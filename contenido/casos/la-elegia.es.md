---
titulo: "Mods de Minecraft: La Elegía y Coliseo del Mar"
slug: "la-elegia"
orden: 6
anio: 2026
tipo: "juego"
resumen: "Dos mods de Minecraft con criaturas y jefes que tienen modelos y animaciones propias."
papel: "Dirigí e integré el trabajo de varios agentes de IA en ramas paralelas, y decidí qué entraba y qué no."
tecnologia:
  - "Java 25"
  - "Fabric"
  - "GeckoLib"
  - "Gradle"
  - "Herramientas en Python"
cifras:
  - valor: "59"
    etiqueta: "animaciones del jefe Aurelion"
  - valor: "~43,000"
    etiqueta: "líneas de Java en La Elegía"
  - valor: "376"
    etiqueta: "commits (cambios guardados) en La Elegía"
  - valor: "6"
    etiqueta: "jefes con cuerpo propio en Coliseo del Mar"
privado: true
escena: "jefe-del-mar"
portada: "/medios/la-elegia/portada.webp"
medios:
  - tipo: "video"
    src: "/medios/la-elegia/aurelion.mp4"
    poster: "/medios/la-elegia/aurelion.jpg"
    ancho: 720
    alto: 720
    alt: "Aurelion, el jefe del primer piso: once de sus 59 animaciones, de despertar a caer."
  - tipo: "video"
    src: "/medios/la-elegia/la-torre.mp4"
    poster: "/medios/la-elegia/la-torre.jpg"
    ancho: 720
    alto: 1280
    alt: "La torre de 100 pisos y 4,000 bloques de alto, con su castillo en la cima, construida por una IA dentro del juego."
  - tipo: "imagen"
    src: "/medios/la-elegia/aurelion-hoja.webp"
    ancho: 1680
    alto: 1418
    alt: "Hoja del modelo de Aurelion: vistas, paleta, esqueleto de 69 huesos y lista de animaciones."
  - tipo: "imagen"
    src: "/medios/la-elegia/brezo-concepto-y-modelo.webp"
    ancho: 1269
    alto: 820
    alt: "Brezo, el mercader: mi concepto a la izquierda y el modelo del juego a la derecha, en la misma pose."
  - tipo: "imagen"
    src: "/medios/la-elegia/iridia-concepto-y-modelo.webp"
    ancho: 1455
    alto: 820
    alt: "Iridia: concepto y modelo en la misma pose."
  - tipo: "imagen"
    src: "/medios/la-elegia/capitana-concepto-y-modelo.webp"
    ancho: 1295
    alto: 820
    alt: "La Capitana: concepto y modelo en la misma pose."
---

## Qué es

Dos mods para Minecraft. «La Elegía» es un juego de rol con jefes, mazmorras, cinemáticas, música e interfaz propias. «Coliseo del Mar» es un mod de jefes con una IA que pelea con táctica.

## Para quién

Para jugadores de un servidor de Minecraft que quieren peleas con jefes de verdad. Los dos mods están desplegados en mi propio servidor.

## Cómo funciona

1. Un script dibuja las texturas y arma el modelo de cada criatura.
2. Una prueba automática valida que el modelo cargue bien en el juego.
3. El jefe pelea con su propia IA: elige ataques, esquiva y cambia de fase.
4. Un bot de prueba juega la pelea completa y se comprueba que no haya errores.
5. Se publica en el servidor con respaldo previo.

## Mi papel

Dirigí a varios agentes de IA que trabajaban en ramas paralelas, cada uno en su área: criaturas, objetos e interfaz. Yo repartí el trabajo, decidí el diseño e integré el resultado. Probé y corregí cada tanda antes de seguir.

## La prueba

La Elegía suma unas 43,000 líneas de Java y 376 commits. Una pelea completa contra un jefe se probó con un bot, sin errores. Coliseo del Mar está desplegado con 6 jefes con cuerpo propio.

## Tecnología

Java 25, Fabric (la base para hacer mods), GeckoLib (animación de modelos), Gradle y herramientas propias en Python.
