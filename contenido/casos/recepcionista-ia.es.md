---
titulo: "Recepcionista con IA por WhatsApp"
slug: "recepcionista-ia"
orden: 1
anio: 2026
tipo: "producto"
resumen: "Contesta por WhatsApp a los pacientes de una clínica dental y les agenda su cita."
papel: "Fundador y desarrollador: decidí el diseño, dirigí a la IA que escribió el código, exigí las pruebas y lo puse en producción."
tecnologia:
  - "TypeScript"
  - "Node.js"
  - "Anthropic SDK (tool use)"
  - "WhatsApp Cloud API"
  - "Google Calendar"
  - "Supabase"
cifras:
  - valor: "523"
    etiqueta: "pruebas automáticas aprobadas"
  - valor: "78"
    etiqueta: "commits (cambios guardados)"
  - valor: "~14,000"
    etiqueta: "líneas de TypeScript"
privado: true
escena: "recepcionista-whatsapp"
portada: "/medios/recepcionista-ia/portada.webp"
medios:
  - tipo: "video"
    src: "/medios/recepcionista-ia/conversacion.mp4"
    poster: "/medios/recepcionista-ia/conversacion.jpg"
    ancho: 540
    alto: 1168
    alt: "Conversación real por WhatsApp con una clínica de demostración: el asistente da el precio, revisa la agenda y confirma la cita."
  - tipo: "video"
    src: "/medios/recepcionista-ia/anuncio.mp4"
    poster: "/medios/recepcionista-ia/anuncio.jpg"
    ancho: 720
    alto: 1280
    alt: "Anuncio de YaContesto: un paciente escribe a las 11 de la noche y el asistente le agenda."
---

## Qué es

Un asistente con IA que atiende el WhatsApp de una clínica dental. Responde dudas, da precios y maneja la agenda de citas.

## Para quién

Para clínicas dentales en México, donde el WhatsApp se acumula y la recepción no alcanza a contestar todo.

## Cómo funciona

1. Un paciente escribe al WhatsApp de la clínica.
2. La IA le contesta con los servicios, precios y horarios que la clínica aprobó.
3. Revisa la agenda antes de ofrecer una hora.
4. Agenda, cancela o cambia la cita en el calendario de la clínica.
5. Si hace falta una persona, le pasa la conversación al equipo.

## Mi papel

Lo concebí, lo diseñé y lo llevé a producción. Dirigí a Claude Code para escribir el código, definí qué podía y qué no podía hacer el asistente, y revisé cada cambio. También llevé la parte comercial: prospección, propuestas, contrato de prueba e instalación en sitio.

## La prueba

Salió a producción en septiembre de 2026 con una clínica dental real, usando la API oficial de WhatsApp y el número de la propia clínica. Tiene 523 pruebas automáticas aprobadas. Quiere decir que cada cambio se comprueba solo antes de publicarse, para que un arreglo no rompa lo que ya funcionaba.

## Tecnología

TypeScript, Node.js, SDK de Anthropic con tool use, WhatsApp Cloud API, Google Calendar y Supabase.
