// Pruebas de humo de las escenas del plano (escenas/*.ts y components/plano/geometria.ts). Corre con `npm test`
// (node --test; Node 24 borra los tipos al importar los .ts).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";
import { componer, MEDIDAS, validarEscena } from "../components/plano/geometria.ts";
import { planificar, PX_NOMINAL } from "../components/plano/guion.ts";
import { TOPES } from "../escenas/tipos.ts";

const CARPETA = "escenas";
const archivos = readdirSync(CARPETA).filter((f) => f.endsWith(".ts") && !["tipos.ts", "index.ts"].includes(f));
const escenas = await Promise.all(archivos.map(async (f) => ({ archivo: f, escena: (await import(`../${CARPETA}/${f}`)).default })));

/** Cuenta los pasos numerados (`1. …`) de la sección `## <título>` de un Markdown. */
function pasosDeSeccion(ruta, titulos) {
  const { content } = matter(readFileSync(ruta, "utf8"));
  let dentro = false;
  let n = 0;
  for (const linea of content.split(/\r?\n/)) {
    const titulo = /^## +(.+?)\s*$/.exec(linea);
    if (titulo) dentro = titulos.includes(titulo[1]);
    else if (dentro && /^\d+\.\s/.test(linea)) n++;
  }
  return n;
}

test("hay escenas y cada archivo se llama como su escena", () => {
  assert.ok(escenas.length >= 9, `se esperaban al menos 9 escenas, hay ${escenas.length}`);
  for (const { archivo, escena } of escenas) assert.equal(`${escena.nombre}.ts`, archivo);
});

test("el registro (escenas/index.ts) tiene todas las escenas", () => {
  const indice = readFileSync(join(CARPETA, "index.ts"), "utf8");
  for (const { escena } of escenas) assert.match(indice, new RegExp(`from "\\./${escena.nombre}"`), `falta ${escena.nombre} en el registro`);
});

for (const { escena } of escenas) {
  test(`${escena.nombre}: referencias, topes, encimados y trazos que no cruzan nodos (2 composiciones × 2 idiomas)`, () => {
    assert.deepEqual(validarEscena(escena), []);
  });

  test(`${escena.nombre}: cada etiqueta y nota respeta su tope en los dos idiomas`, () => {
    for (const n of escena.nodos)
      for (const idioma of ["es", "en"]) {
        assert.ok(n.etiqueta[idioma].length <= TOPES.etiqueta, `${n.id} (${idioma}): «${n.etiqueta[idioma]}»`);
        if (n.nota) assert.ok(n.nota[idioma].length <= TOPES.nota, `nota de ${n.id} (${idioma}): «${n.nota[idioma]}»`);
      }
    for (const g of escena.globos ?? []) for (const idioma of ["es", "en"]) assert.ok(g.texto[idioma].length <= TOPES.globo);
  });

  test(`${escena.nombre}: dura entre 6 y 14 s en completo y ≤ 6 s en mini`, () => {
    for (const comp of ["ancho", "alto"]) {
      const p = componer(escena, comp, "es");
      const medidos = Object.fromEntries(p.trazos.map((t) => [t.id, { largo: t.largo, cortes: t.cortes }]));
      const completo = planificar(escena, medidos, { pxPorUnidad: PX_NOMINAL[comp], maximo: 14 });
      const seg = completo.duracion / completo.escala;
      assert.ok(seg >= 6 && seg <= 14.01, `${comp}: ${seg.toFixed(1)} s`);
      const mini = planificar(escena, medidos, { pxPorUnidad: PX_NOMINAL[comp], maximo: 6 });
      assert.ok(mini.duracion / mini.escala <= 6.01, `${comp} mini: ${(mini.duracion / mini.escala).toFixed(1)} s`);
      assert.equal(completo.pasos.length, escena.pasos.length);
    }
  });
}

test("el número de pasos de cada escena es el de «Cómo funciona» de su caso (es y en)", () => {
  const porNombre = new Map(escenas.map(({ escena }) => [escena.nombre, escena]));
  const casos = readdirSync("contenido/casos").filter((f) => f.endsWith(".md"));
  let revisados = 0;
  for (const f of casos) {
    const ruta = join("contenido/casos", f);
    const { data } = matter(readFileSync(ruta, "utf8"));
    if (!data.escena) continue;
    const escena = porNombre.get(data.escena);
    assert.ok(escena, `${f} pide la escena «${data.escena}», que no existe`);
    const n = pasosDeSeccion(ruta, ["Cómo funciona", "How it works"]);
    assert.equal(escena.pasos.length, n, `${data.escena}: ${escena.pasos.length} pasos, ${f} tiene ${n}`);
    revisados++;
  }
  assert.ok(revisados >= 8, `solo se revisaron ${revisados} casos`);
  for (const idioma of ["es", "en"]) {
    const n = pasosDeSeccion(`contenido/perfil.${idioma}.md`, ["Cómo trabajo", "How I work"]);
    assert.equal(porNombre.get("firma").pasos.length, n, `firma vs perfil.${idioma}.md`);
  }
});

test("la letra mide al menos 12 px reales en las dos composiciones", () => {
  for (const comp of ["ancho", "alto"]) {
    const m = MEDIDAS[comp];
    const px = (m.F * m.anchoMinimoPx) / m.W;
    assert.ok(px >= 12, `${comp}: ${px.toFixed(2)} px`);
  }
  assert.equal(MEDIDAS.alto.W, 360);
});

test("NEGATIVA: un trazo a un nodo que no existe no pasa la validación", () => {
  const base = escenas.find(({ escena }) => escena.nombre === "firma").escena;
  const rota = { ...base, trazos: [...base.trazos, { id: "plan-fantasma", de: "plan", a: "fantasma" }] };
  const errores = validarEscena(rota);
  assert.ok(
    errores.some((e) => e.includes("fantasma")),
    `se esperaba un error por «fantasma», llegó: ${JSON.stringify(errores)}`,
  );
});

test("NEGATIVA: dos nodos en la misma celda se reportan como encimados", () => {
  const base = escenas.find(({ escena }) => escena.nombre === "crm-agenda").escena;
  const encimada = { ...base, nodos: base.nodos.map((n) => (n.id === "cita" ? { ...n, ancho: [5, 1] } : n)) };
  assert.ok(validarEscena(encimada).some((e) => e.includes("se enciman")));
});

test("NEGATIVA: una etiqueta de más de 18 caracteres no pasa", () => {
  const base = escenas.find(({ escena }) => escena.nombre === "firma").escena;
  const larga = { ...base, nodos: base.nodos.map((n, i) => (i === 0 ? { ...n, etiqueta: { es: "UNA ETIQUETA DEMASIADO LARGA", en: "X" } } : n)) };
  assert.ok(validarEscena(larga).some((e) => e.includes("tope")));
});
