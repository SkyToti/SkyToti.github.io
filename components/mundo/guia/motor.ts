// El motor de Haku: una máquina de estados imperativa (sin re-renders de React) con UN solo temporizador que avanza
// cuadro a cuadro y se apaga cuando no hay nada que animar (o la pestaña está oculta).
//   sentado ──scroll──▶ (sentarse al revés) ▶ caminar ──350 ms quieto──▶ (si quedó atrás: corre ≤ 0.6 s) ▶ sentarse ▶
//   sentado ▶ (presenta la estación actual) · 8 s sin actividad ▶ lamerse / bostezar · estación «pie» ▶ dormido ·
//   cursor rápido ▶ susto · clic sin frases ▶ saltar · estación con Haku propio ▶ corre hasta él, salta y desaparece
//   (entrarEnEscena) y vuelve a caer al salir (salirDeEscena): nunca hay dos Haku a la vista.
// Con menos movimiento no camina: presenta la estación que queda en medio de la ventana cuando el scroll para.
import type { Ciclo, DatosCiclos, Lienzo } from "./ciclos";
import { carrera, distanciaRuta, fpsCaminata, fraseSiguiente, ladoPresentar, objetivoX, paso } from "./logica";

type Paso = { ciclo: Ciclo; cuadro: number; ms: number };
type Modo = "sentado" | "caminar" | "secuencia" | "dormido" | "oculto";

export type OpcionesMotor = {
  lienzo: Lienzo;
  datos: DatosCiclos;
  /** se mueve en x (transform) */
  caja: HTMLElement;
  /** se voltea (data-espejo) para caminar a la izquierda */
  espejo: HTMLElement;
  /** el interruptor «guía / silencio»: la esquina de Haku queda justo a su derecha */
  interruptor?: HTMLElement | null;
  quieto: boolean;
  silencio: boolean;
  frases: Record<string, string[]>;
  repuesto?: string[];
  /** abre (texto) o cierra (null) el globo */
  decir: (texto: string | null) => void;
  /** esconde (true) o muestra (false) al guía; `cae` = vuelve con su caída */
  ocultar?: (si: boolean, cae: boolean) => void;
  /** ¿se ve el guía? (en la portada, arriba del todo, el Haku que se ve es el del escritorio) */
  visible?: () => boolean;
  /** dónde sentarse cerca de `x` sin taparle nada a nadie (y a qué escala); null = donde está */
  hueco?: (x: number) => { x: number; escala: number; libre: boolean } | null;
};

const ESQUINA = 12; // px de la orilla izquierda a la caja de Haku en su esquina
const PARAR_MS = 350;
const CORRE_PX = 500; // hasta el hueco donde sentarse: a más de esto corre; a menos, camina
const OCIO_MS = 8000;
const QUIETO_MS = 320; // con menos movimiento: cuánto esperar a que pare el scroll para presentar
const REVISA_MS = 900; // ya sentado: cuándo volver a mirar si lo de alrededor (que se sigue revelando) le cayó encima

const pasos = (ciclo: Ciclo, cuadros: number[], fps: number): Paso[] => cuadros.map((cuadro) => ({ ciclo, cuadro, ms: 1000 / fps }));

/** la estación que contiene el centro de la ventana (la más honda, si se anidan); el pie solo si de verdad se llegó al final */
export function estacionActual(): { nombre: string; lado: string | undefined } | null {
  const mx = innerWidth / 2, my = innerHeight / 2;
  let hallada: HTMLElement | null = null;
  for (const el of document.querySelectorAll<HTMLElement>("[data-estacion]")) {
    if (el.closest("[data-guia]")) continue;
    const r = el.getBoundingClientRect();
    if (r.height > 0 && r.top <= my && r.bottom >= my && r.left <= mx && r.right >= mx) hallada = el;
  }
  const pie = document.querySelector<HTMLElement>('[data-estacion="pie"]');
  const alFinal = scrollY + innerHeight >= document.documentElement.scrollHeight - 4;
  if (pie && alFinal && pie.getBoundingClientRect().top < innerHeight) hallada = pie;
  if (!hallada) return null;
  return { nombre: hallada.dataset.estacion ?? "", lado: hallada.dataset.lado };
}

