// Dirección pública del sitio. Se fija al compilar con NEXT_PUBLIC_SITIO (sin diagonal final).
export const SITIO = (process.env.NEXT_PUBLIC_SITIO || "http://localhost:3200").replace(/\/+$/, "");

export const urlAbsoluta = (ruta: string): string => `${SITIO}${ruta}`;
