// Imagen para compartir (Open Graph, 1200×630), generada al compilar por next/og: lo primero que ve quien recibe el
// enlace por WhatsApp, LinkedIn o correo. A la izquierda el nombre enorme, el titular y la dirección del sitio; a la
// derecha el escritorio de noche con Haku, el agente y la lámpara, y la línea con la chispa que sale de debajo del
// nombre. La usan app/(es)/og.png/route.tsx y app/(en)/en/og.png/route.tsx.
//
// El dibujo es el del kit (dibujo/piezas/vista-previa.mjs → components/dibujo/datos/vista-previa.json, ya «a mano»
// con roughjs al generar): se mete como SVG en un <img> de datos, que satori le pasa a resvg tal cual (tramas y
// opacidades incluidas). Solo el cuadro f0 del hervor. Así no hace falta navegador en el build y la imagen sale del
// mismo dibujo que el sitio.
// Las letras se piden a Google Fonts como TTF estático al compilar (satori no lee woff2 ni ejes variables); si no hay
// red, sale con la letra por omisión de next/og y el build no se rompe.
import { ImageResponse } from "next/og";
import { partirHervor } from "@/components/dibujo/hervor";
import vistaPrevia from "@/components/dibujo/datos/vista-previa.json";
import { contenido } from "./contenido";
import type { Idioma } from "./idioma";
import { SITIO } from "./sitio";
import { TEXTOS } from "./textos";

export const TAMANO_OG = { width: 1200, height: 630 };

const C = {
  noche: "#0B1220",
  hueso: "#EDE6D6",
  huesoApagado: "#A7A698",
  ambar: "#F5B455",
};

async function letra(familia: string, texto: string): Promise<ArrayBuffer | null> {
  try {
    const css = await (
      await fetch(`https://fonts.googleapis.com/css2?family=${familia}&text=${encodeURIComponent(texto)}`, {
        headers: { "User-Agent": "Mozilla/4.0" },
        signal: AbortSignal.timeout(8000),
      })
    ).text();
    const url = /src: url\((.+?)\) format\('(?:truetype|opentype)'\)/.exec(css)?.[1];
    if (!url) return null;
    return await (await fetch(url, { signal: AbortSignal.timeout(8000) })).arrayBuffer();
  } catch {
    return null;
  }
}

/** La dirección del sitio sin protocolo; nada si es una dirección local (la tarjeta no anuncia localhost). */
export function direccionVisible(sitio: string = SITIO): string {
  const sin = sitio.replace(/^https?:\/\//, "").replace(/\/+$/, "");
  return /^(localhost|127\.|0\.0\.0\.0|\[::1\])/.test(sin) ? "" : sin;
}

/** El dibujo del kit como SVG suelto (cuadro f0), listo para un <img> de datos. */
function dibujo(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vistaPrevia.vb}" width="${TAMANO_OG.width}" height="${TAMANO_OG.height}">${partirHervor(vistaPrevia.svg).base}</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

export async function imagenOg(idioma: Idioma): Promise<ImageResponse> {
  const perfil = contenido().perfil(idioma);
  const marca = TEXTOS[idioma].marca;
  const [nombre, ...resto] = marca.split(" ");
  const apellido = resto.join(" ");
  const titular = (perfil.titular ?? "").split(" · ");
  const direccion = direccionVisible();

  const [titulos, texto, mono] = await Promise.all([
    letra("Bricolage+Grotesque:opsz,wdth,wght@96,90,700", marca),
    letra("Bricolage+Grotesque:wght@500", titular.join("")),
    direccion ? letra("JetBrains+Mono:wght@500", direccion) : Promise.resolve(null),
  ]);
  const fonts = [
    ...(titulos ? [{ name: "Titulo", data: titulos, weight: 700 as const }] : []),
    ...(texto ? [{ name: "Texto", data: texto, weight: 500 as const }] : []),
    ...(mono ? [{ name: "Mono", data: mono, weight: 500 as const }] : []),
  ];

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: C.noche }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- satori: el dibujo va como imagen de datos */}
        <img src={dibujo()} width={TAMANO_OG.width} height={TAMANO_OG.height} alt="" style={{ position: "absolute", left: 0, top: 0 }} />
        <div
          style={{
            position: "absolute",
            left: 66,
            top: 52,
            display: "flex",
            flexDirection: "column",
            fontFamily: "Titulo",
            fontSize: 138,
            lineHeight: 0.9,
            letterSpacing: -3,
            color: C.hueso,
          }}
        >
          <div style={{ display: "flex" }}>{nombre}</div>
          <div style={{ display: "flex" }}>{apellido}</div>
        </div>
        <div
          style={{
            position: "absolute",
            left: 72,
            top: 378,
            display: "flex",
            flexDirection: "column",
            fontFamily: "Texto",
            fontSize: 37,
            lineHeight: 1.22,
            color: C.hueso,
          }}
        >
          {titular.map((parte, i) => (
            <div key={parte} style={{ display: "flex", color: i === 0 ? C.hueso : C.huesoApagado }}>
              {parte}
            </div>
          ))}
        </div>
        {direccion ? (
          <div style={{ position: "absolute", left: 72, top: 548, display: "flex", fontFamily: "Mono", fontSize: 25, letterSpacing: 1, color: C.ambar }}>
            {direccion}
          </div>
        ) : null}
      </div>
    ),
    { ...TAMANO_OG, fonts: fonts.length ? fonts : undefined },
  );
}