export class Motor {
  private o: OpcionesMotor;
  private modo: Modo = "sentado";
  private x = 0;
  private dir: 1 | -1 = 1;
  private espejado = false;
  private cuadroCamina = 0;
  private cola: Paso[] = [];
  private despues: (() => void) | null = null;
  private interrumpible = true;
  private reloj: ReturnType<typeof setTimeout> | undefined;
  private ocio: ReturnType<typeof setTimeout> | undefined;
  private esperaQuieto: ReturnType<typeof setTimeout> | undefined;
  private arranque: ReturnType<typeof setTimeout> | undefined;
  private ultimoScroll = -1e9;
  private ultimaActividad = 0;
  private scrollPrevio = 0;
  private tiempoPrevio = 0;
  private vel = 0;
  private objetivo = 0;
  private estacion: string | null = null;
  private presentada: string | null = null;
  private pendiente: { nombre: string; lado: string | undefined } | "dormir" | null = null;
  private vistas = new Map<string, number>();
  private sustoHasta = 0;
  private puntero: { x: number; y: number; t: number } | null = null;
  private miradaPendiente = false;
  private largoAlterno = 0;
  /** la carrera al parar (se quedó atrás) o hacia un destino fijo */
  private corre: { fps: number; px: number } | null = null;
  private destino: number | null = null;
  private alDestino: (() => void) | null = null;
  /** la estación con Haku propio en la que el guía «se convirtió» (oculto mientras tanto) */
  private escena: string | null = null;
  private quitar: (() => void)[] = [];
  /** sentado (o haciendo algo sentado): ahí no tapa nada; caminando sí puede cruzar por delante */
  private asentado = false;
  private escala = 1;
  private vigiaHueco: ReturnType<typeof setTimeout> | undefined;
  /** cuántas veces se ha vuelto a acomodar desde el último scroll (tope: no persigue lo que se sigue moviendo) */
  private reacomodos = 0;

  constructor(o: OpcionesMotor) {
    this.o = o;
  }

  // ── medidas ──
  private anchoCaja() {
    return this.o.caja.offsetWidth || this.o.datos.ancho;
  }
  private esquina() {
    const r = this.o.interruptor?.getBoundingClientRect();
    return (r && r.width ? r.right + 4 : ESQUINA) + this.anchoCaja() * 0.2;
  }
  private colocar() {
    this.o.caja.style.transform = `translate3d(${(this.x - this.anchoCaja() / 2).toFixed(1)}px,0,0)`;
  }
  private voltear(si: boolean) {
    this.espejado = si;
    this.o.espejo.dataset.espejo = si ? "1" : "0";
  }
  /** zancada en px: unidades del lienzo × px por unidad */
  private zancada() {
    return this.o.datos.zancada * (this.anchoCaja() / this.o.datos.ancho);
  }
  private visible() {
    return this.o.visible ? this.o.visible() : true;
  }
  /** sentado al 100 % o, si no hay hueco, al 70 % (crece desde el piso, con transición en el CSS) */
  private ponerEscala(e: number) {
    this.escala = e;
    this.o.espejo.style.scale = e === 1 ? "" : String(e);
  }
  private marcarAsentado(si: boolean) {
    this.asentado = si;
    this.o.caja.toggleAttribute("data-asentado", si);
    if (!si) clearTimeout(this.vigiaHueco);
  }
  private hueco(x: number) {
    return this.o.hueco && this.visible() && !this.escena ? this.o.hueco(x) : null;
  }
  /** quieto o en silencio no camina: aparece en su sitio (la esquina, o el hueco más cercano a ella) */
  private acomodarQuieto() {
    if (this.escena) return;
    const h = this.hueco(this.esquina());
    this.x = h ? h.x : this.esquina();
    this.ponerEscala(h ? h.escala : 1);
    this.colocar();
  }
  /** ya sentado: si algo que se reveló le quedó debajo, se cambia de sitio (o de tamaño) */
  private reacomodar = () => {
    if (!this.asentado || this.escena || document.hidden) return;
    if (this.o.quieto || this.o.silencio) return this.acomodarQuieto();
    if (!(this.modo === "sentado" || this.modo === "dormido" || (this.modo === "secuencia" && this.interrumpible))) return;
    const h = this.hueco(this.x);
    if (!h) return;
    if (Math.abs(h.x - this.x) <= this.zancada() * 0.5) {
      if (h.escala !== this.escala) this.ponerEscala(h.escala);
      return;
    }
    if (this.reacomodos >= 2) return;
    this.reacomodos++;
    const dormia = this.modo === "dormido";
    this.irA(h.x, dormia ? () => this.dormir() : undefined, true, h.escala, true);
  };
  /** el escenario bajo la mitad de la ventana y cuánto se ha avanzado dentro (0..1) */
  private medir() {
    const mitad = innerHeight * 0.5;
    let nombre: string | null = null, avance = 0;
    for (const el of document.querySelectorAll<HTMLElement>("[data-estacion]")) {
      if (el.closest("[data-guia]")) continue;
      const r = el.getBoundingClientRect();
      if (r.top <= mitad && r.height > 0) {
        nombre = el.dataset.estacion ?? null;
        avance = (mitad - r.top) / r.height;
      }
    }
    this.estacion = nombre ?? this.estacion;
    this.objetivo = objetivoX(avance, innerWidth);
  }

