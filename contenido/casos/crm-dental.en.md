---
titulo: "Dental CRM"
slug: "crm-dental"
orden: 2
anio: 2026
tipo: "producto"
resumen: "The system where a dental clinic keeps its schedule, patients, treatment quotes and cash register."
papel: "Founder and developer: I defined what it had to do, directed the AI that programmed it and required the tests."
tecnologia:
  - "React 19"
  - "Vite"
  - "TypeScript"
  - "Supabase (PostgreSQL)"
  - "Vitest"
  - "Playwright"
  - "PWA"
  - "monorepo pnpm"
cifras:
  - valor: "420"
    etiqueta: "automated tests passing"
  - valor: "99"
    etiqueta: "commits (saved changes)"
  - valor: "~34,700"
    etiqueta: "lines of TypeScript"
privado: true
escena: "crm-agenda"
demo: "/demo/crm/index.html"
portada: "/medios/crm-dental/4-agenda-hoy-1280.webp"
medios:
  - tipo: "imagen"
    src: "/medios/crm-dental/4-agenda-hoy-1280.webp"
    ancho: 1280
    alto: 800
    alt: "Daily schedule by chair, with data from a fictional clinic."
  - tipo: "imagen"
    src: "/medios/crm-dental/tablero-1280.webp"
    ancho: 1280
    alto: 800
    alt: "Owner dashboard: appointments this week, new patients and money collected."
  - tipo: "imagen"
    src: "/medios/crm-dental/presupuesto.webp"
    ancho: 1280
    alto: 800
    alt: "A fictional patient’s treatment estimate, with the acceptance signature."
  - tipo: "imagen"
    src: "/medios/crm-dental/caja.webp"
    ancho: 1280
    alto: 800
    alt: "Cash register closing: what was collected in cash and by card."
  - tipo: "imagen"
    src: "/medios/crm-dental/7-expediente-1280.webp"
    ancho: 1280
    alto: 800
    alt: "Clinical record with a signed, closed note."
  - tipo: "imagen"
    src: "/medios/crm-dental/5-whatsapp-1280.webp"
    ancho: 1280
    alto: 800
    alt: "An appointment booked by the WhatsApp receptionist shows up on the schedule."
  - tipo: "imagen"
    src: "/medios/crm-dental/tablero-390.webp"
    ancho: 390
    alto: 844
    alt: "The dashboard on a phone."
  - tipo: "imagen"
    src: "/medios/crm-dental/4-agenda-hoy-390.webp"
    ancho: 390
    alto: 844
    alt: "The schedule on a phone."
---

## What it is

An application for the clinic. It holds each doctor's schedule, the patients, the treatment quotes, the payments and the cash register.

## Who it's for

Front desk staff, doctors and owners of dental clinics.

## How it works

1. The front desk opens the schedule by doctor.
2. They book a patient's appointment in a free slot.
3. The doctor builds the treatment quote with the patient.
4. The front desk collects payment and records it in the cash register.
5. The WhatsApp receptionist reads prices, hours and the schedule from here.

## My role

I decided what it had to solve and how it was organized inside. I directed Claude Code to program it, wrote the rules that could not be broken and reviewed every change. Nothing is accepted unless the tests pass.

## The proof

420 automated tests passing, plus end-to-end tests that go through the application the way a person would. In plain words: every time something changes, the machine checks that what came before still works.

## Technology

React 19, Vite, TypeScript, Supabase (PostgreSQL), Vitest, Playwright, an installable app (PWA) and a pnpm monorepo.
