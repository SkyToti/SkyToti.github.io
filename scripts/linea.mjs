// La línea viva (components/mundo/): comprueba en 1440×900, 834×1194 y 390×844 que
//   (a) muestreando 400 puntos del trazo, ninguno cae sobre texto visible (rectángulos de Range.getClientRects()
//       de h1, h2, h3, p, li, a y botones) ni sobre un img/video/svg (escenas, inventos, viñetas: la parte visible,
//       recortada por su overflow) ni sobre un `[data-obstaculo]` (vistas, inventos, el número gigante de un
//       escenario), con 6 px de holgura. Un dibujo «detrás» (`[data-linea="detras"]`: decoración ancha) SÍ se puede
//       cruzar (la línea pasa por detrás y atenuada): sus img/svg/obstáculos no cuentan, pero su texto, sus botones
//       y una `Vista` dentro de él siguen siendo duros. Además, ningún `[data-pasillo]` tiene texto ni medios dentro y la línea
//       encontró ruta a todos los escenarios a todo lo ancho (sin `data-sin-ruta` en el SVG);
//   (b) el trazo pasa a ≤ 8 px de cada ancla visible, en orden;
//   (c) bajando despacio con la rueda hasta el fondo, todas las estaciones acaban con `llego` y la chispa termina en
//       el ancla del pie;
//   (d) con reducedMotion: 'reduce' la línea está completa, no hay chispa y todas las estaciones tienen `llego`;
//   (e) 0 errores y 0 avisos de consola. Un `net::ERR_ABORTED` de un .mp4/.webm no cuenta: Chrome corta así la
//       descarga de un video al navegar o al cerrar la pestaña (cualquier otro fallo de red, sí).
// Sale con 1 si algo falla.
//
// Uso, con el sitio servido (`npm run build && npm run start`, puerto 3210):
//   nice -n 19 taskset -c 0-3 node scripts/linea.mjs / /en/
//   … --base http://localhost:3210 --solo 390,1440
import { abrirNavegador, leerArgumentos, PERFILES, urlDe } from "./comun.mjs";

const { opciones, rutas } = leerArgumentos();
const base = opciones.base || "http://localhost:3210";
const anchos = [
  { nombre: "1440", ...PERFILES.escritorio },
  { nombre: "834", ...PERFILES.ipad },
  { nombre: "390", ...PERFILES.iphone13 },
].filter((a) => !opciones.solo || opciones.solo.split(",").includes(a.nombre));

function vigilar(pagina) {
  const avisos = [];
  pagina.on("console", (m) => ["error", "warning"].includes(m.type()) && avisos.push(`consola ${m.type()}: ${m.text()}`));
  pagina.on("pageerror", (e) => avisos.push(`página: ${String(e)}`));
  pagina.on("response", (r) => r.status() >= 400 && avisos.push(`HTTP ${r.status()}: ${r.url()}`));
  pagina.on("requestfailed", (r) => {
    const error = r.failure()?.errorText ?? "";
    if (/ERR_ABORTED/.test(error) && /\.(mp4|webm)(\?|$)/.test(r.url())) return;
    avisos.push(`falló: ${r.url()} (${error})`);
  });
  return avisos;
}

