# Encargo común — rehacer el inicio «a todo lo ancho»

> Lo leen los agentes que rehacen escenarios. Cada uno recibe además SU lista de archivos.

## Por qué
Diego (dueño del portafolio) vio el sitio con los dibujos montados y dijo: «las previews quedaron pequeñas…
estás desaprovechando toda la página, encerrándote en un solo marco del medio… quiero animaciones por
todos lados… los motion designers no hacen un solo recorrido hacia abajo, usan toda la página… aún no lo
veo como un diseño profesional de un motion designer». Antes ya había aprobado el estilo de dibujo y a los
personajes («me encanta»). Tu trabajo debe notarse a simple vista: más grande, más compuesto, más vivo.

## Lee primero (completo)
1. `MUNDO.md`: sobre todo «Versión 2 — A todo lo ancho, con Haku de guía» y la tabla «Los escenarios, uno
   por uno (composición)». TU fila de esa tabla es el encargo de composición.
2. `components/paginas/inicio/LEEME.md`: el contrato de `Escenario`, `Texto`, `Sangra`, `Numero`, `Vista`,
   `Abanico`, `TiraDeLado`; anclas, lados, pasillos y obstáculos de la línea viva; la lista de comprobación.
3. `components/paginas/inicio/escenarios/PuntoDeVenta.tsx` y su `.module.css`: es el PATRÓN ya hecho.
4. `DIRECCION.md` §2 (color y letra), §5 (movimiento) y §7 (calidad).
5. Lo que vayas a usar: `components/mundo/inventos/` (los inventos; se cargan con `InventoPerezoso`),
   `components/mundo/estaciones/` (repisa, buzón, pie, sello, monograma), `components/mundo/tira/`,
   `components/mundo/trafico/LEEME.md` (cruces y ambiente), `components/mundo/guia/LEEME.md` (Haku guía),
   `components/dibujo/` (kit: `Dibujo`, `DibujoVivo`, `Tambaleo`), `components/Escena.tsx` (diagramas).

## Reglas de convivencia (varios agentes a la vez, cada uno en su worktree)
- Tocas SOLO los archivos de tu lista. Estilos en un `*.module.css` junto a tu componente: NADA nuevo en
  `app/globals.css`. Textos de interfaz nuevos (es/en) en `components/paginas/inicio/textos.ts` SOLO si tu
  lista lo incluye; si no, en un `textos.ts` local junto a tu archivo.
- NO toques: `components/dibujo/`, `dibujo/`, `components/plano/`, `escenas/`, `components/mundo/LineaViva.tsx`,
  `components/mundo/geometria.ts`, `components/mundo/guia/`, `components/mundo/trafico/`, `lib/`, `contenido/`,
  `demos/`, `public/demo/`, `package.json`, ni las piezas comunes `Escenario.tsx` / `Vista.tsx` (si les falta
  algo, resuélvelo en tu archivo y anótalo en «NO VERIFICADO»).
- Los inventos ya NO llevan la foto pegada con cinta: la prueba real va en una `Vista` grande.

## Vara
- En 1440 px la prueba real principal mide ≥ 50 % del ancho de la ventana; algo del dibujo se sale por
  una orilla; hay número gigante detrás; nada repite la composición de otro escenario.
- Algo se mueve al llegar la chispa, algo responde al cursor o al toque, y algo se puede tocar con teclado.
- El texto del caso (título, resumen, píldoras, «Ver el caso») se lee sin esperar animaciones y con AA.
- Celular (390 px): apilado a todo el ancho, vista al 100 %, sin barra horizontal, sin inclinaciones > 2°.
- `prefers-reduced-motion`: todo visible y quieto. Sin JavaScript: texto, imágenes y enlaces presentes.
- Ningún teléfono; nada de texto inventado (todo sale de `contenido/` o de textos de interfaz); un solo h1
  en la página; sin sombras ni degradados de color; sin dependencias nuevas; `useGSAP` con `scope`;
  `motion/react` solo cargado de forma perezosa; solo `transform`, `opacity`, `stroke-dashoffset`, `display`.

## Verificar (sin esto no está hecho)
- `npm run check; echo $?` → 0.
- `npm run build` y sirve `out/` en TU puerto (`npx --yes serve@14 out -l <puerto>`; guarda el PID; `kill <pid>`;
  nunca `pkill -f` / `pgrep -f`; no toques los puertos 3210 ni 3211).
- `node scripts/linea.mjs / /en/ --base http://localhost:<puerto>` en verde (0 choques).
- `node scripts/nada-oculto.mjs / /en/ --base http://localhost:<puerto>` en verde.
- 0 errores y 0 avisos de consola en `/` y `/en/`.
- Capturas con Playwright (`nice -n 19 taskset -c 0-3`) de TUS escenarios en 1440×900, 834×1194 y 390×844: en
  reposo, a media animación, con cursor encima y con `reducedMotion`. ÁBRELAS con Read una por una y corrige
  (máximo 4 rondas): tamaños reales contra la vara, texto tapado, cortes feos, huecos muertos, barra horizontal.
- No midas Lighthouse: otro agente está arreglando el rendimiento de carga.

## Entrega
Commits en tu rama, mensajes en español terminados con `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`,
sin push. Informe alrededor de las 110 llamadas a herramientas aunque falte algo, en el formato de contrato
(ESTADO, RESUMEN, RUTAS con las capturas, GIT con rama y hashes leídos de `git log`, PRUEBAS, NO VERIFICADO,
SIGUIENTE), diciendo sin maquillar qué escenario quedó más flojo.
