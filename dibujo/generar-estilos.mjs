// Genera los SVG estáticos (3 cuadros por pieza = línea que hierve) y las páginas del laboratorio.
// Uso: node generar.mjs        (escribe lab/svg/*.svg y lab/{a,b,c}.html)
import rough from 'roughjs';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { construir } from './escena.mjs';
import { estilos, color } from './estilos.mjs';

const aqui = new URL('.', import.meta.url).pathname;
const gen = rough.generator();
const SEMILLAS = [11, 47, 83]; // fijas: el dibujo sale igual cada vez
const ORDEN = ['escritorio', 'monitor', 'teclado', 'taza', 'lampara', 'gato', 'agente'];

const palomita = ([x, y]) => [{ tipo: 'polilinea', pts: [[x, y], [x + 5, y + 6], [x + 15, y - 8]], tono: 'ambar' }];
const num = (n) => (Math.round(n * 10) / 10).toString();
const fmt = (d) => d.replace(/-?\d*\.?\d+(?:e-?\d+)?/g, (m) => num(+m)).replace(/\s+/g, ' ').replace(/ ?([MLCQZAmlcqza]) ?/g, '$1').replace(/ -/g, '-').trim();
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
// une los sub-trayectos que siguen donde terminó el anterior: el «dash» de DrawSVG se reinicia
// en cada M, así que sin esto un camino se dibujaría desde todos sus tramos a la vez
function unir(d) {
  const partes = d.trim().split(/(?=M)/);
  let fin = null;
  return partes.map((p) => {
    const nums = p.match(/-?\d*\.?\d+(?:e-?\d+)?/g)?.map(Number) || [];
    const ini = nums.slice(0, 2);
    const pegada = fin && Math.hypot(ini[0] - fin[0], ini[1] - fin[1]) < 0.75;
    fin = nums.slice(-2);
    return pegada ? p.replace(/^M\s*-?\d*\.?\d+(?:e-?\d+)?[\s,]+-?\d*\.?\d+(?:e-?\d+)?\s*/, '') : p;
  }).join(' ');
}

// alarga los extremos de un trazo abierto (remates que se pasan del marcador)
function rematar(pts, k) {
  if (!k || pts.length < 2) return pts;
  const ext = (a, b) => { const dx = a[0] - b[0], dy = a[1] - b[1], n = Math.hypot(dx, dy) || 1; return [a[0] + (dx / n) * k, a[1] + (dy / n) * k]; };
  const q = pts.slice();
  q[0] = ext(pts[0], pts[1]);
  q[q.length - 1] = ext(pts[pts.length - 1], pts[pts.length - 2]);
  return q;
}

function dibujable(p, o, remate = 0) {
  switch (p.tipo) {
    case 'linea': { const [a, b] = rematar([p.a, p.b], remate); return gen.line(a[0], a[1], b[0], b[1], o); }
    case 'polilinea': return gen.linearPath(rematar(p.pts, remate), o);
    case 'poligono': return gen.polygon(p.pts, o);
    case 'rect': return gen.rectangle(p.x, p.y, p.w, p.h, o);
    case 'elipse': return gen.ellipse(p.c[0], p.c[1], p.rx * 2, p.ry * 2, o);
    case 'camino': return gen.path(p.d, o);
  }
  throw new Error(`tipo desconocido: ${p.tipo}`);
}

function limpio(p) {
  const pt = ([x, y]) => `${num(x)} ${num(y)}`;
  switch (p.tipo) {
    case 'poligono': return `M${p.pts.map(pt).join('L')}Z`;
    case 'rect': return `M${num(p.x)} ${num(p.y)}h${num(p.w)}v${num(p.h)}h${num(-p.w)}Z`;
    case 'elipse': { const [cx, cy] = p.c; return `M${num(cx - p.rx)} ${num(cy)}A${num(p.rx)} ${num(p.ry)} 0 1 0 ${num(cx + p.rx)} ${num(cy)}A${num(p.rx)} ${num(p.ry)} 0 1 0 ${num(cx - p.rx)} ${num(cy)}Z`; }
    case 'camino': return fmt(p.d);
    case 'linea': return `M${pt(p.a)}L${pt(p.b)}`;
    case 'polilinea': return `M${p.pts.map(pt).join('L')}`;
  }
}

