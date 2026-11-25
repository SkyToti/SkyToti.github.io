// Lector del contenido en Markdown (perfil, casos y «más»), con el frontmatter validado por zod.
//
// Estructura esperada dentro de la carpeta de contenido (por omisión `contenido/`, o la de CONTENIDO_DIR):
//   perfil.es.md, perfil.en.md
//   casos/<slug>.es.md, casos/<slug>.en.md
//   mas.es.md, mas.en.md            (opcional)
//   guia.es.md, guia.en.md          (opcional: las frases de Haku por estación y las de repuesto)
// Si falta el .en.md, se usa el .es.md y se marca `sinTraducir: true`. Si un frontmatter no cumple el
// esquema, se lanza ErrorDeContenido con la ruta del archivo y el campo: el build falla con ese mensaje.
//
// Este archivo lo importa también `node --test` (pruebas/contenido.test.mjs) con la eliminación de tipos
// de Node: de lib/ solo se importan TIPOS (`import type`), y nada de sintaxis que no se pueda borrar.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { isAbsolute, join, relative, resolve } from "node:path";
import matter from "gray-matter";
import { Marked } from "marked";
import { z } from "zod";
import type { Idioma } from "./idioma";

export const TIPOS_CASO = ["producto", "codigo-abierto", "web", "juego", "escritorio"] as const;
export type TipoCaso = (typeof TIPOS_CASO)[number];

const url = z.url({ protocol: /^https?$/, error: "debe ser una URL http(s) completa" });
const texto = z.string().trim().min(1, "no puede ir vacío");
const rutaPublica = z.string().startsWith("/", "es una ruta dentro de public/, empieza con /");
const cifra = z.object({ valor: z.union([z.number(), texto]).transform(String), etiqueta: texto });

/** Una captura o un video del caso («Se ve así»). `ancho`/`alto` son los del archivo: dan la proporción. */
export const esquemaMedio = z.object({
  tipo: z.enum(["video", "imagen"]),
  src: rutaPublica,
  poster: rutaPublica.optional(),
  ancho: z.number().int().positive(),
  alto: z.number().int().positive(),
  alt: texto,
});
export type Medio = z.output<typeof esquemaMedio>;

export const esquemaCaso = z.object({
  titulo: texto,
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "solo minúsculas, números y guiones"),
  orden: z.number(),
  anio: z.union([z.number().int(), texto]).transform(String),
  tipo: z.enum(TIPOS_CASO),
  resumen: texto.refine((s) => !s.includes("\n"), "debe ser una sola línea"),
  papel: texto,
  tecnologia: z.array(texto).min(1, "pon al menos una"),
  cifras: z.array(cifra).optional(),
  enVivo: url.optional(),
  repo: url.optional(),
  portada: rutaPublica.optional(),
  // Demo interactiva servida por el propio sitio (p. ej. /demo/crm/index.html): se abre en la misma pestaña.
  demo: rutaPublica.optional(),
  medios: z.array(esquemaMedio).default([]),
  // Nombre de la escena animada en kebab-case: el archivo escenas/<escena>.ts (ver ESCENAS.md).
  escena: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "nombre de escena en kebab-case (escenas/<nombre>.ts)").optional(),
  privado: z.boolean(),
});

export const esquemaPerfil = z.object({
  nombre: texto,
  /** El nombre con el que firma la portada («Diego Benítez»). Si falta, se usa `nombre`. */
  nombreCorto: texto.optional(),
  titular: texto.optional(),
  ciudad: texto.optional(),
  disponibilidad: texto.optional(),
  idiomas: texto.optional(),
  correo: z.email().optional(),
  github: url.optional(),
  cifras: z.array(cifra).default([]),
});

export const esquemaMas = z.object({
  titulo: texto.optional(),
  proyectos: z.array(z.object({ nombre: texto, linea: texto, url, imagen: rutaPublica })).default([]),
});

