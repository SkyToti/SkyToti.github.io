// Compuerta de privacidad (DIRECCION.md §8): recorre los HTML de out/ y falla si encuentra algo que no debe
// publicarse: «PENDIENTE», un enlace de WhatsApp (wa.me), un enlace tel: o un número de teléfono (10 dígitos
// con o sin espacios/guiones, o +52). Corre al final de `npm run check`.
//   node scripts/privacidad.mjs [carpeta]      (por omisión out/)
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const PALABRAS = [
  { nombre: "PENDIENTE", re: /PENDIENTE/ },
  { nombre: "enlace de WhatsApp (wa.me)", re: /wa\.me/i },
  { nombre: "enlace tel:", re: /\btel:/i },
  { nombre: "prefijo +52", re: /\+\s?52(?=[\s\d(-])/ },
];
// 10 dígitos seguidos, o separados por un espacio, guion o punto, sin más dígitos pegados a los lados.
const TELEFONO = /(?<![\d,.])\d(?:[ \-.]?\d){9}(?![\d])/;

/** Lo que lee una persona o un buscador: el texto sin etiquetas, más los atributos que llevan texto o enlaces. */
function textoLegible(html) {
  const sinCodigo = html
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<svg\b[\s\S]*?<\/svg>/gi, " ");
  const atributos = [...sinCodigo.matchAll(/\s(?:href|content|alt|title|aria-label|value)="([^"]*)"/gi)].map((m) => m[1]);
  const texto = sinCodigo.replace(/<[^>]+>/g, " ").replace(/&nbsp;|&#160;/g, " ");
  return [texto, ...atributos].join("\n");
}

function* htmlDe(dir) {
  for (const nombre of readdirSync(dir)) {
    const ruta = join(dir, nombre);
    if (statSync(ruta).isDirectory()) yield* htmlDe(ruta);
    else if (nombre.endsWith(".html")) yield ruta;
  }
}

/** Lista de hallazgos `archivo: qué` (vacía si todo está limpio). */
export function revisar(dir) {
  const hallazgos = [];
  for (const archivo of htmlDe(dir)) {
    const html = readFileSync(archivo, "utf8");
    const nombre = relative(dir, archivo);
    for (const { nombre: que, re } of PALABRAS) {
      const m = re.exec(html);
      if (m) hallazgos.push(`${nombre}: ${que} («${html.slice(Math.max(0, m.index - 20), m.index + 30).replace(/\s+/g, " ")}»)`);
    }
    const tel = TELEFONO.exec(textoLegible(html));
    if (tel) hallazgos.push(`${nombre}: parece un teléfono («${tel[0]}»)`);
  }
  return hallazgos;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dir = process.argv[2] || "out";
  const hallazgos = revisar(dir);
  if (hallazgos.length) {
    console.error(`privacidad: ${hallazgos.length} hallazgo(s) en ${dir}/`);
    hallazgos.forEach((h) => console.error("  - " + h));
    process.exit(1);
  }
  console.log(`privacidad: ${dir}/ limpio (sin PENDIENTE, wa.me, tel: ni teléfonos)`);
}
