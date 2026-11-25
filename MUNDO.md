# MUNDO — «Una sola línea»

> Guion de la capa creativa del portafolio (24-nov-2026). Nace de la corrección de Diego tras ver
> la primera versión: «lo único que veo animado son letras y un scroll bonito; no es un portafolio
> de motion designer». Esta capa va ENCIMA de lo ya construido (textos, casos, diagramas,
> rendimiento); no lo sustituye. El estilo de dibujo se elige en `dibujo/` (tinta fina, marcador
> o risografía); este guion vale para cualquiera de los tres.

## La idea

**Un solo trazo dibuja todo el portafolio, y quien lo visita es la chispa que lo recorre.**

- La línea sale del subrayado del nombre, se vuelve el escritorio de Diego, baja serpenteando entre
  sus proyectos, y termina en un sobre.
- La **chispa** es un punto ámbar que avanza por la línea con el scroll. Donde llega, las cosas se
  dibujan, se encienden y hacen algo.
- **Haku**, el gato de Diego, es el personaje: aparece en la portada, se cuela en varias estaciones
  y cierra el sitio dormido.
- Los **agentes** son robotitos con cabeza de foco. Son los que cargan, arman y martillan. Dibujan
  «dirijo agentes de IA» sin escribirlo.
- Cada proyecto es un **invento**: un objeto dibujado que se arma al llegar la chispa, tiene una
  broma de movimiento, y se puede tocar.

Regla que no se rompe: el nombre, el rol, los botones y el texto de cada caso se leen sin esperar a
ningún dibujo. El mundo acompaña; nunca tapa ni retrasa.

## Las tres capas de movimiento

| Capa | Con qué | Para qué |
|---|---|---|
| **Trazo** | GSAP: DrawSVG, MotionPath, ScrollTrigger | la línea que se dibuja con el scroll, la chispa que viaja, las piezas que se trazan |
| **Vida** | cuadros alternos (línea que hierve, 8 por segundo) + bucles cortos | que lo dibujado respire como animación tradicional; se detiene solo |
| **Tacto** | Motion (`motion/react`): resortes, arrastre, `layout`, `AnimatePresence` | lo que responde a la mano: orejas, cajones, objetos de la repisa, y la lámina que se transforma en la página del caso |

## Las estaciones (inicio)

| # | Estación | Qué se dibuja | La broma de movimiento | Se puede tocar |
|---|---|---|---|---|
| 0 | **Cabecera** | el monograma «DB» hecho con la misma línea; una mini línea con chispa como avance de lectura | el monograma se vuelve a trazar al pasar el cursor | — |
| 1 | **El escritorio** (portada) | escritorio, monitor con `</>`, lámpara, taza, Haku sentado, un agente cargando un bloque | la lámpara se enciende con un parpadeo; Haku parpadea y mueve la cola; el agente da tres pasitos | Haku sigue el cursor con los ojos y mueve una oreja; clic en la lámpara apaga la luz y quedan los ojos y la chispa |
| 2 | **La pizarra** (cifras) | un corchete a mano bajo cada cifra y un sello «medido» | el agente estampa el sello al terminar de contar | — |
| 3 | **Los inventos** (trabajo) | nueve inventos, uno por caso (abajo) | cada uno la suya | clic: el invento vuela a la cabecera de su caso (transición compartida) |
| 4 | **La tira** (cómo trabajo) | cuatro viñetas: la mano que boceta · los agentes que reciben piezas · la máquina de sellos «PRUEBAS» · el avión de papel que despega | una pieza falla la prueba, rebota, la arreglan y pasa | en escritorio la tira avanza con el scroll; en celular, viñetas apiladas |
| 5 | **El cuaderno** (también) | un cuaderno con cinta | las hojas se levantan con una corriente de aire | arrastrar la esquina pasa la hoja |
| 6 | **La repisa** (sobre mí) | una repisa con objetos: un libro (diez años vendiendo), un cuaderno de clase (dos carreras), una taza (trabaja de noche), un pin de mapa (Cuernavaca, remoto), un diccionario (español e inglés), el plato de Haku | cada objeto se tambalea con resorte y suelta su dato; Haku salta a la repisa | cada objeto |
| 7 | **El buzón** (contacto) | la línea termina en un sobre; un buzón con su banderita | Haku empuja el sobre desde la orilla de la mesa, cae al buzón y sube la banderita | «Escríbeme»; al copiar el correo, el sobre se cierra con un sello «copiado» |
| 8 | **Pie** | Haku hecho rosca sobre el final de la línea | «zzz» que hierve | «apagar la luz» regresa arriba |