  // ── el reloj ──
  private programar(ms: number) {
    clearTimeout(this.reloj);
    if (document.hidden) return;
    this.reloj = setTimeout(this.tic, ms);
  }
  private avanzar(nx: number) {
    this.x = nx;
    this.cuadroCamina = (this.cuadroCamina + 1) % 6;
    this.o.lienzo.mostrar("caminar", this.cuadroCamina);
    this.colocar();
  }
  private tic = () => {
    if (this.modo === "secuencia") {
      const p = this.cola.shift();
      if (!p) {
        const d = this.despues;
        this.despues = null;
        this.interrumpible = true;
        if (d) d();
        else this.sentado();
        return;
      }
      this.o.lienzo.mostrar(p.ciclo, p.cuadro);
      this.programar(p.ms);
      return;
    }
    if (this.modo === "caminar") {
      // hacia un destino fijo (para que quepa su globo, o hasta el Haku de una estación)
      if (this.destino !== null && this.corre) {
        const d = this.destino - this.x;
        if (Math.abs(d) <= this.corre.px) {
          this.avanzar(this.destino);
          const f = this.alDestino;
          this.destino = null;
          this.alDestino = null;
          this.corre = null;
          return f ? f() : this.parar();
        }
        this.avanzar(this.x + Math.sign(d) * this.corre.px);
        this.programar(1000 / this.corre.fps);
        return;
      }
      if (performance.now() - this.ultimoScroll >= PARAR_MS) {
        // el scroll paró: si se quedó atrás, corre (doble de cuadros, ≤ 0.6 s) hasta su marca y luego se sienta
        if (!this.corre) {
          const falta = distanciaRuta(this.x, this.objetivo, this.dir, innerWidth, this.anchoCaja());
          this.corre = carrera(falta, this.zancada(), fpsCaminata(this.vel));
          if (!this.corre) return this.parar();
        }
        const r = paso(this.x, this.objetivo, this.dir, innerWidth, this.anchoCaja(), this.corre.px);
        if (!r.avanzo) {
          this.corre = null;
          return this.parar();
        }
        this.avanzar(r.x);
        this.programar(1000 / this.corre.fps);
        return;
      }
      const r = paso(this.x, this.objetivo, this.dir, innerWidth, this.anchoCaja(), this.zancada());
      // un cuadro = una zancada: el pie apoyado no patina
      if (r.avanzo) this.avanzar(r.x);
      this.programar(1000 / fpsCaminata(this.vel));
      return;
    }
    if (this.modo === "dormido") {
      const c = this.o.lienzo.cuadro === 0 ? 1 : 0;
      this.o.lienzo.mostrar("dormir", c);
      this.programar(c ? 1300 : 1100);
    }
  };

  private secuencia(lista: Paso[], despues: (() => void) | null, interrumpible = true) {
    clearTimeout(this.ocio);
    this.modo = "secuencia";
    this.cola = lista;
    this.despues = despues;
    this.interrumpible = interrumpible;
    this.tic();
  }

  // ── estados ──
  private sentado() {
    this.modo = "sentado";
    this.marcarAsentado(true);
    clearTimeout(this.vigiaHueco);
    this.vigiaHueco = setTimeout(this.reacomodar, REVISA_MS);
    clearTimeout(this.reloj);
    this.o.lienzo.mostrar("sentado", 0);
    if (this.puntero) this.mirada();
    if (this.pendiente && !this.o.quieto && !this.o.silencio && this.visible()) return this.atender();
    this.programarOcio();
  }

