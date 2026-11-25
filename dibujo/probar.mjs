// Pruebas de comportamiento del laboratorio (hervor, cursor, lámpara, teclado, menos movimiento, peso).
// Uso: nice -n 19 taskset -c 0-3 node probar.mjs http://127.0.0.1:3417
import { existsSync, statSync } from 'node:fs';
const candidatos = [new URL('../node_modules/playwright/index.mjs', import.meta.url).pathname, process.env.PLAYWRIGHT_MJS || '/home/skytoti/Proyectos/portafolio/node_modules/playwright/index.mjs'];
const { chromium } = await import(candidatos.find((c) => existsSync(c)));

const base = process.argv[2] || 'http://127.0.0.1:3417';
const resultados = [];
const prueba = async (nombre, fn) => {
  try { await fn(); resultados.push(['ok', nombre]); } catch (e) { resultados.push(['FALLA', `${nombre}: ${e.message.split('\n')[0]}`]); }
};
const afirmar = (c, m) => { if (!c) throw new Error(m); };
const b = await chromium.launch();
const SVG = '.lamina.horizontal svg';

for (const e of ['a', 'b', 'c']) {
  for (const comp of ['h', 'v']) {
    await prueba(`${e}-${comp}.svg pesa ≤ 120 KB`, async () => {
      const kb = statSync(new URL(`./lab/svg/${e}-${comp}.svg`, import.meta.url)).size / 1024;
      afirmar(kb <= 120, `${kb.toFixed(1)} KB`);
    });
  }

  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errores = [];
  p.on('pageerror', (x) => errores.push(x.message));
  await p.goto(`${base}/${e}.html`);
  const cuadros = async (ms) => p.evaluate(async ([sel, ms]) => {
    const s = document.querySelector(sel), vistos = new Set();
    const t0 = performance.now();
    while (performance.now() - t0 < ms) { vistos.add(s.dataset.f ?? '0'); await new Promise((r) => setTimeout(r, 40)); }
    return [...vistos];
  }, [SVG, ms]);

  await prueba(`${e}: hierve al entrar (3 cuadros)`, async () => {
    const v = await cuadros(600); afirmar(v.length === 3, `cuadros vistos: ${v}`);
  });
  await prueba(`${e}: se queda quieta después de ~6 s`, async () => {
    await p.waitForTimeout(6200);
    const v = await cuadros(800); afirmar(v.length === 1 && v[0] === '0', `sigue hirviendo: ${v}`);
    const prog = await p.evaluate((sel) => document.querySelector(sel)._lab.tl.progress(), SVG);
    afirmar(prog === 1, `entrada en ${prog}`);
  });
  await prueba(`${e}: al pasar el cursor hierve y los ojos lo siguen`, async () => {
    const caja = await p.locator(`${SVG} .golpe-gato`).boundingBox();
    await p.mouse.move(caja.x + caja.width / 2, caja.y + caja.height / 2);
    await p.waitForTimeout(90);
    const oreja = await p.getAttribute(`${SVG} [data-anim="oreja-d"]`, 'transform');
    afirmar(Math.abs(parseFloat(oreja.replace('rotate(', ''))) > 2, `la oreja no se mueve: ${oreja}`);
    await p.mouse.move(caja.x - 300, caja.y - 100, { steps: 4 });
    await p.waitForTimeout(350);
    const v = await cuadros(500); afirmar(v.length > 1, 'no hierve con el cursor encima');
    const t = await p.getAttribute(`${SVG} [data-anim="pupila"]`, 'transform');
    const [x] = t.match(/-?\d+\.?\d*/g).map(Number); afirmar(x < -1, `pupila no mira a la izquierda: ${t}`);
    await p.mouse.move(5, 5);
    await p.waitForTimeout(300);
    const v2 = await cuadros(400); afirmar(v2.length === 1, 'sigue hirviendo al salir');
  });
  await prueba(`${e}: clic en la lámpara apaga y vuelve a encender`, async () => {
    await p.click(`${SVG} .interruptor`); await p.waitForTimeout(600);
    let o = await p.evaluate((sel) => [1 - getComputedStyle(document.querySelector(`${sel} .dibujo`)).opacity, +getComputedStyle(document.querySelector(`${sel} .luz`)).opacity], SVG);
    afirmar(o[0] > 0.8 && o[1] === 0, `apagada: oscuro ${o[0]}, luz ${o[1]}`);
    await p.click(`${SVG} .interruptor`); await p.waitForTimeout(600);
    o = await p.evaluate((sel) => [1 - getComputedStyle(document.querySelector(`${sel} .dibujo`)).opacity, +getComputedStyle(document.querySelector(`${sel} .luz`)).opacity], SVG);
    afirmar(o[0] === 0 && o[1] === 1, `encendida: oscuro ${o[0]}, luz ${o[1]}`);
  });
  await prueba(`${e}: la lámpara responde al teclado`, async () => {
    await p.focus(`${SVG} .interruptor`); await p.keyboard.press('Enter'); await p.waitForTimeout(100);
    afirmar(await p.getAttribute(`${SVG} .interruptor`, 'aria-pressed') === 'true', 'Enter no la apagó');
    await p.keyboard.press(' '); await p.waitForTimeout(100);
    afirmar(await p.getAttribute(`${SVG} .interruptor`, 'aria-pressed') === 'false', 'Espacio no la encendió');
  });
  await prueba(`${e}: sin errores de JS`, async () => afirmar(errores.length === 0, errores.join(' | ')));
  await p.close();

  const r = await b.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  await r.goto(`${base}/${e}.html`);
  await prueba(`${e}: menos movimiento = dibujada y quieta`, async () => {
    await r.waitForTimeout(300);
    const estado = await r.evaluate((sel) => {
      const s = document.querySelector(sel);
      return { prog: s._lab.tl.progress(), chispa: +getComputedStyle(s.querySelector('.chispa')).opacity, luz: +getComputedStyle(s.querySelector('.luz')).opacity };
    }, SVG);
    afirmar(estado.prog === 1 && estado.chispa === 1 && estado.luz === 1, JSON.stringify(estado));
    const v = await r.evaluate(async (sel) => { const s = document.querySelector(sel), vistos = new Set(); for (let i = 0; i < 15; i++) { vistos.add(s.dataset.f ?? '0'); await new Promise((x) => setTimeout(x, 40)); } return [...vistos]; }, SVG);
    afirmar(v.length === 1, `hierve con menos movimiento: ${v}`);
  });
  await r.close();
}
await b.close();
const fallan = resultados.filter(([e]) => e !== 'ok');
resultados.forEach(([e, n]) => console.log(`${e.padEnd(5)} ${n}`));
console.log(`\n${resultados.length - fallan.length} ok / ${fallan.length} fallan`);
process.exit(fallan.length ? 1 : 0);