### Los nueve inventos

| Caso | Invento | Qué pasa cuando llega la chispa |
|---|---|---|
| Recepcionista con IA | **El conmutador de noche**: un teléfono sonando bajo una luna, un agente con diadema frente a un tablero de clavijas | el teléfono tiembla, el agente conecta una clavija, salta un globo «¡listo!» |
| CRM dental | **La muela-mapa**: la muela con sus puntos (su propio diseño) dentro de una tableta que sostiene un agente | los puntos se encienden uno por uno; píldora «demo interactiva» |
| yacontesto.com | **El folioscopio**: un bloc de hojas que al pasar muestran la historia dibujada | las hojas pasan con el scroll |
| minecraft-rcon-mcp | **La bóveda con ventanilla**: puerta de caja fuerte, una máquina de turnos (el folio) y un agente en fila con su tarjeta | un comando rebota con tache rojo; una mano sella «aprobado» y la puerta gira |
| taller-claude | **La mesa de los seis**: seis agentes con sombreros de tres tamaños (gorra, sombrero, chistera) y una batuta | la batuta da un golpe y martillan en escala |
| La Elegía | **La torre**: la torre de cien pisos entre nubes, el castillo arriba y el sol de Aurelion detrás | la torre crece piso a piso con el scroll y el castillo aparece de un salto |
| La Isla | **La isla flotante**: una isla-barra con ventanitas | la isla cambia de forma: reproductor, lanzador, control |
| Tierra de Viajes | **El avión de papel**: la propia línea se vuelve ruta punteada hasta una maleta con pase de abordar | el avión cruza la sección entera |
| Punto de venta | **La colmena-caja**: una caja registradora con forma de colmena y una abeja con lentes leyendo | el cajón se abre con una moneda hexagonal |

## La línea y la chispa (ingeniería)

- La línea es UN `<path>` en un SVG que mide el alto de la página. Se calcula en el navegador con
  las posiciones reales de las anclas `[data-estacion]` (curva suave por los puntos), y se vuelve a
  calcular al cambiar el tamaño. En celular baja pegada al margen izquierdo y hace un rizo hacia
  cada estación.
- Se dibuja con el scroll (DrawSVG + `scrub`), siempre un poco detrás de la chispa.
- La chispa va en posición fija y sigue el `<path>` (MotionPath con el mismo progreso).
- Cada estación escucha «llegó la chispa» una sola vez y corre su animación.
- Solo `transform`, `opacity`, `stroke-dashoffset` y `display`. Sin filtros. Nada pinta fuera de
  pantalla. Lo que hierve se detiene a los 6 s o al salir de vista.
- Con `prefers-reduced-motion`: la línea ya dibujada, todo en su estado final, sin hervor, sin
  viaje; las bromas se ven en su último cuadro.
- Las ilustraciones son decorativas (`aria-hidden`): todo lo que dicen ya está escrito al lado.
- Presupuesto: Lighthouse en celular ≥ 95 con todo puesto. Los dibujos de cada estación entran al
  acercarse (import dinámico), no en la carga inicial.

## Página de caso

Arriba, el invento del caso en grande y vivo (llega volando desde la lámina del inicio). Después,
lo que ya existe: ficha, «Cómo funciona» con su diagrama, la prueba, «Se ve así», mi papel.

## Producción (cuando Diego elija estilo)