  private programarOcio() {
    clearTimeout(this.ocio);
    if (this.o.quieto || document.hidden || this.modo !== "sentado") return;
    const falta = OCIO_MS - (performance.now() - this.ultimaActividad);
    const corto = 2600 + Math.random() * 2200;
    this.ocio = setTimeout(() => {
      if (this.modo !== "sentado") return;
      if (performance.now() - this.ultimaActividad >= OCIO_MS) {
        this.ultimaActividad = performance.now(); // el siguiente gesto largo, en otros 8 s
        this.largoAlterno++;
        return this.largoAlterno % 2
          ? this.secuencia(pasos("lamerse", [0, 1, 2, 3, 1, 2, 3, 0], 6), null)
          : this.secuencia(pasos("bostezar", [0, 1, 1, 1, 1, 2, 2], 5), null);
      }
      if (Math.random() < 0.6) this.secuencia(pasos("parpadeo", [0, 1, 0], 14), null);
      else this.secuencia(pasos("cola", [1, 2, 1, 0], 6), null);
    }, Math.max(400, Math.min(corto, falta > 0 ? falta : corto)));
  }

  private levantarse(callar = true) {
    if (callar) this.o.decir(null);
    this.marcarAsentado(false);
    this.ponerEscala(1);
    const desdeDormido = this.modo === "dormido";
    const lista = [...(desdeDormido ? pasos("sentado", [0, 0], 8) : []), ...pasos("sentarse", [2, 1, 0], 12)];
    this.secuencia(lista, () => this.caminar(), false);
  }

  private caminar() {
    this.modo = "caminar";
    this.voltear(this.destino !== null ? this.destino < this.x : this.dir < 0);
    this.o.lienzo.mostrar("caminar", this.cuadroCamina);
    this.programar(1000 / (this.corre?.fps ?? fpsCaminata(this.vel)));
  }

  /** el scroll paró y llegó a su marca: antes de sentarse busca un hueco donde no tape nada (y sigue hasta él) */
  private parar() {
    const h = this.hueco(this.x);
    if (h && Math.abs(h.x - this.x) > this.zancada() * 0.5) {
      this.destino = h.x;
      this.alDestino = () => this.sentarseYa(h.escala);
      // camina con su ciclo; si el hueco está a más de 500 px, corre (≤ 0.6 s)
      const lejos = Math.abs(h.x - this.x) > CORRE_PX;
      this.corre = (lejos ? carrera(Math.abs(h.x - this.x), this.zancada(), 12) : null) ?? { fps: 12, px: this.zancada() };
      return this.caminar();
    }
    this.sentarseYa(h?.escala ?? 1);
  }

  private sentarseYa(escala: number) {
    const pie = this.estacion === "pie" || this.pendiente === "dormir";
    this.ponerEscala(escala);
    this.marcarAsentado(true);
    this.secuencia(pasos("sentarse", [0, 1, 2], 10), () => {
      if (pie && !this.o.silencio) {
        this.pendiente = null;
        this.dormir();
      } else this.sentado();
    });
  }

  private dormir() {
    this.o.decir(null);
    this.modo = "dormido";
    this.marcarAsentado(true);
    clearTimeout(this.ocio);
    this.o.lienzo.mostrar("dormir", 0);
    if (!this.o.quieto) this.programar(1100);
  }

  /** se sienta, mira hacia el contenido, lo señala con la pata y suelta la primera frase */
  private atender() {
    const p = this.pendiente;
    if (!p) return;
    // escondido (arriba del todo en la portada): lo guarda para cuando se vea
    if (!this.visible() && !this.escena) return;
    this.pendiente = null;
    if (p === "dormir") return this.dormir();
    this.estacion = p.nombre;
    this.presentada = p.nombre;
    const lado = ladoPresentar(p.lado, this.x, innerWidth);
    const frase = this.frase(p.nombre);
    if (this.o.quieto || this.o.silencio || this.escena) {
      if (frase && !this.o.silencio) this.o.decir(frase);
      return;
    }
    const mira = (lado === "der") !== this.espejado ? 0 : 1;
    this.secuencia(pasos("mirar", Array(8).fill(mira), 10), () => {
      this.voltear(lado === "izq");
      if (frase) this.o.decir(frase);
      this.secuencia(pasos("senalar", [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0], 8), null);
    });
  }

