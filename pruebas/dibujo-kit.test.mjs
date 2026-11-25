// Pruebas del kit de dibujo que no necesitan navegador: ids por instancia y generador determinista.
// Corre con `npm test` (node --test; Node 24 borra los tipos al importar los .ts).
// Las de hornear necesitan roughjs (cd dibujo && npm ci); sin él se saltan con aviso.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { prefijarIds, limpiarId } from "../components/dibujo/ids.ts";

const raiz = new URL("../", import.meta.url).pathname;
const datos = (n) => JSON.parse(readFileSync(`${raiz}components/dibujo/datos/${n}.json`, "utf8"));
const idsDe = (svg) => [...svg.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
const refsDe = (svg) => [...svg.matchAll(/(?:url\(#|href="#)([^")]+)/g)].map((m) => m[1]);

test("ids: dos instancias del mismo dibujo no comparten ningún id", () => {
  const { svg } = datos("repisa-globo");
  assert.ok(idsDe(svg).length > 0, "el dibujo de prueba debe tener al menos una trama");
  const a = prefijarIds(svg, "dA"), b = prefijarIds(svg, "dB");
  const ia = new Set(idsDe(a)), ib = idsDe(b);
  assert.equal(ib.filter((id) => ia.has(id)).length, 0);
  // cada referencia apunta a un id de su misma instancia
  for (const s of [a, b]) {
    const propios = new Set(idsDe(s));
    for (const r of refsDe(s)) assert.ok(propios.has(r), `referencia huérfana: ${r}`);
  }
});

test("ids: todos los dibujos generados quedan con referencias completas tras prefijar", () => {
  for (const f of readdirSync(`${raiz}components/dibujo/datos`).filter((f) => f.endsWith(".json"))) {
    const s = prefijarIds(JSON.parse(readFileSync(`${raiz}components/dibujo/datos/${f}`, "utf8")).svg, "dX");
    const propios = new Set(idsDe(s));
    for (const r of refsDe(s)) assert.ok(propios.has(r), `${f}: referencia huérfana ${r}`);
  }
});

test("ids: un id de React se limpia a caracteres válidos", () => {
  assert.equal(limpiarId("«r1a»"), "r1a");
  assert.equal(limpiarId("_R_3b_"), "_R_3b_");
  assert.equal(limpiarId(":r0:"), "r0");
  assert.equal(prefijarIds('<g fill="none"/>', "x"), '<g fill="none"/>');
});

let hornear = null;
try {
  ({ hornear } = await import("../dibujo/kit/hornear.mjs"));
} catch {
  hornear = null;
}

test("generador: misma entrada → mismo SVG, y los datos en git están al día", async (t) => {
  if (!hornear) return t.skip("sin roughjs: cd dibujo && npm ci");
  const piezas = readdirSync(`${raiz}dibujo/piezas`).filter((f) => f.endsWith(".mjs"));
  let n = 0;
  for (const f of piezas) {
    const m = await import(`../dibujo/piezas/${f}`);
    if (typeof m.ilustraciones !== "function") continue;
    for (const d of m.ilustraciones()) {
      if (!d.vb) continue; // las que se ajustan a su caja las compara el generador
      const r1 = hornear(d), r2 = hornear(m.ilustraciones().find((x) => x.nombre === d.nombre));
      assert.equal(r1.svg, r2.svg, `${d.nombre}: dos horneadas distintas`);
      const enGit = datos(d.nombre);
      assert.equal(JSON.stringify({ ...r1, ...(d.sigue ? { sigue: d.sigue } : {}) }), JSON.stringify(enGit), `${d.nombre}: datos viejos (node dibujo/generar.mjs)`);
      n++;
    }
  }
  assert.ok(n >= 10, `se esperaban las ilustraciones de la tanda 3, hubo ${n}`);
});

test("generador: las poses de Haku no cambiaron con las opciones nuevas", async (t) => {
  if (!hornear) return t.skip("sin roughjs: cd dibujo && npm ci");
  const { poses } = await import("../dibujo/piezas/haku.mjs");
  const { E } = await import("../dibujo/kit/formas.mjs");
  for (const d of poses()) {
    const enGit = datos(d.nombre);
    const zonas = d.zonaHaku ? [E([0, -96], 64, 100, { nombre: "haku" })] : []; // como en generar.mjs
    assert.equal(hornear({ ...d, zonas, vb: enGit.vb.split(" ").map(Number) }).svg, enGit.svg, d.nombre);
  }
});

test("hervor: la base solo trae los f0 y los cuadros rehacen el SVG entero, en todos los dibujos", async () => {
  const { partirHervor } = await import("../components/dibujo/hervor.ts");
  const raiz = new URL("../", import.meta.url).pathname;
  for (const f of readdirSync(`${raiz}components/dibujo/datos`).filter((f) => f.endsWith(".json"))) {
    const svg = JSON.parse(readFileSync(`${raiz}components/dibujo/datos/${f}`, "utf8")).svg;
    const { base, cuadros } = partirHervor(svg);
    assert.doesNotMatch(base, /class="f[12]"/, f);
    assert.equal(cuadros.length, (base.match(/<g class="f0">/g) || []).length, f);
    // volver a meter cada par detrás de su f0 da el marcado original
    let i = 0;
    const junto = base.replace(/<g class="f0">[\s\S]*?<\/g>/g, (g0) => g0 + cuadros[i++]);
    assert.equal(junto, svg, f);
  }
});