1. **Kit de dibujo**: del laboratorio `dibujo/` a `components/dibujo/`: geometría limpia →
   trazo a mano con semilla → tres cuadros; `<Dibujo>`, `useHierve`, `useTrazo`.
2. **Hojas de personaje**: Haku en seis poses (sentado, mirando, saltando, empujando, de pie,
   dormido) y el agente en cinco (parado, caminando, cargando, martillando, con diadema).
3. **La línea y la chispa** sobre el inicio actual.
4. **Estaciones**, en tandas de tres en paralelo: portada y pizarra · inventos 1–5 · inventos 6–9 ·
   tira, cuaderno, repisa, buzón y pie.
5. **Tacto**: Motion en lámina → caso, repisa, buzón.
6. Cada ilustración se revisa a tamaño completo antes de entrar: anatomía del gato, que nada flote
   ni se cruce, que se lea en 390 px.

Después del portafolio: el rediseño completo y funcional del punto de venta, con este mismo
lenguaje, como demo dentro del sitio.

---

# Versión 2 — A todo lo ancho, con Haku de guía

> Corrección de Diego (24-nov-2026) al ver los inventos montados: «las previews quedaron pequeñas…
> estás desaprovechando toda la página, encerrándote en un solo marco del medio… quiero animaciones
> por todos lados, que ande Haku caminando, que te enseñe el portafolio… los motion designers no
> hacen un solo recorrido hacia abajo, usan toda la página». Esta versión MANDA sobre la retícula de
> `DIRECCION.md` §3 y sobre «Las estaciones» de arriba en todo lo que sea composición.

## Reglas de puesta en escena

1. **Se acabó la columna.** El inicio ya no vive en un contenedor de 1320 px. Cada bloque es un
   **escenario** que ocupa todo el ancho de la ventana (100vw) y casi todo el alto (≥ 92svh en
   escritorio). El texto sí tiene ancho de lectura (≤ 34rem), pero se coloca DENTRO del escenario,
   no al revés.
2. **Las pruebas reales, grandes.** La captura o el video de cada proyecto mide al menos el 50 % del
   ancho de la ventana en escritorio (y todo el ancho en celular). Nada de miniaturas pegadas con
   cinta: el invento acompaña a la preview, no la sustituye ni la achica.
3. **Se sangra.** Los dibujos pueden salirse por las orillas (una torre que no cabe, una mesa que
   sigue fuera de cuadro). Lo cortado por el borde se ve más grande que lo que cabe.
4. **Cada escenario se compone distinto.** Prohibido repetir «texto a un lado, imagen al otro» nueve
   veces. Hay composiciones horizontales, diagonales, apiladas, con el título gigante detrás, con la
   preview inclinada, con el invento en primer plano tapando una esquina.
5. **El movimiento va en todas direcciones.** Además de bajar: tramos que avanzan de lado, cosas que
   cruzan la pantalla de orilla a orilla, acercamientos, capas a distinta velocidad.
6. **Todo responde.** No hay dibujo que no reaccione al cursor o al toque.
7. **La regla de siempre sigue:** nombre, rol, botones y el texto de cada caso se leen sin esperar a
   nada, y el sitio no baja de 95 en Lighthouse en celular.

## Haku, el guía

Haku deja de ser un adorno de la portada y se vuelve quien te enseña el portafolio.

- **Vive en la ventana, no en la página.** Camina por un «piso» en la parte baja de la pantalla
  (posición fija). Cuando haces scroll, camina (ciclo de caminata dibujado cuadro a cuadro, hacia
  donde va el scroll); cuando paras, se sienta; si no haces nada un rato, se lame una pata o bosteza;
  al final, se duerme.
- **Presenta.** En cada escenario camina hasta su marca, se sienta, mira hacia la preview y suelta
  un globo corto en primera persona. Un clic o toque en Haku: otro comentario, o un salto.
- **Reacciona.** Te sigue con la mirada, se asusta si mueves el cursor muy rápido cerca de él, y se
  deja arrastrar un poco (regresa con resorte).
