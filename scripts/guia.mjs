// Haku, el guía, en el sitio servido (1440×900 y 390×844). Haku camina directo sobre la página (sin franja). Baja
// DESPACIO por toda la página y vuelve a subir, y falla (sale con 1) si:
//   · en alguna estación (salvo el pie, donde se duerme) no hay globo al llegar (ni tocando a Haku);
//   · parado el scroll, Haku no se ve ENTERO: el gato del guía a tamaño completo (sin encoger) dentro de la ventana, o,
//     si el guía se convirtió en el Haku de una estación, ese dibujo entero dentro de la ventana;
//   · en algún momento hay más de UN Haku a la vista (el guía + cualquier [data-haku="propio"] con su Haku visible);
//   · hay más de un guía montado, o su <svg> muestra más de un cuadro a la vez (lienzos huérfanos: el «gato doble»);
//   · el globo LIBRE (no la placa) se encima con un renglón, un rótulo de svg, un control o una vista, o queda bajo
//     la cabecera.
//   · en el inicio a 1440×900, Haku sentado pisa texto, botones o vistas habiendo en esa franja un hueco libre
//     (se mira otra vez a los 2.5 s, por si se estaba acomodando; dice la estación, lo que pisa y dónde estaba el hueco).
// Avisos (no fallan): Haku sentado encima de texto sin ningún hueco libre en todo el ancho (o fuera del inicio) y la
// placa (globo pegado a Haku cuando no cabía libre) encima de texto.
// Sirve para el inicio y para las páginas de caso.
//
// Uso, con el sitio servido (`npm run build`, luego `npx --yes serve@14 out -l <puerto>`):
//   nice -n 19 taskset -c 0-3 node scripts/guia.mjs / /en/ --base http://localhost:3210 [--solo 1440,390]
import { abrirNavegador, leerArgumentos, PERFILES, urlDe, vigilarErrores } from "./comun.mjs";

const { opciones, rutas } = leerArgumentos();
const base = opciones.base || "http://localhost:3210";
const anchos = [
  { nombre: "1440", ...PERFILES.escritorio },
  { nombre: "390", ...PERFILES.iphone13 },
].filter((a) => !opciones.solo || opciones.solo.split(",").includes(a.nombre));
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

