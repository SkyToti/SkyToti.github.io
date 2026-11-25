import { createContext, useContext } from "react";

/**
 * Si una pantalla completa (la agenda, pacientes, laboratorio, Imagen Dental o el armado) tapa la principal.
 * Mientras la tapa, sus piezas que crecen hacia otra (`layoutId`) no se vuelven a medir en cada dibujo: cambiar
 * de vista en la agenda redibuja la app, y medir los mosaicos de abajo alargaba el cambio a Mes en un teléfono
 * lento (fluidez B, CPU 4×). Al cerrarse, la dependencia cambia y se miden como siempre, así que regresar a su
 * origen no cambia.
 */
export const Cubierta = createContext(false);
export const useDependenciaCubierta = () => (useContext(Cubierta) ? "cubierta" : undefined);
