# Demo del CRM dental (concepto de diseño)

Vite + React 19 + Tailwind 4 + motion, solo frontend. Todos los datos son de ejemplo: «Clínica Dental Ejemplo»
con Centro, Norte (y Sur, por abrir), Imagen Dental, laboratorio y especialidades; doctores ficticios.

```bash
npm run demo:crm        # desde la raíz del portafolio: npm ci + build → public/demo/crm/ (se guarda en git)
npm run demo-limpia     # la compuerta: ningún término de la lista negra en src/, index.html ni lo compilado
```

- Se sirve en `/demo/crm/` (`base` de `vite.config.ts`); sin mapas de fuente.
- Queda fuera del `tsconfig.json`, de ESLint y de las pruebas del portafolio: tiene su propio `tsc`.
- Recorrido guiado: mantener apretada la marca «Tu CRM» 1.5 s, escribir «recorrido» en la búsqueda (`/`) o
  abrir `/demo/crm/?presentar=1`. Espacio pausa, ← → paso a paso, 1 a 13 saltan de capítulo, Esc sale.