/** Las frases de Haku (MUNDO.md, «Haku, el guía»): por estación (`portada`, `cifras`, el slug de cada caso…) y unas de
 *  repuesto para cuando ya se dijo todo. Solo frontmatter; el cuerpo del archivo se ignora. */
export const esquemaGuia = z.object({
  estaciones: z.record(
    z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "el nombre de la estación va en kebab-case (el mismo `data-estacion`)"),
    z.array(texto).min(1, "pon al menos una frase"),
  ),
  repuesto: z.array(texto).default([]),
});

export type Guia = {
  idioma: Idioma;
  /** true si se pidió inglés y no había guia.en.md: todo es el texto en español. */
  sinTraducir: boolean;
  /** frases por estación (nombre del `data-estacion` → frases, en orden) */
  estaciones: Record<string, string[]>;
  repuesto: string[];
  /** estaciones que faltaban en guia.en.md y se tomaron de guia.es.md (vacío en español) */
  enEspanol: string[];
};

export type Seccion = { titulo: string; id: string; html: string };

type Cuerpo = {
  idioma: Idioma;
  /** true si se pidió inglés y no había .en.md: es el texto en español. */
  sinTraducir: boolean;
  /** HTML de lo que va antes del primer `## ` (puede ir vacío). */
  intro: string;
  secciones: Seccion[];
};

export type Caso = z.output<typeof esquemaCaso> & Cuerpo;
export type Perfil = z.output<typeof esquemaPerfil> & Cuerpo;
export type Mas = z.output<typeof esquemaMas> & Cuerpo;

export class ErrorDeContenido extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = "ErrorDeContenido";
  }
}

const conversor = new Marked({ gfm: true, async: false });
const aHtml = (md: string): string => (md.trim() ? (conversor.parse(md) as string) : "");

/** «Cómo lo hice» → «como-lo-hice». */
export function aId(titulo: string): string {
  return (
    titulo
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "seccion"
  );
}

