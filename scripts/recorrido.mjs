// Recorrido lento: baja la página por pasos, como el pulgar, y captura la pantalla cada N px.
// Lo que capturas.mjs no ve (lo que se queda pegado o salta ENTRE secciones) aparece aquí.
//
// Uso, con el sitio servido (`npm run start`, puerto 3210):
//   nice -n 19 taskset -c 0-3 node scripts/recorrido.mjs / --perfil escritorio --paso 120 --espera 120
//   … --base http://localhost:3210 --max 300 --quieto
// En escritorio baja con la rueda (pasa por Lenis); en iPhone/iPad con scrollTo (con toque sintético y
// isMobile la rueda se cuelga). Sale con código 1 si hubo errores de consola o desborde horizontal.
// Todo va a capturas/<fecha-hora>/recorrido-<perfil>-<ruta>/.
import { mkdir, writeFile } from "node:fs/promises";
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
const [perfil] = elegirPerfiles(opciones.perfil || "escritorio");
const paso = Number(opciones.paso) || 120;
const espera = Number(opciones.espera) || 120;
const maximo = Number(opciones.max) || 400;
const salida = await carpetaDeCorrida(opciones.salida);
const rueda = !PERFILES[perfil].isMobile;

const navegador = await abrirNavegador();
const contexto = await navegador.newContext({ ...PERFILES[perfil], reducedMotion: "quieto" in opciones ? "reduce" : "no-preference" });
let fallas = 0;
const informe = [];

for (const ruta of rutas) {
  const carpeta = join(salida, `recorrido-${perfil}-${nombreDeRuta(ruta)}`);
  await mkdir(carpeta, { recursive: true });
  const pagina = await contexto.newPage();
  const errores = vigilarErrores(pagina);
  await pagina.goto(urlDe(base, ruta), { waitUntil: "load" });
  await pagina.evaluate(() => document.fonts.ready.then(() => undefined));
  if (rueda) await pagina.mouse.move(PERFILES[perfil].viewport.width / 2, PERFILES[perfil].viewport.height / 2);

  const desbordes = new Set();
  let anterior = -1;
  let n = 0;
  for (; n < maximo; n++) {
    await pagina.waitForTimeout(espera);
    const { y, desborde } = await pagina.evaluate(() => ({
      y: Math.round(scrollY),
      desborde: document.documentElement.scrollWidth > innerWidth + 1 ? document.documentElement.scrollWidth : 0,
    }));
    if (desborde) desbordes.add(`desborde horizontal: ${desborde}px`);
    await pagina.screenshot({ path: join(carpeta, `${String(n).padStart(4, "0")}-y${y}.png`) });
    if (y === anterior) break; // ya no baja más: llegó al final
    anterior = y;
    if (rueda) await pagina.mouse.wheel(0, paso);
    else await pagina.evaluate((d) => window.scrollBy(0, d), paso);
  }

  const errUnicos = [...new Set(errores)];
  informe.push({ perfil, ruta, cuadros: n + 1, errores: errUnicos, hallazgos: [...desbordes] });
  if (errUnicos.length || desbordes.size) fallas++;
  console.log(`${perfil} ${ruta}: ${n + 1} cuadros, ${errUnicos.length} errores, ${desbordes.size} desbordes`);
  [...desbordes].forEach((x) => console.log("  - " + x));
  errUnicos.forEach((x) => console.log("  ! " + x.slice(0, 200)));
  await pagina.close();
}

await contexto.close();
await navegador.close();
await writeFile(join(salida, "informe-recorrido.json"), JSON.stringify(informe, null, 2));
console.log(`recorrido en ${salida}`);
process.exit(fallas ? 1 : 0);
