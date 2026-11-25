// Capturas y comprobaciones del banco /laboratorio/tanda-3/ (y que /laboratorio/dibujo/ siga igual).
//   nice -n 19 taskset -c 0-3 node dibujo/capturar-tanda3.mjs http://127.0.0.1:3223
// Deja PNG en dibujo/capturas/tanda-3/ (los cuadros sueltos de la tira del buzón en tira/) y un informe en consola.
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const aqui = new URL('.', import.meta.url).pathname;
const salida = `${aqui}capturas/tanda-3/`;
mkdirSync(`${salida}tira`, { recursive: true });
const base = (process.argv[2] || 'http://127.0.0.1:3223').replace(/\/$/, '');
const nav = await chromium.launch();
const informe = [];
const ok = (cond, texto) => { informe.push(`${cond ? 'ok ' : 'MAL'} ${texto}`); };

async function abrir(url, ancho, alto, extra = {}) {
  const ctx = await nav.newContext({ viewport: { width: ancho, height: alto }, deviceScaleFactor: 1, ...extra });
  const p = await ctx.newPage();
  const errores = [];
  p.on('console', (m) => { if (m.type() === 'error') errores.push(m.text()); });
  p.on('pageerror', (e) => errores.push(String(e)));
  await p.goto(url, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  return { p, ctx, errores };
}
const centrar = (p, sel) => p.evaluate((s) => document.querySelector(s)?.scrollIntoView({ block: 'center' }), sel);

for (const [ancho, alto] of [[1440, 900], [390, 844]]) {
  const suf = String(ancho);
  const { p, ctx, errores } = await abrir(`${base}/laboratorio/tanda-3/`, ancho, alto);

  // ── ids: el mismo dibujo tres veces (el primero oculto): cada visible tiene su propia trama
  const ids = await p.evaluate(() => [...document.querySelectorAll('[data-banco="ids"] svg')].map((s) => s.querySelector('pattern')?.id));
  ok(new Set(ids).size === ids.length && ids.every(Boolean), `${suf} ids por instancia: ${ids.join(', ')}`);
  await centrar(p, '[data-banco="ids"]');
  await p.locator('[data-banco="ids"]').screenshot({ path: `${salida}ids-${suf}.png` });

  // ── la repisa: llega la chispa
  const repisa = p.locator('[data-banco="repisa"]');
  await centrar(p, '[data-banco="repisa"]');
  await p.waitForTimeout(500);
  const antes = await p.evaluate(() => !!document.querySelector('[data-banco="repisa"] [data-desperto]'));
  ok(!antes, `${suf} la repisa espera a la chispa (a los 0.5 s a la vista sigue dormida)`);
  await p.locator('[data-llega="repisa"]').click();
  const luego = await p.evaluate(() => !!document.querySelector('[data-banco="repisa"] [data-desperto]'));
  ok(luego, `${suf} estacion:llega la despierta al instante`);
  await centrar(p, '[data-banco="repisa"]');
  await p.waitForTimeout(1600);
  await repisa.screenshot({ path: `${salida}repisa-llegando-${suf}.png` });
  await p.waitForTimeout(820);
  await repisa.screenshot({ path: `${salida}repisa-salto-${suf}.png` });
  await p.waitForTimeout(3500);
  await repisa.screenshot({ path: `${salida}repisa-final-${suf}.png` });
  const visibles = await p.evaluate(() => [...document.querySelectorAll('[data-banco="repisa"] [data-objeto]')].filter((o) => o.offsetParent && getComputedStyle(o).opacity === '1').length);
  ok(visibles === 6, `${suf} los seis objetos en su sitio (${visibles})`);
  // clic en el libro
  const comp = ancho > 700 ? 'h' : 'v';
  await p.locator(`[data-comp="${comp}"] [data-objeto="ventas"] button`).click();
  await p.waitForTimeout(450);
  await repisa.screenshot({ path: `${salida}repisa-globo-clic-${suf}.png` });
  const g1 = await p.locator(`[data-comp="${comp}"] [data-globo]`).innerText();
  ok(/ventas/i.test(g1), `${suf} clic en el libro abre su globo: «${g1.split('\n')[0]}»`);
  // teclado: Escape cierra; Tab recorre
  await p.keyboard.press('Escape');
  await p.locator('[data-llega="repisa"]').focus();
  await p.keyboard.press('Tab');
  await p.keyboard.press('Tab');
  await p.waitForTimeout(450);
  await repisa.screenshot({ path: `${salida}repisa-globo-teclado-${suf}.png` });
  const g2 = await p.locator(`[data-comp="${comp}"] [data-globo]`).innerText();
  const enfocado = await p.evaluate(() => document.activeElement?.closest('[data-objeto]')?.getAttribute('data-objeto'));
  ok(enfocado === 'estudios' && /ingenier/i.test(g2), `${suf} Tab Tab → ${enfocado}: «${g2.split('\n')[0]}»`);

  // ── monograma: estado final y a media retrazada
  await p.evaluate(() => window.scrollTo(0, 0));
  await p.waitForTimeout(900);
  await p.locator('[data-banco="cabecera"]').screenshot({ path: `${salida}monograma-${suf}.png` });
  await p.locator('[data-monograma]').hover();
  await p.waitForTimeout(330);
  await p.locator('[data-monograma]').screenshot({ path: `${salida}monograma-retrazo-${suf}.png` });

  // ── el buzón: sin chispa (respaldo a 1.2 s), tira de cuadros
  await centrar(p, '[data-banco="buzon"]');
  const buzon = p.locator('[data-banco="buzon"]');
  const t0 = Date.now();
  await p.waitForSelector('[data-banco="buzon"] [data-desperto]', { timeout: 5000 });
  const espera = Date.now() - t0;
  ok(espera > 900 && espera < 2600, `${suf} el buzón arrancó solo a los ${espera} ms sin chispa`);
  if (ancho === 1440) {
    const cuadros = [];
    const inicio = Date.now();
    while (Date.now() - inicio < 4600) {
      const t = Date.now() - inicio;
      const n = String(cuadros.length).padStart(3, '0');
      await buzon.locator('svg[data-dibujo="buzon"]').screenshot({ path: `${salida}tira/b-${n}.png` });
      cuadros.push(`${n} ${t}`);
    }
    informe.push(`   tira del buzón: ${cuadros.length} cuadros (tira/b-*.png + tira/tiempos.txt; arma la tira con armar-tira.py)`);
    writeFileSync(`${salida}tira/tiempos.txt`, `${cuadros.join('\n')}\n`);
  } else await p.waitForTimeout(4800);
  await buzon.screenshot({ path: `${salida}buzon-final-${suf}.png` });
  await p.locator('[data-copiar]').click();
  await p.waitForTimeout(1300);
  await buzon.screenshot({ path: `${salida}buzon-copiado-${suf}.png` });
  ok(await p.locator('[data-banco="buzon"] [data-estampa]').count() === 1, `${suf} correo:copiado → baja la estampa`);

  // ── el pie
  await centrar(p, '[data-banco="pie"]');
  await p.waitForSelector('[data-banco="pie"] [data-desperto]', { timeout: 5000 });
  await p.waitForTimeout(4600);
  const pie = p.locator('[data-banco="pie"]');
  await pie.screenshot({ path: `${salida}pie-final-${suf}.png` });
  await p.locator('[data-banco="pie"] [data-zona="haku"]').click();
  await p.waitForTimeout(380);
  await pie.screenshot({ path: `${salida}pie-ojo-${suf}.png` });
  const rol = await p.locator('[data-banco="pie"] [data-zona="haku"]').getAttribute('role');
  ok(rol === 'button', `${suf} Haku del pie es un botón accesible (${rol})`);

  // ── el sello
  await centrar(p, '[data-banco="sello"]');
  await p.waitForSelector('[data-banco="sello"] [data-desperto]', { timeout: 5000 });
  await p.waitForTimeout(4200);
  await p.locator('[data-banco="sello"]').screenshot({ path: `${salida}sello-${suf}.png` });

  ok(errores.length === 0, `${suf} errores de consola: ${errores.length}${errores[0] ? ` · ${errores[0]}` : ''}`);
  await ctx.close();
}

// ── menos movimiento: todo en su último cuadro, sin esperar a nadie
{
  const { p, ctx, errores } = await abrir(`${base}/laboratorio/tanda-3/`, 1440, 900, { reducedMotion: 'reduce' });
  for (const s of ['repisa', 'buzon', 'pie', 'sello']) {
    await centrar(p, `[data-banco="${s}"]`);
    await p.waitForTimeout(500);
    await p.locator(`[data-banco="${s}"]`).screenshot({ path: `${salida}quieto-${s}.png` });
  }
  const visibles = await p.evaluate(() => [...document.querySelectorAll('[data-comp="h"] [data-objeto]')].filter((o) => getComputedStyle(o).opacity === '1').length);
  ok(visibles === 6, `quieto: los seis objetos se ven (${visibles})`);
  await p.locator('[data-comp="h"] [data-objeto="lugar"] button').click();
  await p.waitForTimeout(300);
  await p.locator('[data-banco="repisa"]').screenshot({ path: `${salida}quieto-repisa-globo.png` });
  ok(/Cuernavaca/.test(await p.locator('[data-comp="h"] [data-globo]').innerText()), 'quieto: el globo funciona sin movimiento');
  ok(errores.length === 0, `quieto: errores de consola ${errores.length}${errores[0] ? ` · ${errores[0]}` : ''}`);
  await ctx.close();
}

// ── /laboratorio/dibujo/ debe seguir igual
for (const [ancho, alto] of [[1440, 900], [390, 844]]) {
  const { p, ctx, errores } = await abrir(`${base}/laboratorio/dibujo/`, ancho, alto);
  const portada = p.locator('[data-banco="portada"]');
  await portada.scrollIntoViewIfNeeded();
  await p.waitForTimeout(7500);
  await portada.screenshot({ path: `${salida}dibujo-portada-${ancho}.png` });
  ok(errores.length === 0, `/laboratorio/dibujo/ ${ancho}: errores de consola ${errores.length}${errores[0] ? ` · ${errores[0]}` : ''}`);
  await ctx.close();
}

console.log(informe.join('\n'));
await nav.close();
