---
titulo: "AI receptionist on WhatsApp"
slug: "recepcionista-ia"
orden: 1
anio: 2026
tipo: "producto"
resumen: "It answers a dental clinic's patients on WhatsApp and books their appointments."
papel: "Founder and developer: I decided the design, directed the AI that wrote the code, required the tests and put it into production."
tecnologia:
  - "TypeScript"
  - "Node.js"
  - "Anthropic SDK (tool use)"
  - "WhatsApp Cloud API"
  - "Google Calendar"
  - "Supabase"
cifras:
  - valor: "523"
    etiqueta: "automated tests passing"
  - valor: "78"
    etiqueta: "commits (saved changes)"
  - valor: "~14,000"
    etiqueta: "lines of TypeScript"
privado: true
escena: "recepcionista-whatsapp"
portada: "/medios/recepcionista-ia/portada.webp"
medios:
  - tipo: "video"
    src: "/medios/recepcionista-ia/conversacion.mp4"
    poster: "/medios/recepcionista-ia/conversacion.jpg"
    ancho: 540
    alto: 1168
    alt: "A real WhatsApp conversation with a demo clinic: the assistant gives the price, checks the calendar and confirms the appointment."
  - tipo: "video"
    src: "/medios/recepcionista-ia/anuncio.mp4"
    poster: "/medios/recepcionista-ia/anuncio.jpg"
    ancho: 720
    alto: 1280
    alt: "YaContesto ad: a patient writes at 11 p.m. and the assistant books the appointment."
---

## What it is

An AI assistant that handles a dental clinic's WhatsApp. It answers questions, gives prices and manages the appointment calendar.

## Who it's for

Dental clinics in Mexico, where WhatsApp messages pile up and the front desk can't answer them all.

## How it works

1. A patient writes to the clinic's WhatsApp.
2. The AI replies with the services, prices and hours the clinic approved.
3. It checks the calendar before offering a time.
4. It books, cancels or changes the appointment in the clinic's calendar.
5. If a person is needed, it hands the conversation to the team.

## My role

I came up with it, designed it and took it to production. I directed Claude Code to write the code, set what the assistant could and could not do, and reviewed every change. I also handled the business side: prospecting, proposals, a trial contract and on-site installation.

## The proof

It went into production in September 2026 with a real dental clinic, using the official WhatsApp API and the clinic's own number. It has 523 automated tests passing. That means every change is checked automatically before it is published, so a fix doesn't break what already worked.

## Technology

TypeScript, Node.js, Anthropic SDK with tool use, WhatsApp Cloud API, Google Calendar and Supabase.
