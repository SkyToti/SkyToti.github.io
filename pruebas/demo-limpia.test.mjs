// Pruebas de la compuerta de limpieza de la demo (scripts/demo-limpia.mjs). Los términos reales no se escriben
// aquí: las pruebas usan términos inventados que se agregan como hashes, igual que la lista de verdad.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { hashTermino, palabras, revisar } from "../scripts/demo-limpia.mjs";

const LIMPIO = "export const UNIDAD = { nombre: \"Clínica Dental Ejemplo\", sucursales: [\"Centro\", \"Norte\"] };";
// inventados para las pruebas
const FRASE = "Ñandú Púrpura";
const EXTRA = { porPalabra: [hashTermino(FRASE)], porFragmento: [[7, hashTermino("zorzalo")]] };

function carpeta(t, archivos) {
  const dir = mkdtempSync(join(tmpdir(), "portafolio-demo-limpia-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  for (const [nombre, texto] of Object.entries(archivos)) {
    mkdirSync(join(dir, nombre, ".."), { recursive: true });
    writeFileSync(join(dir, nombre), texto);
  }
  return dir;
}

test("normaliza sin acentos ni mayúsculas", () => {
  assert.deepEqual(palabras("ÑANDÚ, púrpura-2"), ["nandu", "purpura", "2"]);
  assert.equal(hashTermino("ñandu   PURPURA"), hashTermino(FRASE));
});

test("una demo limpia pasa", (t) => {
  assert.deepEqual(revisar([carpeta(t, { "src/datos.ts": LIMPIO, "index.html": "<title>Demo</title>" })], EXTRA), []);
});

test("la demo de verdad está limpia", () => {
  assert.deepEqual(revisar(), []);
});

for (const [que, texto] of [
  ["una frase de dos palabras, con otras mayúsculas y sin acentos", "const x = 'nandu PURPURA';"],
  ["la frase partida por un salto de línea y signos", "Ñandú,\n  púrpura"],
  ["un fragmento pegado a un identificador", "const asistenteZorzalo = 1;"],
  ["un fragmento en minificado", "var a=\"ZORZALO\".length"],
]) {
  test(`NEGATIVA: detecta ${que}`, (t) => {
    const dir = carpeta(t, { "src/datos.ts": LIMPIO, "assets/index-abc.js": texto });
    const hallazgos = revisar([dir], EXTRA);
    assert.equal(hallazgos.length, 1, `no detectó: ${texto}`);
    assert.match(hallazgos[0], /index-abc\.js/);
    assert.doesNotMatch(hallazgos[0], /zorzalo|purpura/i, "el aviso no repite el término");
  });
}

test("NEGATIVA: un mapa de fuente publicado falla", (t) => {
  const dir = carpeta(t, { "assets/index.js": LIMPIO, "assets/index.js.map": "{}" });
  assert.match(revisar([dir], EXTRA).join("\n"), /mapa de fuente/);
});

test("NEGATIVA: el script sale con código 1 si hay un hallazgo", (t) => {
  const dir = carpeta(t, { "a.js.map": "{}" });
  const r = spawnSync(process.execPath, ["scripts/demo-limpia.mjs", dir], { encoding: "utf8" });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /mapa de fuente/);
});
