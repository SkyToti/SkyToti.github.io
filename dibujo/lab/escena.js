// Animación de «El escritorio de noche» (igual para los tres estilos).
// Entrada ≤ 6 s con GSAP · línea que hierve a 8 cuadros/s solo mientras está viva ·
// ojos que siguen al cursor · clic en la lámpara la apaga/enciende · menos movimiento = quieto.
// ?t=2.5 congela la entrada en ese segundo (capturas); ?t=fin la deja en su estado final.
(() => {
  gsap.registerPlugin(DrawSVGPlugin, MotionPathPlugin);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const q = new URLSearchParams(location.search);
  const congelar = q.has('t') ? (q.get('t') === 'fin' ? 'fin' : parseFloat(q.get('t'))) : null;
  const VIVA = 6000; // ms que hierve sola al entrar

  document.querySelectorAll('.lamina').forEach((lam) => montar(lam.querySelector('svg.escena'), lam.querySelector('.otra-vez')));

  function montar(svg, boton) {
    const $ = (s, r = svg) => r.querySelector(s);
    const $$ = (s, r = svg) => (r ? [...r.querySelectorAll(s)] : []);
    const grupo = (n) => $(`[data-g="${n}"]`);
    const sub = (g, s) => $(`[data-s="${s}"]`, grupo(g));
    const setT = (el, s) => el && el.setAttribute('transform', s);

    // ── línea que hierve: alterna .f0/.f1/.f2 cambiando un atributo (no recalcula nada) ──
    let cuadro = 0, reloj = null, hover = false, introViva = false, enVista = true;
    const pon = (n) => { cuadro = n; svg.dataset.f = n; };
    const hervir = () => {
      const quiere = !reduce && congelar === null && (hover || introViva) && enVista;
      if (quiere && !reloj) reloj = setInterval(() => pon((cuadro + 1) % 3), 125);
      if (!quiere && reloj) { clearInterval(reloj); reloj = null; pon(0); }
    };
    new IntersectionObserver(([e]) => { enVista = e.isIntersecting; hervir(); }).observe(svg);

    // índice de cada trazo dentro de su cuadro: así los 3 cuadros se dibujan a la par
    const idx = new Map();
    $$('.f0, .f1, .f2').forEach((f) => $$('path.t:not(.tf)', f).forEach((p, k) => idx.set(p, k)));
    const trazos = (el) => $$('path.t:not(.tf)', el);

    const luz = $('.luz'), dibujo = $('.dibujo'), chispa = $('.chispa'), estela = $('.estela'), guia = $('.guia');
    const fin = parseFloat(guia.dataset.fin);
    const tl = gsap.timeline({ paused: true });

    const dibuja = (el, t, dur, paso = 0) => {
      const els = Array.isArray(el) ? el.flatMap(trazos) : trazos(el);
      if (els.length) tl.fromTo(els, { drawSVG: '0%' }, { drawSVG: '100%', duration: dur, ease: 'power2.inOut', stagger: paso ? (i, p) => idx.get(p) * paso : 0 }, t);
    };
    const aparece = (els, t, dur = 0.35) => {
      els = (Array.isArray(els) ? els : [els]).filter(Boolean);
      if (els.length) tl.fromTo(els, { opacity: 0 }, { opacity: 1, duration: dur, ease: 'power1.out' }, t);
    };
    // pequeños «muñecos» con pivote propio: se animan escribiendo su transform
    const muneco = (el, ini, fmt) => { const o = { ...ini }; const pinta = () => setT(el, fmt(o)); pinta(); return { o, pinta }; };
    // una secuencia de poses (cada pose es su propio tween: así el último valor siempre se pinta)
    const poses = (dest, m, lista, t, ease = 'sine.inOut') => {
      let acc = 0;
      lista.forEach(({ duration, ...v }) => { dest.to(m.o, { ...v, duration, ease, onUpdate: m.pinta }, t + acc); acc += duration; });
    };

    // 1 · la línea, de izquierda a derecha
    dibuja(grupo('linea'), 0, 1.3);
    // 2 · escritorio → monitor → teclado/taza → lámpara → gato → agente
    dibuja(grupo('escritorio'), 0.5, 0.7);
    aparece($$('.rel', grupo('escritorio')), 0.8, 0.5);
    dibuja(sub('monitor', 'marco'), 0.85, 0.9, 0.06);
    aparece($$('.rel', sub('monitor', 'marco')), 1.2, 0.5);
    dibuja(sub('monitor', 'codigo'), 1.55, 0.45, 0.1);
    aparece($$('.rel', sub('monitor', 'notas')), 1.75, 0.2);
    dibuja(sub('monitor', 'notas'), 1.75, 0.4, 0.05);
    dibuja(grupo('teclado'), 1.3, 0.5);
    aparece([...$$('.tf', grupo('teclado')), ...$$('.rel', grupo('teclado'))], 1.7, 0.3);
    dibuja(grupo('taza'), 1.45, 0.6, 0.06);
    aparece($$('.rel', grupo('taza')), 1.8, 0.3);
    dibuja(grupo('lampara'), 1.85, 0.75, 0.08);
    aparece($$('.rel', grupo('lampara')), 2.3, 0.3);
    // la lámpara se enciende con un parpadeo de dos cuadros
    tl.set(luz, { opacity: 0 }, 0).set(luz, { opacity: 1 }, 2.7).set(luz, { opacity: 0 }, 2.79).set(luz, { opacity: 1 }, 2.9);

    const gato = grupo('gato');
    dibuja(sub('gato', 'cuerpo'), 2.3, 0.7, 0.025);
    dibuja(sub('gato', 'cabeza'), 2.55, 0.7, 0.02);
    dibuja([sub('gato', 'oreja-i'), sub('gato', 'oreja-d')], 2.9, 0.35, 0.04);
    dibuja(sub('gato', 'cola'), 3.0, 0.4, 0.04);
    aparece($$('.rel', gato), 2.75, 0.45);
    aparece($('.ojos'), 3.2, 0.25);

    dibuja(grupo('agente'), 3.05, 0.6, 0.03);
    aparece($$('.rel', grupo('agente')), 3.35, 0.3);

    // el agente da tres pasitos (con brinquito) hasta dejar el bloque junto al monitor
    const pasosEl = $('[data-anim="pasos"]');
    const paso = +pasosEl.dataset.paso, n = +pasosEl.dataset.pasos;
    const pasos = muneco(pasosEl, { x: -paso * n, y: 0 }, (o) => `translate(${o.x.toFixed(2)} ${o.y.toFixed(2)})`);
    tl.set(pasos.o, { x: -paso * n, y: 0, onUpdate: pasos.pinta, onComplete: pasos.pinta }, 0);
    for (let k = 0; k < n; k++) {
      poses(tl, pasos, [
        { x: -paso * (n - k) + paso / 2, y: -5, duration: 0.15 },
        { x: -paso * (n - k - 1), y: 0, duration: 0.15 },
      ], 3.85 + k * 0.36, 'power1.inOut');
    }

    // el gato parpadea y mueve la cola una vez
    const ojos = ['ojo-i', 'ojo-d'].map((s) => muneco($(`[data-anim="${s}"]`), { s: 1 }, (o) => `scale(1 ${o.s.toFixed(3)})`));
    ojos.forEach((m) => poses(tl, m, [{ s: 0.08, duration: 0.07 }, { s: 1, duration: 0.11 }], 4.3));
    const cola = muneco($('[data-anim="cola"]'), { r: 0 }, (o) => `rotate(${o.r.toFixed(2)})`);
    poses(tl, cola, [{ r: -13, duration: 0.22 }, { r: 9, duration: 0.26 }, { r: -3, duration: 0.2 }, { r: 0, duration: 0.24 }], 4.55);

    // rótulos: la flecha se traza y el texto aparece
    $$('.rotulo').forEach((r, i) => { const t = 3.6 + i * 0.45; aparece($('text', r), t, 0.3); dibuja(r, t + 0.1, 0.4); });

    // la chispa recorre la línea (MotionPath) con su estela (DrawSVG en ventana)
    const viaje = { v: 0 };
    tl.fromTo(chispa, { opacity: 0 }, { opacity: 1, duration: 0.15 }, 3.3);
    tl.to(chispa, { motionPath: { path: guia, start: 0, end: fin }, duration: 2.5, ease: 'none' }, 3.3);
    tl.set(estela, { opacity: 1 }, 3.3);
    tl.fromTo(viaje, { v: 0 }, { v: fin, duration: 2.5, ease: 'none', onUpdate() {
      gsap.set(estela, { drawSVG: `${Math.max(0, viaje.v - 0.07) * 100}% ${viaje.v * 100}%` });
    } }, 3.3);
    tl.to(estela, { opacity: 0, duration: 0.25 }, 5.75);

    // ── estados de arranque ──
    const final = () => { tl.progress(1); pon(0); };
    if (reduce || congelar === 'fin') final();
    else if (typeof congelar === 'number') { tl.seek(congelar); pon(Math.floor(congelar * 8) % 3); }
    else arrancar();

    function arrancar() {
      tl.restart();
      introViva = true; hervir();
      clearTimeout(svg._viva);
      svg._viva = setTimeout(() => { introViva = false; hervir(); }, VIVA);
    }

    // ── interacción ──
    svg.addEventListener('pointerenter', () => { hover = true; hervir(); });
    svg.addEventListener('pointerleave', () => { hover = false; hervir(); mirar(null); });

    const pupilas = $$('[data-anim="pupila"]').map((p) => ({ p, ...muneco(p, { x: 0, y: 0 }, (o) => `translate(${o.x.toFixed(2)} ${o.y.toFixed(2)})`) }));
    function mirar(ev) {
      pupilas.forEach(({ p, o, pinta }) => {
        let x = 0, y = 0;
        if (ev) {
          const l = new DOMPoint(ev.clientX, ev.clientY).matrixTransform(p.parentNode.getScreenCTM().inverse());
          const dx = l.x - +p.dataset.cx, dy = l.y - +p.dataset.cy, d = Math.hypot(dx, dy) || 1;
          const k = Math.min(1, d / 90) * 3.4;
          x = (dx / d) * k; y = (dy / d) * k * 0.85;
        }
        gsap.to(o, { x, y, duration: reduce ? 0 : 0.18, ease: 'power2.out', overwrite: true, onUpdate: pinta });
      });
    }
    svg.addEventListener('pointermove', (ev) => { if (tl.progress() === 1) mirar(ev); });

    const oreja = muneco($('[data-anim="oreja-d"]'), { r: 0 }, (o) => `rotate(${o.r.toFixed(2)})`);
    let tlOreja = null;
    $('.golpe-gato').addEventListener('pointerenter', () => {
      if (reduce || tlOreja?.isActive()) return;
      tlOreja = gsap.timeline();
      poses(tlOreja, oreja, [{ r: 16, duration: 0.09 }, { r: -7, duration: 0.12 }, { r: 4, duration: 0.1 }, { r: 0, duration: 0.14 }], 0);
    });

    const interruptor = $('.interruptor');
    let encendida = true;
    function alternar(valor = !encendida) {
      if (tl.progress() < 1) tl.progress(1);
      encendida = valor;
      const d = reduce ? 0 : 1;
      gsap.to(luz, { opacity: encendida ? 1 : 0, duration: 0.12 * d, overwrite: true });
      // apagada: el dibujo baja a 18 %; los ojos y la chispa viven fuera de .dibujo y siguen igual
      gsap.to(dibujo, { opacity: encendida ? 1 : 0.18, duration: 0.45 * d, ease: 'power2.out', overwrite: true });
      interruptor.setAttribute('aria-pressed', String(!encendida));
      interruptor.setAttribute('aria-label', encendida ? 'Apagar la lámpara' : 'Encender la lámpara');
    }
    interruptor.addEventListener('click', () => alternar());
    interruptor.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); alternar(); } });

    if (boton) {
      if (reduce) boton.hidden = true;
      boton.addEventListener('click', () => { alternar(true); gsap.set(dibujo, { opacity: 1 }); arrancar(); });
    }
    svg._lab = { tl, alternar }; // para las capturas
  }
})();
