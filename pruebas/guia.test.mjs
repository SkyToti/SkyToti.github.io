// Pruebas del lector de las frases de Haku (lector.guia en lib/contenido.ts). Corre con `npm test`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { cpSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { crearLector, ErrorDeContenido } from "../lib/contenido.ts";

const EJEMPLO = "pruebas/contenido-ejemplo";

function copiaDeEjemplo(t) {
  const dir = mkdtempSync(join(tmpdir(), "portafolio-guia-"));
  cpSync(EJEMPLO, dir, { recursive: true });
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

test("lee la guía en español con sus estaciones y su repuesto", () => {
  const g = crearLector(EJEMPLO).guia("es");
  assert.deepEqual(g.estaciones.portada, ["Frase de ejemplo de la portada.", "Otra frase de la portada."]);
  assert.deepEqual(g.repuesto, ["Repuesto de ejemplo."]);
  assert.equal(g.sinTraducir, false);
  assert.deepEqual(g.enEspanol, []);
});

test("en inglés, lo que falta (una estación, el repuesto) se toma del español", () => {
  const g = crearLector(EJEMPLO).guia("en");
  assert.deepEqual(g.estaciones.portada, ["Sample line for the cover."]);
  assert.deepEqual(g.estaciones["caso-uno"], ["Frase de ejemplo del caso uno."]);
  assert.deepEqual(g.enEspanol, ["caso-uno"]);
  assert.deepEqual(g.repuesto, ["Repuesto de ejemplo."]);
  assert.equal(g.sinTraducir, false);
});

test("sin guia.en.md, el inglés es la guía en español entera; sin guia.es.md, null", (t) => {
  const dir = copiaDeEjemplo(t);
  rmSync(join(dir, "guia.en.md"));
  const g = crearLector(dir).guia("en");
  assert.equal(g.sinTraducir, true);
  assert.deepEqual(g.estaciones.portada, ["Frase de ejemplo de la portada.", "Otra frase de la portada."]);
  rmSync(join(dir, "guia.es.md"));
  assert.equal(crearLector(dir).guia("es"), null);
});

test("NEGATIVA: una estación sin frases o con un nombre que no es kebab-case rompe con la ruta y el campo", (t) => {
  const dir = copiaDeEjemplo(t);
  const archivo = join(dir, "guia.es.md");
  writeFileSync(archivo, '---\nestaciones:\n  portada: []\n---\n');
  assert.throws(() => crearLector(dir).guia("es"), (e) => e instanceof ErrorDeContenido && /guia\.es\.md[\s\S]*portada/.test(e.message));
  writeFileSync(archivo, '---\nestaciones:\n  Portada:\n    - "Hola."\n---\n');
  assert.throws(() => crearLector(dir).guia("es"), /guia\.es\.md[\s\S]*estaciones\.Portada/);
  writeFileSync(archivo, '---\nestaciones:\n  portada:\n    - ""\n---\n');
  assert.throws(() => crearLector(dir).guia("es"), /no puede ir vacío/);
});

test("la guía real trae frases para cada caso y repuesto en los dos idiomas, sin caer al español", () => {
  const lector = crearLector("contenido");
  for (const idioma of ["es", "en"]) {
    const g = lector.guia(idioma);
    assert.ok(g, `falta contenido/guia.${idioma}.md`);
    assert.deepEqual(g.enEspanol, [], `estaciones sin traducir en guia.${idioma}.md`);
    assert.ok(g.repuesto.length >= 2, "al menos dos frases de repuesto");
    for (const slug of lector.slugs()) assert.ok(g.estaciones[slug]?.length, `sin frases para ${slug} (${idioma})`);
  }
});
