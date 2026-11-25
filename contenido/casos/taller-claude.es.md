---
titulo: "taller-claude"
slug: "taller-claude"
orden: 5
anio: 2026
tipo: "codigo-abierto"
resumen: "Un equipo de agentes de IA donde uno planea y seis ejecutan, cada uno con el modelo que cuesta menos."
papel: "Diseñé el reparto de trabajo, las reglas de los informes y los controles, y dirigí a la IA que lo construyó."
tecnologia:
  - "Plugin de Claude Code"
  - "Subagentes"
  - "Skills"
  - "Hooks"
  - "Bash"
  - "jq"
cifras:
  - valor: "6"
    etiqueta: "agentes especializados"
  - valor: "3"
    etiqueta: "casos de evaluación del enrutamiento"
repo: "https://github.com/SkyToti/taller-claude"
privado: false
escena: "orquesta-agentes"
---

## Qué es

Un plugin para Claude Code que reparte el trabajo entre agentes de IA. Uno planea y los demás ejecutan.

## Para quién

Para quien trabaja con agentes de IA y quiere control sobre el costo y la calidad de lo que entregan.

## Cómo funciona

1. Un planificador recibe el encargo y lo divide.
2. Reparte cada tarea al agente que le toca: explorar, investigar, redactar, programar o verificar.
3. Cada agente usa un modelo fijo según el costo: Haiku, Sonnet u Opus.
4. Cada uno devuelve un informe corto con un formato fijo.
5. Unos controles automáticos revisan el formato, limitan qué archivos puede tocar cada agente y anotan cada ejecución.

## Mi papel

Diseñé el sistema completo: quién hace qué, con qué modelo, qué puede escribir y cómo se informa. Dirigí a la IA que lo construyó. Este mismo equipo de agentes sirve para trabajar mis otros proyectos.

## La prueba

Trae tres evaluaciones de enrutamiento, que comprueban que cada tipo de encargo llegue al agente correcto. Los controles dejan una bitácora con la fecha, el agente, el modelo y la duración de cada llamada.

## Tecnología

Plugin de Claude Code con subagentes, skills y hooks (controles automáticos), en Bash y jq.
