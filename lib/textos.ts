// Textos de interfaz (lo que no es contenido): botones, títulos fijos, etiquetas.
// El contenido (perfil, casos, «más») va en Markdown en contenido/ y lo lee lib/contenido.ts.
import type { Idioma } from "./idioma";

type Textos = {
  /** Nombre corto con el que firma el sitio (título de la pestaña, imagen para compartir, pie). */
  marca: string;
  /** Monograma de la cabecera. */
  iniciales: string;
  /** Código del idioma de destino, visible en la cabecera. */
  cambiarIdioma: string;
  /** Texto accesible del enlace de cambio de idioma. */
  cambiarIdiomaEtiqueta: string;
  saltarAlContenido: string;
  navegacion: string;
  irAlInicio: string;
  trabajo: string;
  sobreMi: string;
  cv: string;
  cvEtiqueta: string;
  verTrabajo: string;
  correo: string;
  cifras: string;
  masTrabajo: string;
  /** Rótulo de «Más trabajo» cuando hay un solo proyecto (va como lámina ancha). */
  tambien: string;
  nombre: string;
  otraPestana: string;
  contacto: string;
  /** Botón principal de Contacto (mailto). */
  escribeme: string;
  copiar: string;
  copiado: string;
  noSeCopio: string;
  cvEs: string;
  cvEn: string;
  github: string;
  ciudad: string;
  disponibilidad: string;
  idiomas: string;
  volverAlInicio: string;
  volverArriba: string;
  papel: string;
  anio: string;
  tipo: string;
  tecnologia: string;
  enVivo: string;
  repositorio: string;
  /** Botón de la demo interactiva de un caso (misma pestaña; la demo trae su «Volver al portafolio»). */
  abrirDemo: string;
  /** Píldora de la lámina del inicio cuando el caso tiene demo. */
  demoInteractiva: string;
  /** La frase del bloque de la demo, antes de «Se ve así». */
  demoFrase: string;
  privado: string;
  seVeAsi: string;
  siguienteCaso: string;
  pasos: string;
  sinTraducir: string;
  tipos: Record<"producto" | "codigo-abierto" | "web" | "juego" | "escritorio", string>;
};

export const TEXTOS: Record<Idioma, Textos> = {
  es: {
    marca: "Diego Benítez",
    iniciales: "DB",
    cambiarIdioma: "EN",
    cambiarIdiomaEtiqueta: "Ver esta página en inglés",
    saltarAlContenido: "Saltar al contenido",
    navegacion: "Navegación principal",
    irAlInicio: "Ir al inicio",
    trabajo: "Trabajo",
    sobreMi: "Sobre mí",
    cv: "CV",
    cvEtiqueta: "Descargar mi CV en PDF",
    verTrabajo: "Ver trabajo",
    correo: "Correo",
    cifras: "Cifras",
    masTrabajo: "Más trabajo",
    tambien: "También",
    nombre: "Nombre",
    otraPestana: "(se abre en otra pestaña)",
    contacto: "Contacto",
    escribeme: "Escríbeme",
    copiar: "Copiar",
    copiado: "Correo copiado",
    noSeCopio: "No se pudo copiar: selecciónalo y cópialo a mano",
    cvEs: "CV en español (PDF)",
    cvEn: "CV en inglés (PDF)",
    github: "GitHub",
    ciudad: "Ciudad",
    disponibilidad: "Disponibilidad",
    idiomas: "Idiomas",
    volverAlInicio: "Volver al inicio",
    volverArriba: "Volver arriba",
    papel: "Papel",
    anio: "Año",
    tipo: "Tipo",
    tecnologia: "Tecnología",
    enVivo: "Ver en vivo",
    repositorio: "Ver el código",
    abrirDemo: "Abrir la demo interactiva",
    demoInteractiva: "Demo interactiva",
    demoFrase:
      "Es el diseño completo, funcionando en tu navegador con una clínica de ejemplo. Mantén apretado «Tu CRM» un segundo y medio para ver el recorrido guiado.",
    privado: "Código privado",
    seVeAsi: "Se ve así",
    siguienteCaso: "Siguiente caso",
    pasos: "Pasos",
    sinTraducir: "Esta página todavía no está traducida.",
    tipos: {
      producto: "Producto",
      "codigo-abierto": "Código abierto",
      web: "Web",
      juego: "Juego",
      escritorio: "Escritorio",
    },
  },
  en: {
    marca: "Diego Benítez",
    iniciales: "DB",
    cambiarIdioma: "ES",
    cambiarIdiomaEtiqueta: "View this page in Spanish",
    saltarAlContenido: "Skip to content",
    navegacion: "Main navigation",
    irAlInicio: "Go to home",
    trabajo: "Work",
    sobreMi: "About",
    cv: "CV",
    cvEtiqueta: "Download my CV as a PDF",
    verTrabajo: "See my work",
    correo: "Email",
    cifras: "Numbers",
    masTrabajo: "More work",
    tambien: "Also",
    nombre: "Name",
    otraPestana: "(opens in a new tab)",
    contacto: "Contact",
    escribeme: "Email me",
    copiar: "Copy",
    copiado: "Email copied",
    noSeCopio: "Could not copy: select it and copy it by hand",
    cvEs: "CV in Spanish (PDF)",
    cvEn: "CV in English (PDF)",
    github: "GitHub",
    ciudad: "Based in",
    disponibilidad: "Availability",
    idiomas: "Languages",
    volverAlInicio: "Back to home",
    volverArriba: "Back to top",
    papel: "Role",
    anio: "Year",
    tipo: "Type",
    tecnologia: "Stack",
    enVivo: "See it live",
    repositorio: "See the code",
    abrirDemo: "Open the interactive demo",
    demoInteractiva: "Interactive demo",
    // «Tu CRM» se queda en español: es la etiqueta tal como aparece en la demo.
    demoFrase:
      "It is the full design, running in your browser with a sample clinic. The demo is in Spanish: press and hold the button labeled “Tu CRM” (Your CRM) for a second and a half to start the guided tour.",
    privado: "Private code",
    seVeAsi: "What it looks like",
    siguienteCaso: "Next case",
    pasos: "Steps",
    sinTraducir: "This page is not translated yet; it is shown in Spanish.",
    tipos: {
      producto: "Product",
      "codigo-abierto": "Open source",
      web: "Web",
      juego: "Game",
      escritorio: "Desktop",
    },
  },
};

/** El PDF del CV de cada idioma (en public/; copia sin teléfono). */
export const CV: Record<Idioma, string> = {
  es: "/CV-Diego-Benitez-ES.pdf",
  en: "/CV-Diego-Benitez-EN.pdf",
};
