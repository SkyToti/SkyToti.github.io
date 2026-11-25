// El tráfico (tanda 6): el ciclo de caminata del agente y las medidas que comparten las piezas (dibujo/piezas/trafico-*)
// y los cruces (components/mundo/trafico/comun.ts). Si una pieza cambia de lienzo o de paso y el componente no, el
// agente patinaría o el carrito se separaría de sus manos.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as agente from "../dibujo/piezas/trafico-agente.mjs";
import * as carrito from "../dibujo/piezas/trafico-carrito.mjs";
import * as cosas from "../dibujo/piezas/trafico-cosas.mjs";

const raiz = new URL("../", import.meta.url);
const datos = (n) => JSON.parse(readFileSync(new URL(`components/dibujo/datos/${n}.json`, raiz), "utf8"));
const comun = readFileSync(new URL("components/mundo/trafico/comun.ts", raiz), "utf8");
const constante = (nombre) => {
  const m = comun.match(new RegExp(`export const ${nombre} = ([^;]+?)(?: as const)?;`));
  assert.ok(m, `${nombre} en comun.ts`);
  return JSON.parse(m[1].replace(/(\w+):/g, '"$1":'));
};

/** el marcado de cada `<g data-g="paso<k>-…">` (con sus <g> anidados) */
function cuadro(svg, k) {
  let total = "";
  const abre = `<g data-g="paso${k}-`;
  for (let i = svg.indexOf(abre); i >= 0; i = svg.indexOf(abre, i + 1)) {
    let j = i, prof = 0;
    do {
      const a = svg.indexOf("<g", j + 1), c = svg.indexOf("</g>", j + 1);
      if (j === i) { prof = 1; j = i; }
      if (a >= 0 && a < c) { prof++; j = a; } else { prof--; j = c; }
    } while (prof > 0);
    total += svg.slice(i, j + 4);
  }
  return total;
}

test("el ciclo de caminata: 3 variantes × 4 cuadros, un solo trazo, mismo lienzo, ≤ 7 KB por cuadro", () => {
  const lienzos = new Set();
  for (const n of ["trafico-camina", "trafico-empuja", "trafico-hombro"]) {
    const d = datos(n);
    lienzos.add(d.vb);
    assert.ok(!d.svg.includes('class="f1"') && !d.svg.includes('class="f2"'), `${n}: sin hervor`);
    for (let k = 0; k < 4; k++) {
      const c = cuadro(d.svg, k);
      assert.ok(c.length > 1000, `${n} cuadro ${k} existe`);
      assert.ok(c.length <= 7 * 1024, `${n} cuadro ${k}: ${(c.length / 1024).toFixed(1)} KB`);
    }
    assert.ok(!d.svg.includes('data-g="paso4-'), `${n}: solo 4 cuadros`);
  }
  assert.equal(lienzos.size, 1, "las tres variantes en el mismo lienzo");
  assert.equal(datos("trafico-camina").vb, agente.LIENZO.join(" "));
});

test("las medidas de comun.ts son las de las piezas", () => {
  assert.equal(constante("PASO"), agente.PASO);
  assert.equal(constante("RUEDA"), carrito.RUEDA);
  assert.equal(constante("RADIO_MONEDA"), cosas.RADIO_MONEDA);
  assert.deepEqual(constante("LIENZO_CARRITO"), carrito.LIENZO_CARRITO);
  assert.deepEqual(constante("LIENZO_VIGA"), cosas.LIENZO_VIGA);
  assert.deepEqual(constante("LIENZO_TABLA"), cosas.LIENZO_TABLA);
  assert.deepEqual(constante("AGENTES_VIGA"), cosas.VIGA.agentes);
  assert.equal(constante("LETRERO").x, carrito.LETRERO.x);
  assert.equal(datos("trafico-carrito").vb, carrito.LIENZO_CARRITO.join(" "));
  assert.equal(datos("trafico-viga").vb, cosas.LIENZO_VIGA.join(" "));
});

test("la viga alcanza a los tres agentes (también al último cuando va un PASO atrasado)", () => {
  const xs = cosas.VIGA.agentes;
  assert.ok(cosas.VIGA.desde < Math.min(...xs) - agente.PASO - 17, "la viga sobresale detrás del último");
  assert.ok(cosas.VIGA.hasta > Math.max(...xs) + 17, "la viga sobresale delante del primero");
});
