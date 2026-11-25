// Capturas del laboratorio con el Playwright del portafolio.
// Uso: nice -n 19 taskset -c 0-3 node capturar.mjs http://127.0.0.1:3417 [a b c]
import { readFileSync, mkdirSync, mkdtempSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
// el Playwright del portafolio (en un worktree no hay node_modules: se usa el del checkout principal)
const candidatos = [new URL('../node_modules/playwright/index.mjs', import.meta.url).pathname, process.env.PLAYWRIGHT_MJS || '/home/skytoti/Proyectos/portafolio/node_modules/playwright/index.mjs'];
const { chromium } = await import(candidatos.find((c) => existsSync(c)));
const tmp = mkdtempSync(`${tmpdir()}/dibujo-`);

const base = process.argv[2] || 'http://127.0.0.1:3417';
const pedidos = process.argv.slice(3).length ? process.argv.slice(3) : ['a', 'b', 'c'];
const dir = new URL('./capturas/', import.meta.url).pathname;
mkdirSync(dir, { recursive: true });
const TIEMPOS = [0.5, 1.5, 2.5, 3.5, 4.5, 6];
const errores = [];

const navegador = await chromium.launch();
const nueva = async (w, h) => {
  const p = await navegador.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  p.on('pageerror', (e) => errores.push(`${p.url()} · ${e.message}`));
  p.on('console', (m) => m.type() === 'error' && errores.push(`${p.url()} · ${m.text()}`));
  return p;
};
const ir = async (p, url) => { await p.goto(url, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(150); };
const b64 = (f) => `data:image/png;base64,${readFileSync(f).toString('base64')}`;

async function mosaico(imagenes, ancho, salida, columnas) {
  const p = await nueva(ancho * columnas + 24 * (columnas + 1), 400);
  const celdas = imagenes.map(([src, rotulo]) => `<figure><img src="${src}"><figcaption>${rotulo}</figcaption></figure>`).join('');
  await p.setContent(`<style>body{margin:0;background:#05080f;padding:24px;display:grid;grid-template-columns:repeat(${columnas},${ancho}px);gap:24px;font:14px ui-monospace,monospace;color:#A7A698}
    figure{margin:0}img{width:${ancho}px;display:block;border:1px solid #2A3854}figcaption{margin-top:6px}</style>${celdas}`);
  await p.waitForTimeout(200);
  await p.screenshot({ path: salida, fullPage: true });
  await p.close();
}

for (const e of pedidos) {
  const url = `${base}/${e}.html`;
  let p = await nueva(1440, 900);
  await ir(p, `${url}?t=fin`);
  await p.screenshot({ path: `${dir}${e}-1440.png` });
  await p.click('.lamina.horizontal .interruptor');
  await p.waitForTimeout(700);
  await p.screenshot({ path: `${dir}${e}-apagado.png` });
  const aria = await p.getAttribute('.lamina.horizontal .interruptor', 'aria-label');
  if (aria !== 'Encender la lámpara') errores.push(`${e}: el interruptor no cambió (${aria})`);
  // cuadros de la entrada
  const cuadros = [];
  for (const t of TIEMPOS) {
    await ir(p, `${url}?t=${t}`);
    const f = `${tmp}/cuadro-${e}-${t}.png`;
    await p.locator('.lamina.horizontal svg').screenshot({ path: f });
    cuadros.push([b64(f), `${t} s`]);
  }
  await p.close();
  await mosaico(cuadros, 400, `${dir}${e}-tira.png`, 6);

  p = await nueva(390, 844);
  await ir(p, `${url}?t=fin`);
  const desborde = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (desborde > 0) errores.push(`${e}-390: se sale ${desborde}px a lo ancho`);
  await p.screenshot({ path: `${dir}${e}-390.png`, fullPage: true });
  await p.close();
  console.log(`listo ${e}`);
}

if (pedidos.length === 3) {
  await mosaico(pedidos.map((e) => [b64(`${dir}${e}-1440.png`), `${e.toUpperCase()}`]), 720, `${dir}comparativa.png`, 3);
}
await navegador.close();
console.log(errores.length ? `ERRORES:\n${errores.join('\n')}` : 'sin errores de consola');