  /** con menos movimiento: presenta la estación que quedó en medio de la ventana (una vez por estación) */
  private presentarActual() {
    if (this.o.silencio || this.escena) return;
    const e = estacionActual();
    if (!e || e.nombre === this.presentada) return;
    // (presentada se marca en atender: si aún no se veía, se reintenta)
    this.estacion = e.nombre;
    if (e.nombre === "pie") {
      this.pendiente = null;
      return this.dormir();
    }
    if (this.modo === "dormido") this.sentado();
    this.pendiente = e;
    this.atender();
  }

  private frase(nombre: string | null) {
    const k = nombre ?? "";
    const n = this.vistas.get(k) ?? 0;
    const f = fraseSiguiente(this.o.frases[k], this.o.repuesto, n);
    if (f) this.vistas.set(k, n + 1);
    return f;
  }

  private mirada() {
    if (this.miradaPendiente || !this.puntero) return;
    this.miradaPendiente = true;
    requestAnimationFrame(() => {
      this.miradaPendiente = false;
      if (this.modo !== "sentado" || !this.puntero || this.o.quieto) return;
      const r = this.o.caja.getBoundingClientRect();
      const ex = r.left + r.width / 2, ey = r.top + r.height * (55 / 120);
      let dx = (this.puntero.x - ex) / 220;
      const dy = (this.puntero.y - ey) / 220;
      if (this.espejado) dx = -dx;
      this.o.lienzo.pupilas(dx, dy);
    });
  }

  private asustar() {
    const ahora = performance.now();
    if (this.o.quieto || this.escena || this.modo === "dormido" || this.modo === "caminar" || !this.interrumpible || ahora < this.sustoHasta) return;
    this.sustoHasta = ahora + 5000;
    this.o.decir(null);
    this.secuencia(pasos("susto", [0, 1, 1, 1, 1, 1, 0], 10), () => {
      if (performance.now() - this.ultimoScroll < PARAR_MS && !this.o.silencio) this.caminar();
      else this.secuencia(pasos("sentarse", [1, 2], 10), null);
    }, false);
  }

  // ── eventos ──
  private alScroll = () => {
    const ahora = performance.now();
    const y = scrollY, dy = y - this.scrollPrevio, dt = Math.max(1, ahora - this.tiempoPrevio);
    this.scrollPrevio = y;
    this.tiempoPrevio = ahora;
    if (!dy) return;
    this.vel = this.vel * 0.6 + (dy / dt) * 0.4;
    this.ultimoScroll = ahora;
    this.ultimaActividad = ahora;
    this.medir();
    this.reacomodos = 0;
    if (this.escena) return; // es el Haku de la estación: el guía no anda
    if (this.o.quieto || this.o.silencio) {
      clearTimeout(this.esperaQuieto);
      this.esperaQuieto = setTimeout(() => {
        this.acomodarQuieto();
        if (!this.o.silencio) this.presentarActual();
      }, QUIETO_MS);
      return;
    }
    const dir: 1 | -1 = dy > 0 ? 1 : -1;
    // el scroll manda sobre cualquier carrera o destino a medias
    if (this.destino !== null) {
      this.destino = null;
      this.alDestino = null;
      this.o.decir(null);
    }
    this.corre = null;
    if (this.modo === "caminar") {
      if (dir !== this.dir) { this.dir = dir; this.voltear(dir < 0); }
      return;
    }
    this.dir = dir;
    if (this.modo === "dormido" && this.estacion === "pie") return; // en el pie se queda dormido
    if (this.modo === "secuencia" && !this.interrumpible) return;
    this.levantarse();
  };

  private alLlegar = (e: Event) => {
    const el = (e.target instanceof Element ? e.target : null)?.closest<HTMLElement>("[data-estacion]");
    const detalle = (e as CustomEvent<{ nombre?: string }>).detail;
    const nombre = detalle?.nombre ?? el?.dataset.estacion;
    if (!nombre || this.o.silencio) return;
    // con menos movimiento la chispa enciende todo de golpe: manda la posición del scroll, no el orden de los eventos
    if (this.o.quieto) return;
    this.ultimaActividad = performance.now();
    if (this.escena) {
      if (nombre === this.escena && nombre !== "pie") {
        const f = this.frase(nombre);
        if (f) this.o.decir(f);
      }
      return;
    }
    this.pendiente = nombre === "pie" ? "dormir" : { nombre, lado: el?.dataset.lado };
    if (this.modo === "sentado") this.atender();
    else if (this.modo === "secuencia" && this.interrumpible && !this.despues) this.sentado();
  };

