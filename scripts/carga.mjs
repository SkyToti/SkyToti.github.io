// El costo de cargar (y de recorrer) una página, medido con el trace de Chromium y el perfilador de V8:
//   · TBT aproximado (Σ de lo que pasa de 50 ms cada tarea del hilo principal desde el FCP), nº y duración de las
//     tareas largas (> 50 ms), tiempo en layout y en recálculo de estilo, layouts forzados desde JavaScript (con la
//     función que los pidió), y el top 10 de funciones por tiempo propio y por tiempo total (nombre y archivo).
//   · Con --scroll: además baja toda la página a pasos de pulgar y reporta las tareas > 80 ms durante la bajada.
// Perfil de celular tipo Lighthouse (412×823, DPR 1.75, táctil) y CPU ×4. Sin red simulada (sitio local).
//
// Uso, con el sitio servido (`npx --yes serve@14 out -l 3246`):
//   nice -n 19 taskset -c 0-3 node scripts/carga.mjs / --base http://localhost:3246
//   … --cpu 4 --espera 6000 --scroll --escritorio --json salida.json --veces 3 --fuente (trozo del código de cada función) --pila (quién llamó a lo más caro de cada tarea larga)
import { writeFile } from "node:fs/promises";
import { abrirNavegador, leerArgumentos, urlDe } from "./comun.mjs";

const { opciones, rutas } = leerArgumentos();
const base = opciones.base || "http://localhost:3246";
const cpu = Number(opciones.cpu || 4);
const espera = Number(opciones.espera || 6000);
const veces = Number(opciones.veces || 1);
const conScroll = "scroll" in opciones;
const escritorio = "escritorio" in opciones;

const CATEGORIAS = [
  "devtools.timeline",
  "disabled-by-default-devtools.timeline",
  "disabled-by-default-devtools.timeline.stack",
  "v8.execute",
  "blink.user_timing",
  "loading",
  "toplevel",
];

const ms = (n) => Math.round(n);
const corta = (url) => (url ? url.replace(/^https?:\/\/[^/]+/, "").replace(/\?.*$/, "") : "(nativo)");

async function medir(navegador, ruta) {
  const contexto = await navegador.newContext(
    escritorio
      ? { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 }
      : {
          viewport: { width: 412, height: 823 },
          deviceScaleFactor: 1.75,
          isMobile: true,
          hasTouch: true,
          userAgent:
            "Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36",
        },
  );
  const pagina = await contexto.newPage();
  const avisos = [];
  pagina.on("console", (m) => ["error", "warning"].includes(m.type()) && avisos.push(`${m.type()}: ${m.text()}`));
  pagina.on("pageerror", (e) => avisos.push(`página: ${String(e)}`));
  const cdp = await contexto.newCDPSession(pagina);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: cpu });
  await cdp.send("Profiler.enable");
  await cdp.send("Profiler.setSamplingInterval", { interval: 200 });
  const eventos = [];
  cdp.on("Tracing.dataCollected", ({ value }) => eventos.push(...value));
  await cdp.send("Tracing.start", { categories: CATEGORIAS.join(","), transferMode: "ReportEvents" });
  await cdp.send("Profiler.start");

  await pagina.goto(urlDe(base, ruta), { waitUntil: "load" });
  await pagina.waitForTimeout(espera);
  let marcaScroll = null;
  if (conScroll) {
    marcaScroll = await pagina.evaluate(() => (performance.mark("carga:bajada"), performance.now()));
    // a velocidad de pulgar: 140 px cada 60 ms hasta el fondo
    await pagina.evaluate(async () => {
      const dormir = (t) => new Promise((r) => setTimeout(r, t));
      for (let y = 0; y < document.documentElement.scrollHeight; y += 140) {
        window.scrollTo(0, y);
        await dormir(60);
      }
      await dormir(1500);
    });
  }
  const { profile } = await cdp.send("Profiler.stop");
  const fin = new Promise((r) => cdp.once("Tracing.tracingComplete", r));
  await cdp.send("Tracing.end");
  await fin;
  await contexto.close();
  return { eventos, profile, avisos, marcaScroll };
}

