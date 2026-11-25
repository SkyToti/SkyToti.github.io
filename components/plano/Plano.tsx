// Plano (servidor): el SVG de una escena YA en su estado final (todo trazado, encendido y contado), en las dos
// composiciones; CSS muestra una según el ancho del contenedor. Así se ve completo sin JavaScript, con
// prefers-reduced-motion y para los buscadores. PlanoVivo lo lleva al estado inicial y lo anima.
import type { Escena, TipoNodo } from "@/escenas/tipos";
import type { Idioma } from "@/lib/idioma";
import { componer, estadoFinal, formatoCota, type Composicion, type NodoL } from "./geometria";
import css from "./plano.module.css";

type Props = { escena: Escena; idioma: Idioma; modo: "completo" | "mini"; resumen: string };

export default function Plano({ escena, idioma, modo, resumen }: Props) {
  return (
    <div className={css.plano}>
      {(["ancho", "alto"] as const).map((c) => (
        <Lamina key={c} escena={escena} idioma={idioma} modo={modo} resumen={resumen} composicion={c} />
      ))}
    </div>
  );
}

function Lamina({ escena, idioma, modo, resumen, composicion }: Props & { composicion: Composicion }) {
  const p = componer(escena, composicion, idioma, { notas: modo !== "mini" });
  const final = estadoFinal(escena);
  const [, , W, H] = p.viewBox;
  const F = p.F;

  return (
    <svg
      className={`${css.svg} ${css[composicion]}`}
      viewBox={p.viewBox.join(" ")}
      width={W}
      height={H}
      role="img"
      aria-label={resumen}
      data-composicion={composicion}
      fontSize={F}
    >
      <g aria-hidden="true">
        <g>
          {p.trazos.map((t) => (
            <path key={t.id} d={t.d} className={`${css.trazoBase} ${t.punteado ? css.punteado : ""}`} />
          ))}
        </g>
        <g>
          {p.trazos.map((t) => (
            <path
              key={t.id}
              d={t.d}
              className={`${css.trazoVivo} ${t.punteado ? css.punteado : ""}`}
              data-trazo={t.id}
              data-largo={Math.round(t.largo * 10) / 10}
              data-cortes={t.cortes.length ? JSON.stringify(t.cortes) : undefined}
              data-punteado={t.punteado || undefined}
            />
          ))}
        </g>

        {p.compuertas.map((c) => {
          const estado = final.compuertas[c.id];
          const L = c.caja.y2 - c.caja.y1 > c.caja.x2 - c.caja.x1 ? c.caja.y2 - c.caja.y1 : c.caja.x2 - c.caja.x1;
          const barra = (clase: string | undefined, extra: Record<string, unknown> = {}) => (
            <rect x={-2} y={-L / 2} width={4} height={L} rx={1} className={clase} {...extra} />
          );
          return (
            <g key={c.id} data-compuerta={c.id}>
              <g transform={`translate(${c.punto.x} ${c.punto.y})${c.horizontal ? "" : " rotate(90)"}`}>
                <g data-barra="" transform={estado === "abre" ? "rotate(90)" : undefined}>
                  {barra(css.barra)}
                  {barra(css.barraAlto, { "data-alto": "", opacity: estado === "detiene" ? 1 : 0 })}
                  {barra(css.barraAbierta, { "data-abierta": "", opacity: estado === "abre" ? 1 : 0 })}
                </g>
              </g>
              <text x={c.etiqueta.x} y={c.etiqueta.y} className={css.compuertaTexto}>
                {c.etiqueta.texto}
              </text>
            </g>
          );
        })}

        {p.nodos.map((n) => (
          <NodoSvg key={n.id} n={n} F={F} marca={final.marcas[n.id]} conNota={modo !== "mini"} />
        ))}

        {p.cotas.map((c) => {
          const texto = `${c.prefijo}${formatoCota(c.numero, idioma)}${c.sufijo}`;
          return (
            <g key={c.id} data-cota={c.id}>
              <text
                x={c.valor.x}
                y={c.valor.y}
                fontSize={c.valor.F}
                className={css.cotaValor}
                data-valor=""
                data-numero={c.numero}
                data-prefijo={c.prefijo}
                data-sufijo={c.sufijo}
                data-idioma={idioma}
              >
                {texto}
              </text>
              <text x={c.etiqueta.x} y={c.etiqueta.y} className={css.cotaEtiqueta}>
                {c.etiqueta.texto}
              </text>
            </g>
          );
        })}

        {p.globos.map((g) => (
          <g key={g.id} data-globo={g.id}>
            <path d={g.d} className={g.lado === "sale" ? css.globoSale : css.globoEntra} />
            {g.lineas.map((l, i) => (
              <text key={i} x={l.x} y={l.y} className={css.globoTexto}>
                {l.texto}
              </text>
            ))}
          </g>
        ))}

        <g data-pulsos="" />
      </g>
    </svg>
  );
}

