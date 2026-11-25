// Los inventos se cargan perezosos en un hueco reservado con la proporción de components/mundo/inventos/registro.ts
// (LIENZO 640×420). Si un dibujo cambia de lienzo, el hueco mentiría y la sustitución movería el diseño.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const raiz = new URL("../", import.meta.url);
const registro = readFileSync(new URL("components/mundo/inventos/registro.ts", raiz), "utf8");
const lienzo = registro.match(/LIENZO = \{ ancho: (\d+), alto: (\d+) \}/);
const datos = [...registro.matchAll(/datos\/([a-z0-9-]+)\.json/g)].map((m) => m[1]);

test("cada invento del registro tiene el lienzo reservado", () => {
  assert.ok(lienzo, "LIENZO en registro.ts");
  assert.ok(datos.length >= 10, `registra los diez inventos (${datos.length} datos)`);
  for (const n of datos) {
    const d = JSON.parse(readFileSync(new URL(`components/dibujo/datos/${n}.json`, raiz), "utf8"));
    assert.equal(`${d.ancho}×${d.alto}`, `${lienzo[1]}×${lienzo[2]}`, n);
  }
});
