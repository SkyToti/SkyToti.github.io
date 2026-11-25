// Pruebas del lector de contenido (lib/contenido.ts). Corre con `npm test` (node --test, sin compilar:
// Node 24 borra los tipos al importar el .ts).
import { test } from "node:test";
import assert from "node:assert/strict";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { escribirCifra, partirCifra } from "../lib/cifras.ts";
import { crearLector, ErrorDeContenido, partirEnSecciones, pasosDe, SECCIONES, seccionDe } from "../lib/contenido.ts";

const EJEMPLO = "pruebas/contenido-ejemplo";

/** Copia el contenido de ejemplo a una carpeta temporal para poder romperlo sin tocar el original. */
function copiaDeEjemplo(t) {
  const dir = mkdtempSync(join(tmpdir(), "portafolio-contenido-"));
  cpSync(EJEMPLO, dir, { recursive: true });
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

test("lee el perfil en los dos idiomas", () => {
  const lector = crearLector(EJEMPLO);
  assert.equal(lector.perfil("es").nombre, "Persona de Ejemplo");
  assert.equal(lector.perfil("en").titular, "Sample full stack developer");
  assert.equal(lector.perfil("en").sinTraducir, false);
  assert.deepEqual(
    lector.perfil("es").secciones.map((s) => s.titulo),
    ["En una línea", "Cómo trabajo"],
  );
  assert.deepEqual(lector.perfil("es").cifras, [{ valor: "~1,500", etiqueta: "pruebas de ejemplo" }]);
  assert.match(seccionDe(lector.perfil("en"), SECCIONES.enUnaLinea).html, /Sample profile/);
});

test("lee los medios de un caso y los proyectos de «más» con su imagen", () => {
  const lector = crearLector(EJEMPLO);
  assert.deepEqual(lector.caso("caso-uno", "es").medios, [
    { tipo: "imagen", src: "/medios/la-isla/control.webp", ancho: 1920, alto: 1080, alt: "Captura de ejemplo." },
  ]);
  assert.deepEqual(lector.caso("caso-dos", "es").medios, []);
  assert.equal(lector.mas("es").proyectos[0].imagen, "/medios/mas/cuaderno-de-repaso.webp");
});

test("NEGATIVA: un medio o su póster que no existe en public/ rompe el build con el campo", (t) => {
  const dir = copiaDeEjemplo(t);
  const archivo = join(dir, "casos/caso-uno.es.md");
  const original = readFileSync(archivo, "utf8");
  writeFileSync(archivo, original.replace("/medios/la-isla/control.webp", "/medios/no-existe.webp"));
  assert.throws(() => crearLector(dir).caso("caso-uno", "es"), /caso-uno\.es\.md[\s\S]*medios\[0\]\.src[\s\S]*no-existe/);
  writeFileSync(archivo, original.replace("    alt: Captura", "    poster: /medios/tampoco.jpg\n    alt: Captura"));
  assert.throws(() => crearLector(dir).caso("caso-uno", "es"), /medios\[0\]\.poster/);
});

test("la demo de un caso es una ruta de public/ que tiene que existir", (t) => {
  const dir = copiaDeEjemplo(t);
  const archivo = join(dir, "casos/caso-uno.es.md");
  const original = readFileSync(archivo, "utf8");
  writeFileSync(archivo, original.replace("privado: false", 'privado: false\ndemo: "/demo/crm/index.html"'));
  assert.equal(crearLector(dir).caso("caso-uno", "es").demo, "/demo/crm/index.html");
  writeFileSync(archivo, original.replace("privado: false", 'privado: false\ndemo: "/demo/no-existe.html"'));
  assert.throws(() => crearLector(dir).caso("caso-uno", "es"), /caso-uno\.es\.md[\s\S]*la demo[\s\S]*no-existe/);
  writeFileSync(archivo, original.replace("privado: false", 'privado: false\ndemo: "https://otro.sitio/demo"'));
  assert.throws(() => crearLector(dir).caso("caso-uno", "es"), /demo/);
});

test("NEGATIVA: un medio sin alt o con tipo desconocido falla", (t) => {
  const dir = copiaDeEjemplo(t);
  const archivo = join(dir, "casos/caso-uno.es.md");
  writeFileSync(archivo, readFileSync(archivo, "utf8").replace("tipo: imagen", "tipo: gif").replace(/^ {4}alt: .*\n/m, ""));
  assert.throws(() => crearLector(dir).caso("caso-uno", "es"), /tipo[\s\S]*alt|alt[\s\S]*tipo/);
});

test("NEGATIVA: la imagen de un proyecto de «más» tiene que existir", (t) => {
  const dir = copiaDeEjemplo(t);
  const archivo = join(dir, "mas.es.md");
  writeFileSync(archivo, readFileSync(archivo, "utf8").replace("cuaderno-de-repaso.webp", "nada.webp"));
  assert.throws(() => crearLector(dir).mas("es"), /mas\.es\.md[\s\S]*proyectos\[0\]\.imagen/);
});

test("los pasos de una lista en HTML", () => {
  assert.deepEqual(pasosDe("<ol>\n<li><strong>Uno.</strong> a</li>\n<li>Dos</li>\n</ol>"), [
    { html: "<strong>Uno.</strong> a" },
    { html: "Dos" },
  ]);
  assert.deepEqual(pasosDe(undefined), []);
});

test("las cifras conservan prefijo, sufijo, decimales y separador de miles", () => {
  for (const v of ["~14,000", "Más de 2,000", "~10 años", "1.8 MB", "2,000+", "~173 MB", "523", "1,092", "~34,700"]) {
    const c = partirCifra(v);
    assert.ok(c, v);
    assert.equal(escribirCifra(c, c.numero), v);
  }
  assert.equal(escribirCifra(partirCifra("~14,000"), 0), "~0");
  assert.equal(escribirCifra(partirCifra("~14,000"), 1234), "~1,234");
  assert.equal(escribirCifra(partirCifra("1.8 MB"), 0.95), "0.9 MB");
  assert.equal(escribirCifra(partirCifra("Más de 2,000"), 999), "Más de 999");
  assert.equal(partirCifra("sin número"), null);
});

test("lista los casos por orden y valida el frontmatter", () => {
  const casos = crearLector(EJEMPLO).casos("es");
  assert.deepEqual(
    casos.map((c) => c.slug),
    ["caso-uno", "caso-dos"],
  );
  const [uno, dos] = casos;
  assert.equal(uno.anio, "2026");
  assert.equal(dos.anio, "2025–2026");
  assert.deepEqual(uno.cifras, [{ valor: "120", etiqueta: "usuarios de prueba" }]);
  assert.equal(dos.privado, true);
  assert.equal(uno.escena, "escena-de-prueba");
});

test("parte el cuerpo en secciones por `## ` e ignora los títulos dentro de bloques de código", () => {
  const caso = crearLector(EJEMPLO).caso("caso-uno", "es");
  assert.match(caso.intro, /Introducción del caso/);
  assert.deepEqual(
    caso.secciones.map((s) => [s.titulo, s.id]),
    [
      ["El problema", "el-problema"],
      ["Lo que hice", "lo-que-hice"],
      ["Resultado", "resultado"],
    ],
  );
  assert.match(caso.secciones[1].html, /<code[^>]*>## esto no es una sección/);
});

test("ids de sección únicos aunque se repita el título", () => {
  const { secciones } = partirEnSecciones("## Uno\na\n## Uno\nb");
  assert.deepEqual(
    secciones.map((s) => s.id),
    ["uno", "uno-2"],
  );
});

test("sin .en.md usa el español y marca sinTraducir", () => {
  const lector = crearLector(EJEMPLO);
  const dos = lector.caso("caso-dos", "en");
  assert.equal(dos.titulo, "Caso dos");
  assert.equal(dos.sinTraducir, true);
  assert.equal(lector.caso("caso-uno", "en").sinTraducir, false);
  assert.equal(lector.mas("en")?.sinTraducir, true);
});

test("NEGATIVA: un caso sin `titulo` falla con un mensaje que nombra el archivo y el campo", (t) => {
  const dir = copiaDeEjemplo(t);
  const archivo = join(dir, "casos/caso-uno.es.md");
  writeFileSync(archivo, readFileSync(archivo, "utf8").replace(/^titulo: .*\n/m, ""));
  assert.throws(
    () => crearLector(dir).casos("es"),
    (e) => {
      assert.ok(e instanceof ErrorDeContenido);
      assert.match(e.message, /caso-uno\.es\.md/);
      assert.match(e.message, /titulo/);
      return true;
    },
  );
});

test("NEGATIVA: tipo fuera de la lista y URL inválida", (t) => {
  const dir = copiaDeEjemplo(t);
  const archivo = join(dir, "casos/caso-dos.es.md");
  writeFileSync(
    archivo,
    readFileSync(archivo, "utf8").replace("tipo: codigo-abierto", "tipo: app").replace(/repo: .*/, "repo: no-es-url"),
  );
  assert.throws(() => crearLector(dir).caso("caso-dos", "es"), /tipo[\s\S]*repo|repo[\s\S]*tipo/);
});

test("NEGATIVA: el slug del frontmatter tiene que coincidir con el archivo", (t) => {
  const dir = copiaDeEjemplo(t);
  const archivo = join(dir, "casos/caso-dos.es.md");
  writeFileSync(archivo, readFileSync(archivo, "utf8").replace("slug: caso-dos", "slug: otro"));
  assert.throws(() => crearLector(dir).caso("caso-dos", "es"), /no coincide/);
});

test("NEGATIVA: carpeta inexistente da un error claro", () => {
  assert.throws(() => crearLector("pruebas/no-existe").perfil("es"), /No existe la carpeta de contenido/);
});
