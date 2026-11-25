---
titulo: "La Isla, mi escritorio de Linux"
slug: "la-isla"
orden: 7
anio: 2026
tipo: "escritorio"
resumen: "La barra y los paneles de mi escritorio de Linux, rápidos, ligeros y con identidad propia."
papel: "Escribí la filosofía y los límites de memoria, y dirigí a la IA que construyó la barra y su motor."
tecnologia:
  - "Quickshell (QML)"
  - "Rust"
  - "Hyprland"
  - "Fedora 44"
cifras:
  - valor: "~173 MB"
    etiqueta: "de memoria en uso, con todos los paneles abiertos"
  - valor: "1.8 MB"
    etiqueta: "de memoria del motor en Rust"
privado: true
escena: "isla-barra"
portada: "/medios/la-isla/control.webp"
medios:
  - tipo: "video"
    src: "/medios/la-isla/isla-paneles.mp4"
    poster: "/medios/la-isla/isla-paneles.jpg"
    ancho: 1920
    alto: 1080
    alt: "La isla se transforma: de reposo a Control, a Hoy, al lanzador y de vuelta."
  - tipo: "imagen"
    src: "/medios/la-isla/control.webp"
    ancho: 1920
    alto: 1080
    alt: "El panel de Control: interruptores, sonido y las cifras del sistema que sirve el motor en Rust."
  - tipo: "imagen"
    src: "/medios/la-isla/hoy-calendario.webp"
    ancho: 1920
    alto: 1080
    alt: "El panel Hoy: calendario, el atajo del día y las notificaciones."
  - tipo: "imagen"
    src: "/medios/la-isla/atajos-busqueda.webp"
    ancho: 1920
    alto: 1080
    alt: "La guía de atajos, con búsqueda."
  - tipo: "imagen"
    src: "/medios/la-isla/lanzador.webp"
    ancho: 1920
    alto: 1080
    alt: "El lanzador: busca apps, ventanas, archivos y acciones."
  - tipo: "imagen"
    src: "/medios/la-isla/todas-las-apps.webp"
    ancho: 1920
    alto: 1080
    alt: "La cuadrícula de todas las apps, por categoría."
  - tipo: "video"
    src: "/medios/la-isla/menu-y-atajos.mp4"
    poster: "/medios/la-isla/menu-y-atajos.jpg"
    ancho: 1920
    alto: 1080
    alt: "El menú de clic derecho del escritorio y la guía de atajos en uso."
  - tipo: "imagen"
    src: "/medios/la-isla/isla-reposo.webp"
    ancho: 1920
    alto: 1080
    alt: "La isla en reposo sobre un fondo animado propio, pintado por un shader."
  - tipo: "imagen"
    src: "/medios/la-isla/menu-capturas.webp"
    ancho: 1920
    alto: 1080
    alt: "El menú del escritorio con su submenú de capturas."
  - tipo: "imagen"
    src: "/medios/la-isla/energia.webp"
    ancho: 1920
    alto: 1080
    alt: "El panel de energía."
  - tipo: "imagen"
    src: "/medios/la-isla/notificacion.webp"
    ancho: 1920
    alto: 1080
    alt: "Una notificación saliendo de la isla."
  - tipo: "imagen"
    src: "/medios/la-isla/selector-fondos-vivos.webp"
    ancho: 1920
    alto: 1080
    alt: "El selector de fondos en tiras inclinadas."
  - tipo: "imagen"
    src: "/medios/la-isla/terminal-kitty.webp"
    ancho: 1920
    alto: 1080
    alt: "La terminal con el mismo tema."
---

## Qué es

«La Isla» es la barra y el conjunto de paneles de mi escritorio. Detrás tiene un motor pequeño en Rust que vigila el sistema.

## Para quién

Para mí, como herramienta de trabajo diaria: transmisiones, mods, servidores y webs. Es la prueba de que sé fijar reglas de rendimiento.

## Cómo funciona

1. El motor en Rust corre siempre y vigila el sistema: procesador, memoria, red y juegos abiertos.
2. La barra pide lo que necesita por un canal local.
3. Cada panel se crea al abrirse y se destruye al cerrarse.
4. Si algo se traba, hay respaldo y la barra regresa sola a la anterior.

## Mi papel

Definí ocho principios por escrito, con topes de memoria y reglas de animación. Dirigí a la IA que programó las piezas. Una pieza solo se da por terminada si se mide contra esos topes y yo la uso y confirmo que se siente bien.

## La prueba

Medido el 21 de noviembre de 2026: recién abierta ocupa unos 137 MB. Con todos los paneles usados se estaciona en unos 173 MB y no sigue creciendo con las horas. El motor en Rust ocupa 1.8 MB.

## Tecnología

Quickshell con QML para lo que se ve, Rust para el motor, sobre Hyprland en Fedora 44.
