# dibujo/ · kit de ilustración a mano

## El kit (estilo elegido el 24-nov-2026: «Riso con mano de marcador»)
```sh
cd dibujo && npm ci                                   # solo roughjs (se usa al GENERAR, no en el navegador)
node dibujo/generar.mjs                               # → components/dibujo/datos/<nombre>.json + index.ts (van en git)
nice -n 19 taskset -c 0-3 node dibujo/capturar-kit.mjs lab                    # lab/personajes.html, lab/escritorio.html
nice -n 19 taskset -c 0-3 node dibujo/capturar-kit.mjs sitio http://127.0.0.1:3210   # banco /laboratorio/dibujo/
```
- `kit/formas.mjs` geometría limpia (L, PL, PG, R, RR, E, P, T, `tubo` para patas y colas, `colocar`).
- `kit/estilo.mjs` el estilo: línea `ext` 3.25 · `int` 2.25 · `fino` 1.5; rellenos planos desfasados por `rol`;
  tramas (`trama`) SOLO en luz y sombra.
- `kit/hornear.mjs` geometría → SVG con 3 cuadros de hervor (semillas 11, 47, 83; determinista).
- `piezas/` una ilustración = geometría con grupos (`data-g`, orden de entrada), anclas (`data-anim` + pivote
  `data-o`: ojoIzq, pupilaDer, oreja, cola, agente, luz…) y gestos por nombre. `haku.mjs` (6 poses),
  `agente.mjs` (5 poses), `escritorio.mjs` (portada h 900×640 y v 360×440).
- En React: `<Dibujo nombre vivo? controles? titulo?>` (servidor) y `<DibujoVivo>` (cliente, GSAP);
  `<EscritorioDeNoche>` y `<HojaDePersonajes>` listos para montarse.

## Contrato (tanda 3; todo opcional y compatible con los datos de antes)
- **Registro solo**: una pieza que exporte `ilustraciones()` → `[{ nombre, grupos, vb?, tope?, … }]` entra sola a
  `generar.mjs`. Ayudas en `kit/componer.mjs` (`prefijar`, `soloAnim`, `caja`, `hueco`). Grupo con `opacidad: 0`
  = en reposo oculto (solo un gesto lo muestra). Texto con `giro` y `largo` (ancho fijo, para sellos).
- **Ids por instancia**: `<Dibujo>` prefija los `id` (tramas) con `useId`: el mismo dibujo se pinta N veces.
- **Despertar**: `<DibujoVivo>` busca el `[data-estacion]` más cercano y arranca con su evento `estacion:llega` (o si
  ya tiene la clase `llego`); sin estación, o a los 1.2 s a la vista (≥ 50 %) sin chispa, arranca solo. Avisa con
  `dibujo:desperto` (burbujea). Prop `retraso` (s) para escalonar varios dibujos de una estación.
- **Gestos nuevos**: `escala`; en todos `desde` (estado al empezar), `ease` y `grupos` (mueve data-g enteros);
  `secuencia`: `{ tipo: 'secuencia', pasos: [{ gesto, espera }] }` (cada paso empieza `espera` s después de que
  termina el anterior; negativo = se encima).
- **Tocar**: `alTocar: [{ zona, gesto | [gestos], etiqueta?, accesible? }]` corre al clic o toque (en táctil gana a
  `alPasar`) y avisa `dibujo:toca` ({ zona }). Solo con `accesible: true` la zona es `role="button"`, entra al Tab y
  responde a Enter/Espacio (y el SVG pasa de `aria-hidden` a `role="group"`); `etiquetas` en `<Dibujo>` traduce.
  Desde fuera: `dibujo:gesto` ({ gesto }) sobre el SVG o su contenedor. Con menos movimiento, último cuadro.
- **Tambaleo** (`components/dibujo/Tambaleo.tsx`, Motion): resorte al pasar/tocar, `sacude` (contador) desde
  fuera, arrastre corto con `dragSnapToOrigin` (solo puntero fino), `cae` con rebote; `useReducedMotion` lo deja
  quieto. Se usa SIEMPRE por `<TambaleoPerezoso>` (Motion en un trozo aparte; `precargarTambaleo()`).
