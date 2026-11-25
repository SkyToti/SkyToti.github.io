// Capturas del kit de dibujo.
//   node dibujo/capturar-kit.mjs lab                 → hojas del laboratorio (archivos locales, sin servidor)
//   node dibujo/capturar-kit.mjs sitio <url-base>    → banco /laboratorio/dibujo/ del sitio construido
// Correr con: nice -n 19 taskset -c 0-3 node dibujo/capturar-kit.mjs …
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const aqui = new URL('.', import.meta.url).pathname;
const salida = `${aqui}capturas/`;
mkdirSync(salida, { recursive: true });
const [modo = 'lab', base = 'http://127.0.0.1:3210'] = process.argv.slice(2);
const navegador = await chromium.launch();

async function pagina(ancho, alto, opciones = {}) {
  const ctx = await navegador.newContext({ viewport: { width: ancho, height: alto }, deviceScaleFactor: 1, ...opciones });
  const p = await ctx.newPage();
  const errores = [];
  p.on('console', (m) => { if (m.type() === 'error') errores.push(m.text()); });
  p.on('pageerror', (e) => errores.push(String(e)));
  return { p, ctx, errores };
}

if (modo === 'lab') {
  for (const [nombre, ancho] of [['personajes', 1440], ['personajes-390', 390]]) {
    const { p, ctx } = await pagina(ancho, 900);
    await p.goto(`file://${aqui}lab/personajes.html`);
    await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: `${salida}${nombre}.png`, fullPage: true });
    await ctx.close();
  }
  // revisión pose por pose a tamaño completo (opcional: DIBUJO_POSES=<carpeta>)
  if (process.env.DIBUJO_POSES) {
    const { p: q, ctx: c2 } = await pagina(1440, 900, { deviceScaleFactor: 2 });
    await q.goto(`file://${aqui}lab/personajes.html`);
    await q.evaluate(() => document.fonts.ready);
    const figs = q.locator('figure');
    for (let i = 0; i < await figs.count(); i++) await figs.nth(i).screenshot({ path: `${process.env.DIBUJO_POSES}/pose-${i + 1}.png` });
    await c2.close();
  }
  const { p, ctx } = await pagina(1000, 900);
  await p.goto(`file://${aqui}lab/escritorio.html`);
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: `${salida}escritorio-lab.png`, fullPage: true });
  await ctx.close();
  console.log('lab: personajes.png, personajes-390.png, escritorio-lab.png');
} else {
  const url = `${base.replace(/\/$/, '')}/laboratorio/dibujo/`;
  const informe = [];
  for (const [ancho, alto, suf] of [[1440, 900, '1440'], [390, 844, '390']]) {
    // estado final (la entrada ya corrió)
    const a = await pagina(ancho, alto);
    await a.p.goto(url, { waitUntil: 'networkidle' });
    await a.p.evaluate(() => document.fonts.ready);
    const portada = a.p.locator('[data-banco="portada"]');
    await portada.scrollIntoViewIfNeeded();
    await a.p.waitForTimeout(7500);
    await portada.screenshot({ path: `${salida}sitio-portada-${suf}.png` });
    // lámpara apagada (clic en el botón de la lámpara visible)
    const boton = a.p.locator('[data-banco="portada"] button[data-lampara]:visible').first();
    await boton.click();
    await a.p.waitForTimeout(700);
    await portada.screenshot({ path: `${salida}sitio-apagado-${suf}.png` });
    const presionado = await boton.getAttribute('aria-pressed');
    await boton.press('Enter');
    await a.p.waitForTimeout(500);
    const presionado2 = await boton.getAttribute('aria-pressed');
    // hoja de personajes
    const hoja = a.p.locator('[data-banco="personajes"]');
    await hoja.scrollIntoViewIfNeeded();
    await a.p.waitForTimeout(6500);
    await hoja.screenshot({ path: `${salida}sitio-personajes-${suf}.png` });
    informe.push(`${suf}: errores=${a.errores.length} lampara=${presionado}->${presionado2}${a.errores.length ? ` · ${a.errores[0]}` : ''}`);
    await a.ctx.close();

    // tira de la entrada: 6 cuadros
    const b = await pagina(ancho, alto);
    await b.p.goto(url, { waitUntil: 'networkidle' });
    await b.p.evaluate(() => document.fonts.ready);
    const lam = b.p.locator('[data-banco="portada"]');
    await lam.scrollIntoViewIfNeeded();
    for (let i = 0; i < 6; i++) {
      await b.p.waitForTimeout(i === 0 ? 300 : 900);
      await lam.screenshot({ path: `${salida}sitio-tira-${suf}-${i + 1}.png` });
    }
    informe.push(`${suf} tira: errores=${b.errores.length}`);
    await b.ctx.close();

    // menos movimiento
    const c = await pagina(ancho, alto, { reducedMotion: 'reduce' });
    await c.p.goto(url, { waitUntil: 'networkidle' });
    await c.p.evaluate(() => document.fonts.ready);
    const lr = c.p.locator('[data-banco="portada"]');
    await lr.scrollIntoViewIfNeeded();
    await c.p.waitForTimeout(400);
    await lr.screenshot({ path: `${salida}sitio-quieto-${suf}.png` });
    const ocultos = await c.p.evaluate(() => [...document.querySelectorAll('svg[data-dibujo] path.t')].filter((e) => getComputedStyle(e).strokeDashoffset !== '0px' && e.getAttribute('style')).length);
    informe.push(`${suf} quieto: errores=${c.errores.length} trazos-tocados=${ocultos} mueve=${await c.p.evaluate(() => document.documentElement.classList.contains('mueve'))}`);
    await c.ctx.close();
  }
  console.log(informe.join('\n'));
}
await navegador.close();