/** En la página: (a) choques del trazo con texto o medios y (b) anclas por las que no pasa, en orden. */
function geometria() {
  const svg = document.querySelector("svg[data-linea-viva]");
  const camino = svg?.querySelector("[data-trazo]");
  if (!camino || !camino.getAttribute("d")) return { error: "no hay trazo" };
  const total = camino.getTotalLength();
  // Del espacio del SVG al de getBoundingClientRect (getScreenCTM incluye el corrimiento del viewport visual en
  // los perfiles de celular y no sirve para comparar con rectángulos de cliente).
  const caja = svg.getBoundingClientRect();
  const vb = svg.viewBox.baseVal;
  const ex = vb && vb.width ? caja.width / vb.width : 1;
  const ey = vb && vb.height ? caja.height / vb.height : 1;
  const punto = (l) => {
    const p = camino.getPointAtLength(l);
    return { x: caja.left + p.x * ex, y: caja.top + p.y * ey };
  };
  const HOLGURA = 6;
  const cajas = [];
  /** dentro de un dibujo «detrás» (el marcador más cercano manda: una Vista dentro sigue siendo dura) */
  const enDetras = (el) => el.closest("[data-linea],[data-vista]")?.getAttribute("data-linea") === "detras";
  /** la parte de `r` que dejan ver los ancestros de `el` con overflow distinto de visible */
  const recortar = (el, r) => {
    for (let a = el; a && a !== document.body; a = a.parentElement) {
      const o = getComputedStyle(a);
      if (o.overflowX === "visible" && o.overflowY === "visible") continue;
      const c = a.getBoundingClientRect();
      const x0 = Math.max(r.left, c.left), y0 = Math.max(r.top, c.top), x1 = Math.min(r.right, c.right), y1 = Math.min(r.bottom, c.bottom);
      r = new DOMRect(x0, y0, Math.max(0, x1 - x0), Math.max(0, y1 - y0));
    }
    return r;
  };
  /** quién es: etiqueta#id.clases[data-*] · estación (para saber qué bloque estorba sin adivinar) */
  const quien = (el) => {
    const clases = typeof el.className === "string" ? el.className : el.getAttribute("class") || "";
    const datos = [...el.attributes].filter((a) => a.name.startsWith("data-")).map((a) => a.name.slice(5)).join(",");
    const est = el.closest("[data-estacion]")?.dataset.estacion ?? "sin estación";
    const padre = el.parentElement;
    const clasesPadre = padre ? (typeof padre.className === "string" ? padre.className : padre.getAttribute("class") || "") : "";
    return `<${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""}${clases ? "." + clases.trim().split(/\s+/).join(".") : ""}` +
      `${datos ? " [" + datos + "]" : ""}> en «${est}» (padre .${clasesPadre.trim().split(/\s+/).join(".") || "?"})`;
  };
  const rango = document.createRange();
  const andador = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = andador.nextNode(); n; n = andador.nextNode()) {
    const el = n.parentElement;
    if (!el || !n.textContent.trim() || !el.closest("h1,h2,h3,p,li,a,button") || el.closest("header,.sr-only,script,style"))
      continue;
    if (getComputedStyle(el).visibility === "hidden") continue;
    // en un dibujo «detrás», el texto transparente (la etiqueta de un agente que aún no se enseña) no cuenta
    if (enDetras(el)) {
      let oculto = false;
      for (let a = el; a && a.getAttribute("data-linea") !== "detras"; a = a.parentElement)
        if (parseFloat(getComputedStyle(a).opacity) < 0.05) oculto = true;
      if (oculto) continue;
    }
    rango.selectNodeContents(n);
    for (const r0 of rango.getClientRects()) {
      // solo lo que se ve: el texto recortado por un ancestro con overflow (una viñeta fuera del marco de la tira
      // fijada) no cuenta
      const r = recortar(el, r0);
      if (r.width > 0 && r.height > 0) cajas.push({ r, que: `texto «${n.textContent.trim().slice(0, 30)}»`, el });
    }
  }
  document.querySelectorAll("main img, main video, main svg, footer img, footer svg, [data-obstaculo]").forEach((m) => {
    if (m.closest("[data-linea-viva]") || enDetras(m)) return;
    const que = m.hasAttribute("data-obstaculo") ? `obstáculo ${m.dataset.vista !== undefined ? "vista" : m.dataset.numero ? "número" : m.tagName.toLowerCase()}` : m.tagName.toLowerCase();
    // solo la parte que se ve: recortada por los ancestros con overflow distinto de visible (la tira fijada
    // esconde las viñetas que salen de su marco)
    let r = m.getBoundingClientRect();
    for (let a = m.parentElement; a && a !== document.body; a = a.parentElement) {
      const o = getComputedStyle(a);
      if (o.overflowX === "visible" && o.overflowY === "visible") continue;
      const c = a.getBoundingClientRect();
      const x0 = Math.max(r.left, c.left), y0 = Math.max(r.top, c.top), x1 = Math.min(r.right, c.right), y1 = Math.min(r.bottom, c.bottom);
      r = new DOMRect(x0, y0, Math.max(0, x1 - x0), Math.max(0, y1 - y0));
    }
    const minimo = m.hasAttribute("data-obstaculo") ? 1 : 24;
    if (r.width >= minimo && r.height >= minimo) cajas.push({ r, que: `${que} ${Math.round(r.width)}×${Math.round(r.height)}`, el: m });
  });
  // Los botones de un dibujo «detrás» (un agente de la mesa, un objeto de la repisa) son duros.
  document.querySelectorAll('[data-linea="detras"] button').forEach((b) => {
    if (!enDetras(b)) return;
    const r = recortar(b, b.getBoundingClientRect());
    if (r.width >= 1 && r.height >= 1) cajas.push({ r, que: `botón de un dibujo detrás ${Math.round(r.width)}×${Math.round(r.height)}`, el: b });
  });
  // Cuántos puntos del trazo pasan por detrás de un dibujo (informativo).
  const zonas = [...document.querySelectorAll('[data-linea="detras"]')].map((z) => recortar(z, z.getBoundingClientRect()));
  // Los pasillos son zonas vacías: nada de texto ni medios dentro.
  const pasillosLlenos = [...document.querySelectorAll("[data-pasillo]")]
    .filter((p) => p.textContent.trim() || p.querySelector("img,video,svg,canvas"))
    .map((p) => p.closest("[data-estacion]")?.dataset.estacion ?? "?");
  const choques = [];
  let detras = 0;
  for (let i = 0; i < 400; i++) {
    const p = punto((total * i) / 399);
    if (zonas.some((r) => p.x > r.left && p.x < r.right && p.y > r.top && p.y < r.bottom)) detras++;
    const c = cajas.find(
      ({ r }) => p.x > r.left - HOLGURA && p.x < r.right + HOLGURA && p.y > r.top - HOLGURA && p.y < r.bottom + HOLGURA,
    );
    if (c) choques.push(`punto ${i} (${Math.round(p.x)}, ${Math.round(p.y + scrollY)}) sobre ${c.que} — ${quien(c.el)}`);
  }
  // (b) muestreo fino (cada 3 px) para medir la distancia a cada ancla.
  const finos = [];
  for (let l = 0; l <= total; l += 3) finos.push(punto(l));
  finos.push(punto(total));
  const anclas = [...document.querySelectorAll("[data-estacion] [data-ancla]")].filter((a) => a.getClientRects().length);
  const fallidas = [];
  let desde = 0;
  for (const a of anclas) {
    const r = a.getBoundingClientRect();
    const c = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    let hallado = -1;
    let minimo = Infinity;
    for (let i = desde; i < finos.length; i++) {
      const d = Math.hypot(finos[i].x - c.x, finos[i].y - c.y);
      minimo = Math.min(minimo, d);
      if (d <= 8) {
        hallado = i;
        break;
      }
    }
    const nombre = a.closest("[data-estacion]").dataset.estacion;
    if (hallado < 0) fallidas.push(`${nombre}: a ${minimo.toFixed(1)} px (después de la anterior)`);
    else desde = hallado;
  }
  if (choques.length && window.__depurar) choques.unshift(`d=${camino.getAttribute("d").slice(0, 90)} ancla0=${JSON.stringify(anclas[0].getBoundingClientRect().toJSON())} svg=${JSON.stringify(svg.getBoundingClientRect().toJSON())} sy=${scrollY}`);
  const sinRuta = svg.dataset.sinRuta ? svg.dataset.sinRuta.split(" ") : [];
  const mascara = camino.getAttribute("mask");
  return { choques, fallidas, anclas: anclas.length, total: Math.round(total), sinRuta, pasillosLlenos, detras, mascara: Boolean(mascara) };
}

