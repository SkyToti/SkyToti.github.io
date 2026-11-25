// Guion en línea del <head>: corre antes del primer pintado.
// - `js`: hay JavaScript (el CSS puede esconder lo que luego se revela).
// - `mueve`: además, se permite movimiento. Sin `mueve` todo se ve quieto y completo: con
//   prefers-reduced-motion, sin JavaScript, o si en 10 s no arrancó el movimiento (components/movimiento/Suave.tsx
//   pone window.__movimientoListo).
export const GUION_ARRANQUE = `(function(){var d=document.documentElement;d.classList.add('js');try{if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;d.classList.add('mueve');setTimeout(function(){if(!window.__movimientoListo)d.classList.remove('mueve')},10000)}catch(e){d.classList.remove('mueve')}})();`;

// La letra de los rótulos (Shantell Sans, 101 KB): solo la usan los dibujos, el tráfico y los globos, nunca el texto
// principal. Declarada en el CSS, el navegador la pedía con prioridad máxima en el primer pintado y competía con el
// documento y las letras del texto (FCP y LCP en celular). Ahora se declara aquí, tras `load` (fuera de la carga
// inicial); mientras tanto los rótulos usan su letra de respaldo, igual que con font-display: swap. Sin JavaScript,
// la misma @font-face va en un <noscript> del <head> (RaizHtml). Los pesos y ejes: components/dibujo/dibujo.module.css.
export const LETRA_ROTULOS = "/fuentes/shantell-sans-latin.woff2";
export const CARA_ROTULOS = `@font-face{font-family:"Shantell Sans";src:url("${LETRA_ROTULOS}") format("woff2");font-weight:300 800;font-display:swap}`;
export const GUION_ROTULOS = `(function(){function f(){try{var c=new FontFace("Shantell Sans","url(${LETRA_ROTULOS}) format('woff2')",{weight:"300 800",display:"swap"});document.fonts.add(c);c.load().catch(function(){})}catch(e){}}if(document.readyState==="complete")f();else addEventListener("load",f,{once:true})})();`;
