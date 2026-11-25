// Pruebas de la compuerta de privacidad (scripts/privacidad.mjs).
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { revisar } from "../scripts/privacidad.mjs";

const LIMPIO = `<!doctype html><html><body><p>Más de 2,000 pruebas · ~14,000 líneas · 1.8 MB · 2026</p>
<a href="mailto:alguien@ejemplo.com">Correo</a><svg><path d="M1 2 3 4 5 6 7 8 9 0"/></svg>
<script>self.__next_f.push([1,"1234567890"])</script></body></html>`;

function carpeta(t, archivos) {
  const dir = mkdtempSync(join(tmpdir(), "portafolio-privacidad-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  for (const [nombre, html] of Object.entries(archivos)) {
    mkdirSync(join(dir, nombre, ".."), { recursive: true });
    writeFileSync(join(dir, nombre), html);
  }
  return dir;
}

test("un sitio limpio pasa (cifras, años, SVG y scripts no son teléfonos)", (t) => {
  assert.deepEqual(revisar(carpeta(t, { "index.html": LIMPIO, "en/index.html": LIMPIO })), []);
});

for (const [que, trozo] of [
  ["teléfono de 10 dígitos seguidos", "<p>Llámame: 7771234567</p>"],
  ["teléfono con espacios", "<p>777 123 4567</p>"],
  ["teléfono con +52", "<footer>+52 777 123 4567</footer>"],
  ["enlace tel:", '<a href="tel:7771234567">Llamar</a>'],
  ["WhatsApp", '<a href="https://wa.me/527771234567">WhatsApp</a>'],
  ["PENDIENTE", "<p>PENDIENTE: la cifra</p>"],
  ["teléfono en un atributo", '<img alt="Escríbeme al 55 1234 5678">'],
]) {
  test(`NEGATIVA: detecta ${que}`, (t) => {
    const dir = carpeta(t, { "index.html": LIMPIO, "trabajo/caso/index.html": `<html><body>${trozo}</body></html>` });
    const hallazgos = revisar(dir);
    assert.equal(hallazgos.length >= 1, true, `no detectó: ${trozo}`);
    assert.match(hallazgos[0], /trabajo\/caso\/index\.html/);
  });
}

test("NEGATIVA: el script sale con código 1 si hay un hallazgo", (t) => {
  const dir = carpeta(t, { "index.html": '<a href="tel:5512345678">x</a>' });
  const r = spawnSync(process.execPath, ["scripts/privacidad.mjs", dir], { encoding: "utf8" });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /enlace tel:/);
});
