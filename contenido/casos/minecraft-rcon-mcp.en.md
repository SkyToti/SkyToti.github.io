---
titulo: "minecraft-rcon-mcp"
slug: "minecraft-rcon-mcp"
orden: 4
anio: 2026
tipo: "codigo-abierto"
resumen: "It lets an AI run a Minecraft server, but a person approves the dangerous commands."
papel: "I designed the security rules, directed the AI that wrote the code and required attack tests."
tecnologia:
  - "Python"
  - "Model Context Protocol (MCP) SDK"
  - "pytest"
  - "GitHub Actions"
  - "Licencia MIT"
cifras:
  - valor: "1,092"
    etiqueta: "automated tests passing"
  - valor: "227"
    etiqueta: "attacks written as tests"
  - valor: "11"
    etiqueta: "flaws found, all fixed"
repo: "https://github.com/SkyToti/minecraft-rcon-mcp"
privado: false
escena: "puerta-con-folio"
---

## What it is

A bridge between an AI agent and a Minecraft server. The agent can look things up and do routine tasks. Anything dangerous, like shutting down the server, does not run on its own.

## Who it's for

Anyone who runs a server and wants help from an AI without handing over every key. It is open source, under the MIT license.

## How it works

1. The agent asks for a command.
2. The server cleans it up and sorts it: read, write, confirm or deny.
3. Safe commands run right away.
4. Dangerous commands return a single-use ticket, tied to that exact command.
5. A person approves it outside the model, and only then does it run.

## My role

I decided the security model: the AI does not authorize itself. I directed Claude Code to write it and ordered adversarial reviews, which are attempts to break it. Every flaw found became a permanent test.

## The proof

227 attacks written as tests turned up 11 findings, all fixed. In total, 1,092 tests pass. They include attempts to trick the AI with messages from the game chat and attempts to leak passwords.

## Technology

Python, MCP (the standard for letting an AI use tools), RCON (the remote control for a Minecraft server), pytest and GitHub Actions.