/** En la página: (c)/(d) estado de las estaciones, de la chispa y del trazo. */
function estado() {
  const svg = document.querySelector("svg[data-linea-viva]");
  const sin = [...document.querySelectorAll("[data-estacion]")].filter((e) => !e.classList.contains("llego")).map((e) => e.dataset.estacion);
  // la chispa va en la capa de delante (otro svg[data-linea-viva], encima del contenido)
  const chispa = document.querySelector("svg[data-linea-viva] [data-chispa]");
  const visibleChispa = chispa && getComputedStyle(chispa).display !== "none" && chispa.getClientRects().length > 0;
  let distanciaPie = null;
  if (visibleChispa) {
    const nucleo = chispa.querySelector("circle:not([data-halo])").getBoundingClientRect();
    const anclas = [...document.querySelectorAll('[data-estacion="pie"] [data-ancla]')].filter((a) => a.getClientRects().length);
    const a = anclas.at(-1)?.getBoundingClientRect();
    if (a) distanciaPie = Math.hypot(nucleo.left + nucleo.width / 2 - (a.left + a.width / 2), nucleo.top + nucleo.height / 2 - (a.top + a.height / 2));
  }
  const camino = svg?.querySelector("[data-trazo]");
  const estilo = camino && getComputedStyle(camino);
  // Dibujado completo: sin guiones, o con el guion visible ≥ largo total.
  let completo = false;
  if (camino) {
    const total = camino.getTotalLength();
    // con pathLength (la línea lo pone en 1) los guiones van en esa unidad: se pasan a px
    const unidad = camino.hasAttribute("pathLength") ? total / (parseFloat(camino.getAttribute("pathLength")) || 1) : 1;
    const guiones = estilo.strokeDasharray;
    const visible = guiones === "none" ? total : parseFloat(guiones) * unidad;
    completo = visible >= total - 2 && Math.abs((parseFloat(estilo.strokeDashoffset) || 0) * unidad) < 2;
  }
  return { sin, visibleChispa, distanciaPie, completo, quieto: svg?.hasAttribute("data-quieto") ?? null };
}

