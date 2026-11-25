// Textos de interfaz de la segunda mitad del inicio (Cómo trabajo, También, Sobre mí, Contacto y el pie), en los dos
// idiomas. Viven aquí y no en ./textos.ts para que estas secciones se puedan rehacer sin tocar archivos comunes.
// Los datos de la repisa que NO están en contenido/ (estudios, la taza y Haku) salen SOLO de hechos del CV de Diego
// (Hybridge: dos ingenierías en línea y en paralelo; UTEZ: 4 cuatrimestres de Desarrollo de Software Multiplataforma).
// Nada de horarios ni datos inventados.
import type { Idioma } from "@/lib/idioma";

export type TextosD = {
  /** enlace de «También» al sitio del proyecto */
  abrirSitio: string;
  /** el cuaderno de «También», que levanta sus hojas al tocarlo */
  hojear: string;
  /** rótulo encima del correo escrito en Contacto */
  oCopiaElCorreo: string;
  /** rótulo encima de los CV y GitHub */
  masDeMi: string;
  /** los títulos de la repisa que no salen del perfil, y los datos de estudios, la taza y Haku */
  repisa: {
    idiomas: string;
    estudios: { titulo: string; texto: string };
    noche: { titulo: string; texto: string };
    haku: { titulo: string; texto: string };
  };
  /** rótulo sobre la repisa: cómo se usa */
  repisaPista: string;
};

export const TEXTOS_D: Record<Idioma, TextosD> = {
  es: {
    abrirSitio: "Abrir el sitio",
    hojear: "Cuaderno dibujado: tócalo para levantar sus hojas",
    oCopiaElCorreo: "O copia el correo",
    masDeMi: "CV y código",
    repisa: {
      idiomas: "Idiomas",
      estudios: {
        titulo: "Dos ingenierías en línea",
        texto:
          "Hybridge: Ingeniería en Desarrollo de Software e Ingeniería en Inteligencia Artificial, en línea y en paralelo. Antes, 4 cuatrimestres de Desarrollo de Software Multiplataforma en la UTEZ.",
      },
      noche: { titulo: "La taza", texto: "Aquí se trabaja con café." },
      haku: { titulo: "Haku", texto: "Haku es su gato. Supervisa." },
    },
    repisaPista: "Toca un objeto de la repisa",
  },
  en: {
    abrirSitio: "Open the site",
    hojear: "Drawn notebook: tap it to lift its pages",
    oCopiaElCorreo: "Or copy the address",
    masDeMi: "CV and code",
    repisa: {
      idiomas: "Languages",
      estudios: {
        titulo: "Two engineering degrees online",
        texto:
          "Hybridge: B.Eng. in Software Development and B.Eng. in Artificial Intelligence, online and in parallel. Before that, 4 terms of Multiplatform Software Development at UTEZ.",
      },
      noche: { titulo: "The mug", texto: "Work here runs on coffee." },
      haku: { titulo: "Haku", texto: "Haku is his cat. He supervises." },
    },
    repisaPista: "Tap an object on the shelf",
  },
};