function analizar({ eventos, profile, marcaScroll }) {
  // hilo principal del renderer de la página: el CrRendererMain con más tiempo de tareas
  const nombres = new Map();
  for (const e of eventos) if (e.ph === "M" && e.name === "thread_name") nombres.set(`${e.pid}:${e.tid}`, e.args.name);
  const porHilo = new Map();
  for (const e of eventos) {
    if (e.name !== "RunTask" || e.ph !== "X") continue;
    const k = `${e.pid}:${e.tid}`;
    if (nombres.get(k) !== "CrRendererMain") continue;
    porHilo.set(k, (porHilo.get(k) ?? 0) + e.dur);
  }
  const principal = [...porHilo.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const delHilo = eventos.filter((e) => `${e.pid}:${e.tid}` === principal);
  const fcp = delHilo.find((e) => e.name === "firstContentfulPaint")?.ts ?? eventos.find((e) => e.name === "firstContentfulPaint")?.ts ?? 0;
  const tareas = delHilo.filter((e) => e.name === "RunTask" && e.ph === "X").sort((a, b) => a.ts - b.ts);
  const inicio = tareas[0]?.ts ?? 0;
  const deCarga = (t) => marcaScroll === null || t.ts < marcaScrollTs;
  let marcaScrollTs = Infinity;
  // la bajada empieza en la marca «carga:bajada» (performance.mark: sale en el trace con el mismo reloj)
  if (marcaScroll !== null) marcaScrollTs = eventos.find((e) => e.name === "carga:bajada")?.ts ?? Infinity;
  const carga = tareas.filter(deCarga);
  const tbt = carga.filter((t) => t.ts >= fcp && t.dur > 50_000).reduce((s, t) => s + (t.dur - 50_000), 0) / 1000;
  const suma = (n, filtro = deCarga) => delHilo.filter((e) => e.name === n && e.ph === "X" && filtro(e)).reduce((s, e) => s + e.dur, 0) / 1000;
  const layout = suma("Layout");
  const estilo = suma("UpdateLayoutTree") + suma("RecalculateStyles");
  // layouts y estilos forzados: los que traen pila de JavaScript (los pidió una lectura de geometría)
  const forzados = new Map();
  for (const e of delHilo) {
    if (!["Layout", "UpdateLayoutTree"].includes(e.name) || e.ph !== "X" || !deCarga(e)) continue;
    const pila = e.args?.beginData?.stackTrace ?? e.args?.data?.stackTrace;
    if (!pila?.length) continue;
    const f = pila[0];
    const k = `${e.name === "Layout" ? "layout" : "estilo"} ← ${f.functionName || "(anónima)"} ${corta(f.url)}:${f.lineNumber}:${f.columnNumber}`;
    const v = forzados.get(k) ?? { n: 0, ms: 0 };
    v.n++;
    v.ms += e.dur / 1000;
    forzados.set(k, v);
  }

  // perfil de V8: tiempo propio y total por función
  const nodos = new Map(profile.nodes.map((n) => [n.id, n]));
  const padre = new Map();
  for (const n of profile.nodes) for (const h of n.children ?? []) padre.set(h, n.id);
  const propio = new Map();
  const total = new Map();
  const clave = (n) => `${n.callFrame.functionName || "(anónima)"} ${corta(n.callFrame.url)}:${n.callFrame.lineNumber + 1}:${n.callFrame.columnNumber + 1}`;
  let t = profile.startTime;
  const finCarga = marcaScroll === null ? Infinity : marcaScrollTs; // mismo reloj (µs monotónicos) en Chromium
  profile.samples.forEach((id, i) => {
    const dt = (profile.timeDeltas[i] ?? 0) / 1000;
    t += profile.timeDeltas[i] ?? 0;
    if (t >= finCarga) return;
    const n = nodos.get(id);
    if (!n || ["(idle)", "(program)", "(garbage collector)", "(root)"].includes(n.callFrame.functionName)) {
      if (n?.callFrame.functionName === "(garbage collector)") propio.set("(recolector de basura)", (propio.get("(recolector de basura)") ?? 0) + dt);
      return;
    }
    propio.set(clave(n), (propio.get(clave(n)) ?? 0) + dt);
    const vistas = new Set();
    for (let x = n; x && x.callFrame.functionName !== "(root)"; x = nodos.get(padre.get(x.id))) {
      const k = clave(x);
      if (vistas.has(k)) continue;
      vistas.add(k);
      total.set(k, (total.get(k) ?? 0) + dt);
    }
  });
  // por tarea larga de la carga (> 50 ms) y de la bajada (> 80 ms): las 4 funciones con más tiempo propio dentro de ella
  const enBajada = (t) => marcaScroll !== null && t.ts >= marcaScrollTs && t.dur > 80_000;
  const porTarea = [...carga.filter((t) => t.dur > 50_000), ...tareas.filter(enBajada)].map((tarea) => {
    const m = new Map();
    let tt = profile.startTime;
    profile.samples.forEach((id, i) => {
      tt += profile.timeDeltas[i] ?? 0;
      if (tt < tarea.ts || tt > tarea.ts + tarea.dur) return;
      const n = nodos.get(id);
      if (!n || ["(idle)", "(program)", "(root)"].includes(n.callFrame.functionName)) return;
      m.set(clave(n), (m.get(clave(n)) ?? 0) + (profile.timeDeltas[i] ?? 0) / 1000);
    });
    // la pila del nodo más pesado de la tarea (para saber quién llamó a lo caro)
    const pesos = new Map();
    let t2 = profile.startTime;
    profile.samples.forEach((id, i) => {
      t2 += profile.timeDeltas[i] ?? 0;
      if (t2 >= tarea.ts && t2 <= tarea.ts + tarea.dur) pesos.set(id, (pesos.get(id) ?? 0) + 1);
    });
    const pesado = [...pesos.entries()].filter(([id]) => !["(idle)", "(program)", "(root)"].includes(nodos.get(id)?.callFrame.functionName)).sort((a, b) => b[1] - a[1])[0]?.[0];
    const pila = [];
    for (let x = nodos.get(pesado); x && x.callFrame.functionName !== "(root)"; x = nodos.get(padre.get(x.id))) pila.push(clave(x));
    return { ms: ms(tarea.dur / 1000), bajada: enBajada(tarea), pila, funciones: [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, v]) => `${ms(v)} ms ${k}`) };
  });
  const top = (m, n = 10) => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => ({ funcion: k, ms: ms(v) }));

  const scroll = marcaScroll === null ? null : tareas.filter((t) => t.ts >= marcaScrollTs && t.dur > 80_000).map((t) => ms(t.dur / 1000));
  return {
    fcp: ms((fcp - inicio) / 1000),
    tbt: ms(tbt),
    largas: carga.filter((t) => t.dur > 50_000).map((t) => ({ en: ms((t.ts - inicio) / 1000), ms: ms(t.dur / 1000) })),
    layout: ms(layout),
    estilo: ms(estilo),
    forzados: [...forzados.entries()].sort((a, b) => b[1].ms - a[1].ms).slice(0, 10).map(([k, v]) => ({ quien: k, n: v.n, ms: ms(v.ms) })),
    propio: top(propio),
    total: top(total),
    scroll,
    porTarea,
  };
}

