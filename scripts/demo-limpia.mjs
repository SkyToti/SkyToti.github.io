// Compuerta de limpieza de la demo del CRM: falla si en el código de la demo o en lo compilado aparece un
// término de la lista negra (nombres, lugares y marcas del proyecto privado del que salió el diseño).
// La lista NO se escribe en claro: son hashes SHA-256 del término normalizado (minúsculas, sin acentos, solo
// letras y números separados por un espacio). Se comparan:
//   · por palabra: cada ventana de 1, 2 y 3 palabras seguidas del texto;
//   · por fragmento: cualquier trozo de una palabra con el largo del término (atrapa identificadores pegados).
// También falla si hay mapas de fuente (.map) en lo publicado. Corre en `npm run check`.
//   node scripts/demo-limpia.mjs [ruta ...]   (por omisión: demos/crm/src, demos/crm/index.html, public/demo/crm)
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const RUTAS = ["demos/crm/src", "demos/crm/index.html", "public/demo/crm"];

/** [largo, hash]: se busca dentro de cada palabra */
const POR_FRAGMENTO = [
  [5, "923e5a75dba9dddad9405b0f91af70e8b8a190e5df40ed0f4d367078b6289920"],
  [10, "deda23ecae322a8d5cd4bf6dab70d8a49d95e5c24514c01e0c413e463760d8fd"],
  [7, "99dfc47bbb6fb7b7346dd4fae72fc614e7afac03009b0248b9f760fc29258590"],
  [8, "0940a5da472b15090e9c5600ad1442d8ef779b6b759379b43b6cee5ce7790bfd"],
  [10, "4c88985900ff6ed71d507fd3286865da4d10d893d770620002c3e8e38784ca97"],
  [9, "2e05a838c19979acb76a0b41ff9d922c6be0ffb82b48961e84bff11ef4ee2f26"],
];
/** hashes de palabras o frases completas (de 1 a 3 palabras) */
const POR_PALABRA = [
  "fda36a70efa5b84bf42dfae40e4c7a204f3197debdd6bd2977721268a6c81a1f",
  "7fdf5509bb6dc6eed5be3aa54805b84f69785a3df470523284cbd74c4dd66616",
  "008231aaf99956982ffbb132c5fe9d79272f6f109abdefb723afe455a4213765",
  "c7172ae4dc9d864bc6759147d9e781d7061888a72d5040ccbf39ce24a2b11b63",
  "02ccba012cf3647c6a821132b25e4fa7f91187a60cb7e55f96410680a98b44f0",
  "4459089fbd29ef539163e2a36a80e9db973145c3e1765798ae4c7727b9ec2bb5",
  "522ceeff12b1a8526b737620fa1510921a9e573dab2d33043a4856d331e2ea31",
  "17d81ccc3ec74246f33fcdbeefbf072c0171dabe9f069ba572ba9577fa731342",
  "c692b342c6bf657a4677de74c490fe1571ad2a7850f7bd1010a66fa4b9e86cad",
  "3fe47637c5d17afd37ba5d33ace0f5faf064a23f0ca6764e0f61aedf8ad0bd8e",
  "2eaefb10481705b2d0011829e3f017b11feaf49083d3ab518c42363c289ff74f",
  "6b40506d8d5a01861a3a9681594f55ad074e97db58969c2fed82ba615910d56b",
];

const BINARIOS = new Set([".woff", ".woff2", ".ttf", ".otf", ".png", ".jpg", ".jpeg", ".webp", ".avif", ".gif", ".ico"]);

const sha = (t) => createHash("sha256").update(t).digest("hex");
/** Minúsculas, sin acentos (ñ → n), y solo letras y números */
export const palabras = (texto) => texto.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().match(/[a-z0-9]+/g) ?? [];
export const hashTermino = (termino) => sha(palabras(termino).join(" "));

function* archivos(ruta) {
  if (!existsSync(ruta)) return;
  if (!statSync(ruta).isDirectory()) return yield ruta;
  for (const nombre of readdirSync(ruta)) {
    if (nombre === "node_modules") continue;
    yield* archivos(join(ruta, nombre));
  }
}

/**
 * Hallazgos `archivo: qué` (vacío si está limpio). Nunca repite el término: solo dice qué hash coincidió.
 * `extra` agrega listas (las pruebas lo usan con términos inventados).
 */
export function revisar(rutas = RUTAS, extra = {}) {
  const porPalabra = new Set([...POR_PALABRA, ...(extra.porPalabra ?? [])]);
  const porFragmento = [...POR_FRAGMENTO, ...(extra.porFragmento ?? [])];
  const largos = [...new Set(porFragmento.map(([n]) => n))];
  const fragmentos = new Set(porFragmento.map(([, h]) => h));
  const hallazgos = [];
  for (const ruta of rutas) {
    for (const archivo of archivos(ruta)) {
      const ext = extname(archivo).toLowerCase();
      if (ext === ".map") {
        hallazgos.push(`${archivo}: mapa de fuente publicado`);
        continue;
      }
      if (BINARIOS.has(ext)) continue;
      const ws = palabras(readFileSync(archivo, "utf8"));
      const vistos = new Set();
      for (let i = 0; i < ws.length; i++) {
        for (let n = 1; n <= 3 && i + n <= ws.length; n++) {
          const h = sha(ws.slice(i, i + n).join(" "));
          if (porPalabra.has(h) && !vistos.has(h)) {
            vistos.add(h);
            hallazgos.push(`${archivo}: término de la lista negra (por palabra, ${h.slice(0, 10)}…)`);
          }
        }
      }
      for (const w of new Set(ws)) {
        for (const n of largos) {
          for (let i = 0; i + n <= w.length; i++) {
            const h = sha(w.slice(i, i + n));
            if (fragmentos.has(h) && !vistos.has(h)) {
              vistos.add(h);
              hallazgos.push(`${archivo}: término de la lista negra (dentro de una palabra, ${h.slice(0, 10)}…)`);
            }
          }
        }
      }
    }
  }
  return hallazgos;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const rutas = process.argv.length > 2 ? process.argv.slice(2) : RUTAS;
  const faltan = rutas.filter((r) => !existsSync(r));
  if (faltan.length) {
    console.error(`demo-limpia: no existe ${faltan.join(", ")}`);
    process.exit(1);
  }
  const hallazgos = revisar(rutas);
  if (hallazgos.length) {
    console.error(`demo-limpia: ${hallazgos.length} hallazgo(s)`);
    hallazgos.forEach((h) => console.error("  - " + h));
    process.exit(1);
  }
  console.log(`demo-limpia: limpio (${rutas.join(", ")})`);
}
