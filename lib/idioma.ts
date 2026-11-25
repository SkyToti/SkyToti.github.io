// Los dos idiomas del sitio y cómo se arma cada ruta en cada uno.
// Español vive en la raíz (/, /trabajo/<slug>/); inglés bajo /en/ (/en/, /en/work/<slug>/).

export type Idioma = "es" | "en";

export const IDIOMAS: readonly Idioma[] = ["es", "en"];

/** Etiqueta BCP 47 para `<html lang>`, `hreflang` y `inLanguage`. */
export const ETIQUETA: Record<Idioma, string> = { es: "es-MX", en: "en" };

/** Locale de Open Graph. */
export const LOCALE_OG: Record<Idioma, string> = { es: "es_MX", en: "en_US" };

export const otroIdioma = (idioma: Idioma): Idioma => (idioma === "es" ? "en" : "es");

/** Ruta del inicio en cada idioma (siempre con diagonal final: el sitio exporta con trailingSlash). */
export const rutaInicio = (idioma: Idioma): string => (idioma === "es" ? "/" : "/en/");

/** Ruta de un caso en cada idioma. */
export const rutaCaso = (idioma: Idioma, slug: string): string =>
  idioma === "es" ? `/trabajo/${slug}/` : `/en/work/${slug}/`;

/** Mapa para `alternates.languages` (hreflang) a partir de una función que da la ruta por idioma. */
export function alternos(ruta: (idioma: Idioma) => string): Record<string, string> {
  return {
    [ETIQUETA.es]: ruta("es"),
    [ETIQUETA.en]: ruta("en"),
    "x-default": ruta("es"),
  };
}
