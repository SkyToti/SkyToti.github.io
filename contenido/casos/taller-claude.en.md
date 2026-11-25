---
titulo: "taller-claude"
slug: "taller-claude"
orden: 5
anio: 2026
tipo: "codigo-abierto"
resumen: "A team of AI agents where one plans and six carry out the work, each on the cheapest model that fits."
papel: "I designed how the work is split, the rules for the reports and the controls, and directed the AI that built it."
tecnologia:
  - "Plugin de Claude Code"
  - "Subagentes"
  - "Skills"
  - "Hooks"
  - "Bash"
  - "jq"
cifras:
  - valor: "6"
    etiqueta: "specialized agents"
  - valor: "3"
    etiqueta: "routing evaluation cases"
repo: "https://github.com/SkyToti/taller-claude"
privado: false
escena: "orquesta-agentes"
---

## What it is

A plugin for Claude Code that splits work among AI agents. One plans and the rest carry it out.

## Who it's for

Anyone who works with AI agents and wants control over the cost and quality of what they deliver.

## How it works

1. A planner receives the request and breaks it down.
2. It hands each task to the right agent: explore, research, write, program or verify.
3. Each agent uses a fixed model chosen by cost: Haiku, Sonnet or Opus.
4. Each one returns a short report in a fixed format.
5. Automatic controls check the format, limit which files each agent can touch and log every run.

## My role

I designed the whole system: who does what, with which model, what each agent can write and how they report. I directed the AI that built it. This same team of agents works on my other projects.

## The proof

It includes three routing evaluations, which check that each type of request reaches the right agent. The controls keep a log with the date, agent, model and duration of every call.

## Technology

A Claude Code plugin with subagents, skills and hooks (automatic controls), written in Bash and jq.
