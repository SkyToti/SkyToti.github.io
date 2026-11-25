# ESCENAS — las «maquinitas» del plano

> Especificación del motor de escenas y del guion de cada una. Depende de `DIRECCION.md`
> (gramática: trazo, nodo, pulso, compuerta, cota; tokens de color y movimiento).
> Una escena es **datos**, no código suelto: un solo motor las dibuja y las anima todas, para
> que el sitio entero se mueva igual.

## 1. El motor (`components/plano/`)

### Datos de una escena (`escenas/<nombre>.ts`, tipado en `escenas/tipos.ts`)

```ts
type Texto = { es: string; en: string }

type Nodo = {
  id: string
  tipo: 'persona' | 'ia' | 'servicio' | 'dato' | 'fin'
  etiqueta: Texto            // ≤ 18 caracteres por idioma; va en mono, mayúsculas
  nota?: Texto               // segunda línea opcional, en hueso-apagado (≤ 26 caracteres)
  ancho: [col: number, fila: number]   // composición horizontal: retícula 12 × 6
  alto: [col: number, fila: number]    // composición vertical (celular): retícula 4 × N
}

type Trazo = { id: string; de: string; a: string; punteado?: boolean }   // ruta ortogonal, esquinas de 8 px
type Compuerta = { id: string; en: string /* id del trazo */; etiqueta: Texto }
type Cota = { id: string; junto: string /* id de nodo o compuerta */; valor: number; prefijo?: string; sufijo?: string; etiqueta: Texto }
type Globo = { id: string; junto: string; texto: Texto; lado: 'entra' | 'sale' }  // burbuja de mensaje, ≤ 60 caracteres

type Accion =
  | { dibuja: string | string[] }                 // trazos (se dibujan a la vez)
  | { enciende: string | string[] }               // nodos: de `linea` a `linea-viva` + etiqueta a `hueso`
  | { pulso: string; vuelve?: boolean; color?: 'ambar' | 'alto' }   // viaja por el trazo; `vuelve` = ida y vuelta
  | { pulsos: string[] }                          // varios a la vez (reparto en paralelo)
  | { compuerta: string; estado: 'abre' | 'detiene' }
  | { cuenta: string }                            // la cota sube de 0 a su valor
  | { globo: string }                             // aparece la burbuja
  | { marca: string; como: 'hecho' | 'alto' }     // palomita o tache sobre un nodo
  | { espera: number }

type Paso = { acciones: Accion[] }                // un Paso por cada paso de «Cómo funciona» del caso, en el mismo orden
type Escena = { nombre: string; nodos: Nodo[]; trazos: Trazo[]; compuertas?: Compuerta[]; cotas?: Cota[]; globos?: Globo[]; pasos: Paso[] }
```

### Componentes

- `Plano` (servidor): dibuja el SVG **ya en su estado final** (todo trazado, todo encendido, cotas
  con su valor) a partir de los datos y del idioma. Así se ve completo sin JavaScript, con
  `prefers-reduced-motion` y para los buscadores. Renderiza las dos composiciones (`ancho` ≥ 768 px,
  `alto` debajo) y CSS muestra una. Etiquetas como `<text>` real. Tamaño de letra mínimo ya
  escalado: 12 px en pantalla en ambas composiciones (el `viewBox` de `alto` es de 360 de ancho
  para que no se encoja). `role="img"` con `aria-label` = resumen del caso; los pasos se leen en
  la lista de al lado, no dentro del SVG (`aria-hidden` en los textos internos).
- `PlanoVivo` (cliente, `useGSAP` con `scope`): al montar, y solo si `html.mueve`, lleva el plano
  a su estado inicial (trazos sin dibujar con DrawSVG, nodos en `linea`, cotas en 0, globos
  ocultos) y arma UNA línea de tiempo con una etiqueta por paso (`paso-1`, `paso-2`…).
  - Empieza al entrar en vista (ScrollTrigger `once`), se pausa al salir de pantalla y con la
    pestaña oculta. Corre una vez y se queda en el estado final.
  - Emite el paso activo para que la lista de pasos lo resalte (`aria-current="step"`).
  - Controles: reproducir/pausa y «ver de nuevo»; cada paso de la lista es un botón que lleva la
    línea de tiempo a su etiqueta (`tl.tweenTo`). Todo con teclado.
  - Pulsos con MotionPath sobre el mismo `<path>` del trazo, `ease: 'none'`, 220 px/s. Un pulso es
    un círculo de 4 px en `ambar` con una estela corta (segundo círculo al 35 %).
- `Pasos` (servidor): la lista numerada del caso, con el texto del Markdown.
- Modo `mini` de `Plano`/`PlanoVivo` para la lámina del inicio: sin etiquetas `nota`, sin
  controles, corre una vez al entrar en vista.

### Reglas del motor

