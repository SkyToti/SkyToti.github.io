# DIRECCIÓN — «Plano vivo»

> Aprobada por Diego el 24-nov-2026 (eligió «Plano vivo» entre tres). Manda sobre cualquier
> decisión visual o de movimiento. Método: skill `web-cinematica` (6 capas).
> Lo que el sitio debe lograr: que un reclutador que **no sabe leer GitHub** entienda en
> 10 segundos, desde el celular, quién es Diego, qué construye y cómo contactarlo.

```
MARCA       Diego Benítez. Desarrollador full stack que dirige agentes de IA con disciplina
            de ingeniería, y hace webs con movimiento. Le habla a reclutadores no técnicos;
            en segunda lectura, a un líder técnico.
SENSACIÓN   preciso · vivo · honesto.
            NO queremos parecer: plantilla de portafolio (gradiente morado, «Hola, soy…»,
            barras de porcentaje de habilidades, tarjetas iguales con sombra), terminal
            verde de hacker, neón, ni vitrina que se mueve por moverse.
FIRMA       «El plano que se pone a trabajar». Un diagrama de línea fina se dibuja y luego
            FUNCIONA: pulsos de luz viajan por las líneas, se reparten, pasan una compuerta
            y llegan. Está en la portada (idea → agentes → pruebas → producción) y la misma
            gramática explica cada proyecto que no se puede ver.
```

## 1. Concepto

Los mejores proyectos de Diego son invisibles: un bot que contesta WhatsApp, un servidor que
le pone candados a una IA, un orquestador de agentes. Un enlace a GitHub no le dice nada a
quien no programa. **El portafolio los dibuja y los echa a andar.** Cada caso tiene su
«maquinita»: un plano que muestra, paso a paso y en palabras llanas, qué entra, qué pasa y
qué sale.

Una sola gramática para todo el sitio:

| Pieza | Qué significa | Cómo se ve |
|---|---|---|
| **Trazo** | una conexión, un camino | línea de 1.5 px que se dibuja (DrawSVG) |
| **Nodo** | alguien o algo que hace un trabajo | círculo o caja de esquinas de 6 px, con su etiqueta en mono |
| **Pulso** | un mensaje, una tarea, un comando | punto ámbar que viaja por el trazo a velocidad constante |
| **Compuerta** | una regla que deja pasar o detiene | barra corta que cruza el trazo; se abre o se queda |
| **Cota** | un dato medido | número en mono con su etiqueta, como las medidas de un plano |

Si una animación no es una de esas cinco cosas, no va.

## 2. Tokens

### Color (contraste medido el 24-nov-2026 contra `noche`)

| Nombre | Hex | Uso | Contraste |
|---|---|---|---|
| `noche` | `#0B1220` | fondo de la página | — |
| `superficie` | `#121B2E` | láminas, tarjetas, cabecera | — |
| `linea` | `#2A3854` | trazos en reposo, retícula, bordes (solo decorativo) | 1.6 |
| `linea-viva` | `#5B6F96` | trazos ya dibujados, iconos, bordes de foco secundarios | 3.7 |
| `hueso` | `#EDE6D6` | texto principal y títulos | 15.1 |
| `hueso-apagado` | `#A7A698` | texto secundario, etiquetas | 7.6 |
| `ambar` | `#F5B455` | EL acento: pulsos, enlace activo, botón principal, foco | 10.3 |
| `alto` | `#F0776B` | solo dentro de escenas: «negado», «detenido» | 6.7 |

Reglas: un solo acento (`ambar`). Nada de degradados de color; la profundidad se hace con
`superficie` y con la retícula. El botón principal es `ambar` con texto `noche` (10.3).
`linea` nunca lleva texto encima ni es el único indicador de algo.

### Letra (dos familias, por `next/font/google`, alojadas en el propio sitio)

- **Bricolage Grotesque** (variable: peso, ancho, tamaño óptico): títulos y texto. Con carácter
  en grande, limpia en chico.
  - Nombre en portada: `clamp(2.75rem, 8vw, 7rem)`, peso 700, ancho 90, interlineado 0.95, tracking −0.02em.
  - Título de sección: `clamp(2rem, 4.5vw, 3.5rem)`, peso 650.
  - Texto: 1.0625rem (17 px) / 1.6, peso 400. Mínimo absoluto en cualquier parte: 12 px.
- **JetBrains Mono**: SOLO etiquetas del plano, cotas, números de lámina, etiquetas de
  tecnología. Mayúsculas con tracking 0.06em a 12–13 px. Nunca párrafos.