/** En la página: estación del centro, globo, choques del globo y cuántos Haku se ven. */
function medir() {
  const enVentana = (r) => r.width > 1 && r.height > 1 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
  const guia = document.querySelector("[data-guia]");
  // la estación que contiene el centro de la ventana
  let estacion = null;
  for (const el of document.querySelectorAll("[data-estacion]")) {
    const r = el.getBoundingClientRect();
    if (r.top <= innerHeight / 2 && r.bottom >= innerHeight / 2 && r.left <= innerWidth / 2 && r.right >= innerWidth / 2) estacion = el.dataset.estacion;
  }
  // ¿cuántos Haku se ven?
  const opacidad = (el) => {
    let o = 1;
    for (let a = el; a && a !== document.documentElement; a = a.parentElement || a.parentNode) {
      if (!(a instanceof Element)) break;
      const e = getComputedStyle(a);
      if (e.display === "none" || e.visibility === "hidden") return 0;
      o *= parseFloat(e.opacity);
    }
    return o;
  };
  const vistos = [];
  const caja = guia?.querySelector("[data-haku]");
  if (guia && caja && guia.hasAttribute("data-listo") && opacidad(caja) > 0.1 && enVentana(caja.getBoundingClientRect())) vistos.push("guía");
  for (const p of document.querySelectorAll('[data-haku="propio"]')) {
    const grupos = [...p.querySelectorAll('[data-g^="haku"]')].filter((g) => {
      const r = g.getBoundingClientRect();
      return enVentana(r) && opacidad(g) > 0.1;
    });
    if (grupos.length) vistos.push(p.closest("[data-estacion]")?.dataset.estacion ?? "¿?");
  }
  const raices = document.querySelectorAll("[data-guia]").length;
  const cuadros = guia ? [...guia.querySelectorAll("[data-haku] svg g[data-cuadro]")].filter((g) => g.style.display !== "none").length : 0;
  // lo que tapa una caja (el globo o Haku sentado): renglones, botones, vistas y obstáculos a la vista
  // (Haku sentado: solo lo que se lee y las vistas; delante de un dibujo decorativo sí puede quedar)
  const tapados = (rg, dibujos = true) => {
    const choques = [];
    const cruza = (r) => r.left < rg.right - 1 && rg.left < r.right - 1 && r.top < rg.bottom - 1 && rg.top < r.bottom - 1;
    const nombre = (el) => `${el.tagName.toLowerCase()} «${(el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 30)}»`;
    const rango = document.createRange();
    for (const el of document.querySelectorAll("h1, h2, h3, p, li, a[href], button")) {
      if (guia?.contains(el) || el.closest(".sr-only, [aria-hidden='true']")) continue;
      if (!enVentana(el.getBoundingClientRect()) || opacidad(el) < 0.05) continue;
      if (el.matches("a[href], button") && cruza(el.getBoundingClientRect())) { choques.push(nombre(el)); continue; }
      const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      for (let n = w.nextNode(); n; n = w.nextNode()) {
        if (!n.textContent.trim() || n.parentElement?.closest(".sr-only")) continue;
        rango.selectNodeContents(n);
        if ([...rango.getClientRects()].some((r) => r.width > 2 && r.height > 2 && cruza(r))) { choques.push(nombre(el)); break; }
      }
    }
    // los rótulos de un diagrama o dibujo (<text> de svg) también se leen
    for (const el of document.querySelectorAll("svg text")) {
      if (guia?.contains(el) || el.closest("[data-linea-viva]")) continue;
      const r = el.getBoundingClientRect();
      if (enVentana(r) && cruza(r) && opacidad(el) > 0.05) choques.push(`rótulo «${(el.textContent || "").trim().slice(0, 24)}»`);
    }
    for (const el of document.querySelectorAll(dibujos ? "[data-obstaculo], [data-vista], video" : "[data-vista], video")) {
      if (guia?.contains(el) || el.querySelector?.('[data-haku-estado="dentro"]') || el.closest('[data-haku-estado="dentro"]') || el.matches('[data-haku="propio"]')) continue;
      const r = el.getBoundingClientRect();
      if (enVentana(r) && cruza(r) && opacidad(el) > 0.05) choques.push(`obstáculo ${el.tagName.toLowerCase()}.${String(el.className).slice(0, 30)}`);
    }
    return [...new Set(choques)];
  };
  // el globo o la placa: qué tapa; nunca bajo la cabecera
  const g = document.querySelector("[data-haku-globo]");
  let globo = null, choques = [];
  if (g && getComputedStyle(g).visibility !== "hidden") {
    const rg = g.getBoundingClientRect();
    const placa = g.getAttribute("data-placa");
    globo = { x: Math.round(rg.left), y: Math.round(rg.top), w: Math.round(rg.width), h: Math.round(rg.height), texto: g.textContent, placa };
    const cabecera = document.querySelector("body > header, header[data-cabecera], header")?.getBoundingClientRect();
    if (cabecera && rg.top < cabecera.bottom - 1) choques.push("la cabecera");
    choques.push(...tapados(rg));
  }
  // Haku entero: el cuadro visible del guía (o el Haku de la estación en que se convirtió)
  let entero = null;
  const cuadro = guia?.querySelector('[data-haku] svg g[data-cuadro]:not([style*="none"])');
  if (guia && guia.hasAttribute("data-listo") && !guia.hasAttribute("data-oculto") && cuadro) {
    const r = cuadro.getBoundingClientRect();
    const escala = guia.querySelector("[data-espejo]")?.style.scale || "1";
    const problemas = [];
    if (r.left < -1 || r.right > innerWidth + 1) problemas.push(`se sale por la orilla (x ${Math.round(r.left)}–${Math.round(r.right)})`);
    if (r.bottom > innerHeight + 1 || r.top < 0) problemas.push(`se sale por arriba o por abajo (y ${Math.round(r.top)}–${Math.round(r.bottom)})`);
    let tapa = [];
    let huecoLibre = null;
    if (guia.querySelector("[data-asentado]")) {
      tapa = tapados(r, false);
      // ¿había en esa franja un hueco donde no pisara nada que se lea (ni botones ni vistas)? a saltos de 16 px
      if (tapa.length) {
        for (let x = 60; x + r.width < innerWidth - 4 && huecoLibre === null; x += 16) {
          const c = { left: x, right: x + r.width, top: r.top, bottom: r.bottom };
          if (!tapados(c, false).length) huecoLibre = Math.round(x + r.width / 2);
        }
      }
    }
    if (escala !== "1") problemas.push(`encogido (escala ${escala})`);
    if (opacidad(cuadro) < 0.5) problemas.push("transparente");
    entero = { quien: "guía", problemas, alto: Math.round(r.height), tapa, huecoLibre, x: Math.round(r.left + r.width / 2) };
  } else if (guia?.hasAttribute("data-oculto")) {
    const propio = document.querySelector('[data-haku-estado="dentro"]');
    const rs = propio ? [...propio.querySelectorAll('[data-g^="haku"]')].map((x) => x.getBoundingClientRect()).filter((r) => r.width > 1) : [];
    const problemas = [];
    if (!rs.length) problemas.push("el guía se escondió y no hay Haku de estación a la vista");
    else {
      const top = Math.min(...rs.map((r) => r.top)), bottom = Math.max(...rs.map((r) => r.bottom));
      const left = Math.min(...rs.map((r) => r.left)), right = Math.max(...rs.map((r) => r.right));
      if (left < -1 || right > innerWidth + 1 || top < 0 || bottom > innerHeight + 1) problemas.push(`el Haku de la estación no está entero en la ventana (${Math.round(left)},${Math.round(top)}–${Math.round(right)},${Math.round(bottom)})`);
    }
    entero = { quien: "estación", problemas };
  }
  return { estacion, vistos, raices, cuadros, globo, choques, entero, y: Math.round(scrollY), alto: document.documentElement.scrollHeight };
}

