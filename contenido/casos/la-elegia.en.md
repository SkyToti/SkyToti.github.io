---
titulo: "Minecraft mods: La Elegía and Coliseo del Mar"
slug: "la-elegia"
orden: 6
anio: 2026
tipo: "juego"
resumen: "Two Minecraft mods with creatures and bosses that have their own models and animations."
papel: "I directed and merged the work of several AI agents on parallel branches, and decided what went in and what didn't."
tecnologia:
  - "Java 25"
  - "Fabric"
  - "GeckoLib"
  - "Gradle"
  - "Herramientas en Python"
cifras:
  - valor: "59"
    etiqueta: "animations for the boss Aurelion"
  - valor: "~43,000"
    etiqueta: "lines of Java in La Elegía"
  - valor: "376"
    etiqueta: "commits (saved changes) in La Elegía"
  - valor: "6"
    etiqueta: "bosses with their own bodies in Coliseo del Mar"
privado: true
escena: "jefe-del-mar"
portada: "/medios/la-elegia/portada.webp"
medios:
  - tipo: "video"
    src: "/medios/la-elegia/aurelion.mp4"
    poster: "/medios/la-elegia/aurelion.jpg"
    ancho: 720
    alto: 720
    alt: "Aurelion, the first-floor boss: eleven of his 59 animations, from waking up to falling."
  - tipo: "video"
    src: "/medios/la-elegia/la-torre.mp4"
    poster: "/medios/la-elegia/la-torre.jpg"
    ancho: 720
    alto: 1280
    alt: "The 100-floor tower, 4,000 blocks tall with a castle on top, built by an AI inside the game."
  - tipo: "imagen"
    src: "/medios/la-elegia/aurelion-hoja.webp"
    ancho: 1680
    alto: 1418
    alt: "Aurelion’s model sheet: views, palette, 69-bone rig and the list of animations."
  - tipo: "imagen"
    src: "/medios/la-elegia/brezo-concepto-y-modelo.webp"
    ancho: 1269
    alto: 820
    alt: "Brezo, the merchant: my concept on the left and the in-game model on the right, in the same pose."
  - tipo: "imagen"
    src: "/medios/la-elegia/iridia-concepto-y-modelo.webp"
    ancho: 1455
    alto: 820
    alt: "Iridia: concept and model in the same pose."
  - tipo: "imagen"
    src: "/medios/la-elegia/capitana-concepto-y-modelo.webp"
    ancho: 1295
    alto: 820
    alt: "The Captain: concept and model in the same pose."
---

## What it is

Two mods for Minecraft. "La Elegía" is a role-playing game with its own bosses, dungeons, cutscenes, music and interface. "Coliseo del Mar" is a boss mod with an AI that fights with tactics.

## Who it's for

Players on a Minecraft server who want real boss fights. Both mods are deployed on my own server.

## How it works

1. A script draws the textures and builds the model of each creature.
2. An automated test checks that the model loads correctly in the game.
3. The boss fights with its own AI: it picks attacks, dodges and changes phase.
4. A test bot plays the whole fight, and we check that there are no errors.
5. It is published to the server, with a backup first.

## My role

I directed several AI agents working on parallel branches, each in its own area: creatures, items and interface. I split the work, decided the design and merged the result. I tested and fixed each batch before moving on.

## The proof

La Elegía adds up to about 43,000 lines of Java and 376 commits. A complete fight against a boss was tested with a bot, with no errors. Coliseo del Mar is deployed with 6 bosses that have their own bodies.

## Technology

Java 25, Fabric (the base for making mods), GeckoLib (model animation), Gradle and custom tools in Python.
