// Revisión a tamaño real de las ilustraciones sueltas (lab/ilustraciones.html, cuadro 1, estado final).
//   nice -n 19 taskset -c 0-3 node dibujo/revisar.mjs <carpeta> [filtro] [escala=1]
// Una captura por ilustración: <carpeta>/<nombre>.png, al ancho de su viewBox × escala (1 = como se verá).
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const aqui = new URL('.', import.meta.url).pathname;
const [carpeta, filtro = '', escala = '1'] = process.argv.slice(2);
if (!carpeta) { console.error('uso: node dibujo/revisar.mjs <carpeta> [filtro] [escala]'); process.exit(1); }
mkdirSync(carpeta, { recursive: true });
const nav = await chromium.launch();
const p = await nav.newPage({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: 1 });
await p.goto(`file://${aqui}lab/ilustraciones.html`);
await p.addStyleTag({ content: `.hoja{display:block}figure{display:inline-block;margin:8px;vertical-align:top}figure svg{max-height:none!important;overflow:visible}` });
const nombres = await p.$$eval('figure[data-fig]', (fs, [f, k]) => fs.map((fig) => {
  const svg = fig.querySelector('svg'); const w = +svg.getAttribute('viewBox').split(' ')[2];
  svg.style.width = `${w * k}px`; return fig.dataset.fig;
}).filter((n) => n.includes(f)), [filtro, +escala]);
await p.evaluate(() => document.fonts.ready);
for (const n of nombres) await p.locator(`figure[data-fig="${n}"] svg`).screenshot({ path: `${carpeta}/${n}.png` });
console.log(nombres.join(' '));
await nav.close();