const navegador = await abrirNavegador();
let fallas = 0;
try {
  for (const ruta of rutas) {
    for (const a of anchos) {
      const { nombre, ...perfil } = a;
      const ctx = await navegador.newContext({ ...perfil });
      const p = await ctx.newPage();
      const errores = vigilarErrores(p);
      await p.goto(urlDe(base, ruta), { waitUntil: "load" });
      await p.waitForSelector("[data-guia][data-listo]", { timeout: 15000 }).catch(() => {});
      await espera(1200);
      const vistas = new Map();
      let sentados = 0;
      const avisos = [];
      const falla = (m) => { fallas++; console.log(`  ✗ ${ruta} ${nombre}: ${m}`); };
      const revisar = (m, donde) => {
        if (m.vistos.length > 1) falla(`${m.vistos.length} Haku a la vez (${m.vistos.join(" + ")}) en y=${m.y} ${donde}`);
        if (m.raices !== 1) falla(`${m.raices} guías montados en y=${m.y}`);
        if (m.cuadros > 1) falla(`el <svg> del guía muestra ${m.cuadros} cuadros a la vez en y=${m.y}`);
      };
      // bajar despacio, de media en media pantalla; en cada estación nueva, esperar a que presente y revisar el globo
      const paso = Math.round(perfil.viewport.height * 0.45);
      await p.mouse.move(perfil.viewport.width / 2, perfil.viewport.height / 3);
      for (let vuelta = 0; vuelta < 120; vuelta++) {
        // a media caminata también
        await p.mouse.wheel(0, paso / 2);
        await espera(90);
        revisar(await p.evaluate(medir), "(caminando)");
        await p.mouse.wheel(0, paso / 2);
        await espera(1700);
        let m = await p.evaluate(medir);
        revisar(m, "(bajando)");
        if (m.estacion && !vistas.has(m.estacion)) {
          if (!m.globo) {
            // sin globo todavía: tocar a Haku pide otra frase (si el guía se ve)
            // (con .click() del elemento, no con el ratón: si el guía está escondido, el ratón tocaría lo de abajo)
            if (m.vistos.includes("guía")) await p.evaluate(() => document.querySelector("[data-guia] [data-haku]")?.click());
            await espera(1600);
            m = await p.evaluate(medir);
          }
          vistas.set(m.estacion, m.globo);
          if (!m.globo && m.estacion !== "pie") falla(`sin globo al llegar a «${m.estacion}» (y=${m.y})`);
          if (m.globo && m.choques.length) {
            if (m.globo.placa && !m.choques.includes("la cabecera")) avisos.push(`placa en «${m.estacion}» encima de ${m.choques.slice(0, 2).join(", ")}`);
            else falla(`globo en «${m.estacion}» tapa: ${m.choques.slice(0, 3).join(", ")}`);
          }
        }
        if (!m.entero || m.entero.problemas.length) {
          // una segunda mirada: si se estaba sentando o cayendo, ya debió llegar
          await espera(1500);
          const m2 = await p.evaluate(medir);
          if (!m2.entero) falla(`Haku no se ve en «${m2.estacion}» (y=${m2.y})`);
          else if (m2.entero.problemas.length) {
            falla(`Haku (${m2.entero.quien}) no se ve entero en «${m2.estacion}» (y=${m2.y}): ${m2.entero.problemas.join("; ")}`);
          }
        }
        if (m.entero?.quien === "guía") sentados++;
        if (m.entero?.tapa?.length) {
          // en el inicio a 1440×900 es FALLA si había un hueco libre en la franja (tras darle tiempo a acomodarse)
          const inicio = ruta === "/" || ruta === "/en/";
          const m3 = inicio && nombre === "1440" && m.entero.huecoLibre !== null ? (await espera(2500), await p.evaluate(medir)) : null;
          if (m3?.entero?.tapa?.length && m3.entero.huecoLibre !== null) {
            falla(`Haku sentado en «${m3.estacion}» (y=${m3.y}, x=${m3.entero.x}) pisa ${m3.entero.tapa.slice(0, 2).join(", ")} habiendo hueco libre en x=${m3.entero.huecoLibre}`);
          } else if (!m3 || m3.entero?.tapa?.length) avisos.push(`Haku sentado en «${m.estacion}» (y=${m.y}) encima de ${m.entero.tapa.slice(0, 2).join(", ")}`);
        }
        if (m.y + perfil.viewport.height >= m.alto - 2) break;
      }
      // y de vuelta arriba, más rápido
      for (let vuelta = 0; vuelta < 80; vuelta++) {
        await p.mouse.wheel(0, -paso * 1.5);
        await espera(500);
        const m = await p.evaluate(medir);
        revisar(m, "(subiendo)");
        if (m.y <= 0) break;
      }
      const sinGlobo = [...vistas].filter(([, g]) => !g).map(([e]) => e);
      const placas = [...vistas].filter(([, g]) => g?.placa).map(([e]) => e);
      console.log(`${ruta} ${nombre}: ${vistas.size} estaciones revisadas · Haku entero ${sentados} veces` +
        `${placas.length ? ` · como placa: ${placas.join(", ")}` : ""}${sinGlobo.length ? ` · sin globo: ${sinGlobo.join(", ")}` : ""}`);
      if (avisos.length) console.log(`  avisos (${avisos.length}): ${[...new Set(avisos)].slice(0, 4).join(" | ")}`);
      if (errores.length) console.log(`  aviso: ${errores.slice(0, 3).join(" | ")}`);
      await ctx.close();
    }
  }
} finally {
  await navegador.close();
}
console.log(fallas ? `✗ ${fallas} falla(s)` : "✓ guía: un solo Haku, entero y a su tamaño, con globo en cada estación");
process.exit(fallas ? 1 : 0);
