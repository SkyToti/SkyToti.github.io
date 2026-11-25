// Capturas del banco de escenas (/laboratorio/escenas/) en escritorio (1440×900) y iPhone 13: cada escena en
// español en TRES momentos (recién entrada en vista ~1 s, a media animación y terminada), la final en inglés, el
// modo mini terminado y una pasada con prefers-reduced-motion. Arma una hoja por escena y perfil para revisarla.
// Sale con código 1 si hubo errores o avisos de consola, o si alguna escena no terminó.
//
// Uso, con el sitio servido (`npm run build && npm run start`, puerto 3210):
//   nice -n 19 taskset -c 0-3 node scripts/capturas-escenas.mjs [--base http://localhost:3210] [--solo firma,crm-agenda]
import { readFile, writeFile } from "node:fs/promises";
import { abrirNavegador, carpetaDeCorrida, join, leerArgumentos, PERFILES, urlDe, vigilarErrores } from "./comun.mjs";

const { opciones } = leerArgumentos();
const base = opciones.base || "http://localhost:3210";
const solo = opciones.solo ? opciones.solo.split(",") : null;
const salida = await carpetaDeCorrida(opciones.salida || "capturas");
const RUTA = "/laboratorio/escenas/";

const navegador = await abrirNavegador();
const informe = { errores: [], escenas: [] };

async function abrir(perfil, reducido) {
  const contexto = await navegador.newContext({ ...PERFILES[perfil], reducedMotion: reducido ? "reduce" : "no-preference" });
  const pagina = await contexto.newPage();
  const errores = vigilarErrores(pagina);
  pagina.on("console", (m) => m.type() === "warning" && errores.push(`aviso: ${m.text()}`));
  await pagina.goto(urlDe(base, RUTA), { waitUntil: "load" });
  await pagina.evaluate(() => document.fonts.ready.then(() => undefined));
  return { contexto, pagina, errores };
}

/** Lleva el bloque al centro de la pantalla con scroll nativo (Lenis lo sigue). */
async function centrar(pagina, sel) {
  await pagina.evaluate((s) => {
    const el = document.querySelector(s);
    const r = el.getBoundingClientRect();
    window.scrollTo(0, window.scrollY + r.top - Math.max(16, (innerHeight - r.height) / 2));
  }, sel);
}

const nombres = await (async () => {
  const { contexto, pagina } = await abrir("escritorio", false);
  const n = await pagina.$$eval('[data-banco$="-completo"][data-banco^="es-"]', (els) =>
    els.map((e) => e.dataset.banco.replace(/^es-/, "").replace(/-completo$/, "")),
  );
  await contexto.close();
  return solo ? n.filter((x) => solo.includes(x)) : n;
})();

for (const perfil of ["escritorio", "iphone13"]) {
  const { contexto, pagina, errores } = await abrir(perfil, false);
  for (const nombre of nombres) {
    const sel = `[data-banco="es-${nombre}-completo"]`;
    const vivo = `${sel} [data-escena]`;
    await centrar(pagina, sel);
    await pagina.waitForTimeout(1000);
    const archivo = (m) => join(salida, `${perfil}_${nombre}_${m}.png`);
    await pagina.locator(sel).screenshot({ path: archivo("1-inicio") });
    const duracion = Number(await pagina.getAttribute(vivo, "data-duracion")) || 10;
    await pagina.waitForTimeout(Math.max(0, (duracion / 2) * 1000 - 1000));
    await pagina.locator(sel).screenshot({ path: archivo("2-medio") });
    const termino = await pagina
      .waitForSelector(`${vivo}[data-terminado]`, { timeout: (duracion / 2 + 4) * 1000 })
      .then(() => true)
      .catch(() => false);
    await pagina.waitForTimeout(300);
    await pagina.locator(sel).screenshot({ path: archivo("3-final") });
    // mini y en inglés, ya terminados
    for (const [clave, s] of [
      ["4-mini", `[data-banco="es-${nombre}-mini"]`],
      ["5-en", `[data-banco="en-${nombre}-completo"]`],
    ]) {
      await centrar(pagina, s);
      const d = Number(await pagina.getAttribute(`${s} [data-escena]`, "data-duracion").catch(() => null)) || 8;
      await pagina.waitForSelector(`${s} [data-escena][data-terminado]`, { timeout: (d + 4) * 1000 }).catch(() => null);
      await pagina.waitForTimeout(300);
      await pagina.locator(s).screenshot({ path: archivo(clave) });
    }
    informe.escenas.push({ perfil, nombre, duracion, termino });
    if (!termino) informe.errores.push(`${perfil}/${nombre}: no terminó en ${duracion} s + 4`);
  }
  informe.errores.push(...errores.map((e) => `${perfil}: ${e}`));
  await contexto.close();

  // Menos movimiento: el plano se ve completo y sin controles.
  const quieto = await abrir(perfil, true);
  for (const nombre of nombres) {
    const sel = `[data-banco="es-${nombre}-completo"]`;
    await centrar(quieto.pagina, sel);
    await quieto.pagina.waitForTimeout(150);
    await quieto.pagina.locator(sel).screenshot({ path: join(salida, `${perfil}_${nombre}_6-quieto.png`) });
  }
  informe.errores.push(...quieto.errores.map((e) => `${perfil} quieto: ${e}`));
  await quieto.contexto.close();
}

// Hojas de revisión: una por escena y perfil, con los seis momentos.
const hoja = await navegador.newPage({ viewport: { width: 1800, height: 900 } });
for (const perfil of ["escritorio", "iphone13"])
  for (const nombre of nombres) {
    // En línea (data:), porque una página en blanco no puede cargar file://.
    const datos = async (m) => (await readFile(join(salida, `${perfil}_${nombre}_${m}.png`)).catch(() => Buffer.alloc(0))).toString("base64");
    const momentos = ["1-inicio", "2-medio", "3-final", "4-mini", "5-en", "6-quieto"];
    const fuentes = await Promise.all(momentos.map(datos));
    const img = (m, i) => `<figure><img src="data:image/png;base64,${fuentes[i]}"><figcaption>${m}</figcaption></figure>`;
    const ancho = perfil === "escritorio" ? "33%" : "16%";
    await hoja.setContent(
      `<style>body{margin:0;background:#222;color:#ddd;font:14px monospace;display:flex;flex-wrap:wrap;gap:8px;padding:8px}figure{margin:0;width:calc(${ancho} - 8px)}img{width:100%}</style>` +
        momentos.map(img).join(""),
    );
    await hoja.waitForLoadState("load");
    await hoja.screenshot({ path: join(salida, `HOJA_${perfil}_${nombre}.png`), fullPage: true });
  }

await writeFile(join(salida, "informe.json"), JSON.stringify(informe, null, 2));
await navegador.close();
console.log(`Capturas en ${salida}`);
for (const e of informe.escenas) console.log(`${e.perfil.padEnd(10)} ${e.nombre.padEnd(24)} ${e.duracion}s ${e.termino ? "terminó" : "NO TERMINÓ"}`);
if (informe.errores.length) {
  console.log(`\n${informe.errores.length} problema(s):`);
  for (const e of [...new Set(informe.errores)]) console.log(" -", e);
  process.exitCode = 1;
}