- **Se puede callar.** Un botón pequeño «Haku: guía / silencio» (se recuerda en el navegador). Con
  menos movimiento: Haku sentado en su esquina, con los globos como texto fijo, sin caminar.
- **Es decoración accesible:** sus globos no llevan información que no esté ya escrita en la página.
- Sus frases viven en `contenido/guia.es.md` y `guia.en.md` (una por escenario, más dos de repuesto).

## El tráfico

Entre escenarios pasan cosas de orilla a orilla, disparadas por el scroll y solo una vez:
un agente empujando un carrito con el número del siguiente proyecto, el avión de papel cruzando
todo el ancho, nubes a dos velocidades, una fila de tres agentes cargando una viga, la moneda
hexagonal rodando. Nunca tapan texto.

## Los actos

| Acto | Composición a todo lo ancho |
|---|---|
| **Portada** | El escritorio ocupa toda la base de la ventana, de orilla a orilla; el nombre arriba a la izquierda, enorme; una ventana con luna a la derecha; la repisa cruza el fondo. Al primer scroll, Haku salta del escritorio al piso y empieza a guiar. |
| **Cifras** | Una banda de orilla a orilla con las cifras en grande; un agente estampa cada una al pasar. |
| **Trabajo** | Nueve escenarios, uno por pantalla, cada uno con su composición. Los tres de YaContesto forman un tramo horizontal (se avanza de lado). La Elegía es un tramo alto: la torre mide pantalla y media y se sube por ella. |
| **Cómo trabajo** | La tira a todo lo ancho, con viñetas grandes que pasan de lado. |
| **Sobre mí** | La repisa cruza la ventana de pared a pared. |
| **Contacto** | La mesa y el buzón a lo ancho; Haku empuja el sobre. |
| **Pie** | Haku se duerme. |

En celular: los mismos escenarios, apilados a todo el ancho; los tramos horizontales se vuelven
carrusel con el dedo; Haku más chico en la esquina inferior.

## Los escenarios, uno por uno (composición)

Piezas comunes (las hace quien construya el primer escenario; los demás las usan):

- `components/paginas/inicio/Escenario.tsx`: la sección a todo lo ancho. `<section data-estacion data-lado>`
  de 100vw y `min-height: 100svh` en ≥ 1024 px (alto natural en celular), sin `max-width`; relleno
  lateral `clamp(20px, 4vw, 72px)` SOLO para el bloque de texto; acepta capas que sangran
  (`overflow: clip` en la sección, no en la página). Trae el ancla de la línea viva.
- `components/paginas/inicio/Vista.tsx`: la prueba real en GRANDE. Imagen o video con marco fino y
  esquinas de 10 px; `ancho` en vw (por defecto 56vw en escritorio, 100 % en celular); inclinación
  opcional (−4° a 4°) que se endereza con resorte al pasar el cursor; los videos se reproducen
  solos SIN sonido al estar a la vista y se pausan al salir (cargados al acercarse, con `poster`);
  clic abre el caso. Varias vistas pueden ir «en abanico» y traer al frente la que se toca.
- El rótulo del escenario: número gigante en mono (hasta 22vw, en `linea`) DETRÁS de todo, título
  grande, resumen (≤ 34rem), píldoras y un botón «Ver el caso».

