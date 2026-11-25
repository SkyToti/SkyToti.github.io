// Una captura o un video de «Se ve así», siempre como <figure> con su pie visible (el `alt`, en hueso-apagado,
// 14 px). Imágenes con width/height (CLS 0), carga perezosa y enlace al archivo completo en otra pestaña; videos
// con controles, sin autoplay y sin descargar nada hasta que se pide (preload="none").
//   · Video vertical: un marco de alto máximo 72svh (sin pasarse de la columna).
//   · Imagen de celular (alto > ancho): dentro de un marco de teléfono de ancho máximo 320 px; no se estira.
//   · Lo horizontal ocupa el ancho de su celda.
import type { Medio as DatosMedio } from "@/lib/contenido";

export const esVertical = (m: { ancho: number; alto: number }) => m.alto > m.ancho;

type Props = { medio: DatosMedio; revelar?: boolean; otraPestana: string };

export default function Medio({ medio, revelar, otraPestana }: Props) {
  const vertical = esVertical(medio);
  const proporcion = { aspectRatio: `${medio.ancho} / ${medio.alto}` };
  const pie = (
    // El pie repite el `alt`: se oculta al lector de pantalla para que no lo oiga dos veces.
    <figcaption aria-hidden="true" className="mt-3 text-[14px] leading-snug text-hueso-apagado">
      {medio.alt}
    </figcaption>
  );

  if (medio.tipo === "video") {
    return (
      <figure
        data-revelar={revelar || undefined}
        className={vertical ? "flex-none" : "w-full"}
        style={{ width: vertical ? `min(100%, calc(72svh * ${medio.ancho} / ${medio.alto}))` : "100%" }}
      >
        <video
          controls
          preload="none"
          playsInline
          poster={medio.poster}
          width={medio.ancho}
          height={medio.alto}
          aria-label={medio.alt}
          className="block h-auto w-full rounded-[6px] border border-linea bg-superficie object-cover"
          style={proporcion}
        >
          <source src={medio.src} type="video/mp4" />
        </video>
        {pie}
      </figure>
    );
  }

  const imagen = (
    // eslint-disable-next-line @next/next/no-img-element -- sitio estático: <img> propio con width/height.
    <img
      src={medio.src}
      width={medio.ancho}
      height={medio.alto}
      alt={medio.alt}
      loading="lazy"
      decoding="async"
      className={`block h-auto w-full bg-superficie object-cover ${vertical ? "rounded-[4px]" : "rounded-[6px] border border-linea transition-colors duration-[var(--dur-micro)] group-hover:border-linea-viva"}`}
      style={proporcion}
    />
  );

  return (
    <figure data-revelar={revelar || undefined} className={vertical ? "w-full max-w-[320px] flex-none" : "w-full"}>
      <a
        href={medio.src}
        target="_blank"
        rel="noopener"
        className={`group block rounded-[6px] ${
          vertical ? "border-[1.5px] border-linea-viva bg-superficie px-2 pt-5 pb-2 transition-colors duration-[var(--dur-micro)] hover:border-hueso" : ""
        }`}
      >
        {/* Marco de teléfono: cuerpo con bisel y la bocina arriba. */}
        {vertical && <span aria-hidden="true" className="mx-auto -mt-2.5 mb-2.5 block h-[3px] w-10 rounded-full bg-linea-viva" />}
        {imagen}
        <span className="sr-only"> {otraPestana}</span>
      </a>
      {pie}
    </figure>
  );
}
