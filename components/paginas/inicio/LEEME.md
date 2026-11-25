# components/paginas/inicio — escenarios a todo lo ancho

Cada caso de «Trabajo» es un archivo en `escenarios/` (slug → componente en `escenarios/index.ts`). Los que aún
usan `Lamina` se meten solos en el `.marco` centrado; un escenario nuevo usa estas piezas. Muestra: `PuntoDeVenta.tsx`.

## Piezas (`Escenario.tsx`, `Vista.tsx`, `Abanico.tsx`, `TiraDeLado.tsx`)

- `<Escenario nombre lado etiqueta [id] [alto] [ancla] [className]>`: `<section>` de orilla a orilla, `overflow: clip`
  (lo que sangra no crea barra). `nombre` → `data-estacion` (`caso-<slug>`; también es la clave de las frases de Haku).
  `lado` (`izq|der|centro`) → `data-lado`: dónde está la prueba principal (Haku la mira). `alto`: `pantalla` (≥ 100svh,
  por omisión) · `largo` (≥ 180svh) · `natural`; en < 1024 px siempre natural. Define `--relleno`
  (`clamp(20px, 4vw, 72px)`).
- `ancla={{ x, y }}`: dónde pasa la línea viva en escritorio (largos CSS relativos a la sección). Por omisión arriba a
  28 px de la orilla contraria a `lado`. En < 1024 px va sola a 12 px de la izquierda.
- `<Texto [ancho] [lado]>`: ancho de lectura ≤ 34rem y el `--relleno` a los dos lados.
- `<Sangra orilla ancho [alto] [desplaza=8vw] [en] [capa=true]>`: capa que se sale por `izq|der|arriba|abajo` o una
  esquina (`abajo-izq`…). `capa` = absoluta; `capa={false}` = en el flujo con margen negativo. Lleva `data-obstaculo`.
  En < 1024 px vuelve al flujo, dentro del relleno.
- `<Numero n>`: el número gigante (mono, `linea`, hasta 22vw) detrás de todo; sin nodo de texto, `aria-hidden`,
  `data-obstaculo` (salvo `libre`). Colócalo con `className`; que no quede detrás del resumen (solo del título).
- `<Vista medio [ancho=56vw] [inclina] [marco] [href] [prioridad] [idioma]>`: la prueba en GRANDE (≥ 50vw en escritorio;
  100 % menos el relleno en celular). `inclina` −4…4 (máx. 2 en celular) se endereza con resorte al pasar o enfocar.
  Imagen: `<img>` con width/height, perezosa salvo `prioridad`. Video: póster en el HTML, `src` al acercarse (nunca se
  cambia ni se quita), se reproduce solo y mudo con ≥ 50 % a la vista y se pausa al salir sin vaciarse; al primer
  `play()` pasa a `preload="auto"` para que Chrome no corte la descarga al pausar (net::ERR_ABORTED); con menos
  movimiento o ahorro de datos, botón «Reproducir».
  Lleva `data-obstaculo`. Reserva exacta (CLS 0).
- `<Abanico etiqueta [abre] [giro]>` con 2–4 `<Vista href>` dentro: la que se señala/toca/enfoca pasa al frente;
  flechas ← → las recorren; en < 1024 px es carrusel con el dedo.
- `<TiraDeLado etiqueta [cuadro=22vw]>`: fila que pasa de lado con el scroll (escritorio, solo con `html.mueve`);
  si no, carrusel. Recorta lo que se sale: la línea puede pasar junto a ella.

## La línea viva en un escenario ancho

- En escritorio se llega al ancla de un `[data-estacion][data-lado]` (y se sale de ella) por una ruta que esquiva
  (`rutear` en `components/mundo/geometria.ts`): nunca pisa texto, medios ni `[data-obstaculo]`, y puede cruzar la
  ventana de lado a lado por los huecos entre secciones.
- Deja SIEMPRE un paso libre de ≥ 44 px entre lo duro: una orilla, un hueco entre capturas o un `<span data-pasillo
  aria-hidden>` vacío (zona por donde la línea prefiere pasar; abre los `[data-obstaculo]` que toque, nunca texto ni
  medios). Una fila de capturas o de botones que cruce TODA la ventana necesita un hueco (La Isla: 6vw entre la
  primera captura y la segunda).
- **Dibujos que van de pared a pared: `data-linea="detras"`.** Un dibujo decorativo (mesa, repisa, banda del tráfico)
  puede llegar a las dos orillas sin dejar carril: márcalo con `data-linea="detras"` (junto a su `data-obstaculo`, si
  lo trae). La línea lo cruza por detrás y al 35 %; la chispa se sigue viendo encima. Siguen siendo duros: el texto,
  las `Vista` (capturas y videos), los botones y los diagramas. Detalle en `components/mundo/LEEME.md`.
- Un tramo fijado (pin) se rodea por la orilla: deja 40 px libres a cada lado (la línea pasa por ahí).
- Marca `data-obstaculo` en todo dibujo o caja que la línea no deba cruzar (los inventos ya lo traen); si puede
  cruzarlo por detrás, añade `data-linea="detras"`.

## Reglas

- Estilos en un `*.module.css` junto a cada escenario; NADA nuevo en `app/globals.css`.
- Textos de interfaz nuevos en `textos.ts` de esta carpeta (los dos idiomas), no en `lib/textos.ts`. Nada de texto
  inventado: todo sale de `contenido/`.
- Cada escenario toca solo su archivo (y su `.module.css`). Un `h3` por caso; botón «Ver el caso» con el título en
  `sr-only`. Estados ocultos solo bajo `html.mueve`; `useGSAP` con `scope`; `motion/react` solo perezoso.

## Lista de comprobación

1. `npm run check; echo $?` → 0.
2. `npm run build && npx --yes serve@14 out -l <puerto>`; luego `node scripts/linea.mjs / /en/ --base …` en verde
   (390, 834, 1440: 0 choques, sin «sin ruta», pasillos vacíos) y `node scripts/nada-oculto.mjs / /en/ --base …`.
3. Capturas Playwright de tu escenario en 1440×900, 834×1194 y 390×844 (reposo, vista enfocada, `reducedMotion`),
   abiertas una por una: la vista ≥ 50 % del ancho en 1440, nada tapa el texto, sin barra horizontal.
4. Lighthouse en celular (`--form-factor=mobile`): cuatro ≥ 95, CLS < 0.02, 0 errores de consola.