- Solo `transform`, `opacity` y `stroke-dashoffset` (DrawSVG). Nada de filtros ni desenfoques.
- Una sola línea de tiempo por escena; `gsap.matchMedia()` para cambiar de composición sin fugas.
- Nada pinta fuera de pantalla. Ninguna escena corre sola más de 5 s seguidos sin control visible.
- Prueba de humo por escena (`node --test`): todos los `de`/`a`/`en`/`junto` existen, ningún
  nodo se encima con otro en ninguna composición, cada etiqueta respeta su tope de caracteres en
  los dos idiomas, y el número de `pasos` es igual al de pasos del caso en `contenido/`.

## 2. Guiones

Coordenadas `ancho` en la retícula 12 × 6 (col 1–12, fila 1–6). La composición `alto` la decide
quien implementa siguiendo el mismo orden de lectura de arriba abajo.

### `firma` — portada y «Cómo trabajo» (4 pasos)

Nodos: `idea` persona «DIEGO» nota «decide qué se construye» [1,3] · `plan` ia «PLANIFICADOR» [4,3] ·
`a1` ia «AGENTE» [7,1] · `a2` ia «AGENTE» [7,3] · `a3` ia «AGENTE» [7,5] · `prod` fin «EN PRODUCCIÓN» [12,3].
Trazos: `idea-plan`, `plan-a1`, `plan-a2`, `plan-a3`, `a1-prod`, `a2-prod`, `a3-prod` (los tres se
juntan en la col 9 y siguen como uno).
Compuerta: `pruebas` sobre el tramo común (col 10) «PRUEBAS». Cota: `n` junto a `pruebas`,
valor 2000, prefijo «+», etiqueta «pruebas aprobadas».

1. Decido: enciende `idea` → dibuja `idea-plan` → pulso `idea-plan` → enciende `plan`.
2. Dirijo agentes: dibuja `plan-a1..3` → pulsos a los tres a la vez → enciende `a1..3`.
3. Exijo pruebas: dibuja `a*-prod` → pulsos hasta `pruebas`: el primero **se detiene** (compuerta
   `detiene`, pulso en `alto`, regresa a su agente), vuelve a salir y **pasa** (compuerta `abre`) →
   `cuenta n`.
4. Reviso y despliego: pulso final hasta `prod` → marca `prod` hecho.

En la portada corre en modo `mini` (sin notas) y dura ≤ 6 s. En «Cómo trabajo» es la misma
escena, con scroll (pin + scrub, un paso por pantalla) solo en escritorio.

### `recepcionista-whatsapp` (5 pasos)

Nodos: `paciente` persona «PACIENTE» [1,3] · `wa` servicio «WHATSAPP» nota «el número de la clínica» [4,3] ·
`ia` ia «RECEPCIONISTA IA» [7,3] · `reglas` dato «PRECIOS Y HORARIOS» nota «lo que la clínica aprobó» [7,1] ·
`agenda` dato «AGENDA» [10,1] · `cita` fin «CITA AGENDADA» [10,3] · `equipo` persona «EQUIPO» nota «si hace falta» [10,5].
Trazos: `paciente-wa`, `wa-ia`, `ia-reglas`, `ia-agenda`, `ia-cita`, `ia-equipo` (punteado).
Globos: `g1` junto a `paciente`, entra: «¿Tienen cita mañana a las 10?» / “Any opening tomorrow at 10?” ·
`g2` junto a `wa`, sale: «A las 10 está ocupado. Tengo 10:30 u 11:00.» / “10 is taken. I have 10:30 or 11:00.”

1. globo `g1` → dibuja `paciente-wa`, `wa-ia` → pulso `paciente-wa` → pulso `wa-ia` → enciende `ia`.
2. dibuja `ia-reglas` → pulso con `vuelve` → enciende `reglas`.
3. dibuja `ia-agenda` → pulso con `vuelve` → enciende `agenda` → globo `g2`.
4. dibuja `ia-cita` → pulso → marca `cita` hecho.
5. dibuja `ia-equipo` → pulso → enciende `equipo`.

Texto 100 % ficticio. Ningún nombre de clínica ni de persona.

### `crm-agenda` (5 pasos)

Nodos: `recepcion` persona «RECEPCIÓN» [1,2] · `doctor` persona «DOCTOR» [1,5] · `agenda` dato «AGENDA»
nota «por doctor» [5,1] · `cita` dato «CITA» [5,3] · `presu` dato «PRESUPUESTO» [5,5] · `caja` fin «CAJA»
nota «el corte cuadra» [9,5] · `bot` ia «RECEPCIONISTA IA» nota «lee de aquí» [11,2].
Trazos: `recepcion-agenda`, `agenda-cita`, `doctor-presu`, `presu-caja`, `bot-agenda` (punteado).

