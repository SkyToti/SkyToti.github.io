// Mide el tamaño del SVG de la portada en el banco y de sus contenedores (depurar maquetación).
// Uso: node dibujo/medir.mjs [url-base] [ancho]
import { chromium } from 'playwright';

const [base = 'http://127.0.0.1:3210', ancho = '1440'] = process.argv.slice(2);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: +ancho, height: 900 } });
await p.goto(`${base}/laboratorio/dibujo/`);
console.log(await p.evaluate(() => {
  const s = [...document.querySelectorAll('[data-banco="portada"] svg')].find((x) => x.getBoundingClientRect().width > 0);
  const out = [];
  for (let e = s; e && e !== document.body; e = e.parentElement) {
    const cs = getComputedStyle(e);
    out.push(`${e.tagName} ${e.getAttribute('class') || ''} w=${e.getBoundingClientRect().width.toFixed(0)} h=${e.getBoundingClientRect().height.toFixed(0)} disp=${cs.display}`);
  }
  return out.join('\n');
}));
await b.close();
