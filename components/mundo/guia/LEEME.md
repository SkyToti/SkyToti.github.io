# components/mundo/guia — Haku, el guía

Haku vive en la ventana y camina DIRECTO sobre la página, sin franja ni fondo (lo de atrás se ve hasta la orilla de
abajo). Siempre entero y a su tamaño: caja 224×168 → gato ~130 px en escritorio, 192×144 en tableta, 130×98 → ~76 px
en celular; nunca se encoge ni se esconde tras la orilla. Al sentarse busca en TODO el ancho el hueco más cercano
donde su gato no pise texto, botones, vistas ni diagramas (camina hasta él con su ciclo; corre si está a más de 500 px);
si no hay ninguno en todo el ancho, se sienta donde paró (se puede arrastrar y silenciar). Presenta cada estación
con un globo que esquiva el texto si puede; si no, se vuelve una PLACA pegada a Haku por el lado con más espacio
(`data-placa="izq|der"`) o encima de él (`"arriba"`): nunca se queda sin globo. En celular el globo lleva botón de
cerrar. El interruptor de silencio es un botón pequeño flotante en la esquina de abajo a la izquierda. Cuadros: `dibujo/piezas/haku-ciclos.mjs` → `node dibujo/generar.mjs` →
`components/dibujo/datos/haku-ciclos.json` (fuera de `index.ts`; se pide con `import()` perezoso).

- **Montarlo** (una vez, en el layout o la página): `<HakuGuia idioma="es" frases={{ portada: ["…"], … }} repuesto={["…"]} />`.
  Entra tras el `load` + `requestIdleCallback` con `next/dynamic` sin SSR; luego pide cuadros y Motion juntos.
- **Frases**: clave = `data-estacion`; se dicen en orden; al agotarse, `repuesto` (en rueda). Sin ninguna → salta.
  No deben decir nada que no esté ya en la página (los globos son decoración, con `aria-live="polite"`).
- **Estados** (`motor.ts`): `sentado` (parpadea y mueve la cola) → scroll → se levanta (`sentarse` al revés) →
  `caminar` (derecha al bajar, izquierda al subir; un cuadro = una zancada, 8–18 c/s según la velocidad del
  scroll; objetivo del 6 % al 88 % del ancho según el avance en el escenario; si el objetivo queda atrás, sale por
  una orilla y entra por la otra) → 350 ms quieto → `sentarse` → `sentado` → presenta lo pendiente: `mirar` hacia el
  `data-lado` de la estación (o al centro), `senalar` y globo. 8 s sin actividad → `lamerse` / `bostezar`.
  Estación `pie` → `dormir` (y ahí se queda). Cursor muy rápido cerca → `susto` (una vez cada 5 s).
- **Escucha**: `scroll`, `resize`, `pointermove` (en window, pasivos), `estacion:llega` (en document; lee
  `detail.nombre` y `data-lado` de la estación) y `visibilitychange` (pestaña oculta = reloj parado). Al montar
  presenta la última `[data-estacion].llego` si ya había llegado la chispa.
- **Tocar**: Haku es un `button` («Haku, el guía: toca para otro comentario»): clic/toque/Enter = otra frase o salto.
  Arrastre corto con regreso de resorte (`Tambaleo`, solo puntero fino). Escape o 6 s cierran el globo.
- **Silencio**: interruptor «Haku: guía / silencio» (`role="switch"`, `localStorage["haku-guia"]`): sin globos ni
  caminata, sentado en su esquina junto al interruptor. Menos movimiento (o sin `html.mueve`): igual de quieto,
  pero los globos sí salen (sin animación).
- **Rendimiento**: un solo `setTimeout` avanza cuadro a cuadro y se apaga si no hay nada que animar; cambiar de
  cuadro = alternar `display` entre `<g>` ya pintados (cada ciclo se agrega al DOM la primera vez que se usa).
- **Un solo Haku**: el guía se convierte en el Haku dibujado de una estación (`data-haku="propio"`) solo cuando ese
  dibujo terminó su entrada (`data-entro`, evento `dibujo:entro`) y su Haku cabe entero; red: si lleva > 1 s a la vista
  (casi entero) también, y se revisa cada 500 ms además de con el scroll.
- **Banco**: `/laboratorio/tanda-5/` · `nice -n 19 taskset -c 0-3 node dibujo/capturar-tanda5.mjs ciclos|sitio <url>`.