| # | Escenario | Composición (escritorio) | Qué se mueve |
|---|---|---|---|
| P | **Portada** | El escritorio de noche ocupa toda la base de la ventana, de orilla a orilla (la mesa sale por ambos lados). Nombre arriba a la izquierda a tamaño gigante; titular, frase y botones debajo. A la derecha, una ventana con luna. La repisa cruza el fondo. | Se dibuja al cargar; Haku mira el cursor; la lámpara se apaga; al primer scroll Haku salta de la mesa al piso. |
| C | **Cifras** | Banda de orilla a orilla con las cuatro cifras en hilera, cada una a tamaño de titular; debajo de cada una, su etiqueta. Un agente por cifra. | Cuentan al llegar la chispa; cada agente estampa «medido». |
| 1–3 | **YaContesto** (tramo horizontal) | Tres pantallas completas lado a lado, fijadas: se avanza de LADO. Rótulo fijo arriba: «YaContesto · tres piezas de un producto». **1 Recepcionista:** el video de la conversación en un teléfono de 78svh, inclinado −4°, al centro-derecha; el conmutador grande abajo a la izquierda, saliéndose por la orilla; luna arriba. **2 CRM:** el tablero a 62vw saliéndose por la derecha, inclinado 3°, con la captura de celular encima; la muela-mapa tapa su esquina inferior izquierda; botón grande «Abrir la demo interactiva». **3 yacontesto.com:** el recorrido en video a 70vw, centrado como pantalla de cine; el folioscopio abajo a la derecha. | El tramo avanza con el scroll; cada pantalla despierta su invento al centrarse. En celular: tres bloques apilados. |
| 4 | **minecraft-rcon-mcp** | No hay captura: el invento ES la estrella. La bóveda a 80svh, centro-derecha, saliéndose por abajo. A la izquierda, texto y las dos cifras enormes (1,092 · 227). Debajo del texto, el diagrama `puerta-con-folio` en mini como «prueba». | La tarjeta rebota, baja el sello, el volante gira; el volante se puede girar con el cursor. |
| 5 | **taller-claude** | El banco de la mesa de los seis cruza TODA la base de la ventana; los seis agentes en grande. Título arriba a la izquierda; arriba a la derecha, el diagrama `orquesta-agentes` en mini. | La batuta da el golpe y martillan en escala; cada agente salta al tocarlo. |
| 6 | **La Elegía** (tramo alto, 180svh) | La torre dibujada a la derecha mide todo el tramo y se sale por arriba; el castillo en la cima. A la izquierda, fijo mientras subes: el video de Aurelion (cuadrado, 44vw) y debajo el de la torre. Al final, las tres láminas de concepto y modelo en tira horizontal. | Subes por la torre: se arma anillo por anillo con el scroll; nubes a dos velocidades; el sol gira. |
| 7 | **La Isla** | La isla flotando al centro, grande; sus tres capturas reales en abanico (cada una 40vw), saliéndose por los lados. | La isla flota; las capturas pasan al frente al tocarlas. |
| 8 | **Tierra de Viajes** | La portada del sitio a 55vw a la izquierda; el itinerario en un teléfono a la derecha; la maleta abajo; la ruta del avión cruza todo el escenario por encima. | El avión recorre la ruta con el scroll. |
| 9 | **Punto de venta** | La pantalla de venta a 58vw a la derecha, inclinada −3°; la colmena-caja grande abajo a la izquierda, saliéndose; las otras cuatro capturas en una tira que pasa de lado. | Suena la caja; la abeja cruza volando hasta la captura. |
| T | **Cómo trabajo** | La tira a todo lo ancho: cada viñeta mide ~46vw; pasan de lado, fijadas. | Cada viñeta corre al centrarse. |
| + | **También** | El cuaderno grande a un lado y la captura del Cuaderno de repaso a 50vw al otro. | Las hojas se levantan. |
| S | **Sobre mí** | La repisa de pared a pared; el texto encima, en dos columnas. | Objetos que se tambalean y sueltan su dato; Haku salta a la repisa. |
| K | **Contacto** | La mesa y el buzón a lo ancho; «Escríbeme» enorme. | Haku empuja el sobre; sello «copiado». |
| Z | **Pie** | La línea termina; Haku se duerme. | «zzz». |

La línea viva deja de ir pegada a un contenedor: cruza la ventana de lado a lado entre escenarios,
pasando por el ancla de cada uno. `scripts/linea.mjs` sigue mandando: cero choques con texto y vistas.

En celular (< 1024 px): escenarios apilados a todo el ancho con alto natural; las vistas al 100 %
del ancho; los tramos horizontales se vuelven carrusel con el dedo (`scroll-snap`); sin inclinaciones
mayores de 2°; los inventos a todo el ancho, debajo de la vista.