/** Baja despacio con la rueda; cada 8 pasos se detiene 1.2 s y anota dónde quedó la chispa en la pantalla
 *  (quieta debe verse: entre el borde de la cabecera y el borde de abajo). */
async function bajarDespacio(pagina, perfil) {
  const fuera = [];
  await pagina.mouse.move(perfil.viewport.width / 2, perfil.viewport.height / 2);
  for (let vueltas = 0; vueltas < 500; vueltas++) {
    await pagina.mouse.wheel(0, 300);
    await pagina.waitForTimeout(120);
    if (await pagina.evaluate(() => innerHeight + scrollY >= document.documentElement.scrollHeight - 4)) break;
    if (vueltas % 8 === 7) {
      await pagina.waitForTimeout(1200);
      const y = await pagina.evaluate(() => {
        const n = document.querySelector("svg[data-linea-viva] [data-chispa] circle:not([data-halo])")?.getBoundingClientRect();
        return n ? [Math.round(n.top + n.height / 2), innerHeight, Math.round(scrollY)] : null;
      });
      if (y && (y[0] < 48 || y[0] > y[1] - 4)) fuera.push(`scroll ${y[2]}: chispa en y=${y[0]} de ${y[1]}`);
    }
  }
  await pagina.waitForTimeout(2200);
  return fuera;
}

