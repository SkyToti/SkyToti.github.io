// Registro de escenas: nombre (el campo `escena` del frontmatter del caso) → datos.
import type { Escena } from "./tipos";
import cajaLibreria from "./caja-libreria";
import crmAgenda from "./crm-agenda";
import firma from "./firma";
import historiaScroll from "./historia-scroll";
import islaBarra from "./isla-barra";
import itinerarioPrivado from "./itinerario-privado";
import jefeDelMar from "./jefe-del-mar";
import orquestaAgentes from "./orquesta-agentes";
import puertaConFolio from "./puerta-con-folio";
import recepcionistaWhatsapp from "./recepcionista-whatsapp";

export const ESCENAS: Readonly<Record<string, Escena>> = Object.fromEntries(
  [
    firma,
    recepcionistaWhatsapp,
    crmAgenda,
    puertaConFolio,
    orquestaAgentes,
    historiaScroll,
    jefeDelMar,
    islaBarra,
    itinerarioPrivado,
    cajaLibreria,
  ].map((e) => [e.nombre, e]),
);

export const existeEscena = (nombre: string): boolean => Object.hasOwn(ESCENAS, nombre);

export type { Escena } from "./tipos";
