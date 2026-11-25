// Genera los datos del kit de dibujo: una ilustración (geometría limpia en dibujo/piezas/) → un módulo de datos
// ya «a mano» con 3 cuadros de hervor por pieza en components/dibujo/datos/<nombre>.json (+ index.ts).
// También escribe las páginas del laboratorio (lab/personajes.html, lab/escritorio.html) para revisar a mano.
// Uso (desde la raíz del portafolio o desde dibujo/):  node dibujo/generar.mjs
// Determinista: misma entrada → mismos archivos.
import { mkdirSync, writeFileSync, readdirSync, unlinkSync } from 'node:fs';
import { hornear } from './kit/hornear.mjs';
import { E } from './kit/formas.mjs';
import { poses as posesHaku } from './piezas/haku.mjs';
import { poses as posesAgente } from './piezas/agente.mjs';
import { escritorio } from './piezas/escritorio.mjs';
import conmutador from './piezas/conmutador.mjs';
import muelaMapa from './piezas/muela-mapa.mjs';
import folioscopio from './piezas/folioscopio.mjs';
import boveda from './piezas/boveda.mjs';
import mesaDeLosSeis from './piezas/mesa-de-los-seis.mjs';
import { torre } from './piezas/torre.mjs';
import { islaFlotante } from './piezas/isla-flotante.mjs';
import { avionDePapel } from './piezas/avion-de-papel.mjs';
import { colmenaCaja } from './piezas/colmena-caja.mjs';
import { cuadernoDeRepaso } from './piezas/cuaderno.mjs';
import { tira1 } from './piezas/tira-1.mjs';
import { tira2 } from './piezas/tira-2.mjs';
import { tira3 } from './piezas/tira-3.mjs';
import { tira4 } from './piezas/tira-4.mjs';

const aqui = new URL('.', import.meta.url).pathname;
const destino = `${aqui}../components/dibujo/datos/`;
mkdirSync(destino, { recursive: true });

/** caja que envuelve todas las piezas (para las poses sueltas) */
function caja(grupos, pad = 16) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const pon = ([x, y]) => { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); };
  for (const g of grupos) for (const p of g.piezas) {
    if (p.a) { pon(p.a); pon(p.b); }
    if (p.pts) p.pts.forEach(pon);
    if (p.c) { pon([p.c[0] - p.rx, p.c[1] - p.ry]); pon([p.c[0] + p.rx, p.c[1] + p.ry]); }
    if (p.d) { const n = p.d.match(/-?\d*\.?\d+/g).map(Number); for (let i = 0; i + 1 < n.length; i += 2) pon([n[i], n[i + 1]]); }
  }
  return [Math.floor(x0 - pad), Math.floor(y0 - pad), Math.ceil(x1 - x0 + 2 * pad), Math.ceil(y1 - y0 + 2 * pad)];
}

const defs = [
  ...posesHaku().map((d) => ({
    ...d,
    vb: caja(d.grupos),
    zonas: d.zonaHaku ? [E([0, -96], 64, 100, { nombre: 'haku' })] : [],
    tipo: 'pose',
  })),
  ...posesAgente().map((d) => ({ ...d, vb: caja(d.grupos), tipo: 'pose' })),
  ...escritorio().map((d) => ({ ...d, tipo: 'escena' })),
  // inventos de la tanda 1 (640×420; tope propio de 90 KB por dibujo)
  ...[conmutador, muelaMapa, folioscopio, boveda, mesaDeLosSeis].flatMap((f) => f()).map((d) => ({ ...d, tipo: 'invento' })),
  ...[torre(), islaFlotante(), avionDePapel(), colmenaCaja(), cuadernoDeRepaso()].map((d) => ({ ...d, tipo: 'invento' })),
  ...[tira1(), tira2(), tira3(), tira4()].map((d) => ({ ...d, tipo: 'vineta' })), // «La tira» (estación 4)
];

// Piezas que se registran solas: cualquier dibujo/piezas/*.mjs que exporte `ilustraciones()` → [{ nombre, grupos, … }]
// (sin `vb` se ajusta a la caja de sus piezas; `tipo` por defecto 'escena'; `tope` en KB para el aviso de peso).
const yaRegistradas = new Set(defs.map((d) => d.nombre));
const yaEnHojas = new Set(yaRegistradas);
/** [{ nombre, datos, tope? }] → datos/<nombre>.json, fuera de index.ts (se cargan con import() perezoso) */
const aparte = [];
for (const f of readdirSync(`${aqui}piezas`).filter((f) => f.endsWith('.mjs')).sort()) {
  const m = await import(`./piezas/${f}`);
  if (typeof m.modulos === 'function') aparte.push(...m.modulos()); // tanda 5: módulos de datos aparte (no van a index.ts)
  if (typeof m.ilustraciones !== 'function') continue;
  for (const d of m.ilustraciones()) {
    if (yaRegistradas.has(d.nombre)) throw new Error(`ilustración repetida: ${d.nombre} (${f})`);
    yaRegistradas.add(d.nombre);
    defs.push({ tipo: 'escena', ...d, vb: d.vb || caja(d.grupos) });
  }
}

// limpia los datos viejos (si se borra una ilustración, se borra su archivo)
for (const f of readdirSync(destino)) if (f.endsWith('.json')) unlinkSync(`${destino}${f}`);

