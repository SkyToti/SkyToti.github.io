// Textos de interfaz de la página de caso a todo lo ancho (components/paginas/caso/). Nada de contenido: los textos
// del caso salen de contenido/casos/; aquí solo rótulos y nombres accesibles, en los dos idiomas.
import type { Idioma } from "@/lib/idioma";

type TextosCaso = {
  todosLosProyectos: string;
  ficha: string;
  laPruebaPrincipal: string;
  capturas: string;
  enCelular: string;
  comoFunciona: string;
  laPrueba: string;
  queHice: string;
  siguiente: string;
};

export const TEXTOS_CASO: Record<Idioma, TextosCaso> = {
  es: {
    todosLosProyectos: "Todos los proyectos",
    ficha: "Ficha del proyecto",
    laPruebaPrincipal: "El proyecto en pantalla",
    capturas: "Más capturas: desliza o usa las flechas",
    enCelular: "En el celular",
    comoFunciona: "Cómo funciona",
    laPrueba: "La prueba",
    queHice: "Mi papel y tecnología",
    siguiente: "Siguiente caso",
  },
  en: {
    todosLosProyectos: "All projects",
    ficha: "Project details",
    laPruebaPrincipal: "The project on screen",
    capturas: "More screenshots: swipe or use the arrow keys",
    enCelular: "On a phone",
    comoFunciona: "How it works",
    laPrueba: "The proof",
    queHice: "My role and technology",
    siguiente: "Next case",
  },
};
