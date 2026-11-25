# components/mundo/trafico — lo que cruza de orilla a orilla

`<Cruce tipo numero? />` (cliente): banda de 100vw ENTRE dos escenarios (nunca encima de texto), `aria-hidden`, sin
puntero. El alto se reserva en el HTML (`trafico.module.css`): sin JS la banda queda vacía y no hay saltos. A una pantalla
de entrar se importa el cruce (`next/dynamic` sin SSR, un trozo por tipo con sus dibujos). Un ScrollTrigger por cruce.

| tipo | qué pasa | cómo | alto (≥ 640 / < 640) | dónde |
|---|---|---|---|---|
| `carrito` (`numero="02"`) | agente empuja un carrito con letrero → | scrub | 210 / 170 px | antes de cada proyecto |
| `avion` | avión de papel con rizo, ruta punteada que se borra → | scrub | 200 / 170 px | antes de Tierra de Viajes o de «Cómo trabajo» |
| `viga` | 3 agentes cargan una viga ← (el último da un pasito de más); en celular, 1 con tabla | scrub | 170 / 150 px | antes de taller-claude o «Sobre mí» |
| `moneda` | moneda hexagonal rueda →, choca con la orilla, rebota y cae; al tocarla salta | una vez (al 80 %) | 140 / 130 px | antes del punto de venta o de contacto |
| `nubes` | dos capas de nubes ← a dos velocidades; 3 estrellas titilan una vez | scrub + una vez | 220 / 170 px | entre portada y cifras, o antes del pie |

- Scrub = de que la banda asoma abajo a que se va arriba (`clamp`: también la primera y la última de la página).
- Los agentes avanzan a saltos de un cuadro (`PASO` = 12 u): el pie apoyado no se mueve (no patina). Ciclo en
  `dibujo/piezas/trafico-agente.mjs` (camina / empuja / hombro, 4 cuadros `paso0…3`, un solo trazo con `cuadros: 1`).
- Menos movimiento (o sin `html.mueve`): cada cruce es una viñeta quieta a mitad del recorrido.
- `<Ambiente />`: UNA vez por página, fuera de `<main>` (p. ej. primer hijo del body): capa fija `z-index: -1` con la
  `.reticula-fondo` del sitio (CSS, también sin JS) y 10 marcas a mano por las orillas (6 en celular) que entran en
  ocioso: paralaje ≤ 24 px y se apartan 6–10 px del ratón (`quickTo`, solo puntero fino). Opacidad 0.4 sobre tinta
  `viva`: la marca queda ≈ #2B374F y el texto apagado (#A7A698) encima sigue en 4.85:1 (AA).
- Medidas compartidas con las piezas en `comun.ts` (las comprueba `pruebas/trafico.test.mjs`). Banco: `/laboratorio/tanda-6/`.
- Kit: `hornear()` acepta `cuadros: 1` (un solo trazo, sin hervor). Cambio mínimo y compatible (tanda 6).
