---
titulo: "La Isla, my Linux desktop"
slug: "la-isla"
orden: 7
anio: 2026
tipo: "escritorio"
resumen: "The bar and panels of my Linux desktop: fast, light and with an identity of their own."
papel: "I wrote the philosophy and the memory limits, and directed the AI that built the bar and its engine."
tecnologia:
  - "Quickshell (QML)"
  - "Rust"
  - "Hyprland"
  - "Fedora 44"
cifras:
  - valor: "~173 MB"
    etiqueta: "of memory in use, with all panels open"
  - valor: "1.8 MB"
    etiqueta: "of memory for the Rust engine"
privado: true
escena: "isla-barra"
portada: "/medios/la-isla/control.webp"
medios:
  - tipo: "video"
    src: "/medios/la-isla/isla-paneles.mp4"
    poster: "/medios/la-isla/isla-paneles.jpg"
    ancho: 1920
    alto: 1080
    alt: "The island transforms: from idle to Control, to Today, to the launcher and back."
  - tipo: "imagen"
    src: "/medios/la-isla/control.webp"
    ancho: 1920
    alto: 1080
    alt: "The Control panel: toggles, sound and the system figures served by the Rust engine."
  - tipo: "imagen"
    src: "/medios/la-isla/hoy-calendario.webp"
    ancho: 1920
    alto: 1080
    alt: "The Today panel: calendar, shortcut of the day and notifications."
  - tipo: "imagen"
    src: "/medios/la-isla/atajos-busqueda.webp"
    ancho: 1920
    alto: 1080
    alt: "The shortcut guide, with search."
  - tipo: "imagen"
    src: "/medios/la-isla/lanzador.webp"
    ancho: 1920
    alto: 1080
    alt: "The launcher: search apps, windows, files and actions."
  - tipo: "imagen"
    src: "/medios/la-isla/todas-las-apps.webp"
    ancho: 1920
    alto: 1080
    alt: "The grid of all apps, by category."
  - tipo: "video"
    src: "/medios/la-isla/menu-y-atajos.mp4"
    poster: "/medios/la-isla/menu-y-atajos.jpg"
    ancho: 1920
    alto: 1080
    alt: "The desktop right-click menu and the shortcut guide in use."
  - tipo: "imagen"
    src: "/medios/la-isla/isla-reposo.webp"
    ancho: 1920
    alto: 1080
    alt: "The island at rest over one of my own animated wallpapers, drawn by a shader."
  - tipo: "imagen"
    src: "/medios/la-isla/menu-capturas.webp"
    ancho: 1920
    alto: 1080
    alt: "The desktop menu with its screenshot submenu."
  - tipo: "imagen"
    src: "/medios/la-isla/energia.webp"
    ancho: 1920
    alto: 1080
    alt: "The power panel."
  - tipo: "imagen"
    src: "/medios/la-isla/notificacion.webp"
    ancho: 1920
    alto: 1080
    alt: "A notification coming out of the island."
  - tipo: "imagen"
    src: "/medios/la-isla/selector-fondos-vivos.webp"
    ancho: 1920
    alto: 1080
    alt: "The wallpaper picker in slanted strips."
  - tipo: "imagen"
    src: "/medios/la-isla/terminal-kitty.webp"
    ancho: 1920
    alto: 1080
    alt: "The terminal with the same theme."
---

## What it is

"La Isla" is the bar and set of panels on my desktop. Behind it is a small engine in Rust that watches the system.

## Who it's for

For me, as a daily work tool: streams, mods, servers and websites. It shows that I know how to set performance rules.

## How it works

1. The Rust engine runs all the time and watches the system: processor, memory, network and open games.
2. The bar asks for what it needs through a local channel.
3. Each panel is created when it opens and destroyed when it closes.
4. If something freezes, there is a backup and the bar goes back to the previous one on its own.

## My role

I set out eight principles in writing, with memory limits and animation rules. I directed the AI that programmed the pieces. A piece is only done once it is measured against those limits and I use it and confirm it feels right.

## The proof

Measured on November 21, 2026: freshly opened, it uses about 137 MB. With all panels used, it settles at about 173 MB and does not keep growing over the hours. The Rust engine uses 1.8 MB.

## Technology

Quickshell with QML for what you see, Rust for the engine, on Hyprland in Fedora 44.
