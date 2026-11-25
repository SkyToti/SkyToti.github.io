// Una captura por <section> de cada ruta, en escritorio (1440×900), iPhone 13 e iPad Pro 11.
// Sale con código 1 si hubo errores de consola (o respuestas ≥ 400) o desborde horizontal.
//
// Uso, con el sitio servido (`npm run build && npm run start`, puerto 3210):
//   nice -n 19 taskset -c 0-3 node scripts/capturas.mjs / /en/ /trabajo/<slug>/
//   … --base http://localhost:3210 --perfiles escritorio,iphone13 --quieto   (prefers-reduced-motion)
// Todo va a capturas/<fecha-hora>/ (fuera de git), con un informe.json.
import { writeFile } from "node:fs/promises";
import {
  abrirNavegador,
  carpetaDeCorrida,
  elegirPerfiles,
  join,
  leerArgumentos,
  nombreDeRuta,
  PERFILES,
  urlDe,
  vigilarErrores,
} from "./comun.mjs";

const { opciones, rutas } = leerArgumentos();
const base = opciones.base || "http://localhost:3210";
const perfiles = elegirPerfiles(opciones.perfiles);
const quieto = "quieto" in opciones;
const salida = await carpetaDeCorrida(opciones.salida);

const navegador = await abrirNavegador();
const informe = [];
let fallas = 0;

for (const perfil of perfiles) {
  const contexto = await navegador.newContext({ ...PERFILES[perfil], reducedMotion: quieto ? "reduce" : "no-preference" });
  for (const ruta of rutas) {
    const pagina = await contexto.newPage();
    const errores = vigilarErrores(pagina);
    const respuesta = await pagina.goto(urlDe(base, ruta), { waitUntil: "load" });
    if (!respuesta || respuesta.status() >= 400) errores.push(`la ruta respondió ${respuesta?.status() ?? "nada"}`);
    await pagina.evaluate(() => document.fonts.ready.then(() => undefined));
    await pagina.waitForTimeout(400);

    const hallazgos = [];
    const secciones = pagina.locator("section");
    const total = await secciones.count();
    if (!total) hallazgos.push("la página no tiene ninguna <section>");
    for (let i = 0; i < total; i++) {
      const seccion = secciones.nth(i);
      const id = (await seccion.getAttribute("aria-labelledby")) || (await seccion.getAttribute("id")) || "seccion";
      await seccion.scrollIntoViewIfNeeded();
      await pagina.waitForTimeout(150);
      // Recorrer la sección completa (las altas no caben en pantalla) para que se revele todo antes de la foto.
      const tramos = await seccion.evaluate((s) => {
        const caja = s.getBoundingClientRect();
        const ini = caja.top + scrollY;
        const lista = [];
        for (let y = ini; y < ini + caja.height; y += innerHeight * 0.6) lista.push(Math.round(y));
        return lista;
      });
      for (const y of tramos) {
        await pagina.evaluate((v) => window.scrollTo(0, v), y);
        await pagina.waitForTimeout(250);
      }
      await pagina.waitForTimeout(tramos.length > 1 ? 1200 : 150);
      const desborde = await pagina.evaluate(() => {
        const ancho = document.documentElement.scrollWidth;
        return ancho > innerWidth + 1 ? `desborde horizontal: ${ancho}px > ${innerWidth}px` : null;
      });
      if (desborde) hallazgos.push(`${id}: ${desborde}`);
      const archivo = `${nombreDeRuta(ruta)}-${String(i + 1).padStart(2, "0")}-${id}.png`;
      await seccion.screenshot({ path: join(salida, perfil, archivo) });
    }

    const unicos = [...new Set(hallazgos)];
    const errUnicos = [...new Set(errores)];
    informe.push({ perfil, ruta, secciones: total, errores: errUnicos, hallazgos: unicos });
    if (errUnicos.length || unicos.length) fallas++;
    console.log(`${perfil} ${ruta}: ${total} secciones, ${errUnicos.length} errores, ${unicos.length} hallazgos`);
    unicos.forEach((x) => console.log("  - " + x));
    errUnicos.forEach((x) => console.log("  ! " + x.slice(0, 200)));
    await pagina.close();
  }
  await contexto.close();
}

await navegador.close();
await writeFile(join(salida, "informe.json"), JSON.stringify(informe, null, 2));
console.log(`capturas en ${salida}`);
process.exit(fallas ? 1 : 0);