  private alPuntero = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    const ahora = performance.now();
    const antes = this.puntero;
    this.puntero = { x: e.clientX, y: e.clientY, t: ahora };
    if (antes && ahora - antes.t < 80) {
      const v = Math.hypot(e.clientX - antes.x, e.clientY - antes.y) / Math.max(1, ahora - antes.t);
      const r = this.o.caja.getBoundingClientRect();
      const cerca = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2)) < Math.max(150, r.width);
      if (cerca && v > 2.6) return this.asustar();
    }
    if (this.modo === "sentado") this.mirada();
  };

  private alVisibilidad = () => {
    if (document.hidden) {
      clearTimeout(this.reloj);
      clearTimeout(this.ocio);
      return;
    }
    if (this.modo === "sentado") this.programarOcio();
    else if (this.modo !== "oculto") this.tic();
  };

  private alCambiarTamano = () => {
    if (this.o.quieto || this.o.silencio) return this.acomodarQuieto();
    this.x = Math.min(innerWidth, Math.max(0, this.x));
    this.colocar();
    clearTimeout(this.vigiaHueco);
    if (this.asentado) this.vigiaHueco = setTimeout(this.reacomodar, REVISA_MS);
  };

  // ── API ──
  iniciar() {
    this.scrollPrevio = scrollY;
    this.tiempoPrevio = performance.now();
    this.ultimaActividad = performance.now();
    this.x = this.esquina();
    this.colocar();
    this.medir();
    this.voltear(false);
    this.sentado();
    if (this.o.quieto || this.o.silencio) this.acomodarQuieto();
    const on = <K extends keyof WindowEventMap>(t: K, f: (e: WindowEventMap[K]) => void) => {
      addEventListener(t, f as EventListener, { passive: true });
      this.quitar.push(() => removeEventListener(t, f as EventListener));
    };
    on("scroll", this.alScroll);
    on("resize", this.alCambiarTamano);
    on("pointermove", this.alPuntero);
    document.addEventListener("estacion:llega", this.alLlegar);
    document.addEventListener("visibilitychange", this.alVisibilidad);
    this.quitar.push(() => document.removeEventListener("estacion:llega", this.alLlegar));
    this.quitar.push(() => document.removeEventListener("visibilitychange", this.alVisibilidad));
    if (this.o.silencio) return;
    // la estación ACTUAL es la que contiene el centro de la ventana (no la última que encendió la chispa): con menos
    // movimiento la chispa las enciende todas al cargar. Solo se duerme si de verdad está en el pie.
    if (this.o.quieto) {
      this.presentarActual();
      // y otra vez cuando la página terminó de acomodarse (letras, dibujos): si ya presentó, no repite
      this.arranque = setTimeout(() => this.presentarActual(), 700);
      return;
    }
    const e = estacionActual();
    if (!e) return;
    this.pendiente = e.nombre === "pie" ? "dormir" : e;
    this.arranque = setTimeout(() => this.modo === "sentado" && this.atender(), 900);
  }

  destruir() {
    clearTimeout(this.reloj);
    clearTimeout(this.ocio);
    clearTimeout(this.esperaQuieto);
    clearTimeout(this.arranque);
    clearTimeout(this.vigiaHueco);
    this.quitar.forEach((f) => f());
    this.quitar = [];
    this.o.lienzo.destruir();
  }

  /** clic, toque o Enter: la siguiente frase, o un salto si no hay nada que decir */
  tocar() {
    this.ultimaActividad = performance.now();
    if (!this.estacion) this.medir();
    const actual = estacionActual()?.nombre ?? this.estacion;
    const frase = this.o.silencio ? null : this.frase(actual);
    if (frase) {
      // si esa estación estaba por presentarse, ya quedó presentada (así no dice la segunda frase al sentarse)
      if (this.pendiente && this.pendiente !== "dormir" && this.pendiente.nombre === actual) this.pendiente = null;
      this.presentada = actual;
      this.o.decir(frase);
      if (this.modo === "sentado" && !this.o.quieto) this.secuencia(pasos("senalar", [0, 1, 1, 1, 1, 1, 1, 1, 0], 8), null);
      return;
    }
    if (this.o.quieto || this.modo === "dormido" || !this.interrumpible) return;
    const caminaba = this.modo === "caminar";
    this.secuencia(pasos("saltar", [0, 0, 1, 2, 2, 2, 3, 3], 12), () => {
      if (caminaba && performance.now() - this.ultimoScroll < PARAR_MS) this.caminar();
      else this.secuencia(pasos("sentarse", [0, 1, 2], 12), null);
    }, false);
  }

  /** la x (centro) de Haku en la ventana */
  posicion() {
    return this.x;
  }

  /**
   * Camina (corriendo, ≤ 0.6 s) hasta `x` y entonces llama a `despues` (sin `despues`, se sienta). Con menos movimiento
   * o en silencio, aparece ahí sin caminar. No cierra el globo: lo usa el guía para ir a donde su globo quepa.
   */
  irA(x: number, despues?: () => void, sentarse = true, escala = 1, libre = false) {
    const caja = this.anchoCaja();
    // (`libre`: la x ya viene de buscar hueco y puede asomarse por la orilla)
    const nx = libre ? x : Math.min(innerWidth - caja * 0.3, Math.max(caja * 0.3, x));
    const fin = sentarse
      ? () => {
          this.ponerEscala(escala);
          this.marcarAsentado(true);
          this.secuencia(pasos("sentarse", [0, 1, 2], 12), () => { this.sentado(); despues?.(); });
        }
      : despues ?? (() => this.sentado());
    if (this.o.quieto || this.o.silencio || this.modo === "oculto") {
      this.x = nx;
      this.colocar();
      return fin();
    }
    this.destino = nx;
    this.alDestino = fin;
    this.corre = carrera(Math.abs(nx - this.x), this.zancada(), 12) ?? { fps: 24, px: this.zancada() };
    if (this.modo === "caminar") return this.caminar();
    this.levantarse(false);
  }

  /** una estación con Haku propio entra: el guía corre hasta él, salta y desaparece; luego avisa con `listo` */
  entrarEnEscena(nombre: string, x: number, listo: () => void) {
    if (this.escena === nombre) return;
    this.escena = nombre;
    this.pendiente = null;
    this.o.decir(null);
    const fin = () => {
      if (this.escena !== nombre) return;
      clearTimeout(this.reloj);
      clearTimeout(this.ocio);
      this.modo = "oculto";
      this.o.ocultar?.(true, false);
      listo();
      // si la chispa ya había llegado a esa estación y no la presentó, el Haku de la estación dice su frase
      const llego = document.querySelector(`[data-estacion="${nombre}"]`)?.classList.contains("llego");
      if (nombre !== "pie" && !this.o.silencio && (this.o.quieto || llego) && !this.vistas.get(nombre)) {
        const f = this.frase(nombre);
        if (f) this.o.decir(f);
      }
      this.presentada = nombre;
    };
    if (this.o.quieto || this.o.silencio || !this.visible()) {
      this.x = Math.min(innerWidth, Math.max(0, x));
      this.colocar();
      return fin();
    }
    this.irA(x, () => this.secuencia(pasos("saltar", [0, 0, 1, 2, 2, 3, 3, 3], 14), fin, false), false);
  }

  /** la estación con Haku propio salió de la ventana: el guía vuelve a caer al piso */
  salirDeEscena() {
    if (!this.escena) return;
    this.escena = null;
    this.destino = null;
    this.alDestino = null;
    this.corre = null;
    this.o.decir(null);
    this.x = Math.min(innerWidth - this.anchoCaja() * 0.3, Math.max(this.anchoCaja() * 0.3, this.x));
    // cae ya en un hueco (no encima de lo que se lee)
    const h = this.hueco(this.o.quieto || this.o.silencio ? this.esquina() : this.x);
    if (this.o.quieto || this.o.silencio) this.x = this.esquina();
    if (h) {
      this.x = h.x;
      this.ponerEscala(h.escala);
    }
    this.colocar();
    this.o.ocultar?.(false, !this.o.quieto);
    this.sentado();
    if (this.o.quieto) this.presentarActual();
  }

  ponerSilencio(si: boolean) {
    this.o.silencio = si;
    if (!si) return;
    this.o.decir(null);
    clearTimeout(this.reloj);
    this.pendiente = null;
    this.destino = null;
    this.corre = null;
    this.voltear(false);
    this.acomodarQuieto();
    if (this.escena) {
      this.modo = "oculto";
      return;
    }
    this.sentado();
  }

  ponerFrases(frases: Record<string, string[]>, repuesto?: string[]) {
    this.o.frases = frases;
    this.o.repuesto = repuesto;
  }
}