1. enciende `recepcion` → dibuja `recepcion-agenda` → pulso → enciende `agenda`.
2. dibuja `agenda-cita` → pulso → marca `cita` hecho.
3. enciende `doctor` → dibuja `doctor-presu` → pulso → enciende `presu`.
4. dibuja `presu-caja` → pulso → marca `caja` hecho.
5. dibuja `bot-agenda` → pulso con `vuelve` → enciende `bot`.

### `puerta-con-folio` (5 pasos)

Nodos: `agente` ia «AGENTE DE IA» [1,3] · `filtro` servicio «CLASIFICA» nota «leer · escribir · confirmar · negar» [4,3] ·
`seguro` fin «CORRE» nota «lo seguro» [8,1] · `folio` dato «FOLIO» nota «un solo uso» [8,3] ·
`persona` persona «UNA PERSONA» nota «aprueba fuera del modelo» [8,5] · `servidor` fin «SERVIDOR» [12,3] ·
`negado` fin «NEGADO» [4,6].
Trazos: `agente-filtro`, `filtro-seguro`, `filtro-folio`, `persona-folio`, `folio-servidor`, `seguro-servidor`, `filtro-negado`.
Compuerta: `candado` sobre `folio-servidor` «ESPERA».
Cotas: `ataques` junto a `filtro`, 227, «ataques probados» · `pruebas` junto a `servidor`, 1092, «pruebas aprobadas».

1. enciende `agente` → dibuja `agente-filtro` → pulso.
2. enciende `filtro` → dibuja las tres salidas → pulso `filtro-negado` en `alto` → marca `negado` alto → `cuenta ataques`.
3. pulso `filtro-seguro` → `seguro-servidor` → marca `seguro` hecho.
4. pulso `filtro-folio` → enciende `folio` → pulso hacia `servidor` → compuerta `candado` `detiene`.
5. enciende `persona` → dibuja `persona-folio` → pulso → compuerta `candado` `abre` → pulso llega → marca `servidor` hecho → `cuenta pruebas`.

### `orquesta-agentes` (5 pasos)

Nodos: `encargo` persona «ENCARGO» [1,3] · `plan` ia «PLANIFICADOR» [3,3] · seis agentes en la col 7:
`explorador` «EXPLORADOR» nota «Haiku» [7,1] · `cartografo` «CARTÓGRAFO» nota «Haiku» [7,2] ·
`investigador` «INVESTIGADOR» nota «Sonnet» [7,3] · `redactor` «REDACTOR» nota «Sonnet» [7,4] ·
`verificador` «VERIFICADOR» nota «Sonnet» [7,5] · `programador` «PROGRAMADOR» nota «Opus» [7,6] ·
`informe` dato «INFORME CORTO» nota «formato fijo» [10,3] · `listo` fin «INTEGRADO» [12,3].
Trazos: `encargo-plan`, `plan-<agente>` ×6, `<agente>-informe` ×6, `informe-listo`.
Compuerta: `control` sobre `informe-listo` «CONTROLES».
Cota: `seis` junto a `plan`, 6, «agentes».

1. enciende `encargo` → dibuja `encargo-plan` → pulso → enciende `plan`.
2. dibuja los seis `plan-*` → pulsos a la vez → `cuenta seis`.
3. enciende los seis, de arriba abajo (las notas «Haiku / Sonnet / Opus» aparecen con ellos).
4. dibuja los seis `*-informe` → pulsos → enciende `informe`.
5. dibuja `informe-listo` → pulso → compuerta `control` `detiene` (pulso en `alto`, vuelve) → sale de nuevo → `abre` → marca `listo` hecho.

### Cadenas simples (los casos que sí se ven)

Mismo motor, composición en una sola fila. Un nodo por paso de «Cómo funciona», encadenados;
cada paso: dibuja el trazo, pulso, enciende el nodo; el último lleva `marca hecho`.

- `historia-scroll` (yacontesto.com): «EMPIEZA LA HISTORIA» → «LLEGA UN MENSAJE» → «EL ASISTENTE CONTESTA» → «CITA EN EL CALENDARIO» → «PIDE UNA DEMO».
- `jefe-del-mar` (La Elegía): «SCRIPT» nota «dibuja y arma» → «PRUEBA» nota «el modelo carga» → «PELEA» nota «IA del jefe» → «BOT DE PRUEBA» → «SERVIDOR».
- `isla-barra` (La Isla): «MOTOR EN RUST» nota «vigila el sistema» → «CANAL LOCAL» → «PANEL» nota «nace y se destruye» → «RESPALDO».
- `itinerario-privado` (Tierra de Viajes): «ANUNCIO» → «PÁGINA» → «PANEL» nota «arma el itinerario» → «ENLACE PRIVADO» nota «uno por viajero».
- `caja-libreria` (Punto de venta): «BUSCA EL LIBRO» nota «nombre o código» → «CARRITO» nota «efectivo o tarjeta» → «INVENTARIO» nota «se descuenta solo» → «AVISO» nota «quedan pocos» → «REPORTE» nota «en Excel».