const informe = [];
const datos = [];
for (const d of defs) {
  const r = hornear(d);
  if (d.sigue) r.sigue = d.sigue;
  datos.push({ ...r, tipo: d.tipo });
  const json = `${JSON.stringify(r)}\n`;
  writeFileSync(`${destino}${d.nombre}.json`, json);
  const kb = Buffer.byteLength(r.svg) / 1024;
  const tope = d.tope ?? (d.tipo === 'pose' ? 40 : 150);
  informe.push(`${d.nombre.padEnd(20)} ${kb.toFixed(1).padStart(6)} KB${kb > tope ? `  ¡pasa de ${tope} KB!` : ''}`);
}

for (const a of aparte) {
  writeFileSync(`${destino}${a.nombre}.json`, `${JSON.stringify(a.datos)}\n`);
  const cuadros = Object.values(a.datos.cuadros || {}).flat();
  const mayor = Math.max(0, ...cuadros.map((c) => Buffer.byteLength(c) / 1024));
  informe.push(`${a.nombre.padEnd(20)} ${(Buffer.byteLength(JSON.stringify(a.datos)) / 1024).toFixed(1).padStart(6)} KB · ${cuadros.length} cuadros, el mayor ${mayor.toFixed(1)} KB${a.tope && mayor > a.tope ? `  ¡pasa de ${a.tope} KB por cuadro!` : ''}`);
}

const ident = (n) => n.replace(/-(\w)/g, (_, c) => c.toUpperCase());
writeFileSync(`${destino}index.ts`, [
  '// Generado por dibujo/generar.mjs: no se edita a mano (node dibujo/generar.mjs).',
  'import type { DatosDibujo } from "../tipos";',
  ...defs.map((d) => `import ${ident(d.nombre)} from "./${d.nombre}.json";`),
  '',
  'export const DIBUJOS = {',
  ...defs.map((d) => `  "${d.nombre}": ${ident(d.nombre)} as unknown as DatosDibujo,`),
  '} as const;',
  '',
  'export type NombreDibujo = keyof typeof DIBUJOS;',
  '',
].join('\n'));

// ── páginas del laboratorio (estáticas, cuadro 1; para revisar a tamaño completo) ──
const svgDe = (r, clase = '') => `<svg xmlns="http://www.w3.org/2000/svg" class="dib ${clase}" viewBox="${r.vb}" data-dibujo="${r.nombre}">${r.svg}</svg>`;
const pagina = (titulo, cuerpo) => `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${titulo}</title>
<style>
@font-face{font-family:'Shantell Sans';src:url(vendor/shantell-sans-latin.woff2) format('woff2');font-weight:300 800;font-display:block}
:root{color-scheme:dark}*{box-sizing:border-box}
body{margin:0;background:#0B1220;color:#EDE6D6;font:15px/1.4 system-ui,sans-serif;padding:32px clamp(14px,3vw,48px)}
h1{font:760 30px/1.1 'Shantell Sans';font-variation-settings:'INFM' 100,'BNCE' 55;color:#F5B455;margin:0 0 6px}
h2{font:700 20px 'Shantell Sans';color:#EDE6D6;margin:28px 0 12px}
p.n{color:#A7A698;margin:0 0 18px;font-size:13px}
.hoja{display:grid;gap:18px;grid-template-columns:repeat(auto-fill,minmax(300px,1fr))}
.hoja.ag{grid-template-columns:repeat(auto-fill,minmax(220px,1fr))}
figure{margin:0;background:#121B2E;border-radius:6px;padding:14px;display:grid;gap:8px}
figure svg{width:100%;height:auto;max-height:300px}
figcaption{font:600 15px 'Shantell Sans';color:#A7A698}
figcaption b{color:#F5B455;font-weight:760}
.f1,.f2{display:none}
.esc{display:grid;gap:24px}.esc svg{width:100%;height:auto;background:#0B1220}
.v{max-width:360px}
</style></head><body>${cuerpo}</body></html>`;

const figura = (r, i) => `<figure><figcaption><b>${i}</b> · ${r.titulo.replace(/^(Haku|El agente)[, ]*/, '')}</figcaption>${svgDe(r)}</figure>`;
const haku = datos.filter((r) => r.nombre.startsWith('haku-'));
const agentes = datos.filter((r) => r.nombre.startsWith('agente-'));
writeFileSync(`${aqui}lab/personajes.html`, pagina('Hoja de personajes', `<h1>Hoja de personajes</h1><p class="n">Riso con mano de marcador · contorno 3.25 · interior 2.25 · fino 1.5 · cuadro 1 de 3</p>`
  + `<h2>Haku · lynx point</h2><div class="hoja">${haku.map((r, i) => figura(r, i + 1)).join('')}</div>`
  + `<h2>El agente · cabeza de foco</h2><div class="hoja ag">${agentes.map((r, i) => figura(r, i + 1)).join('')}</div>`));
const escenas = datos.filter((r) => r.nombre.startsWith('escritorio-'));
if (escenas.length) writeFileSync(`${aqui}lab/escritorio.html`, pagina('El escritorio de noche', `<div class="esc">${escenas.map((r) => svgDe(r, r.nombre.endsWith('-v') ? 'v' : '')).join('')}</div>`));

// las ilustraciones que se registran solas (piezas con `ilustraciones()`): una hoja para revisarlas a tamaño completo
const sueltas = datos.filter((r) => !yaEnHojas.has(r.nombre));
if (sueltas.length) writeFileSync(`${aqui}lab/ilustraciones.html`, pagina('Ilustraciones', `<h1>Ilustraciones</h1><p class="n">cuadro 1 de 3 · estado final</p>`
  + `<div class="hoja">${sueltas.map((r) => `<figure data-fig="${r.nombre}"><figcaption><b>${r.nombre}</b> · ${r.titulo} · ${r.vb}</figcaption>${svgDe(r)}</figure>`).join('')}</div>`));

console.log(informe.join('\n'));