// muestrea un camino M/L/C absoluto (para colocar la chispa en reposo sin JS)
function puntoEn(d, t) {
  const tok = d.match(/[MLC]|-?\d*\.?\d+/g); const segs = []; let cur = null, i = 0, cmd;
  while (i < tok.length) {
    if (/[MLC]/.test(tok[i])) cmd = tok[i++];
    const n = () => +tok[i++];
    if (cmd === 'M') cur = [n(), n()];
    else if (cmd === 'L') { const a = cur, b = [n(), n()]; segs.push((s) => [a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s]); cur = b; }
    else if (cmd === 'C') { const a = cur, c1 = [n(), n()], c2 = [n(), n()], b = [n(), n()]; segs.push((s) => { const m = 1 - s; return [0, 1].map((k) => m * m * m * a[k] + 3 * m * m * s * c1[k] + 3 * m * s * s * c2[k] + s * s * s * b[k]); }); cur = b; }
  }
  const pts = []; segs.forEach((f) => { for (let s = 0; s <= 1; s += 0.02) pts.push(f(s)); });
  const acc = [0]; for (let k = 1; k < pts.length; k++) acc.push(acc[k - 1] + Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]));
  const meta = acc.at(-1) * t; const k = acc.findIndex((v) => v >= meta);
  return pts[Math.max(0, k)];
}

