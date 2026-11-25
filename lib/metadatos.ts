// Metadatos compartidos (layouts y páginas), armados desde el contenido.
import type { Metadata } from "next";
import { contenido, SECCIONES, seccionDe, textoPlano } from "./contenido";
import { alternos, LOCALE_OG, rutaCaso, rutaInicio, type Idioma } from "./idioma";
import { SITIO, urlAbsoluta } from "./sitio";
import { TEXTOS } from "./textos";

/** «Diego Benítez — Desarrollador Full Stack · IA y webs con movimiento» y la frase «En una línea». */
export function tituloYDescripcion(idioma: Idioma): { titulo: string; descripcion: string | undefined } {
  const perfil = contenido().perfil(idioma);
  const marca = TEXTOS[idioma].marca;
  const linea = textoPlano(seccionDe(perfil, SECCIONES.enUnaLinea)?.html);
  return { titulo: perfil.titular ? `${marca} — ${perfil.titular}` : marca, descripcion: linea || undefined };
}

/** /og.png o /en/og.png (app/(es)/og.png/route.tsx): nombre, titular y un trozo del plano. */
const imagenCompartir = (idioma: Idioma, alt: string) => ({
  url: idioma === "es" ? "/og.png" : "/en/og.png",
  width: 1200,
  height: 630,
  type: "image/png",
  alt,
});

export function metadatosRaiz(idioma: Idioma): Metadata {
  const { titulo, descripcion } = tituloYDescripcion(idioma);
  const marca = TEXTOS[idioma].marca;
  return {
    metadataBase: new URL(SITIO),
    title: { default: titulo, template: `%s · ${marca}` },
    description: descripcion,
    openGraph: { siteName: marca, locale: LOCALE_OG[idioma], type: "website", images: [imagenCompartir(idioma, titulo)] },
    twitter: { card: "summary_large_image" },
    formatDetection: { telephone: false, email: false, address: false },
  };
}

export function metadatosInicio(idioma: Idioma): Metadata {
  const { titulo, descripcion } = tituloYDescripcion(idioma);
  return {
    title: { absolute: titulo },
    description: descripcion,
    alternates: { canonical: rutaInicio(idioma), languages: alternos(rutaInicio) },
    openGraph: {
      url: rutaInicio(idioma),
      title: titulo,
      description: descripcion,
      images: [imagenCompartir(idioma, titulo)],
    },
  };
}

export function metadatosCaso(idioma: Idioma, slug: string): Metadata {
  const caso = contenido().caso(slug, idioma);
  const ruta = rutaCaso(idioma, slug);
  return {
    title: caso.titulo,
    description: caso.resumen,
    alternates: { canonical: ruta, languages: alternos((i) => rutaCaso(i, slug)) },
    openGraph: {
      type: "article",
      url: ruta,
      title: caso.titulo,
      description: caso.resumen,
      ...(caso.portada ? { images: [caso.portada] } : {}),
    },
  };
}

/** JSON-LD `Person` del inicio, desde el perfil. */
export function personaJsonLd(idioma: Idioma): string {
  const perfil = contenido().perfil(idioma);
  const datos = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: perfil.nombre,
    jobTitle: perfil.titular,
    description: tituloYDescripcion(idioma).descripcion,
    url: urlAbsoluta(rutaInicio(idioma)),
    email: perfil.correo ? `mailto:${perfil.correo}` : undefined,
    homeLocation: perfil.ciudad ? { "@type": "Place", name: perfil.ciudad } : undefined,
    sameAs: perfil.github ? [perfil.github] : undefined,
  };
  // `<` escapado: el JSON va dentro de un <script> y no debe poder cerrarlo.
  return JSON.stringify(datos).replace(/</g, "\\u003c");
}