const navegador = await abrirNavegador();
let fallas = 0;
const falla = (msj) => {
  fallas++;
  console.log("  ✗ " + msj);
};
for (const ruta of rutas) {
  for (const { nombre, ...perfil } of anchos) {
    // Con movimiento.
    {
      const contexto = await navegador.newContext({ ...perfil, reducedMotion: "no-preference" });
      const pagina = await contexto.newPage();
      const avisos = vigilar(pagina);
      await pagina.goto(urlDe(base, ruta), { waitUntil: "load" });
      await pagina.waitForSelector("svg[data-linea-viva][data-listo]", { state: "attached", timeout: 15000 });
      await pagina.waitForTimeout(2000);
      const fuera = await bajarDespacio(pagina, perfil);
      fuera.forEach((f) => falla(`(c) quieta fuera de pantalla: ${f}`));
      const e = await pagina.evaluate(estado);
      if (process.env.DEPURAR) await pagina.evaluate(() => (window.__depurar = true));
      const g = await pagina.evaluate(geometria);
      console.log(
        `mueve  ${nombre.padStart(4)} ${ruta}: trazo ${g.total ?? "?"} px, ${g.anclas ?? 0} anclas, ` +
          `${g.choques?.length ?? "?"} choques, ${g.detras ?? 0}/400 puntos detrás de un dibujo, ${g.fallidas?.length ?? "?"} anclas lejos, ` +
          `${e.sin.length} estaciones sin llegar, chispa a ${e.distanciaPie?.toFixed(1) ?? "?"} px del pie, ${avisos.length} avisos`,
      );
      if (g.error) falla(g.error);
      g.choques?.slice(0, 8).forEach((c) => falla(`(a) ${c.slice(0, 400)}`));
      if ((g.choques?.length ?? 0) > 8) falla(`(a) … y ${g.choques.length - 8} más`);
      g.fallidas?.forEach((f) => falla(`(b) ${f}`));
      g.sinRuta?.forEach((n) => falla(`(a) sin ruta libre hacia o desde el escenario «${n}»`));
      if (g.detras && !g.mascara) falla("(a) el trazo cruza un dibujo «detrás» pero no lleva la máscara que lo atenúa");
      g.pasillosLlenos?.forEach((n) => falla(`(a) un data-pasillo de «${n}» tiene texto o medios`));
      if (e.sin.length) falla(`(c) sin llego: ${e.sin.join(", ")}`);
      if (!e.visibleChispa || e.distanciaPie === null || e.distanciaPie > 10) falla(`(c) la chispa no terminó en el pie`);
      if (!e.completo) falla("(c) al fondo, el trazo no quedó completo");
      avisos.forEach((a) => falla(`(e) ${a.slice(0, 200)}`));
      await contexto.close();
    }
    // Con menos movimiento.
    {
      const contexto = await navegador.newContext({ ...perfil, reducedMotion: "reduce" });
      const pagina = await contexto.newPage();
      const avisos = vigilar(pagina);
      await pagina.goto(urlDe(base, ruta), { waitUntil: "load" });
      await pagina.waitForSelector("svg[data-linea-viva][data-listo]", { state: "attached", timeout: 15000 });
      await pagina.waitForTimeout(800);
      const e = await pagina.evaluate(estado);
      console.log(
        `quieto ${nombre.padStart(4)} ${ruta}: completo ${e.completo}, chispa ${e.visibleChispa ? "visible" : "no"}, ` +
          `${e.sin.length} estaciones sin llego, ${avisos.length} avisos`,
      );
      if (!e.quieto || !e.completo) falla("(d) la línea no está completa y quieta");
      if (e.visibleChispa) falla("(d) hay chispa con menos movimiento");
      if (e.sin.length) falla(`(d) sin llego: ${e.sin.join(", ")}`);
      avisos.forEach((a) => falla(`(e) ${a.slice(0, 200)}`));
      await contexto.close();
    }
  }
}
await navegador.close();
console.log(fallas ? `\n${fallas} fallas` : "\nlínea viva: todo en verde");
process.exit(fallas ? 1 : 0);
