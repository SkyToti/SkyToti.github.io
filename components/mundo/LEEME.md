# components/mundo — la línea viva

Un solo trazo (`LineaViva.tsx`) recorre el inicio y lleva una chispa ámbar; `geometria.ts` lo calcula.
Entra con `next/dynamic` sin SSR (`Mundo.tsx`) como primer hijo de `<main class="relative isolate">`.

## Contrato con las estaciones (lo que usan las ilustraciones)

- Estación: cualquier elemento con `data-estacion="<nombre>"`. En el inicio: `portada`, `cifras`,
  `caso-<slug>` (una por lámina), `como-trabajo`, `tambien`, `sobre-mi`, `contacto`, `pie`.
- Dentro, uno o más `<span data-ancla>` vacíos de 1×1 que el CSS coloca (`app/globals.css`, bloque
  «La línea viva»). La línea pasa por todos, en el orden del documento. En escritorio `--carril` (px a la
  izquierda del ancla por donde baja la línea) y `--forma` (`bulto`, `esquina`, `paso`, `fin`) dicen cómo.
- Cuando la chispa pasa por la PRIMERA ancla de una estación (por avance del trazo), una sola vez:
  - la estación recibe la clase `llego` (nunca se quita);
  - se despacha `estacion:llega` desde la estación, con `bubbles: true` y
    `detail: { nombre: string, quieto: boolean }`.
- Escucharlo: `el.addEventListener("estacion:llega", fn)` en la estación o en un ancestro. Si la ilustración
  se monta tarde, revisa antes `el.classList.contains("llego")`: el evento no se repite.
- `quieto: true` = menos movimiento (o sin `html.mueve`): todas llegan al montar; muestra el último cuadro.
- Con la clase, el CSS ya enciende el número de la lámina (`.lamina-numero` → ámbar) y la línea traza un aro
  ámbar alrededor de cada ancla.

## Escenarios a todo lo ancho (components/paginas/inicio/LEEME.md)

- Una estación con `data-lado` (la pone `<Escenario>`) es ancha: en escritorio la línea llega a su ancla y sale de ella
  por `rutear` (A* en rejilla de 12 px): no pisa lo duro (texto, img/video/svg/canvas visibles, recortados por su
  overflow) ni lo blando (`[data-obstaculo]`, `.pin-spacer` salvo 40 px en cada orilla de la ventana; todo tramo que lo cruce va por ruta); prefiere `[data-pasillo]`.
- Si no hay paso, llega por carril y el SVG lleva `data-sin-ruta="<estación>"`: `scripts/linea.mjs` lo marca como falla.

## Dibujos «detrás» (`data-linea="detras"`)

- Un dibujo decorativo ancho (una mesa, una repisa, una banda del tráfico) se declara blando con `data-linea="detras"`
  en su caja: la línea PUEDE cruzarlo. En el A* cuesta un poco más que lo vacío (`COSTE_DETRAS`), así que solo lo
  cruza si le ahorra camino o si no hay otro paso.
- Donde lo cruza, el trazo va por detrás (el SVG del trazo está en `z-index: -1`) y atenuado al 35 % (una `<mask>` con
  la caja de cada zona). La chispa y su estela van en otra capa, ENCIMA del contenido (`svg[data-linea-frente]`,
  `z-index: 1`): se siguen viendo al pasar por detrás.
- Siguen siendo duros aunque estén dentro: el texto, los botones (un agente de la mesa, un objeto de la repisa) y una
  `Vista` (manda el marcador más cercano entre `[data-linea]` y `[data-vista]`). Los diagramas no van en zonas «detrás».
  El texto transparente de una zona «detrás» (opacidad 0: la etiqueta de un agente que aún no se enseña) no cuenta;
  no uses `visibility: hidden` para eso: quita el nombre accesible del botón.
- Volver a medir (ResizeObserver) espera 150 ms sin cambios y luego un rato libre (`requestIdleCallback`, ≤ 700 ms):
  el A* no cae a media bajada. El A* usa heurística de 1 por celda (explora mucho menos; nada bloqueado se pisa).
- Deja entre botones vecinos un paso de ≥ 60 px en escritorio si la fila cruza toda la ventana (la línea guarda 14 px
  con lo duro).
- `scripts/linea.mjs` acepta los cruces sobre zonas «detrás», sigue fallando ante cualquier cruce sobre lo duro, cuenta
  los puntos que pasan por detrás y falla si los hay y el trazo no lleva la máscara.

## Caché de rutas

- Cada tramo ruteado se guarda por su forma vista desde su banda (anclas y cajas relativas a la y de arriba de la
  banda): si algo de más arriba cambia de alto (la tira al fijarse, un invento al montarse), los tramos que solo se
  corren en vertical se reutilizan sin volver a correr el A*. Solo se rehacen los que de verdad cambiaron.

## Reglas

- No pongas texto ni medios donde corre la línea: márgenes, canalones y huecos entre láminas.
  `scripts/linea.mjs` falla si el trazo pasa a < 6 px de un texto, un medio o un botón (salvo los medios de una zona
  «detrás»).
- La línea se vuelve a medir sola (ResizeObserver de `<main>`, del pie y de la caja de cada ancla). Si una
  ilustración cambia el alto de su estación, no hace falta avisar.
- Sin JavaScript no hay línea. Solo se anima `stroke-dashoffset`/`dasharray`, `transform` y `opacity`.

## Inventos y tira (perezosos)

- `inventos/<Invento>.tsx` (los diez): API `{ idioma, foto? }`. Todos pasan por `InventoPerezoso.tsx`: en el HTML va
  un marcador (la portada como `<img>` 16:10, o un recuadro) en un hueco con la proporción del lienzo (640×420,
  `inventos/registro.ts`); a menos de una pantalla se importa el dibujo (un trozo por dibujo e idioma) y la base
  `inventos/Invento.tsx` lo pinta. Mapa caso → invento: `INVENTO_DE_CASO` en el registro.
- La tira (`tira/`) carga igual sus cuatro dibujos al acercarse; el pin se crea al llegar, reordena los ScrollTrigger y
  refresca; la línea se vuelve a medir sola por el cambio de alto de `<main>`.
- Un invento montado en el inicio va DENTRO del `data-estacion` de su lámina: DibujoVivo despierta con la chispa.
