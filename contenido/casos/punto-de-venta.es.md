---
titulo: "Punto de venta de mi librería"
slug: "punto-de-venta"
orden: 9
anio: 2026
tipo: "producto"
resumen: "El sistema con el que cobraba y llevaba el inventario de mi propia librería."
papel: "Fui el cliente, el usuario y quien lo construyó: decidí qué pantallas hacían falta, dirigí a la IA que escribió el código y lo usé en el mostrador."
tecnologia:
  - "Next.js 16"
  - "React 19"
  - "Supabase (PostgreSQL)"
  - "Tailwind CSS 4"
  - "Zustand"
  - "Vitest"
  - "Playwright"
cifras:
  - valor: "17"
    etiqueta: "pruebas automáticas escritas"
  - valor: "5"
    etiqueta: "pantallas: venta, inventario, proveedores, reportes y usuarios"
privado: true
escena: "caja-libreria"
portada: "/medios/punto-de-venta/punto-de-venta.webp"
medios:
  - tipo: "imagen"
    src: "/medios/punto-de-venta/punto-de-venta.webp"
    ancho: 1280
    alto: 800
    alt: "Pantalla de venta con tres libros en el carrito, en una librería de ejemplo."
  - tipo: "imagen"
    src: "/medios/punto-de-venta/inventario.webp"
    ancho: 1280
    alto: 800
    alt: "Inventario de libros con precio y existencias."
  - tipo: "imagen"
    src: "/medios/punto-de-venta/reportes.webp"
    ancho: 1280
    alto: 800
    alt: "Historial de ventas, que se exporta a Excel."
  - tipo: "imagen"
    src: "/medios/punto-de-venta/proveedores.webp"
    ancho: 1280
    alto: 800
    alt: "Lista de proveedores, con datos de ejemplo."
  - tipo: "imagen"
    src: "/medios/punto-de-venta/inicio-de-sesion.webp"
    ancho: 1280
    alto: 800
    alt: "Inicio de sesión del sistema."
---

## Qué es

El sistema de caja de Mr. Beelector, mi librería en el Callejón del Libro de Cuernavaca. Con él se cobra, se lleva el inventario, se registran los proveedores y se sacan los reportes de ventas.

## Para quién

Lo hice para mí: yo atendía el puesto y yo lo administraba. Aun así, cada persona entra con su cuenta y ve solo lo que le toca.

## Cómo funciona

1. Quien atiende busca el libro por nombre o por su código.
2. Lo agrega al carrito y cobra en efectivo o con tarjeta.
3. La venta descuenta sola las existencias del inventario.
4. El sistema avisa cuando un libro se está acabando.
5. Quien administra descarga el reporte de ventas en Excel.

## Mi papel

Fui el cliente, el usuario y quien lo construyó. Decidí las pantallas y las reglas con lo que me hacía falta en el mostrador, dirigí a la IA que escribió el código y lo fui corrigiendo con el uso. Hoy el sistema está en pausa.

## La prueba

Las capturas son del sistema real, corriendo con una librería de ejemplo: los libros, los proveedores y las ventas que se ven son inventados. Tiene 17 pruebas automáticas escritas para ventas, libros, proveedores y usuarios.

## Tecnología

Next.js 16, React 19, Supabase, Tailwind CSS 4, Zustand, Vitest y Playwright.
