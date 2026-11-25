// Haku, el guía (tanda 5): los cuadros (cuántos, cuánto pesan, que estén al día) y las cuentas del motor.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { colocarGlobo, fpsCaminata, fraseSiguiente, ladoPresentar, objetivoX, paso } from "../components/mundo/guia/logica.ts";

const raiz = new URL("../", import.meta.url).pathname;
const datos = JSON.parse(readFileSync(`${raiz}components/dibujo/datos/haku-ciclos.json`, "utf8"));

const CUADROS = { caminar: 6, sentarse: 3, sentado: 1, parpadeo: 2, cola: 3, mirar: 2, senalar: 2, lamerse: 4, bostezar: 3, susto: 2, saltar: 4, dormir: 2 };

test("ciclos: cada uno con sus cuadros, lienzo común 160×120 y piso en 112", () => {
  assert.equal(datos.vb, "0 0 160 120");
  assert.equal(datos.piso, 112);
  assert.ok(datos.zancada > 0, "la caminata declara su zancada");
  for (const [n, k] of Object.entries(CUADROS)) assert.equal(datos.cuadros[n]?.length, k, n);
});

test("ciclos: un solo trazo por cuadro (sin hervor), ≤ 9 KB, y ningún par de cuadros de la caminata igual", () => {
  for (const [n, lista] of Object.entries(datos.cuadros)) {
    lista.forEach((c, i) => {
      assert.ok(!/class="f[012]"/.test(c), `${n}-${i}: quedó un cuadro de hervor`);
      assert.ok(Buffer.byteLength(c) <= 9 * 1024, `${n}-${i}: ${(Buffer.byteLength(c) / 1024).toFixed(1)} KB`);
      assert.ok(!/ id="/.test(c), `${n}-${i}: los ids van solo en <defs>`);
    });
  }
  assert.equal(new Set(datos.cuadros.caminar).size, 6);
  assert.ok(/url\(#tr-/.test(datos.cuadros.caminar[0]) && /id="tr-/.test(datos.svg), "la sombra usa la trama compartida");
});

test("ciclos: solo el sentado base trae pupilas que siguen al cursor", () => {
  assert.match(datos.cuadros.sentado[0], /data-anim="pupilaIzq"/);
  assert.doesNotMatch(datos.cuadros.caminar[0], /data-anim/);
});

test("generador: los ciclos en git están al día", async (t) => {
  let m;
  try {
    m = await import("../dibujo/piezas/haku-ciclos.mjs");
  } catch {
    return t.skip("sin roughjs: cd dibujo && npm ci");
  }
  const [a] = m.modulos();
  assert.equal(JSON.stringify(a.datos), JSON.stringify(datos), "datos viejos: node dibujo/generar.mjs");
});

test("caminata: el pie apoyado retrocede por cuadro justo la zancada (no patina)", async (t) => {
  let m;
  try {
    m = await import("../dibujo/piezas/haku-ciclos.mjs");
  } catch {
    return t.skip("sin roughjs: cd dibujo && npm ci");
  }
  let n = 0;
  for (const k of ["trasCerca", "delCerca", "trasLejos", "delLejos"]) {
    for (let i = 0; i < 6; i++) {
      const a = m.pieEn(k, i / 6), b = m.pieEn(k, ((i + 1) % 6) / 6);
      if (a[1] !== -6 || b[1] !== -6 || b[0] > a[0]) continue; // solo pares apoyados
      assert.ok(Math.abs(a[0] - b[0] - m.ZANCADA_MODELO) < 1e-9, `${k} ${i}: ${a[0] - b[0]}`);
      n++;
    }
  }
  assert.ok(n >= 8, `pares apoyados revisados: ${n}`);
  assert.equal(datos.zancada, m.ZANCADA);
});

test("motor: objetivo del 6 % al 88 % y pasos sin patinar, con vuelta por la orilla", () => {
  assert.equal(Math.round(objetivoX(0, 1000)), 60);
  assert.equal(Math.round(objetivoX(1, 1000)), 880);
  assert.equal(Math.round(objetivoX(7, 1000)), 880);
  // hacia la derecha: avanza justo una zancada
  assert.deepEqual(paso(100, 500, 1, 1000, 160, 4), { x: 104, avanzo: true });
  // ya llegó: no se mueve
  assert.deepEqual(paso(498, 500, 1, 1000, 160, 4), { x: 498, avanzo: false });
  // el objetivo quedó atrás pero el scroll baja: sigue a la derecha y da la vuelta
  const r = paso(1078, 60, 1, 1000, 160, 4);
  assert.ok(r.avanzo && r.x < 0, `salió por la derecha y entró por la izquierda (${r.x})`);
  // subiendo: a la izquierda
  assert.deepEqual(paso(500, 100, -1, 1000, 160, 4), { x: 496, avanzo: true });
  assert.equal(fpsCaminata(0), 8);
  assert.equal(fpsCaminata(50), 18);
});

test("motor: frases en orden, luego repuesto; sin nada → null (salta)", () => {
  assert.equal(fraseSiguiente(["a", "b"], ["r"], 0), "a");
  assert.equal(fraseSiguiente(["a", "b"], ["r"], 1), "b");
  assert.equal(fraseSiguiente(["a", "b"], ["r", "s"], 3), "s");
  assert.equal(fraseSiguiente(["a", "b"], ["r", "s"], 4), "r");
  assert.equal(fraseSiguiente(undefined, undefined, 0), null);
  assert.equal(fraseSiguiente([], ["r"], 0), "r");
  assert.equal(ladoPresentar("izq", 900, 1000), "izq");
  assert.equal(ladoPresentar(undefined, 100, 1000), "der");
  assert.equal(ladoPresentar(null, 900, 1000), "izq");
});

test("motor: el globo no sale de la ventana ni tapa botones", () => {
  const haku = { x: 1300, y: 780, w: 160, h: 120 };
  const g = colocarGlobo(haku, 300, 80, 1440, 900, []);
  assert.ok(g && g.x + g.w <= 1440 - 8 && g.x >= 8 && g.y >= 8, "dentro de la ventana");
  const boton = { x: g.x, y: g.y, w: g.w, h: g.h };
  const h = colocarGlobo(haku, 300, 80, 1440, 900, [boton]);
  assert.ok(h && (h.x !== g.x || h.y !== g.y), "se mueve para no tapar el botón");
  const todo = colocarGlobo(haku, 300, 80, 1440, 900, [{ x: 0, y: 0, w: 1440, h: 900 }]);
  assert.equal(todo, null, "si no cabe sin tapar, no se muestra");
});