- Estaciones en `components/mundo/estaciones/`: `Repisa` ({ idioma, datos }), `Buzon` (escucha `correo:copiado` en
  document), `PieHaku`, `Sello`, `Monograma` ({ href, etiqueta }). Banco: `/laboratorio/tanda-3/`;
  `node dibujo/capturar-tanda3.mjs <url>` + `python3 dibujo/armar-tira.py`; `node dibujo/revisar.mjs <carpeta>`.

## El laboratorio de los tres estilos (histórico)

Tres cuadros de estilo de «El escritorio de noche» (Haku, el agente-foco, la lámpara y la línea con
la chispa). Laboratorio aparte: no toca `app/`, `components/` ni el `package.json` del sitio.

## Regenerar
```sh
cd dibujo && npm ci                 # solo roughjs
node generar-estilos.mjs                  # escribe lab/svg/{a,b,c}-{h,v}.svg y lab/{a,b,c}.html
python3 -m http.server 3417 --bind 127.0.0.1 -d lab   # (anota el PID y ciérralo con kill)
nice -n 19 taskset -c 0-3 node capturar.mjs http://127.0.0.1:3417   # capturas/
nice -n 19 taskset -c 0-3 node probar.mjs   http://127.0.0.1:3417   # 27 pruebas de comportamiento
```
`?t=2.5` congela la entrada en ese segundo; `?t=fin` la deja en su estado final.

## Cómo se define una pieza (`escena.mjs`)
Geometría limpia, sin estilo: `L(a, b)`, `PL(pts)`, `PG(pts)`, `R(x, y, w, h)`, `E(c, rx, ry)`, `P(d)`,
más `{ sub, nombre, tono, rol, capa, entra, detalle, fino }`. Cada parte (gato, monitor…) vive en
coordenadas locales con el origen donde toca la mesa; la composición (`h` 820×560, `v` 350×420) solo
la coloca con `[x, y, escala]`, por eso la vertical es otra colocación y no un escalado.
`pivotes` marca de dónde gira algo (cola, oreja, ojos). `estilos.mjs` decide grosor, temblor y qué
relleno toca a cada `rol`; `generar.mjs` pasa cada pieza por `rough.generator()` con 3 semillas fijas
(`.f0 .f1 .f2` = la línea que hierve) y une los tramos contiguos para que DrawSVG trace de corrido.
Una ilustración nueva = un archivo de geometría + reutilizar estilos, generador y `escena.js`.

## Lo que hace la animación (`lab/escena.js`, igual en los tres)
Línea → escritorio → monitor → lámpara (enciende con parpadeo de dos cuadros) → gato (parpadea y
mueve la cola) → agente (tres pasitos) → rótulos → la chispa recorre la línea. Entrada de 6 s; hierve
a 8 cuadros/s solo esos 6 s y mientras el cursor está encima. Ojos que siguen al cursor, oreja al
pasar por Haku, clic o Enter en la lámpara la apaga (quedan los ojos y la chispa). Menos movimiento:
todo dibujado y quieto. Rótulos en Shantell Sans (woff2 latin en `lab/vendor/`).

## Recomendación: C · Risografía (B de segunda)
- **C** es la que más se ve *de autor*: los bloques corridos y la trama hacen que Haku se lea crema
  (lynx point de verdad) y le dan un sello que escala a 15 ilustraciones sin perder la noche azul.
  Ojo: usa más tinta que el resto del sitio; limitar el cielo a pantalla, taza y ojos.
- **B** es la más legible en el celular y la pariente directa de YaContesto, pero a 820 px la cara del
  gato se empasta (el marcador se come los ojos y la boca); pide ilustraciones más grandes.
- **A** es elegante pero vuelve al «por encimita»: línea fina sobre noche se lee tenue y técnica.
