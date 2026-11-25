// Nada se queda oculto: baja DESPACIO con la rueda hasta el fondo (300 px cada 120 ms), espera, vuelve arriba y
// revisa elemento por elemento que todo h1/h2/h3 y todo [data-lineas]/[data-revelar] se vea: opacidad 1 (en él y
// en sus ancestros), sin `visibility: hidden`, sin quedar desplazado fuera de su máscara (líneas de SplitText).
// Corre en 390, 834 y 1440 con movimiento y, además, con reducedMotion: 'reduce'. Sale con 1 si algo quedó oculto.
//
// Uso, con el sitio servido (`npm run build && npm run start`, puerto 3210):
//   nice -n 19 taskset -c 0-3 node scripts/nada-oculto.mjs / /en/ /trabajo/crm-dental/
//   … --base http://localhost:3210
//   … --sin-bajar --solo 390   (prueba del detector: sin bajar, con movimiento, lo de abajo debe salir oculto)
import { abrirNavegador, leerArgumentos, PERFILES, urlDe, vigilarErrores } from "./comun.mjs";

const { opciones, rutas } = leerArgumentos();
const base = opciones.base || "http://localhost:3210";

const anchos = [
  { nombre: "390", ...PERFILES.iphone13 },
  { nombre: "834", ...PERFILES.ipad },
  { nombre: "1440", ...PERFILES.escritorio },
].filter((a) => !opciones.solo || opciones.solo.split(",").includes(a.nombre));
const modos = "sin-bajar" in opciones ? ["no-preference"] : ["no-preference", "reduce"];

/** En la página: lista de lo que no se ve. */
function revisar() {
  const ocultos = [];
  const piezas = document.querySelectorAll("main h1, main h2, main h3, [data-lineas], [data-revelar]");
  const nombre = (el) =>
    `${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""} «${(el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 40)}»`;
  for (const el of piezas) {
    if (el.closest(".sr-only")) continue;
    const problemas = [];
    for (let a = el; a && a !== document.documentElement; a = a.parentElement) {
      const e = getComputedStyle(a);
      if (parseFloat(e.opacity) < 0.99) problemas.push(`opacidad ${e.opacity} en ${a === el ? "él" : a.tagName.toLowerCase()}`);
      if (e.display === "none") problemas.push(`display:none en ${a === el ? "él" : a.tagName.toLowerCase()}`);
    }
    if (getComputedStyle(el).visibility === "hidden") problemas.push("visibility:hidden");
    // Líneas de SplitText con máscara: si la línea quedó corrida fuera de su máscara, no se ve.
    el.querySelectorAll("*").forEach((hijo) => {
      const padre = hijo.parentElement;
      if (!padre || getComputedStyle(padre).overflow.indexOf("clip") < 0 && getComputedStyle(padre).overflow.indexOf("hidden") < 0) return;
      const r = hijo.getBoundingClientRect();
      const m = padre.getBoundingClientRect();
      if (r.height > 0 && (r.top >= m.bottom - 1 || r.bottom <= m.top + 1)) problemas.push("línea fuera de su máscara");
    });
    const t = getComputedStyle(el).transform;
    if (t && t !== "none") {
      const ty = new DOMMatrix(t).m42;
      if (Math.abs(ty) > 2) problemas.push(`desplazado ${Math.round(ty)} px`);
    }
    if (problemas.length) ocultos.push(`${nombre(el)}: ${[...new Set(problemas)].join(", ")}`);
  }
  return ocultos;
}

const navegador = await abrirNavegador();
let fallas = 0;
for (const modo of modos) {
  for (const ancho of anchos) {
    const { nombre, ...perfil } = ancho;
    const contexto = await navegador.newContext({ ...perfil, reducedMotion: modo });
    // Dos recorridos por ruta: desde arriba bajando despacio, y entrando ya abajo (como al recargar a media página
    // o al seguir un ancla) y subiendo: lo que quedó arriba también tiene que aparecer.
    for (const ruta of rutas.flatMap((r) => [r, `${r}#fondo`])) {
      const desdeAbajo = ruta.endsWith("#fondo");
      const pagina = await contexto.newPage();
      // Un `net::ERR_ABORTED` de un .mp4/.webm no cuenta: Chrome corta así la descarga de un video al navegar o al
      // cerrar la pestaña. Cualquier otro fallo de red, sí.
      const todos = vigilarErrores(pagina);
      await pagina.goto(urlDe(base, ruta.replace("#fondo", "")), { waitUntil: "load" });
      await pagina.waitForTimeout(500);
      // Rueda del ratón también en los perfiles táctiles: es lo que mueve Lenis y ScrollTrigger igual que un dedo.
      await pagina.mouse.move(perfil.viewport.width / 2, perfil.viewport.height / 2);
      if ("sin-bajar" in opciones) {
        // Prueba del propio detector: sin bajar, lo de abajo con movimiento DEBE salir como oculto.
      } else if (desdeAbajo) {
        await pagina.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
        await pagina.waitForTimeout(800);
        for (let vueltas = 0; vueltas < 400; vueltas++) {
          await pagina.mouse.wheel(0, -300);
          await pagina.waitForTimeout(120);
          if (await pagina.evaluate(() => scrollY <= 0)) break;
        }
      } else {
        for (let vueltas = 0; vueltas < 400; vueltas++) {
          await pagina.mouse.wheel(0, 300);
          await pagina.waitForTimeout(120);
          const alFondo = await pagina.evaluate(() => innerHeight + scrollY >= document.documentElement.scrollHeight - 4);
          if (alFondo) break;
        }
      }
      await pagina.waitForTimeout(2500);
      for (let vueltas = 0; vueltas < 400; vueltas++) {
        await pagina.mouse.wheel(0, -1200);
        await pagina.waitForTimeout(60);
        if (await pagina.evaluate(() => scrollY <= 0)) break;
      }
      await pagina.waitForTimeout(1500);
      const ocultos = await pagina.evaluate(revisar);
      const errores = todos.filter((e) => !/^falló: \S+\.(mp4|webm)(\?\S*)? \(net::ERR_ABORTED\)$/.test(e));
      const etiqueta = `${modo === "reduce" ? "quieto" : "mueve "} ${nombre.padStart(4)} ${ruta}`;
      if (ocultos.length || errores.length) fallas++;
      console.log(`${etiqueta}: ${ocultos.length} ocultos, ${errores.length} errores`);
      ocultos.forEach((x) => console.log("  - " + x));
      errores.forEach((x) => console.log("  ! " + x.slice(0, 200)));
      await pagina.close();
    }
    await contexto.close();
  }
}
await navegador.close();
process.exit(fallas ? 1 : 0);