/** Parte el cuerpo en lo de antes del primer `## ` y una sección por cada `## ` (ignora los de bloques de código). */
export function partirEnSecciones(md: string): { intro: string; secciones: Seccion[] } {
  const bloques: { titulo: string | null; lineas: string[] }[] = [{ titulo: null, lineas: [] }];
  let enCodigo = false;
  for (const linea of md.split(/\r?\n/)) {
    if (/^\s{0,3}(```|~~~)/.test(linea)) enCodigo = !enCodigo;
    const titulo = !enCodigo && /^## +(.+?)\s*#*\s*$/.exec(linea);
    if (titulo && titulo[1]) bloques.push({ titulo: titulo[1].trim(), lineas: [] });
    else bloques[bloques.length - 1]!.lineas.push(linea);
  }
  const usados = new Set<string>();
  const secciones = bloques.slice(1).map(({ titulo, lineas }) => {
    let id = aId(titulo!);
    for (let n = 2; usados.has(id); n++) id = `${aId(titulo!)}-${n}`;
    usados.add(id);
    return { titulo: titulo!, id, html: aHtml(lineas.join("\n")) };
  });
  return { intro: aHtml(bloques[0]!.lineas.join("\n")), secciones };
}

export function crearLector(dir: string = process.env.CONTENIDO_DIR || "contenido") {
  const raiz = isAbsolute(dir) ? dir : resolve(process.cwd(), dir);
  const publico = resolve(process.cwd(), "public");
  const cache = new Map<string, unknown>();

  const nombre = (ruta: string) => relative(process.cwd(), ruta) || ruta;

  function asegurarRaiz() {
    if (!existsSync(raiz)) {
      throw new ErrorDeContenido(`No existe la carpeta de contenido ${nombre(raiz)} (se cambia con CONTENIDO_DIR).`);
    }
  }

  /** Busca `<base>.<idioma>.md`; en inglés, si no está, cae al español. */
  function ubicar(base: string, idioma: Idioma): { ruta: string; sinTraducir: boolean } | null {
    asegurarRaiz();
    const pedido = join(raiz, `${base}.${idioma}.md`);
    if (existsSync(pedido)) return { ruta: pedido, sinTraducir: false };
    const espanol = join(raiz, `${base}.es.md`);
    if (idioma === "en" && existsSync(espanol)) return { ruta: espanol, sinTraducir: true };
    return null;
  }

  function leer<E extends z.ZodType>(esquema: E, base: string, idioma: Idioma): (z.output<E> & Cuerpo) | null {
    const clave = `${base}|${idioma}`;
    // En desarrollo no se guarda: así un cambio en contenido/ se ve al recargar, sin reiniciar el servidor.
    if (process.env.NODE_ENV !== "development" && cache.has(clave)) return cache.get(clave) as (z.output<E> & Cuerpo) | null;
    const ubicado = ubicar(base, idioma);
    let resultado: (z.output<E> & Cuerpo) | null = null;
    if (ubicado) {
      let archivo: matter.GrayMatterFile<string>;
      try {
        archivo = matter(readFileSync(ubicado.ruta, "utf8"));
      } catch (e) {
        throw new ErrorDeContenido(`No se pudo leer el frontmatter de ${nombre(ubicado.ruta)}: ${(e as Error).message}`);
      }
      const validado = esquema.safeParse(archivo.data);
      if (!validado.success) {
        throw new ErrorDeContenido(
          `Frontmatter inválido en ${nombre(ubicado.ruta)}:\n${z.prettifyError(validado.error)}`,
        );
      }
      const cuerpo: Cuerpo = { idioma, sinTraducir: ubicado.sinTraducir, ...partirEnSecciones(archivo.content) };
      resultado = Object.assign({}, validado.data as z.output<E>, cuerpo);
    }
    cache.set(clave, resultado);
    return resultado;
  }

  /** Slugs de los casos, sacados de los nombres `casos/<slug>.es.md`. */
  function slugs(): string[] {
    asegurarRaiz();
    const carpeta = join(raiz, "casos");
    const archivos = existsSync(carpeta) ? readdirSync(carpeta) : [];
    const porIdioma = (idioma: Idioma) =>
      archivos.flatMap((a) => {
        const m = new RegExp(`^(.+)\\.${idioma}\\.md$`).exec(a);
        return m && m[1] ? [m[1]] : [];
      });
    const es = porIdioma("es");
    const huerfano = porIdioma("en").find((s) => !es.includes(s));
    if (huerfano) throw new ErrorDeContenido(`${nombre(join(carpeta, `${huerfano}.en.md`))} no tiene su .es.md.`);
    if (!es.length) throw new ErrorDeContenido(`No hay casos en ${nombre(carpeta)} (se esperan archivos <slug>.es.md).`);
    return es.sort();
  }

  /** Falla si un archivo que el contenido nombra no está en public/. */
  function asegurarPublico(archivo: string, campo: string, ruta: string) {
    if (!existsSync(join(publico, ruta))) {
      throw new ErrorDeContenido(`En ${archivo} ${campo} ${ruta} no existe en public/.`);
    }
  }

  function caso(slug: string, idioma: Idioma): Caso {
    const leido = leer(esquemaCaso, `casos/${slug}`, idioma);
    const ruta = nombre(join(raiz, "casos", `${slug}.${leido?.sinTraducir ? "es" : idioma}.md`));
    if (!leido) throw new ErrorDeContenido(`No existe ${ruta}.`);
    if (leido.slug !== slug) {
      throw new ErrorDeContenido(`En ${ruta} el slug del frontmatter («${leido.slug}») no coincide con el archivo.`);
    }
    if (leido.portada) asegurarPublico(ruta, "la portada", leido.portada);
    if (leido.demo) asegurarPublico(ruta, "la demo", leido.demo);
    leido.medios.forEach((m, i) => {
      asegurarPublico(ruta, `medios[${i}].src`, m.src);
      if (m.poster) asegurarPublico(ruta, `medios[${i}].poster`, m.poster);
    });
    return leido;
  }

  return {
    raiz,
    slugs,
    caso,
    /** Todos los casos del idioma, por `orden`. */
    casos(idioma: Idioma): Caso[] {
      return slugs()
        .map((s) => caso(s, idioma))
        .sort((a, b) => a.orden - b.orden);
    },
    perfil(idioma: Idioma): Perfil {
      const leido = leer(esquemaPerfil, "perfil", idioma);
      if (!leido) throw new ErrorDeContenido(`Falta ${nombre(join(raiz, "perfil.es.md"))}.`);
      return leido;
    },
    /** «Más» es opcional: null si no hay mas.es.md. */
    mas(idioma: Idioma): Mas | null {
      const leido = leer(esquemaMas, "mas", idioma);
      const ruta = nombre(join(raiz, `mas.${leido?.sinTraducir ? "es" : idioma}.md`));
      leido?.proyectos.forEach((p, i) => asegurarPublico(ruta, `proyectos[${i}].imagen`, p.imagen));
      return leido;
    },
    /** Las frases de Haku. Opcional: null si no hay guia.es.md. En inglés, si falta guia.en.md se usa el español
     *  entero (`sinTraducir`); si falta solo una estación (o el repuesto), esa se toma del español (`enEspanol`). */
    guia(idioma: Idioma): Guia | null {
      const leido = leer(esquemaGuia, "guia", idioma);
      if (!leido) return null;
      const estaciones: Record<string, string[]> = { ...leido.estaciones };
      let repuesto = leido.repuesto;
      const enEspanol: string[] = [];
      if (idioma === "en" && !leido.sinTraducir) {
        const es = leer(esquemaGuia, "guia", "es");
        for (const [nombre, frases] of Object.entries(es?.estaciones ?? {})) {
          if (estaciones[nombre]) continue;
          estaciones[nombre] = frases;
          enEspanol.push(nombre);
        }
        if (!repuesto.length && es?.repuesto.length) repuesto = es.repuesto;
      }
      return { idioma, sinTraducir: leido.sinTraducir, estaciones, repuesto, enEspanol };
    },
  };
}

export type Lector = ReturnType<typeof crearLector>;

/** La primera sección cuyo id esté en `ids` (un id por idioma: «como-funciona», «how-it-works»). */
export function seccionDe(cuerpo: { secciones: Seccion[] }, ids: readonly string[]): Seccion | undefined {
  return cuerpo.secciones.find((s) => ids.includes(s.id));
}

/** Ids de las secciones fijas del contenido, en los dos idiomas. */
export const SECCIONES = {
  enUnaLinea: ["en-una-linea", "in-one-line"],
  sobreMi: ["sobre-mi", "about-me"],
  comoTrabajo: ["como-trabajo", "how-i-work"],
  queEs: ["que-es", "what-it-is"],
  paraQuien: ["para-quien", "who-it-s-for"],
  comoFunciona: ["como-funciona", "how-it-works"],
  miPapel: ["mi-papel", "my-role"],
  laPrueba: ["la-prueba", "the-proof"],
  tecnologia: ["tecnologia", "technology"],
} as const;

/** Los `<li>` de primer nivel de una lista en HTML, como pasos de una escena. */
export function pasosDe(html: string | undefined): { html: string }[] {
  if (!html) return [];
  return [...html.matchAll(/<li>([\s\S]*?)<\/li>/g)].map((m) => ({ html: (m[1] ?? "").trim() }));
}

/** HTML a texto llano de una línea (para metadatos y etiquetas accesibles). */
export function textoPlano(html: string | undefined): string {
  return (html ?? "")
    .replace(/<[^>]+>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

let lectorPorOmision: Lector | undefined;
/** El lector de la carpeta configurada (CONTENIDO_DIR o `contenido/`), uno por proceso. */
export function contenido(): Lector {
  lectorPorOmision ??= crearLector();
  return lectorPorOmision;
}
