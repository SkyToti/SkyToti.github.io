// Lo compartido por capturas.mjs y recorrido.mjs: argumentos, perfiles de dispositivo y carpeta de salida.
// Córrelos siempre con prioridad baja y en 4 núcleos (Chromium hereda ambas cosas del proceso de node):
//   nice -n 19 taskset -c 0-3 node scripts/capturas.mjs / /en/
import { mkdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { chromium, devices } from "playwright";

/** `--clave valor` a objeto; lo demás (las rutas) en `rutas`. */
export function leerArgumentos(argv = process.argv.slice(2)) {
  const opciones = {};
  const rutas = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) opciones[a.slice(2)] = argv[i + 1]?.startsWith("--") || argv[i + 1] === undefined ? "" : argv[++i];
    else rutas.push(a);
  }
  return { opciones, rutas: rutas.length ? rutas : ["/"] };
}

// Solo Chromium (es el navegador que hay en la caché de Playwright 1.63). Los perfiles de iPhone y iPad toman
// tamaño, densidad, toque y agente de usuario del descriptor, sin su motor WebKit.
const sinMotor = (descriptor) => {
  const copia = { ...descriptor };
  delete copia.defaultBrowserType;
  return copia;
};
export const PERFILES = {
  escritorio: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
  iphone13: sinMotor(devices["iPhone 13"]),
  ipad: sinMotor(devices["iPad Pro 11"]),
};

export function elegirPerfiles(lista) {
  const nombres = lista ? lista.split(",") : Object.keys(PERFILES);
  for (const n of nombres) if (!PERFILES[n]) throw new Error(`No existe el perfil «${n}». Hay: ${Object.keys(PERFILES).join(", ")}`);
  return nombres;
}

export const abrirNavegador = () => chromium.launch();

/** capturas/<AAAA-MM-DD_HHMMSS>/ */
export async function carpetaDeCorrida(base = "capturas") {
  const f = new Date();
  const p = (n) => String(n).padStart(2, "0");
  const sello = `${f.getFullYear()}-${p(f.getMonth() + 1)}-${p(f.getDate())}_${p(f.getHours())}${p(f.getMinutes())}${p(f.getSeconds())}`;
  const carpeta = resolve(base, sello);
  await mkdir(carpeta, { recursive: true });
  return carpeta;
}

/** «/en/work/caso-uno/» → «en-work-caso-uno»; «/» → «inicio». */
export const nombreDeRuta = (ruta) => ruta.replace(/^\/+|\/+$/g, "").replace(/[^a-z0-9]+/gi, "-") || "inicio";

/** Junta los errores de consola, de página y respuestas ≥ 400 de una pestaña. */
export function vigilarErrores(pagina) {
  const errores = [];
  pagina.on("console", (m) => m.type() === "error" && errores.push(`consola: ${m.text()}`));
  pagina.on("pageerror", (e) => errores.push(`página: ${String(e)}`));
  pagina.on("response", (r) => r.status() >= 400 && errores.push(`HTTP ${r.status()}: ${r.url()}`));
  pagina.on("requestfailed", (r) => errores.push(`falló: ${r.url()} (${r.failure()?.errorText})`));
  return errores;
}

export const urlDe = (base, ruta) => new URL(ruta, base.endsWith("/") ? base : `${base}/`).href;
export { join };