### Forma

Radios: 6 px (cajas, botones) y 999 px (píldoras de estado). Trazos de 1.5 px. Sin sombras:
los planos no tienen sombra. Retícula de fondo: líneas de `linea` al 35 % cada 96 px, solo en
la portada y dentro de las escenas, con máscara que la desvanece en las orillas.

## 3. Retícula y ritmo

- Escritorio (≥ 1024): 12 columnas, margen 64 px (48 px bajo 1280), canalón 24 px, ancho máximo 1320 px.
- Tableta (640–1023): 8 columnas, margen 32 px.
- Celular (< 640): 4 columnas, margen 20 px. **Se diseña primero aquí** (iPhone 13, 390 px).
- Cada lámina lleva su rótulo en mono arriba a la izquierda: `01 — RECEPCIONISTA CON IA`.

## 4. Secciones del inicio

| # | Sección | Alto | Qué cuenta | Patrón |
|---|---|---|---|---|
| 1 | **Portada** | 100svh | Nombre, titular, una línea, botones (Ver trabajo · CV · Correo). A la derecha (abajo en celular) el plano firma. | título por líneas (1) + plano firma (22) |
| 2 | **Cotas** | ~0.4 pantalla | 3–4 cifras medidas del CV, con su etiqueta | contadores (4) |
| 3 | **Trabajo** | 8 láminas, ~0.7 pantalla c/u | Número, título, una línea llana, tipo, y una miniatura viva de su maquinita o su captura | revelado en lote (5) |
| 4 | **Cómo trabajo** | ~3.5 pantallas (escritorio) | Los 4 pasos: decido → dirijo agentes → exijo pruebas → reviso y despliego. El plano de la portada, ahora explicado paso a paso | escena fijada con pasos (12), solo escritorio |
| 5 | **Más trabajo** | ~1 pantalla | Rejilla de 7 proyectos menores con enlace | revelado en lote (5) |
| 6 | **Sobre mí** | ~0.8 pantalla | 4 renglones, estudios, idiomas, disponibilidad | título por líneas (1) |
| 7 | **Contacto** | ~0.7 pantalla | Correo copiable, CV en PDF (ES/EN) y GitHub. **Sin teléfono ni WhatsApp** (decisión de Diego, 24-nov-2026); el PDF del sitio es una copia del CV sin el teléfono | — |

Cabecera fija y delgada: `DB` · Trabajo · Sobre mí · CV · `ES/EN`. Enlaces con letras que
ruedan (28), solo con ratón.

### Página de caso (`/trabajo/<slug>/`)

1. Rótulo y título, la línea llana, y una ficha: papel · año · tipo · enlaces (en vivo, repo,
   o la píldora «código privado» cuando aplica).
2. **La maquinita**: la escena del caso. Se reproduce al entrar en vista, con control de
   reproducir/pausa y los pasos de «Cómo funciona» a un lado; tocar un paso lleva la escena a
   ese punto. Sin pin.
3. **La prueba**: cotas con contador y, debajo, qué significan en palabras llanas.
4. **Se ve así**: capturas o video (cuando el proyecto sí se puede ver).
5. Mi papel · Tecnología (una línea, en mono).
6. Siguiente caso →.

## 5. Movimiento

Personalidad: **técnico**. Precisión, líneas que se dibujan, números que cuentan, estados que
confirman. Cero decoración.

| Token | Valor | Para qué |
|---|---|---|
| `--dur-micro` | 0.18 s | hover, foco, palomita |
| `--dur-ui` | 0.4 s | menú, control de escena, cambio de idioma |
| `--dur-entrada` | 0.9 s | títulos y bloques al entrar |
| `--dur-trazo` | 1.2 s | una línea del plano dibujándose |
| `--curva-entrada` | `expo.out` · `cubic-bezier(.16,1,.3,1)` | aparecer y asentarse |
| `--curva-trazo` | `power2.inOut` | dibujar líneas |
| pulso | `ease: none`, 220 px/s | viaja a velocidad constante: es una máquina |
| scrub | `ease: none`, `scrub: 0.8` | lo atado al scroll |
| distancia de entrada | 24 px o máscara | — |
| escalonado | 0.06 s, total ≤ 0.5 s | — |

