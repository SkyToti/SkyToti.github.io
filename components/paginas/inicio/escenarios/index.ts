// Qué escenario pinta cada caso en «Trabajo»: slug → componente. Un slug que no esté aquí usa la lámina común.
import type { ComponentType } from "react";
import CrmDental from "./CrmDental";
import LaElegia from "./LaElegia";
import LaIsla from "./LaIsla";
import Lamina, { type PropsEscenario } from "./Lamina";
import MinecraftRconMcp from "./MinecraftRconMcp";
import PuntoDeVenta from "./PuntoDeVenta";
import RecepcionistaIa from "./RecepcionistaIa";
import TallerClaude from "./TallerClaude";
import TierraDeViajes from "./TierraDeViajes";
import YacontestoWeb from "./YacontestoWeb";

export type { PropsEscenario };

export const ESCENARIOS: Readonly<Record<string, ComponentType<PropsEscenario>>> = {
  "recepcionista-ia": RecepcionistaIa,
  "crm-dental": CrmDental,
  "yacontesto-web": YacontestoWeb,
  "minecraft-rcon-mcp": MinecraftRconMcp,
  "taller-claude": TallerClaude,
  "la-elegia": LaElegia,
  "la-isla": LaIsla,
  "tierra-de-viajes": TierraDeViajes,
  "punto-de-venta": PuntoDeVenta,
};

/** Los casos de YaContesto que van juntos en el tramo horizontal (TramoYaContesto), en este orden. */
export const TRAMO_YACONTESTO: readonly string[] = ["recepcionista-ia", "crm-dental", "yacontesto-web"];

/** Qué cruza ANTES de cada escenario (components/mundo/trafico): el avión antes de Tierra de Viajes, las nubes antes
 *  de La Elegía; antes de los demás (después del tramo), el carrito con el número del que viene. */
export const CRUCE_ANTES: Readonly<Record<string, "avion" | "nubes">> = {
  "tierra-de-viajes": "avion",
  "la-elegia": "nubes",
};

/** El escenario del caso; si el slug no tiene uno propio, la lámina común. */
export function escenarioDe(slug: string): ComponentType<PropsEscenario> {
  return ESCENARIOS[slug] ?? Lamina;
}
