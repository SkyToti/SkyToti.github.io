---
titulo: "Point of sale for my own bookstore"
slug: "punto-de-venta"
orden: 9
anio: 2026
tipo: "producto"
resumen: "The system I used to ring up sales and track inventory at my own bookstore."
papel: "I was the client, the user and the builder: I decided which screens were needed, directed the AI that wrote the code, and used it at the counter."
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
    etiqueta: "automated tests written"
  - valor: "5"
    etiqueta: "screens: sales, inventory, suppliers, reports and users"
privado: true
escena: "caja-libreria"
portada: "/medios/punto-de-venta/punto-de-venta.webp"
medios:
  - tipo: "imagen"
    src: "/medios/punto-de-venta/punto-de-venta.webp"
    ancho: 1280
    alto: 800
    alt: "Checkout screen with three books in the cart, in a sample bookstore."
  - tipo: "imagen"
    src: "/medios/punto-de-venta/inventario.webp"
    ancho: 1280
    alto: 800
    alt: "Book inventory with prices and stock."
  - tipo: "imagen"
    src: "/medios/punto-de-venta/reportes.webp"
    ancho: 1280
    alto: 800
    alt: "Sales history, exportable to Excel."
  - tipo: "imagen"
    src: "/medios/punto-de-venta/proveedores.webp"
    ancho: 1280
    alto: 800
    alt: "Supplier list, with sample data."
  - tipo: "imagen"
    src: "/medios/punto-de-venta/inicio-de-sesion.webp"
    ancho: 1280
    alto: 800
    alt: "The system’s sign-in screen."
---

## What it is

The checkout system for Mr. Beelector, my bookstore at the Callejón del Libro book market in Cuernavaca. It rings up sales, tracks inventory, keeps the supplier list and produces sales reports.

## Who it's for

I built it for myself: I worked the stall and I ran it. Even so, each person signs in with their own account and sees only what they need.

## How it works

1. The person at the counter looks up a book by name or by its code.
2. They add it to the cart and charge in cash or by card.
3. The sale takes the book out of inventory on its own.
4. The system warns when a book is running low.
5. The manager downloads the sales report in Excel.

## My role

I was the client, the user and the builder. I decided the screens and the rules from what I needed at the counter, directed the AI that wrote the code, and kept fixing it as I used it. The system is paused today.

## The proof

The screenshots are from the real system, running with a sample bookstore: the books, suppliers and sales you see are made up. It has 17 automated tests written for sales, books, suppliers and users.

## Technology

Next.js 16, React 19, Supabase, Tailwind CSS 4, Zustand, Vitest and Playwright.