Patrones del catálogo (6): **22 diagrama que se dibuja (la firma, con pulsos por MotionPath)** ·
1 título por líneas con máscara · 4 contadores · 5 revelado en lote · 12 escena fijada con
pasos (solo «Cómo trabajo», solo escritorio) · 26 transición entre páginas (fundido, cabecera
quieta). Detalle: 28 letras que ruedan en la navegación.

**Nunca se mueve:** el texto mientras se lee, los botones (salvo su respuesta), el diseño ya
pintado. Sin cursor personalizado, sin parallax, sin pantalla de carga, sin scroll secuestrado.

**Las escenas se detienen solas.** El plano de la portada corre una vez (~6 s) y queda quieto
en su estado final; un botón discreto «ver de nuevo» lo repite. Las maquinitas de los casos
corren al entrar en vista y tienen pausa (WCAG 2.2.2). Solo pintan mientras se ven.

**Menos movimiento** (`prefers-reduced-motion`): sin Lenis, sin pin, sin pulsos viajando. Los
planos aparecen ya dibujados en su estado final y los pasos se leen como lista. Desde el
primer commit.

**El texto siempre está en el HTML.** Las etiquetas de las escenas son texto real (SVG `<text>`
o HTML encima), se traducen y se leen sin JavaScript. Cada escena lleva al lado su lista de
pasos numerada: la animación la ilustra, no la sustituye.

## 6. Medios (todo de Diego; nada de bancos de imágenes ni IA)

| Caso | Escena (maquinita) | Material real |
|---|---|---|
| Recepcionista con IA | `mensaje-cita`: llega un WhatsApp → la IA lee → revisa la agenda → agenda → contesta; a veces pasa a una persona | fragmento del reel de YaContesto, con datos ficticios |
| CRM dental | `clinica`: agenda, paciente, cobro y caja conectados; el bot lee de ahí | capturas de la «Clínica Dental Ejemplo (ficticia)», `CRM-DENTAL/capturas/1.7/dia/` |
| yacontesto.com | — (el sitio se ve) | grabación del scroll + enlace en vivo + Lighthouse 100 |
| minecraft-rcon-mcp | `folio`: comando → se clasifica (leer / escribir / confirmar / negar) → lo peligroso espera un folio que solo aprueba una persona | GIF de terminal (pendiente) + repo público |
| taller-claude | `orquesta`: un planificador reparte tareas a seis agentes según su costo; los informes vuelven por una compuerta | repo público |
| La Elegía y Coliseo | — (se ve) | tráiler «El Umbral», renders limpios de criaturas |
| La Isla | — (se ve) | capturas de `~/.cache/rediseno/` + grabación nueva |
| Tierra de Viajes | — (se ve) | captura + enlace en vivo |

Video: MP4 H.264 + WebM, 720p, ≤ 8 MB cada uno, con `poster`, `muted playsInline`,
`preload="none"` y carga al acercarse. Sin autoplay con sonido. Imágenes en AVIF/WebP con
`width` y `height`.

**Antes de publicar cualquier captura o video:** revisarlo a tamaño completo buscando nombres
de clínicas, doctores, pacientes o teléfonos reales. Solo sale lo marcado «ficticio» o «ejemplo».

## 7. Calidad (sin esto no está hecho)

- LCP < 2.5 s · CLS 0 · sin tareas largas al hacer scroll · Lighthouse en celular ≥ 95 (meta: 100, como yacontesto.com).
- GSAP y las escenas fuera del camino crítico: el nombre, el titular y los botones se ven y funcionan sin JavaScript.
- AA en todo el texto · un solo `h1` · foco visible en `ambar` · todo con teclado · `alt` que describe.
- Playwright en 1440×900, iPhone 13 e iPad Pro 11: 0 errores de consola, una captura por sección **leída una por una**, y el recorrido lento.
- El iPhone real de Diego antes de publicar.
- La prueba del reclutador (celular, 10 s): ¿quién es y qué busca? · ¿se ve algo moviéndose con sentido? · ¿hay camino obvio a un proyecto? · ¿CV y contacto a un toque?

## 8. Honestidad (reglas del brief del CV, 29-oct-2026)

- Diego **dirige agentes de IA**; no se dice que escribe a mano.
- Cero nombres de clientes, clínicas o pacientes. Cero ingresos. «Una clínica dental real».
- Solo cifras medidas en los repos, con su fecha. Lo que falte se marca `PENDIENTE:`.
- Los repos privados se dicen privados; no se finge una demo pública.
- **Ningún teléfono en el sitio**, ni en texto, ni en enlaces, ni en el PDF. El único contacto es el correo.