function NodoSvg({ n, F, marca, conNota }: { n: NodoL; F: number; marca?: "hecho" | "alto"; conNota: boolean }) {
  const { caja: c } = n;
  const rect = (clase: string | undefined) => <rect x={c.x1} y={c.y1} width={c.x2 - c.x1} height={c.y2 - c.y1} rx={6} className={clase} />;
  const s = F * 0.55;
  return (
    <g data-nodo={n.id}>
      {rect(css.caja)}
      <Marcador tipo={n.tipo} x={n.marcador.x} y={n.marcador.y} s={s} clase={css.marcadorBase} />
      <text x={n.etiqueta.x} y={n.etiqueta.y} className={css.etiquetaBase}>
        {n.etiqueta.texto}
      </text>
      <g data-viva="">
        {rect(marca === "alto" ? css.cajaAlto : css.cajaViva)}
        <Marcador tipo={n.tipo} x={n.marcador.x} y={n.marcador.y} s={s} clase={css.marcadorVivo} />
        <text x={n.etiqueta.x} y={n.etiqueta.y} className={css.etiquetaViva}>
          {n.etiqueta.texto}
        </text>
        {conNota && n.nota && (
          <text x={n.nota.x} y={n.nota.y} textAnchor={n.nota.anchor} className={css.nota}>
            {n.nota.texto}
          </text>
        )}
      </g>
      {marca && <Marca x={n.marca.x} y={n.marca.y} r={n.marca.r} como={marca} />}
    </g>
  );
}

/** Marcador por tipo: persona ○, ia ◇, servicio □, dato ≡, fin ◎. */
function Marcador({ tipo, x, y, s, clase }: { tipo: TipoNodo; x: number; y: number; s: number; clase: string | undefined }) {
  const h = s / 2;
  switch (tipo) {
    case "persona":
      return <circle cx={x} cy={y} r={h} className={clase} />;
    case "ia":
      return <path d={`M${x} ${y - h * 1.2}L${x + h * 1.2} ${y}L${x} ${y + h * 1.2}L${x - h * 1.2} ${y}Z`} className={clase} />;
    case "servicio":
      return <rect x={x - h} y={y - h} width={s} height={s} rx={1} className={clase} />;
    case "dato":
      return <path d={`M${x - h} ${y - h}H${x + h}M${x - h} ${y}H${x + h}M${x - h} ${y + h}H${x + h}`} className={clase} />;
    case "fin":
      return (
        <>
          <circle cx={x} cy={y} r={h} className={clase} />
          <circle cx={x} cy={y} r={h * 0.4} className={`${clase} ${css.relleno}`} />
        </>
      );
  }
}

function Marca({ x, y, r, como }: { x: number; y: number; r: number; como: "hecho" | "alto" }) {
  const k = r * 0.42;
  const d = como === "hecho" ? `M${-k} 0L${-k * 0.2} ${k * 0.8}L${k * 1.1} ${-k * 0.8}` : `M${-k} ${-k}L${k} ${k}M${k} ${-k}L${-k} ${k}`;
  const color = como === "hecho" ? css.marcaHecho : css.marcaAlto;
  return (
    <g transform={`translate(${x} ${y})`}>
      <g data-marca="">
        <circle r={r} className={`${css.marcaFondo} ${color}`} />
        <path d={d} className={`${css.marcaTrazo} ${color}`} />
      </g>
    </g>
  );
}