// el código minificado no dice mucho por su nombre: se muestra un trozo de la fuente donde empieza la función
const fuentes = new Map();
async function fragmento(clave) {
  const m = clave.match(/ (\/\S+\.js):(\d+):(\d+)$/);
  if (!m) return "";
  if (!fuentes.has(m[1])) fuentes.set(m[1], await fetch(urlDe(base, m[1])).then((r) => r.text()).catch(() => ""));
  const lineas = fuentes.get(m[1]).split("\n");
  const linea = lineas[Number(m[2]) - 1] ?? "";
  const col = Number(m[3]) - 1;
  return `  «${linea.slice(Math.max(0, col - 10), col + 70).replace(/\s+/g, " ")}»`;
}

const navegador = await abrirNavegador();
const resultados = [];
try {
  for (const ruta of rutas) {
    for (let v = 0; v < veces; v++) {
      const crudo = await medir(navegador, ruta);
      const r = analizar(crudo);
      resultados.push({ ruta, ...r, avisos: crudo.avisos });
      console.log(`\n== ${ruta} (${escritorio ? "1440" : "celular 412"}, CPU ×${cpu}) corrida ${v + 1}/${veces}`);
      console.log(`FCP ~${r.fcp} ms · TBT ~${r.tbt} ms · tareas largas: ${r.largas.length} [${r.largas.map((t) => `${t.ms}@${t.en}`).join(", ")}]`);
      console.log(`layout ${r.layout} ms · estilo ${r.estilo} ms`);
      for (const t of r.porTarea) {
        console.log(`tarea de ${t.ms} ms${t.bajada ? " (bajada)" : ""}: ${t.funciones.join(" | ")}`);
        if ("pila" in opciones) for (const f of t.pila.slice(0, 40)) console.log(`      ← ${f}${await fragmento(f)}`);
      }
      const conFuente = async (k) => (opciones.fuente === undefined ? "" : await fragmento(k));
      if (r.forzados.length) {
        console.log("forzados (desde JS):");
        for (const f of r.forzados) console.log(`  ${String(f.ms).padStart(5)} ms ×${f.n}  ${f.quien}${await conFuente(f.quien)}`);
      }
      console.log("top 10 propio:");
      for (const f of r.propio) console.log(`  ${String(f.ms).padStart(5)} ms  ${f.funcion}${await conFuente(f.funcion)}`);
      console.log("top 10 total:");
      for (const f of r.total) console.log(`  ${String(f.ms).padStart(5)} ms  ${f.funcion}${await conFuente(f.funcion)}`);
      if (r.scroll) console.log(`bajada: tareas > 80 ms: ${r.scroll.length ? r.scroll.join(", ") : "ninguna"}`);
      if (crudo.avisos.length) console.log("consola:\n  " + crudo.avisos.join("\n  "));
    }
  }
} finally {
  await navegador.close();
}
if (opciones.json) await writeFile(opciones.json, JSON.stringify(resultados, null, 2));
