// Registro de los diez inventos: qué datos cargar (uno por idioma si el dibujo se horneó en dos variantes) y, para
// los de la tanda 1, su hueco fijo. Cada `import()` es un trozo propio: el invento viaja solo cuando se acerca.
import type { DatosDibujo } from "@/components/dibujo/tipos";
import type { HuecoFijo, Idioma } from "./Invento";

type Carga = () => Promise<{ default: unknown }>;
type Entrada = { es: Carga; en?: Carga; hueco?: HuecoFijo };

/** proporción del lienzo de todos los inventos (pruebas/inventos.test.mjs lo comprueba contra los datos) */
export const LIENZO = { ancho: 640, alto: 420 } as const;

/** hueco de la tanda 1: 200×125 del lienzo (igual que FOTO en dibujo/piezas/tanda1-comun.mjs), girado como su marco */
const t1 = (giro: number): HuecoFijo => ({ medida: [200, 125], giro });

export const INVENTOS = {
  conmutador: {
    es: () => import("@/components/dibujo/datos/conmutador-es.json"),
    en: () => import("@/components/dibujo/datos/conmutador-en.json"),
    hueco: t1(3),
  },
  "muela-mapa": {
    es: () => import("@/components/dibujo/datos/muela-mapa-es.json"),
    en: () => import("@/components/dibujo/datos/muela-mapa-en.json"),
    hueco: t1(-3),
  },
  folioscopio: { es: () => import("@/components/dibujo/datos/folioscopio.json"), hueco: t1(3) },
  boveda: {
    es: () => import("@/components/dibujo/datos/boveda-es.json"),
    en: () => import("@/components/dibujo/datos/boveda-en.json"),
    hueco: t1(-3),
  },
  "mesa-de-los-seis": { es: () => import("@/components/dibujo/datos/mesa-de-los-seis.json"), hueco: t1(-3) },
  torre: { es: () => import("@/components/dibujo/datos/torre.json") },
  "isla-flotante": { es: () => import("@/components/dibujo/datos/isla-flotante.json") },
  "avion-de-papel": { es: () => import("@/components/dibujo/datos/avion-de-papel.json") },
  "colmena-caja": { es: () => import("@/components/dibujo/datos/colmena-caja.json") },
  cuaderno: { es: () => import("@/components/dibujo/datos/cuaderno.json") },
} satisfies Record<string, Entrada>;

export type NombreInvento = keyof typeof INVENTOS;

export async function cargarInvento(nombre: NombreInvento, idioma: Idioma): Promise<DatosDibujo> {
  const e: Entrada = INVENTOS[nombre];
  const m = await (idioma === "en" && e.en ? e.en : e.es)();
  return m.default as DatosDibujo;
}

export const huecoDe = (nombre: NombreInvento): HuecoFijo | undefined => (INVENTOS[nombre] as Entrada).hueco;

/** el invento de cada caso (MUNDO.md, «Los nueve inventos») */
export const INVENTO_DE_CASO: Record<string, NombreInvento> = {
  "recepcionista-ia": "conmutador",
  "crm-dental": "muela-mapa",
  "yacontesto-web": "folioscopio",
  "minecraft-rcon-mcp": "boveda",
  "taller-claude": "mesa-de-los-seis",
  "la-elegia": "torre",
  "la-isla": "isla-flotante",
  "tierra-de-viajes": "avion-de-papel",
  "punto-de-venta": "colmena-caja",
};
