// Capturas de la tanda 5 (Haku, el guía) en dibujo/capturas/tanda-5/.
//   nice -n 19 taskset -c 0-3 node dibujo/capturar-tanda5.mjs ciclos            → tiras de cada ciclo (desde los datos)
//   nice -n 19 taskset -c 0-3 node dibujo/capturar-tanda5.mjs sitio <url-base>  → el banco /laboratorio/tanda-5/
// En las tiras: la línea del piso y la del pivote (x = 80) para ver que nada brinca entre cuadros.
import { chromium } from 'playwright';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const aqui = new URL('.', import.meta.url).pathname;
const salida = `${aqui}capturas/tanda-5/`;
mkdirSync(salida, { recursive: true });
const modo = process.argv[2] || 'ciclos';
const nav = await chromium.launch();
const informe = [];
const ok = (c, t) => informe.push(`${c ? 'ok ' : 'MAL'} ${t}`);

if (modo === 'ciclos') {
  const D = JSON.parse(readFileSync(`${aqui}../components/dibujo/datos/haku-ciclos.json`, 'utf8'));
  const k = Number(process.argv[3] || 2);
  const svg = (c) => `<svg viewBox="${D.vb}" width="${D.ancho * k}" height="${D.alto * k}">${D.svg}`
    + `<line x1="0" x2="${D.ancho}" y1="${D.piso}" y2="${D.piso}" stroke="#5B6F96" stroke-width=".5"/>`
    + `<line x1="${D.centro}" x2="${D.centro}" y1="0" y2="${D.alto}" stroke="#2A3854" stroke-width=".5"/>`
    + `${D.envoltura}${c}</g></svg>`;
  const filas = Object.entries(D.cuadros).map(([n, cs]) => `<section data-ciclo="${n}"><h2>${n} · ${cs.length}</h2><div>${cs.map((c, i) => `<figure>${svg(c)}<figcaption>${i + 1}</figcaption></figure>`).join('')}</div></section>`).join('');
  const html = `<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#0B1220;color:#EDE6D6;font:14px system-ui;padding:12px}
section{margin:0 0 10px}h2{font-size:14px;margin:0 0 4px;color:#F5B455}div{display:flex;gap:6px;flex-wrap:wrap}figure{margin:0;background:#121B2E}
figcaption{font-size:11px;color:#A7A698;padding:0 4px}</style>${filas}`;
  const p = await nav.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  await p.setContent(html);
  for (const n of Object.keys(D.cuadros)) await p.locator(`[data-ciclo="${n}"]`).screenshot({ path: `${salida}ciclo-${n}.png` });
  informe.push(`tiras: ${Object.keys(D.cuadros).length} ciclos`);
}

if (modo === 'sitio') {
  const base = (process.argv[3] || 'http://127.0.0.1:3226').replace(/\/$/, '');
  const { correr } = await import('./capturar-tanda5-sitio.mjs');
  await correr({ nav, base, salida, ok, informe });
}

await nav.close();
writeFileSync(`${salida}informe-${modo}.txt`, `${informe.join('\n')}\n`);
console.log(informe.join('\n'));
