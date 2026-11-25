// El banco /laboratorio/tanda-5/ con Playwright (lo llama capturar-tanda5.mjs sitio <url>): hoja de ciclos, la
// caminata grabada (12 cuadros cada 100 ms con scroll), sentado con globo, susto, clic, dormido, silencio y menos
// movimiento, en 1440×900 y 390×844. Comprueba que no patine ni brinque de altura y que no haya errores de consola.
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';

const visible = () => {
  const g = [...document.querySelectorAll('[data-guia] [data-cuadro]')].find((e) => e.style.display !== 'none');
  const caja = document.querySelector('[data-guia] [data-haku]')?.closest('div[class]')?.parentElement?.parentElement;
  const m = /translate3d\(([-\d.]+)px/.exec(caja?.style.transform || '');
  const r = document.querySelector('[data-guia] [data-haku]')?.getBoundingClientRect();
  return { ciclo: g?.parentElement?.dataset.ciclo, cuadro: g ? Number(g.dataset.cuadro) : -1, x: m ? Number(m[1]) : null, abajo: r ? Math.round(r.bottom) : null, espejo: document.querySelector('[data-guia] [data-espejo]')?.dataset.espejo };
};

export async function correr({ nav, base, salida, ok, informe }) {
  const url = `${base}/laboratorio/tanda-5/`;
  for (const [ancho, alto] of [[1440, 900], [390, 844]]) {
    const suf = String(ancho);
    const ctx = await nav.newContext({ viewport: { width: ancho, height: alto }, deviceScaleFactor: 1 });
    const p = await ctx.newPage();
    const errores = [];
    p.on('console', (m) => { if (m.type() === 'error') errores.push(m.text()); });
    p.on('pageerror', (e) => errores.push(String(e)));
    await p.goto(url, { waitUntil: 'networkidle' });
    await p.evaluate(() => document.fonts.ready);
    await p.waitForSelector('[data-guia][data-listo]', { timeout: 15000, state: 'attached' });
    await p.waitForTimeout(600);

    // ── la hoja: todos los ciclos en bucle; la pausa congela su cuadro
    await p.waitForSelector('[data-ficha="dormir"] svg g[data-cuadro]', { state: 'attached' });
    await p.locator('[data-banco="hoja"]').screenshot({ path: `${salida}hoja-${suf}.png` });
    await p.locator('[data-pausa="caminar"]').click();
    const cuadroFicha = () => p.evaluate(() => [...document.querySelectorAll('[data-ficha="caminar"] [data-cuadro]')].findIndex((e) => e.style.display !== 'none'));
    const c1 = await cuadroFicha(); await p.waitForTimeout(350); const c2 = await cuadroFicha();
    ok(c1 === c2 && c1 >= 0, `${suf} la pausa congela la caminata de la hoja (${c1} = ${c2})`);
    await p.locator('[data-pausa="caminar"]').click();

    // ── la caminata: al principio de la estación 1, scroll hacia abajo y 12 cuadros cada 100 ms
    await p.evaluate(() => { const e = document.querySelector('[data-estacion="banco-uno"]'); scrollTo(0, e.getBoundingClientRect().top + scrollY - innerHeight * 0.5 + 10); });
    await p.waitForTimeout(1500);
    const dir = `${salida}caminata-${suf}/`;
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });
    const pista = [];
    await p.mouse.move(ancho - 5, 5);
    for (let i = 0; i < 16; i++) {
      await p.mouse.wheel(0, ancho > 600 ? 70 : 50);
      await p.waitForTimeout(100);
      if (i < 4) continue; // primero se levanta (3 cuadros)
      pista.push(await p.evaluate(visible));
      await p.screenshot({ path: `${dir}${String(i - 4).padStart(2, '0')}.png`, clip: { x: 0, y: alto - 150, width: ancho, height: 150 } });
    }
    const andando = pista.filter((v) => v.ciclo === 'caminar');
    const xs = andando.map((v) => v.x);
    const pasos = xs.slice(1).map((x, i) => Math.round((x - xs[i]) * 10) / 10);
    const alturas = new Set(andando.map((v) => v.abajo));
    ok(andando.length >= 8, `${suf} caminando en ${andando.length} de 12 cuadros grabados`);
    ok(pasos.every((d) => d >= 0) && pasos.some((d) => d > 0), `${suf} avanza a la derecha al bajar; pasos (px): ${pasos.join(' ')}`);
    ok(alturas.size === 1, `${suf} no brinca de altura (abajo: ${[...alturas].join(', ')})`);
    ok(new Set(andando.map((v) => v.cuadro)).size >= 4, `${suf} el ciclo avanza: ${andando.map((v) => v.cuadro).join('')}`);
    execFileSync('python3', ['-c', `
import glob,sys
from PIL import Image
fs=sorted(glob.glob(sys.argv[1]+'*.png')); ims=[Image.open(f) for f in fs]
w,h=ims[0].size; k=0.5 if w>1000 else 1
W,H=int(w*k),int(h*k)
o=Image.new('RGB',(W,H*len(ims)+2*len(ims)),(11,18,32))
for i,im in enumerate(ims): o.paste(im.resize((W,H)),(0,i*(H+2)))
o.save(sys.argv[2])`, dir, `${salida}caminata-${suf}.png`]);
    rmSync(dir, { recursive: true, force: true });
    informe.push(`    ${suf} pista: ${pista.map((v) => `${v.ciclo}${v.cuadro}@${v.x}`).join(' ')}`);

    // ── se detiene: se sienta y presenta la estación con un globo
    await p.waitForTimeout(2600);
    const sentado = await p.evaluate(visible);
    const globo = await p.evaluate(() => { const g = document.querySelector('[data-haku-globo]'); if (!g) return null; const r = g.getBoundingClientRect(); return { texto: g.textContent, x: r.left, y: r.top, d: r.right, b: r.bottom, vis: getComputedStyle(g).visibility }; });
    ok(!!globo && globo.vis === 'visible', `${suf} al detenerse presenta con globo: «${globo?.texto}» (${sentado.ciclo}${sentado.cuadro})`);
    if (globo) ok(globo.x >= 0 && globo.d <= ancho && globo.y >= 0 && globo.b <= alto, `${suf} el globo cabe en la ventana`);
    await p.screenshot({ path: `${salida}sentado-globo-${suf}.png` });
    await p.waitForTimeout(3200);
    await p.screenshot({ path: `${salida}sentado-${suf}.png`, clip: { x: 0, y: alto - 260, width: ancho, height: 260 } });

    // ── clic: la siguiente frase; Escape la cierra
    await p.locator('[data-haku]').click();
    await p.waitForTimeout(400);
    const otra = await p.locator('[data-haku-globo]').textContent().catch(() => null);
    ok(!!otra && otra !== globo?.texto, `${suf} el clic trae otra frase: «${otra}»`);
    await p.keyboard.press('Escape');
    await p.waitForTimeout(150);
    ok(!(await p.locator('[data-haku-globo]').count()), `${suf} Escape cierra el globo`);

    // ── susto: el cursor pasa muy rápido cerca de él (solo escritorio: con mouse)
    if (ancho > 600) {
      await p.waitForTimeout(1200);
      const r = await p.locator('[data-haku]').boundingBox();
      await p.mouse.move(r.x - 200, r.y + 20);
      await p.waitForTimeout(60);
      for (let i = 1; i <= 6; i++) { await p.mouse.move(r.x - 200 + i * 90, r.y + 20); await p.waitForTimeout(16); }
      await p.waitForTimeout(160);
      const s = await p.evaluate(visible);
      ok(s.ciclo === 'susto', `${suf} se asusta con el cursor rápido (${s.ciclo}${s.cuadro})`);
      await p.screenshot({ path: `${salida}susto-${suf}.png`, clip: { x: Math.max(0, r.x - 160), y: alto - 260, width: 480, height: 260 } });
    }

    // ── el pie: se duerme y ahí se queda
    await p.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
    await p.waitForTimeout(400);
    await p.mouse.wheel(0, 200);
    await p.waitForTimeout(3600);
    const pie = await p.evaluate(visible);
    ok(pie.ciclo === 'dormir', `${suf} en el pie se duerme (${pie.ciclo}${pie.cuadro})`);
    await p.screenshot({ path: `${salida}dormido-${suf}.png`, clip: { x: 0, y: alto - 260, width: ancho, height: 260 } });

    // ── silencio: a su esquina, sentado, sin globos; se recuerda al recargar
    await p.locator('[data-haku-interruptor]').click();
    await p.waitForTimeout(300);
    const callado = await p.evaluate(visible);
    await p.locator('[data-haku]').click();
    await p.waitForTimeout(300);
    ok(callado.ciclo === 'sentado' && !(await p.locator('[data-haku-globo]').count()), `${suf} en silencio: sentado en la esquina (x ${callado.x}) y sin globo al tocarlo`);
    await p.screenshot({ path: `${salida}silencio-${suf}.png`, clip: { x: 0, y: alto - 200, width: Math.min(ancho, 560), height: 200 } });
    await p.reload({ waitUntil: 'networkidle' });
    await p.waitForSelector('[data-guia][data-listo]', { timeout: 15000, state: 'attached' });
    ok(await p.evaluate(() => document.querySelector('[data-guia]')?.dataset.silencio === '1'), `${suf} el silencio se recuerda (localStorage)`);
    await p.locator('[data-haku-interruptor]').click();
    ok(errores.length === 0, `${suf} errores de consola: ${errores.length}${errores.length ? ` · ${errores[0]}` : ''}`);
    await ctx.close();

    // ── menos movimiento: sentado y quieto en su esquina; el globo aparece sin animación
    const ctx2 = await nav.newContext({ viewport: { width: ancho, height: alto }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
    const q = await ctx2.newPage();
    const err2 = [];
    q.on('console', (m) => { if (m.type() === 'error') err2.push(m.text()); });
    await q.goto(url, { waitUntil: 'networkidle' });
    await q.waitForSelector('[data-guia][data-listo]', { timeout: 15000, state: 'attached' });
    const a0 = await q.evaluate(visible);
    for (let i = 0; i < 8; i++) { await q.mouse.wheel(0, 400); await q.waitForTimeout(100); }
    await q.evaluate(() => document.querySelector('[data-estacion="banco-dos"]').scrollIntoView({ block: 'center' }));
    await q.waitForTimeout(1200);
    const a1 = await q.evaluate(visible);
    const anim = await q.evaluate(() => { const g = document.querySelector('[data-haku-globo]'); return g ? getComputedStyle(g).animationName : null; });
    ok(a0.x === a1.x && a1.ciclo === 'sentado', `${suf} menos movimiento: quieto en su esquina (x ${a0.x} → ${a1.x}, ${a1.ciclo})`);
    ok(anim === 'none', `${suf} menos movimiento: globo sin animación (${anim})`);
    await q.screenshot({ path: `${salida}menos-movimiento-${suf}.png` });
    ok(err2.length === 0, `${suf} menos movimiento, errores de consola: ${err2.length}`);
    await ctx2.close();
  }
}