function svgDe(idEstilo, idComp) {
  const st = estilos[idEstilo];
  const esc_ = construir(idComp);
  const suf = `-${idEstilo}${idComp}`;
  const url = (f) => (f.startsWith('url(#') ? f.replace(/\)$/, `${suf})`) : f);
  const out = [];
  const ojos = [];

  const trazos = (p, escala, semilla, base) => {
    const tono = st.tonos[p.tono];
    const o = { ...base, seed: semilla, stroke: tono, strokeWidth: base.strokeWidth / Math.abs(escala), preserveVertices: true };
    delete o.remate;
    return gen.toPaths(dibujable(p, o, (base.remate || 0) / Math.abs(escala)))
      .filter((q) => q.stroke && q.stroke !== 'none')
      .map((q) => `<path class="t${p.entra === 'fade' ? ' tf' : ''}" d="${fmt(unir(q.d))}" stroke="${tono}"${(p.tono === 'apagado' || p.fino) && st.finos ? ` stroke-width="${num((base.strokeWidth * st.finos) / Math.abs(escala))}"` : ''}${p.punteado ? ` stroke-dasharray="${p.punteado}"` : ''}/>`)
      .join('');
  };
  const relleno = (p, escala) => {
    const r0 = p.rol && st.rellenos[p.rol];
    if (!r0) return '';
    return [r0].flat().map((r) => capaRelleno(p, escala, r)).join('');
  };
  const capaRelleno = (p, escala, r) => {
    const fill = url(r.fill);
    const mv = r.mueve ? ` transform="translate(${num(r.mueve[0] / escala)} ${num(r.mueve[1] / Math.abs(escala))})"` : '';
    const op = r.opacidad ? ` opacity="${r.opacidad}"` : '';
    let d;
    if (r.modo === 'rugoso') {
      const q = gen.toPaths(dibujable(p, { ...st.trazo, seed: SEMILLAS[0] + 5, fill, fillStyle: 'solid', stroke: 'none', strokeWidth: 0 }))
        .find((x) => x.fill && x.fill !== 'none');
      d = q ? fmt(q.d) : limpio(p);
    } else d = limpio(p);
    return `<path d="${d}" fill="${fill}"${mv}${op}/>`;
  };

  function bloque(piezas, escala) {
    // devuelve rellenos + 3 cuadros de trazos para un conjunto de piezas
    const rel = piezas.map((p) => relleno(p, escala)).join('');
    const conTrazo = piezas.filter((p) => p.tono && !(p.detalle && st.sinDetalles));
    const cuadros = SEMILLAS.map((s, i) => `<g class="f${i}">${conTrazo.map((p) => trazos(p, escala, s, st.trazo)).join('')}</g>`).join('');
    return (rel ? `<g class="rel">${rel}</g>` : '') + cuadros;
  }

  const sw = (escala, k = 1) => ` stroke-width="${num((st.trazo.strokeWidth * k) / Math.abs(escala))}"`;
  const transf = ([x, y, s]) => `translate(${num(x)} ${num(y)}) scale(${num(s)}${s < 0 ? ` ${num(-s)}` : ''})`;

  for (const nombre of ORDEN) {
    const parte = esc_.partes[nombre];
    const pos = esc_.grupos[nombre] || [0, 0, 1];
    const escala = pos[2];
    const subs = [...new Set(parte.piezas.filter((p) => p.capa !== 'ojos').map((p) => p.sub))];
    let interior = subs.map((sub) => {
      const contenido = bloque(parte.piezas.filter((p) => p.sub === sub && p.capa !== 'ojos'), escala);
      const pv = parte.pivotes?.[sub];
      if (pv) return `<g class="s" data-s="${sub}" transform="translate(${pv[0]} ${pv[1]})"><g data-anim="${sub}"><g transform="translate(${-pv[0]} ${-pv[1]})">${contenido}</g></g></g>`;
      return `<g class="s" data-s="${sub}">${contenido}</g>`;
    }).join('');
    if (nombre === 'agente') interior = `<g data-anim="pasos" data-paso="${esc_.paso}" data-pasos="${esc_.pasos}">${interior}</g>`;
    out.push(`<g class="g" data-g="${nombre}"${nombre === 'escritorio' ? '' : ` transform="${transf(pos)}"`}${sw(escala)}>${interior}</g>`);

    if (nombre === 'gato') {
      const capas = ['ojo-i', 'ojo-d'].map((sub) => {
        const pz = parte.piezas.filter((p) => p.sub === sub);
        const pv = parte.pivotes[sub];
        const pupila = pz.filter((p) => p.pupila).map((p) => relleno(p, escala)).join('');
        const ojo = bloque(pz.filter((p) => !p.pupila), escala);
        return `<g transform="translate(${pv[0]} ${pv[1]})"><g data-anim="${sub}"><g transform="translate(${-pv[0]} ${-pv[1]})">${ojo}<g data-anim="pupila" data-cx="${pv[0]}" data-cy="${pv[1]}">${pupila}</g></g></g></g>`;
      }).join('');
      ojos.push(`<g class="ojos" transform="${transf(pos)}"${sw(escala)}>${capas}</g>`);
      const gg = parte.golpe;
      ojos.push(`<ellipse class="golpe-gato" transform="${transf(pos)}" cx="${gg.c[0]}" cy="${gg.c[1]}" rx="${gg.rx}" ry="${gg.ry}" fill="transparent"/>`);
    }
  }

  // la línea: un trazo continuo (sin doble pasada para que la chispa vaya en la punta)
  const lineaP = { tipo: 'camino', d: esc_.linea, tono: 'hueso' };
  const lineaO = { ...st.trazo, ...st.linea, disableMultiStroke: true };
  out.push(`<g class="g" data-g="linea" stroke-width="${st.linea.strokeWidth}">${SEMILLAS.map((s, i) => `<g class="f${i}">${trazos(lineaP, 1, s, lineaO)}</g>`).join('')}</g>`);

  // la luz de la lámpara (la única mancha grande de color)
  const lam = esc_.partes.lampara;
  const lpos = esc_.grupos.lampara;
  const { cono, charco, foco } = lam.luz;
  const luzSvg = (`<g class="luz" transform="${transf(lpos)}">`
    + `<path d="${limpio({ tipo: 'poligono', pts: cono })}" fill="${url(st.luz.cono.fill)}" opacity="${st.luz.cono.opacity}"/>`
    + `<path d="${limpio({ tipo: 'elipse', ...charco })}" fill="${st.luz.charco.fill}" opacity="${st.luz.charco.opacity}"/>`
    + `<circle cx="${num(foco[0])}" cy="${num(foco[1])}" r="6" fill="${color.ambar}" opacity="${st.luz.foco}"/></g>`);
  if (st.luz.debajo) out.unshift(luzSvg); else out.push(luzSvg);

  // rótulos a mano: texto real + flecha/palomita dibujadas
  const rs = st.rotulo;
  out.push(`<g class="rotulos">${esc_.rotulos.map((r) => {
    const tinta = idEstilo === 'c' ? 'ambar' : idEstilo === 'b' ? 'hueso' : 'apagado';
    const ancho = r.texto.length * rs.size * rs.em;
    const x0 = r.ancla === 'end' ? r.x - ancho : r.ancla === 'middle' ? r.x - ancho / 2 : r.x;
    const extra = r.palomita ? palomita([x0 + ancho + 7, r.y - rs.size * 0.42]) : [];
    const piezas = [...r.piezas, ...extra].map((p) => ({ ...p, tono: p.tono || tinta }));
    return `<g class="rotulo" data-r="${r.id}"${sw(1, 0.8)}><text x="${r.x}" y="${r.y}"${r.ancla ? ` text-anchor="${r.ancla}"` : ''} font-size="${rs.size}" fill="${rs.fill}" style="font-weight:${rs.peso};font-variation-settings:'INFM' ${rs.infm},'BNCE' ${rs.bnce}">${esc(r.texto)}</text>${bloque(piezas, 1)}</g>`;
  }).join('')}</g>`);

  // tramas de riso
  const defs = Object.entries(st.tramas || {}).map(([id, t]) =>
    `<pattern id="${id}${suf}" width="${t.paso}" height="${t.paso}" patternUnits="userSpaceOnUse" patternTransform="rotate(18)"><circle cx="${t.paso / 2}" cy="${t.paso / 2}" r="${t.r}" fill="${t.color}"/></pattern>`).join('');

  const reposo = puntoEn(esc_.linea, esc_.chispaFin);
  const c = esc_.partes.lampara.caja;
  const W = esc_.ancho, H = esc_.alto;
  return `<svg xmlns="http://www.w3.org/2000/svg" class="escena" data-estilo="${idEstilo}" data-comp="${idComp}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="t${suf} d${suf}" fill="none" stroke-linecap="round" stroke-linejoin="round">`
    + `<title id="t${suf}">El escritorio de noche</title>`
    + `<desc id="d${suf}">Un escritorio a la luz de una lámpara: un monitor con el símbolo de código, teclado, taza y notas. Haku, un gatito lynx point de ojos azules, supervisa sentado junto al teclado mientras un robotito con cabeza de foco lleva un bloque al monitor. Una sola línea recorre la escena y una chispa ámbar viaja por ella.</desc>`
    + `<style>.f1,.f2{display:none}</style>`
    + (defs ? `<defs>${defs}</defs>` : '')
    + `<g class="dibujo">${out.join('')}</g>`
    + ojos.join('')
    + `<path class="guia" data-fin="${esc_.chispaFin}" d="${fmt(esc_.linea)}"/>`
    + `<path class="estela" d="${fmt(esc_.linea)}" stroke="${color.ambar}" stroke-width="${st.chispa * 0.8}" opacity="0"/>`
    + `<g class="chispa" transform="translate(${num(reposo[0])} ${num(reposo[1])})"><circle r="${st.chispa * 2.4}" fill="${color.ambar}" opacity=".22"/><circle r="${st.chispa}" fill="${color.ambar}"/></g>`
    + `<g class="interruptor" role="button" tabindex="0" aria-label="Apagar la lámpara" aria-pressed="false" transform="${transf(lpos)}"><rect x="${num(c.x)}" y="${num(c.y)}" width="${num(c.w)}" height="${num(c.h)}" rx="8" fill="transparent"/></g>`
    + `</svg>`;
}

// ── salida ──
mkdirSync(`${aqui}lab/svg`, { recursive: true });
const plantilla = readFileSync(`${aqui}plantilla.html`, 'utf8');
const informe = [];
for (const id of Object.keys(estilos)) {
  const svgs = {};
  for (const comp of ['h', 'v']) {
    svgs[comp] = svgDe(id, comp);
    writeFileSync(`${aqui}lab/svg/${id}-${comp}.svg`, svgs[comp]);
    informe.push(`${id}-${comp}.svg ${(Buffer.byteLength(svgs[comp]) / 1024).toFixed(1)} KB`);
  }
  const html = plantilla
    .replaceAll('{{ESTILO}}', id)
    .replaceAll('{{NOMBRE_ESTILO}}', estilos[id].nombre)
    .replace('{{SVG_H}}', svgs.h)
    .replace('{{SVG_V}}', svgs.v);
  writeFileSync(`${aqui}lab/${id}.html`, html);
}
console.log(informe.join('\n'));
