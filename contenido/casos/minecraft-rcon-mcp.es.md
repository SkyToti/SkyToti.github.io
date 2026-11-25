---
titulo: "minecraft-rcon-mcp"
slug: "minecraft-rcon-mcp"
orden: 4
anio: 2026
tipo: "codigo-abierto"
resumen: "Deja que una IA maneje un servidor de Minecraft, pero los comandos peligrosos los aprueba una persona."
papel: "Diseñé las reglas de seguridad, dirigí a la IA que escribió el código y exigí pruebas de ataque."
tecnologia:
  - "Python"
  - "Model Context Protocol (MCP) SDK"
  - "pytest"
  - "GitHub Actions"
  - "Licencia MIT"
cifras:
  - valor: "1,092"
    etiqueta: "pruebas automáticas aprobadas"
  - valor: "227"
    etiqueta: "ataques escritos como prueba"
  - valor: "11"
    etiqueta: "fallas encontradas, todas corregidas"
repo: "https://github.com/SkyToti/minecraft-rcon-mcp"
privado: false
escena: "puerta-con-folio"
---

## Qué es

Un puente entre un agente de IA y un servidor de Minecraft. El agente puede consultar y hacer tareas rutinarias. Lo peligroso, como apagar el servidor, no corre solo.

## Para quién

Para quien administra un servidor y quiere ayuda de una IA sin darle las llaves de todo. Es de código abierto, con licencia MIT.

## Cómo funciona

1. El agente pide un comando.
2. El servidor lo limpia y lo clasifica: leer, escribir, confirmar o negar.
3. Lo seguro corre al momento.
4. Lo peligroso devuelve un folio de un solo uso, atado a ese comando exacto.
5. Una persona lo aprueba fuera del modelo, y solo entonces corre.

## Mi papel

Decidí el modelo de seguridad: la IA no se autoriza a sí misma. Dirigí a Claude Code para escribirlo y encargué revisiones adversariales, que son intentos de romperlo. Cada falla encontrada se volvió una prueba permanente.

## La prueba

227 ataques escritos como pruebas dieron 11 hallazgos, todos corregidos. En total son 1,092 pruebas aprobadas. Incluyen intentos de engañar a la IA con mensajes del chat del juego y de filtrar contraseñas.

## Tecnología

Python, MCP (el estándar para que una IA use herramientas), RCON (el control remoto del servidor de Minecraft), pytest y GitHub Actions.
