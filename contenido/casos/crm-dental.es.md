---
titulo: "CRM dental"
slug: "crm-dental"
orden: 2
anio: 2026
tipo: "producto"
resumen: "El sistema donde una clínica dental lleva su agenda, sus pacientes, sus presupuestos y su caja."
papel: "Fundador y desarrollador: definí qué debía hacer, dirigí a la IA que lo programó y exigí las pruebas."
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
    etiqueta: "pruebas automáticas aprobadas"
  - valor: "99"
    etiqueta: "commits (cambios guardados)"
  - valor: "~34,700"
    etiqueta: "líneas de TypeScript"
privado: true
escena: "crm-agenda"
demo: "/demo/crm/index.html"
portada: "/medios/crm-dental/4-agenda-hoy-1280.webp"
medios:
  - tipo: "imagen"
    src: "/medios/crm-dental/4-agenda-hoy-1280.webp"
    ancho: 1280
    alto: 800
    alt: "Agenda del día por sillón, con datos de una clínica ficticia."
  - tipo: "imagen"
    src: "/medios/crm-dental/tablero-1280.webp"
    ancho: 1280
    alto: 800
    alt: "Tablero del dueño: citas de la semana, pacientes nuevos y lo cobrado."
  - tipo: "imagen"
    src: "/medios/crm-dental/presupuesto.webp"
    ancho: 1280
    alto: 800
    alt: "Presupuesto de un paciente ficticio, con la firma de aceptación."
  - tipo: "imagen"
    src: "/medios/crm-dental/caja.webp"
    ancho: 1280
    alto: 800
    alt: "Corte de caja: lo cobrado en efectivo y con tarjeta."
  - tipo: "imagen"
    src: "/medios/crm-dental/7-expediente-1280.webp"
    ancho: 1280
    alto: 800
    alt: "Expediente clínico con una nota firmada y cerrada."
  - tipo: "imagen"
    src: "/medios/crm-dental/5-whatsapp-1280.webp"
    ancho: 1280
    alto: 800
    alt: "Una cita agendada por la recepcionista de WhatsApp aparece en la agenda."
  - tipo: "imagen"
    src: "/medios/crm-dental/tablero-390.webp"
    ancho: 390
    alto: 844
    alt: "El tablero en un celular."
  - tipo: "imagen"
    src: "/medios/crm-dental/4-agenda-hoy-390.webp"
    ancho: 390
    alto: 844
    alt: "La agenda en un celular."
---

## Qué es

Una aplicación para el consultorio. Ahí viven la agenda de cada doctor, los pacientes, los presupuestos, los cobros y la caja.

## Para quién

Para recepción, doctores y dueños de clínicas dentales.

## Cómo funciona

1. Recepción abre la agenda por doctor.
2. Agenda la cita de un paciente en un hueco libre.
3. Con el paciente, el doctor arma el presupuesto.
4. Recepción cobra y registra el pago en la caja.
5. La recepcionista de WhatsApp lee de aquí los precios, los horarios y la agenda.

## Mi papel

Decidí qué debía resolver y cómo se organizaba por dentro. Dirigí a Claude Code para programarlo, escribí las reglas que no se podían romper y revisé cada cambio. Nada se acepta sin que pasen las pruebas.

## La prueba

420 pruebas automáticas aprobadas, más pruebas de punta a punta, que recorren la aplicación como lo haría una persona. En cristiano: cada vez que cambia algo, la máquina comprueba que lo anterior siga funcionando.

## Tecnología

React 19, Vite, TypeScript, Supabase (PostgreSQL), Vitest, Playwright, app instalable (PWA) y monorepo con pnpm.
