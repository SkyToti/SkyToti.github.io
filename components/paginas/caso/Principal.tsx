// 2 · La prueba principal, enorme, justo debajo de la cabecera, con «Qué es» y «Para quién» al lado. Tres formas:
//   · horizontal: la captura (o el video) a 68vw pegada a la orilla izquierda, con la misma pantalla en el celular
//     tapando su esquina inferior derecha; el texto en la columna derecha. En los casos de número impar, al revés (la
//     captura a la derecha, ladeada 1.5°, y el celular en su esquina izquierda): dos casos seguidos no se ven iguales.
//   · vertical: el video en un teléfono de 80svh; el segundo medio vertical asomando detrás, girado; texto a la derecha.
//   · cuadrado: el video cuadrado a 84svh de alto y, pegado a su lado, el vertical del mismo alto (juntos, ≥ 64 % del
//     ancho); el texto debajo.
// Celular: apilado a todo el ancho (medio, acompañante, texto). Los casos sin medios no usan esta sección (su prueba es
// el diagrama de «Cómo funciona», en Caso.tsx).
import type { CSSProperties } from "react";
import type { Medio, Seccion } from "@/lib/contenido";
import type { Idioma } from "@/lib/idioma";
import { anchoTelefono, FiguraMedio, type Forma } from "./comun";
import css from "./Principal.module.css";
import { TEXTOS_CASO } from "./textos";

type Vars = CSSProperties & Record<`--${string}`, string | number | undefined>;

export default function Principal({
  forma,
  principal,
  acompana,
  textos,
  idioma,
  orden = 0,
}: {
  forma: Exclude<Forma, "sin">;
  principal: Medio;
  acompana?: Medio;
  textos: Seccion[];
  idioma: Idioma;
  /** el número del caso: en los impares la composición horizontal va al revés (captura a la derecha) y ladeada */
  orden?: number;
}) {
  const impar = orden % 2 === 1;
  const tc = TEXTOS_CASO[idioma];
  const alto = forma === "vertical" ? "80svh" : forma === "cuadrado" ? "84svh" : "";
  const anchoPrincipal =
    forma === "vertical"
      ? anchoTelefono(principal, alto)
      : forma === "cuadrado"
        ? `calc(${alto} * ${principal.ancho / principal.alto})`
        : "68vw";
  // cuadrado: el vertical va del mismo alto, pegado a su lado (los dos juntos son la prueba: ≥ 64 % del ancho)
  const altoAcompana = forma === "horizontal" ? "58svh" : forma === "cuadrado" ? "84svh" : "64svh";
  return (
    <section aria-label={tc.laPruebaPrincipal} data-forma={forma} data-lado={impar ? "der" : "izq"} className={css.principal}>
      <div className={css.escena}>
        <FiguraMedio
          medio={principal}
          idioma={idioma}
          ancho={anchoPrincipal}
          telefono={forma === "vertical"}
          inclina={forma === "vertical" ? -2 : forma === "horizontal" && impar ? 1.5 : 0}
          className={css.medio}
          style={
            forma === "vertical"
              ? ({
                  "--ancho-tel-chico": anchoTelefono(principal, "76svh"),
                } as Vars)
              : undefined
          }
        />
        {acompana && (
          <FiguraMedio
            medio={acompana}
            idioma={idioma}
            ancho={esTelefono(acompana) ? anchoTelefono(acompana, altoAcompana) : "40vw"}
            telefono={esTelefono(acompana)}
            inclina={forma === "horizontal" ? -3 : forma === "cuadrado" ? 2 : 4}
            paralaje={0.6}
            className={css.acompana}
            style={
              {
                "--ancho-tel-chico": anchoTelefono(acompana, "68svh"),
              } as Vars
            }
          />
        )}
      </div>
      {textos.length > 0 && (
        <div className={css.texto}>
          {textos.map((s) => (
            <div key={s.id} className={css.bloque}>
              <h2 className={css.rotulo}>{s.titulo}</h2>
              <div className={`prosa ${css.prosa}`} dangerouslySetInnerHTML={{ __html: s.html }} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

const esTelefono = (m: Medio) => m.alto > m.ancho;
