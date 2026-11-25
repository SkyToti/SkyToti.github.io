import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, LayoutGroup, LazyMotion, MotionConfig } from "motion/react";
import Heroe, { type Seccion } from "./heroe/Heroe";
import Mosaico from "./mosaico/Mosaico";
import type { DetalleId } from "./detalle/Detalle";
import type { Resultado } from "./buscar/Buscar";
import Entrada from "./entrada/Entrada";
import type { EstadoExpediente } from "./expedientes/Expediente";
import { SIN_CAMBIOS, type CambiosAgenda, type VistaAgenda } from "./agenda/cambios";
import { precalentarSemanas } from "./agenda/datos";
import { Cubierta } from "./ui/cubierta";
// las pantallas completas y el modo presentación se cargan al abrirse (BRIEF-5 §2.B3)
import { Agenda, Armar, Bandeja, Buscar, Detalle, Equipo, Expediente, Expedientes, NuevaUnidad, Pacientes, Perfil, precargar, precargas, Recorrido, Tablero, trasLaMuela } from "./perezosas";
import { aPaciente, estudioDeBandeja, type Armado, type Lectura } from "./armar/lectura";
import { ESTUDIOS, ORDENES } from "./negocio/datos";
import { Aviso, avisoDicho, fijarAvisoDicho, primeraVez, type DatosAviso } from "./ui/Aviso";
import type { ControlRecorrido } from "./recorrido/Recorrido";
import { ANCLA_SUPERFICIE, anclaDe, marcasDe, PACIENTES, pacientePorId, piezaInicial, type Decision } from "./expedientes/datos";
import { colorDe, metaClinica, NOMBRE_ESTADO, NOMBRE_SUPERFICIE, nombrePieza, orientacionDe, tipoDePieza, type MetaClinica } from "./expedientes/clinica";
import { nuevaVista, ORDEN_VISTAS, VISTAS, type Llamada, type Vista, type VistaBase, type VistaId } from "./vista";
import type { TeselaId } from "./color";
import { enCurso } from "./motor/suave";
import { estadoMuela } from "./objeto/Objeto";
import { movimientoReducido } from "./motor/bucle";

/** La hora se puede fijar con ?hora=13.1 (para capturas y pruebas); si no, es la real */
function horaDeLaURL(): Date {
  const d = new Date();
  const q = new URLSearchParams(location.search).get("hora");
  if (q && !Number.isNaN(Number(q))) {
    const h = Number(q);
    d.setHours(Math.floor(h), Math.round((h % 1) * 60), 0, 0);
    if (d.getDay() === 0) d.setDate(d.getDate() + 1); // en domingo no hay consulta: la captura usa el lunes
  }
  return d;
}
const parametro = (n: string) => new URLSearchParams(location.search).get(n);

type Capa = { tipo: "detalle"; id: DetalleId } | { tipo: "perfil"; id: string } | { tipo: "expediente"; id: string } | null;
type Pantalla = "pacientes" | "laboratorio" | "imagen" | null;
type Armando = { layoutId: string; id: string; inicial?: Partial<Armado>; estudio?: string; fase?: "armado" | "chat"; vuelta?: number } | null;

/** Todo lo que el recorrido automático puede cambiar: se guarda al empezar y se regresa al salir (BRIEF-5 §2.B1) */
interface Foto {
  unidad: VistaId;
  nuevas: Vista[];
  seccion: Seccion;
  capa: Capa;
  expedientes: Record<string, EstadoExpediente>;
  pieza: number | null;
  foco: string | null;
  cambiosAgenda: CambiosAgenda;
  agendaFecha: Date | undefined;
  agenda: VistaAgenda | null;
  pantalla: Pantalla;
  ordenes: typeof ORDENES;
  estudios: typeof ESTUDIOS;
  armado: Armando;
  creando: boolean;
  buscando: boolean;
  avisoApp: DatosAviso | null;
  pacientes: number;
  armados: number;
  cuantasNuevas: number;
  avisoDicho: boolean;
}

/** Hasta cuándo sigue una animación de maquetación (un mosaico que crece): un plazo, para que no se atore si se interrumpe */
const layout = { hasta: 0 };

/** Adónde lleva cada llamada del héroe al tocarla */
const DESTINO_LLAMADA: Record<string, { detalle?: DetalleId; expediente?: string }> = {
  lab: { detalle: "laboratorio" },
  sillones: { detalle: "sillones" },
  pacientes: { detalle: "pacientes" },
  implantes: { expediente: "hector" },
  whatsapp: { detalle: "whatsapp" },
  rotan: { detalle: "rotan" },
  brackets: { expediente: "lucia" },
  sucursales: { detalle: "expansion" },
  licencias: { detalle: "pacientes" },
  escaneo: { expediente: "emilio" },
  estudios: { detalle: "imagen" },
  mercado: { detalle: "imagen" },
  etapa: { detalle: "whatsapp" },
  piezas: { detalle: "laboratorio" },
  ordenes: { detalle: "laboratorio" },
  zirconia: { detalle: "laboratorio" },
  entrega: { detalle: "laboratorio" },
};

/** Un armado de ejemplo para las capturas (?pantalla=armar&ejemplo=1): paciente ficticio */
const EJEMPLO_ARMADO: Partial<Armado> = {
  nombre: "Daniel O.",
  edad: 44,
  unidad: "imagen",
  motivo: "Dolor al masticar",
  antecedentes: ["Hipertensión", "Fuma"],
  marcas: [
    { pieza: 36, superficie: "oclusal", estado: "por-tratar", tipo: "caries" },
    { pieza: 36, superficie: "distal", estado: "por-tratar", tipo: "caries" },
    { pieza: 16, superficie: "oclusal", estado: "realizado", tipo: "restauracion" },
    { pieza: 16, superficie: "conducto", estado: "realizado", tipo: "endodoncia" },
    { pieza: 46, superficie: "raiz", estado: "realizado", tipo: "ausente" },
  ],
  estudios: ["panoramica", "aleta"],
  notas: "Refiere dolor al morder del lado izquierdo desde hace dos semanas.",
};

const estadosIniciales = (): Record<string, EstadoExpediente> =>
  Object.fromEntries(PACIENTES.map((p) => [p.id, { estado: p.analizada ? "analizado" : "sin analizar", decisiones: {} } as EstadoExpediente]));

/** Las funciones de animación bajan aparte, en paralelo al arrancar (BRIEF-5 §2.B3) */
// se piden en cuanto se ve la muela (sin esperar reposo): así la primera vez que algo se abre ya crece desde su origen
const funciones = { listas: false };
const cargarFunciones = () =>
  trasLaMuela(false).then(() =>
    import("./motor/funciones").then((r) => {
      funciones.listas = true;
      return r.default;
    }),
  );

export default function App() {
  const ahora = useMemo(horaDeLaURL, []);
  const [unidad, setUnidad] = useState<VistaId>(() => {
    const q = parametro("unidad");
    return q && q in VISTAS ? (q as VistaId) : "todo";
  });
  // las unidades creadas en el demo («Nueva unidad», BRIEF-4 §4.D): viven solo en esta pestaña
  const [nuevas, setNuevas] = useState<Vista[]>([]);
  const [creando, setCreando] = useState(false);
  const cuantasNuevas = useRef(0);
  const [avisoApp, setAvisoApp] = useState<DatosAviso | null>(null);
  const cerrarAvisoApp = useCallback(() => setAvisoApp(null), []);
  const opciones = useMemo(() => [...ORDEN_VISTAS.map((id) => VISTAS[id]), ...nuevas], [nuevas]);
  const [seccion, setSeccion] = useState<Seccion>("inicio");
  const [capa, setCapa] = useState<Capa>(null);
  const [buscando, setBuscando] = useState(false);
  const [entrada, setEntrada] = useState<"saludo" | "niebla" | "lista">(parametro("entrada") === "0" ? "lista" : "saludo");
  const [niebla, setNiebla] = useState(entrada === "lista" ? 0 : 1);
  const [expedientes, setExpedientes] = useState(estadosIniciales);
  const [foco, setFoco] = useState<string | null>(null);
  // la pieza que se ve en la muela cuando hay un expediente abierto
  const [pieza, setPieza] = useState<number | null>(null);
  // la agenda a pantalla completa (BRIEF-4 §4.C); ?agenda=dia|semana la abre al cargar (maqueta y capturas)
  // lo que se mueve o se crea en la agenda vive aquí mientras dura la visita (no se guarda en ningún lado)
  const [cambiosAgenda, setCambiosAgenda] = useState<CambiosAgenda>(SIN_CAMBIOS);
  const [agendaFecha, setAgendaFecha] = useState<Date | undefined>(undefined);
  // las pantallas completas del bloque D (BRIEF-4 §4.D) y lo que cambia en ellas, en memoria
  const [pantalla, setPantalla] = useState<Pantalla>(() => {
    const q = parametro("pantalla");
    return q === "pacientes" || q === "laboratorio" || q === "imagen" ? q : null;
  });
  // armar un expediente (BRIEF-4 §4.E): de dónde crece, el id que tendrá y, si viene de Imagen Dental, su estudio.
  // Va encima de lo que haya (la bandeja sigue abierta debajo: al cerrar, el armado regresa a su fila)
  const cuantosArmados = useRef(0);
  const [armado, setArmado] = useState<Armando>(() =>
    parametro("pantalla") === "armar" ? { layoutId: "armar", id: "armado-1", inicial: parametro("ejemplo") ? EJEMPLO_ARMADO : undefined } : null,
  );
  // al cerrar una pantalla completa, el foco regresa al botón del detalle del que creció
  const cerrarPantalla = useCallback(() => {
    setPantalla(null);
    const volver = (n: number) => {
      const b = document.querySelector<HTMLElement>(".detalle-pantalla");
      if (b) b.focus({ preventScroll: true });
      else if (n > 0) requestAnimationFrame(() => volver(n - 1));
    };
    requestAnimationFrame(() => volver(20));
  }, []);
  const [ordenes, setOrdenes] = useState(ORDENES);
  const [estudios, setEstudios] = useState(ESTUDIOS);
  const [agenda, setAgenda] = useState<VistaAgenda | null>(() => {
    const q = parametro("agenda");
    return q === "dia" || q === "semana" || q === "mes" ? q : null;
  });
  // el estreno (cifras que cuentan desde 0 y líneas que se dibujan) corre una sola vez
  const [estreno, setEstreno] = useState(true);
  useEffect(() => {
    if (entrada === "saludo") return;
    const t = window.setTimeout(() => setEstreno(false), 2600);
    return () => window.clearTimeout(t);
  }, [entrada]);
  const vista = nuevas.find((v) => v.id === unidad) ?? VISTAS[unidad as VistaBase] ?? VISTAS.todo;
  const devolverFoco = useRef<HTMLElement | null>(null);

  const abrir = useCallback((c: Exclude<Capa, null>) => {
    devolverFoco.current = document.activeElement as HTMLElement | null;
    layout.hasta = performance.now() + 700;
    setCapa(c);
    if (c.tipo === "expediente") {
      const p = pacientePorId(c.id);
      if (p) setPieza(piezaInicial(p));
    }
    setFoco(null);
    setSeccion(
      c.tipo === "detalle" && c.id === "hoy" ? "hoy" : c.tipo === "perfil" && c.id !== "titular" ? "equipo" : c.tipo === "expediente" ? "expedientes" : (s) => (s === "hoy" ? "inicio" : s),
    );
  }, []);
  const cerrar = useCallback(() => {
    layout.hasta = performance.now() + 700;
    setCapa(null);
    setFoco(null);
    setSeccion((s) => (s === "hoy" ? "inicio" : s));
    // el foco regresa a lo que abrió la capa; si era un mosaico, se volvió a montar: se busca por su «data-abrir»
    const antes = devolverFoco.current;
    const clave = antes?.dataset?.abrir ?? antes?.closest<HTMLElement>("[data-tesela]")?.dataset.tesela;
    const doctor = antes?.closest<HTMLElement>("[data-doctor]")?.dataset.doctor;
    const paciente = antes?.closest<HTMLElement>("[data-paciente]")?.dataset.paciente;
    const volver = (intentos: number) => {
      const el = antes?.isConnected
        ? antes
        : clave
          ? document.querySelector<HTMLElement>(`[data-abrir="${clave}"]`)
          : doctor
            ? document.querySelector<HTMLElement>(`[data-doctor="${doctor}"]`)
            : paciente
              ? document.querySelector<HTMLElement>(`[data-paciente="${paciente}"]`)
              : null;
      if (el) el.focus({ preventScroll: true });
      else if (intentos > 0) requestAnimationFrame(() => volver(intentos - 1));
    };
    requestAnimationFrame(() => volver(20));
  }, []);

  const ir = (s: Seccion) => {
    if (s === "hoy") return abrir({ tipo: "detalle", id: "hoy" });
    setCapa(null);
    setSeccion(s);
  };

  // el modo presentación (BRIEF-5 §2.B1): ?presentar=1, el gesto en la marca o «recorrido» en la búsqueda
  const [presentando, setPresentando] = useState(() => parametro("presentar") === "1");

  const elegirResultado = (r: Resultado) => {
    setBuscando(false);
    if (r.tipo === "comando") return setPresentando(true);
    if (r.tipo === "unidad") {
      setCapa(null);
      setSeccion("inicio");
      setUnidad(r.id as VistaId);
    } else if (r.tipo === "doctor") abrir({ tipo: "perfil", id: r.id });
    else if (r.tipo === "paciente") abrir({ tipo: "expediente", id: r.id });
    else abrir({ tipo: "detalle", id: r.id as DetalleId });
  };

  // el análisis de la IA sobre la radiografía de un paciente
  const analizar = (id: string) => setExpedientes((e) => ({ ...e, [id]: { ...e[id], estado: "analizando" } }));
  const terminarAnalisis = useCallback((id: string) => setExpedientes((e) => ({ ...e, [id]: { ...e[id], estado: "analizado" } })), []);
  // armar un expediente y llevar al expediente lo que leyó la IA (BRIEF-4 §4.E)
  const abrirArmado = (x: { layoutId: string; inicial?: Partial<Armado>; estudio?: string }) => setArmado({ ...x, id: `armado-${cuantosArmados.current + 1}` });
  const cerrarArmado = () => {
    const origen = armado?.estudio ? `[data-armar-estudio="${armado.estudio}"]` : "[data-armar]";
    setArmado(null);
    const volver = (n: number) => {
      const b = document.querySelector<HTMLElement>(origen);
      if (b) b.focus({ preventScroll: true });
      else if (n > 0) requestAnimationFrame(() => volver(n - 1));
    };
    requestAnimationFrame(() => volver(20));
  };
  const llevarAlExpediente = (a: Armado, l: Lectura) => {
    if (!armado) return;
    const id = armado.id;
    cuantosArmados.current += 1;
    // el expediente nuevo vive en memoria, como todo lo del demo
    if (!pacientePorId(id)) PACIENTES.push(aPaciente(a, l, id, ahora));
    setExpedientes((e) => ({ ...e, [id]: { estado: "analizado", decisiones: {} } }));
    if (armado.estudio) setEstudios((es) => es.map((x) => (x.id === armado.estudio ? { ...x, estado: "En el expediente", expediente: id } : x)));
    const previo = armado;
    const estudiosAntes = estudios;
    const pantallaAntes = pantalla;
    setArmado(null);
    setPantalla(null);
    abrir({ tipo: "expediente", id });
    // «Deshacer» (BRIEF-5 §2.B2): el expediente se quita y el armado regresa como lo dejaste
    setAvisoApp({
      texto: `${a.nombre.trim() || "El paciente"}: expediente armado en este demo`,
      recarga: primeraVez(),
      deshacer: () => {
        const i = PACIENTES.findIndex((p) => p.id === id);
        if (i >= 0) PACIENTES.splice(i, 1);
        cuantosArmados.current = Math.max(0, cuantosArmados.current - 1);
        setExpedientes((e) => {
          const resto = { ...e };
          delete resto[id];
          return resto;
        });
        setEstudios(estudiosAntes);
        setCapa(null);
        setPantalla(pantallaAntes);
        // una llave nueva: si el armado anterior aún sale con su animación, no se revive (se quedaría en el chat)
        setArmado({ ...previo, inicial: { ...a }, fase: "armado", vuelta: Date.now() });
      },
    });
  };
  const decidir = (id: string, hallazgo: string, d: Decision | null) =>
    setExpedientes((e) => {
      const decisiones = { ...e[id].decisiones };
      if (d) decisiones[hallazgo] = d;
      else delete decisiones[hallazgo];
      return { ...e, [id]: { ...e[id], decisiones } };
    });

  // con un expediente abierto, la muela del héroe es la pieza elegida: sus marcas clínicas son sus llamadas
  const pacienteAbierto = capa?.tipo === "expediente" ? pacientePorId(capa.id) : undefined;
  const estadoAbierto = pacienteAbierto ? expedientes[pacienteAbierto.id] : undefined;
  const marcasAbiertas = useMemo(
    () => (pacienteAbierto && estadoAbierto && pieza != null ? marcasDe(pacienteAbierto, pieza, estadoAbierto.decisiones, estadoAbierto.estado === "analizado") : []),
    [pacienteAbierto, estadoAbierto, pieza],
  );
  const vistaHeroe: Vista = useMemo(() => {
    if (!pacienteAbierto || !estadoAbierto) return vista;
    const usadas = new Set<string>();
    const orden: [number, number][] = [
      [75, 39],
      [72, 13],
      [66, 63],
      [5, 52],
    ];
    const llamadas: Llamada[] = marcasAbiertas.slice(0, 4).map((m) => {
      let r = ANCLA_SUPERFICIE[m.superficie].ranura;
      if (usadas.has(r.join())) r = orden.find((o) => !usadas.has(o.join())) ?? r;
      usadas.add(r.join());
      const h = m.hallazgo;
      return {
        id: h ? h.id : `r-${pieza}-${m.superficie}`,
        tipo: "texto",
        titulo: NOMBRE_SUPERFICIE[m.superficie].replace(/^./, (c) => c.toUpperCase()),
        unidad: m.texto,
        nota: h ? (m.estado === "sugerido" ? `sugerido por la IA · certeza ${Math.round(h.certeza * 100)} %` : m.estado === "realizado" ? "hecho, según el dentista" : "confirmado por el dentista") : `${NOMBRE_ESTADO[m.estado]} · registro del dentista`,
        ancla: anclaDe(m.superficie, tipoDePieza(pieza ?? 16)),
        x: r[0],
        y: r[1],
        lado: r[0] < 30 ? "izq" : "der",
        color: colorDe(m.estado),
        trama: m.estado === "sugerido",
      };
    });
    // la forma: el implante solo si la pieza elegida falta; los brackets van con la paciente
    const ausente = marcasAbiertas.some((m) => m.tipo === "ausente" || m.tipo === "extraccion");
    const muela = { implante: 0, corona: 0, brackets: 0, escaneo: 0, fantasma: 0, ...pacienteAbierto.forma };
    if (!ausente) muela.implante = 0;
    if (estadoAbierto.estado === "analizando") muela.escaneo = 1;
    return { ...vista, llamadas, muela };
  }, [vista, pacienteAbierto, estadoAbierto, marcasAbiertas, pieza]);
  // los colores clínicos de la pieza elegida y hacia dónde gira para enseñarlos (la marca enfocada, o la más urgente)
  const muestra = parametro("muela") === "clinica";
  const clinicaHeroe: MetaClinica | null = useMemo(() => {
    if (muestra)
      return metaClinica([
        { superficie: "oclusal", estado: "realizado" },
        { superficie: "distal", estado: "por-tratar" },
        { superficie: "conducto", estado: "realizado" },
        { superficie: "periapical", estado: "sugerido" },
      ]);
    return pacienteAbierto && estadoAbierto?.estado !== "analizando" ? metaClinica(marcasAbiertas) : null;
  }, [muestra, pacienteAbierto, estadoAbierto, marcasAbiertas]);
  const orientacionHeroe = useMemo(() => {
    if (muestra) return orientacionDe("distal");
    if (!pacienteAbierto || !marcasAbiertas.length) return null;
    const enfocada = marcasAbiertas.find((m) => m.hallazgo && m.hallazgo.id === foco);
    const URG = { "por-tratar": 3, sugerido: 2, realizado: 1 } as const;
    const principal = enfocada ?? [...marcasAbiertas].sort((a, b) => URG[b.estado] - URG[a.estado])[0];
    return orientacionDe(principal.superficie);
  }, [muestra, pacienteAbierto, marcasAbiertas, foco]);

  const tocarLlamada = (id: string) => {
    if (pacienteAbierto) {
      setFoco(id);
      document.querySelector(`.hallazgo[data-hallazgo="${id}"]`)?.scrollIntoView({ block: "nearest", behavior: movimientoReducido() ? "auto" : "smooth" });
      return;
    }
    const d = DESTINO_LLAMADA[id];
    if (d?.detalle) abrir({ tipo: "detalle", id: d.detalle });
    else if (d?.expediente) abrir({ tipo: "expediente", id: d.expediente });
  };
  const llamadaTocable = (id: string) => !!pacienteAbierto || !!DESTINO_LLAMADA[id];



  // teclado global: «/» busca; Esc cierra lo de arriba
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      // con una pantalla completa o una hoja encima, el teclado es suyo (ellas atienden su Esc)
      if (pantalla || agenda || creando || armado) return;
      const escribiendo = (e.target as HTMLElement)?.matches?.("input, textarea");
      if (e.key === "/" && !escribiendo && entrada === "lista") {
        e.preventDefault();
        setBuscando(true);
      } else if (e.key === "Escape") {
        if (buscando) setBuscando(false);
        else if (capa) cerrar();
      }
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [buscando, capa, cerrar, entrada, pantalla, agenda, creando, armado]);

  // la señal para las pruebas: la interfaz terminó de moverse (como __crmQuieta)
  useEffect(() => {
    const w = window as unknown as { __crmQuieta: () => boolean; __crmEstado: () => object };
    const maquetando = () => performance.now() < layout.hasta;
    w.__crmQuieta = () => entradaLista.current && funciones.listas && precargas.listas && enCurso.n === 0 && !maquetando() && estadoMuela.quieta;
    // diagnóstico para las pruebas: qué parte sigue en movimiento
    w.__crmEstado = () => ({ entrada: entradaLista.current, funciones: funciones.listas, transiciones: enCurso.n, maquetacion: maquetando(), muela: estadoMuela.quieta });
    // para las pruebas del recorrido: lo que el recorrido no debe dejar cambiado (BRIEF-5 §5)
    (window as unknown as { __crmFoto: () => string }).__crmFoto = () => {
      const f = controlRecorrido.instantanea();
      return JSON.stringify({ unidad: f.unidad, seccion: f.seccion, capa: f.capa, pantalla: f.pantalla, agenda: f.agenda, armado: !!f.armado, creando: f.creando, nuevas: f.nuevas.map((v) => v.id), cambios: f.cambiosAgenda, ordenes: f.ordenes.map((o) => `${o.id}:${o.estado}`), estudios: f.estudios.map((e) => `${e.id}:${e.estado}`), expedientes: f.expedientes, pacientes: f.pacientes, avisoDicho: f.avisoDicho });
    };
    (window as unknown as { __crmMuela: () => object }).__crmMuela = () => ({ dibujos: estadoMuela.dibujos, forma: { ...estadoMuela.forma }, zonas: estadoMuela.zonas.map((z) => ({ ...z })), tipo: estadoMuela.tipo });
  }, []);
  // ?paciente=hector&pieza=16 abre ese expediente con esa pieza (para la maqueta y las capturas)
  useEffect(() => {
    const q = parametro("paciente");
    if (q && pacientePorId(q)) {
      abrir({ tipo: "expediente", id: q });
      const n = Number(parametro("pieza"));
      if (n) setPieza(n);
    }
  }, [abrir]);
  const entradaLista = useRef(entrada === "lista");
  useEffect(() => {
    entradaLista.current = entrada === "lista";
  }, [entrada]);
  // las pantallas se piden en cuanto se ve la muela (bajo la niebla de la entrada): al tocar ya están
  useEffect(() => precargar(), []);
  // y las citas de ejemplo del mes, en ratos libres: la vista Mes ya no las calcula todas de golpe
  useEffect(() => void trasLaMuela().then(() => precalentarSemanas(ahora)), [ahora]);

  // la foto para el recorrido: lo que hay ahora, siempre al día
  const foto = useRef<Omit<Foto, "pacientes" | "armados" | "cuantasNuevas" | "avisoDicho">>(null!);
  foto.current = { unidad, nuevas, seccion, capa, expedientes, pieza, foco, cambiosAgenda, agendaFecha, agenda, pantalla, ordenes, estudios, armado, creando, buscando, avisoApp };
  const controlRecorrido = useMemo<ControlRecorrido<Foto>>(
    () => ({
      instantanea: () => ({ ...foto.current, pacientes: PACIENTES.length, armados: cuantosArmados.current, cuantasNuevas: cuantasNuevas.current, avisoDicho: avisoDicho() }),
      base: (f) => ({ ...f, unidad: "todo", seccion: "inicio", capa: null, pieza: null, foco: null, agenda: null, agendaFecha: undefined, pantalla: null, armado: null, creando: false, buscando: false, avisoApp: null }),
      restaurar: (f) => {
        layout.hasta = performance.now() + 700;
        setUnidad(f.unidad);
        setNuevas(f.nuevas);
        setSeccion(f.seccion);
        setCapa(f.capa);
        setExpedientes(f.expedientes);
        setPieza(f.pieza);
        setFoco(f.foco);
        setCambiosAgenda(f.cambiosAgenda);
        setAgendaFecha(f.agendaFecha);
        setAgenda(f.agenda);
        setPantalla(f.pantalla);
        setOrdenes(f.ordenes);
        setEstudios(f.estudios);
        setArmado(f.armado);
        setCreando(f.creando);
        setBuscando(f.buscando);
        setAvisoApp(f.avisoApp);
        // los expedientes armados en el recorrido viven en la lista del módulo: se quitan
        PACIENTES.splice(f.pacientes);
        cuantosArmados.current = f.armados;
        cuantasNuevas.current = f.cuantasNuevas;
        fijarAvisoDicho(f.avisoDicho);
      },
      reiniciarEntrada: () => {
        setEntrada("saludo");
        setNiebla(1);
        setEstreno(true);
      },
      entradaLista: () => entradaLista.current,
    }),
    [],
  );

  const terminarEntrada = useCallback(() => {
    setEntrada("lista");
    setNiebla(0);
  }, []);

  return (
    <LazyMotion features={cargarFunciones} strict>
    <MotionConfig reducedMotion="user">
    <LayoutGroup>
      <Cubierta.Provider value={!!agenda || !!pantalla || !!armado}>
      <main className="app" data-capa={capa?.tipo ?? undefined} data-entrada={entrada} data-reducido={movimientoReducido() || undefined}>
        <Heroe
          vista={vistaHeroe}
          ahora={ahora}
          seccion={seccion}
          niebla={niebla}
          alCambiarUnidad={(id) => setUnidad(id)}
          opciones={opciones}
          alNuevaUnidad={() => setCreando(true)}
          alPresentar={presentando ? undefined : () => setPresentando(true)}
          pausada={!!agenda || !!pantalla || !!armado}
          alIr={ir}
          alBuscar={() => setBuscando(true)}
          alPerfil={() => abrir({ tipo: "perfil", id: "titular" })}
          alAbrirHoy={() => setAgenda("dia")}
          alTocarLlamada={tocarLlamada}
          llamadaTocable={llamadaTocable}
          focoLlamada={foco}
          clinica={clinicaHeroe}
          orientacion={orientacionHeroe}
          tipo={pacienteAbierto && pieza != null ? tipoDePieza(pieza) : "molar-superior"}
          contexto={pacienteAbierto && pieza != null ? { titulo: `Pieza ${pieza}`, sub: `${nombrePieza(pieza)} · ${pacienteAbierto.nombre}` } : null}
          busqueda={
            buscando ? (
              <Suspense fallback={null}>
                <Buscar alElegir={elegirResultado} alCerrar={() => setBuscando(false)} />
              </Suspense>
            ) : null
          }
        />
        <div className="lado">
          <Suspense fallback={null}>
          {entrada !== "saludo" &&
            (seccion === "equipo" ? (
              <Equipo vista={vista} ahora={ahora} alAbrir={(id) => abrir({ tipo: "perfil", id })} />
            ) : seccion === "expedientes" ? (
              <Expedientes vista={vista} estados={expedientes} alAbrir={(id) => abrir({ tipo: "expediente", id })} alArmar={() => abrirArmado({ layoutId: "armar" })} />
            ) : (
              <Mosaico
                vista={vista}
                ahora={ahora}
                abierto={capa?.tipo === "detalle" && capa.id !== "hoy" ? (capa.id as TeselaId) : null}
                alAbrir={(id) => abrir({ tipo: "detalle", id })}
                estreno={estreno}
              />
            ))}
          </Suspense>
          <Suspense fallback={null}>
          <AnimatePresence>
            {capa?.tipo === "detalle" && (
              <Detalle
                key={`d-${capa.id}`}
                id={capa.id}
                vista={vista}
                ahora={ahora}
                alCerrar={cerrar}
                alMoverse={(m) => (layout.hasta = m ? performance.now() + 900 : 0)}
                alAbrirExpediente={(id) => abrir({ tipo: "expediente", id })}
                alPantalla={setPantalla}
              />
            )}
            {capa?.tipo === "perfil" && <Perfil key={`p-${capa.id}`} id={capa.id} ahora={ahora} alCerrar={cerrar} />}
            {capa?.tipo === "expediente" && (
              <Expediente
                key={`x-${capa.id}`}
                id={capa.id}
                estado={expedientes[capa.id]}
                alAnalizar={() => analizar(capa.id)}
                alTerminarAnalisis={() => terminarAnalisis(capa.id)}
                alDecidir={(h, d) => decidir(capa.id, h, d)}
                foco={foco}
                alFoco={setFoco}
                pieza={pieza}
                alPieza={setPieza}
                alCerrar={cerrar}
              />
            )}
          </AnimatePresence>
          </Suspense>
        </div>
        <Suspense fallback={null}>
        <AnimatePresence>
          {agenda && (
            <Agenda
              key="agenda"
              ahora={ahora}
              vista={agenda}
              unidadInicial={unidad === "sucursal" ? "norte" : "centro"}
              fechaInicial={agendaFecha}
              alVista={setAgenda}
              cambios={cambiosAgenda}
              alCambios={setCambiosAgenda}
              alAbrirExpediente={(id) => {
                setAgenda(null);
                abrir({ tipo: "expediente", id });
              }}
              alCerrar={() => {
                setAgenda(null);
                // el foco regresa a la ↗ de la tira, de donde salió la agenda
                requestAnimationFrame(() => document.querySelector<HTMLElement>('[data-abrir="hoy"]')?.focus({ preventScroll: true }));
              }}
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {pantalla === "pacientes" && (
            <Pacientes
              key="pacientes"
              ahora={ahora}
              alCerrar={cerrarPantalla}
              alAbrirExpediente={(id) => {
                setPantalla(null);
                abrir({ tipo: "expediente", id });
              }}
              alVerEnAgenda={(f) => {
                setPantalla(null);
                setAgendaFecha(f);
                setAgenda("dia");
              }}
            />
          )}
          {pantalla === "laboratorio" && <Tablero key="laboratorio" ordenes={ordenes} alOrdenes={setOrdenes} alCerrar={cerrarPantalla} />}
          {pantalla === "imagen" && (
            <Bandeja
              key="imagen"
              estudios={estudios}
              alEstudios={setEstudios}
              alCerrar={cerrarPantalla}
              alAbrirExpediente={(id) => {
                setPantalla(null);
                abrir({ tipo: "expediente", id });
              }}
              alArmarExpediente={(e) =>
                abrirArmado({
                  layoutId: `armar-${e.id}`,
                  estudio: e.id,
                  inicial: {
                    nombre: e.paciente,
                    unidad: e.origen === "externo" ? "imagen" : e.origen,
                    motivo: e.origen === "externo" ? "Referido por otro dentista" : "",
                    estudios: [estudioDeBandeja(e.tipo)].filter((x) => x !== null),
                  },
                })
              }
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {armado && (
            <Armar
              key={`${armado.id}:${armado.vuelta ?? 0}`}
              layoutId={armado.layoutId}
              id={armado.id}
              inicial={armado.inicial}
              faseInicial={armado.fase ?? (parametro("chat") ? "chat" : "armado")}
              alCerrar={cerrarArmado}
              alLlevar={llevarAlExpediente}
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {creando && (
            <NuevaUnidad
              key="nueva-unidad"
              alCerrar={() => {
                setCreando(false);
                requestAnimationFrame(() => document.querySelector<HTMLElement>(".selector .titulo")?.focus({ preventScroll: true }));
              }}
              alCrear={(d) => {
                const v = nuevaVista(++cuantasNuevas.current, d);
                const antes = unidad;
                setNuevas((n) => [...n, v]);
                setCapa(null);
                setSeccion("inicio");
                setUnidad(v.id);
                setCreando(false);
                setAvisoApp({
                  texto: `${v.corto}: creada en este demo`,
                  recarga: primeraVez(),
                  deshacer: () => {
                    setNuevas((n) => n.filter((x) => x.id !== v.id));
                    setUnidad(antes);
                  },
                });
                requestAnimationFrame(() => document.querySelector<HTMLElement>(".selector .titulo")?.focus({ preventScroll: true }));
              }}
            />
          )}
        </AnimatePresence>
        </Suspense>
        <AnimatePresence>{avisoApp && <Aviso key={avisoApp.texto} aviso={avisoApp} alCerrar={cerrarAvisoApp} clase="aviso-app" />}</AnimatePresence>
        {entrada !== "lista" && <Entrada fase={entrada} alAbrirNiebla={() => setEntrada("niebla")} alNiebla={setNiebla} alTerminar={terminarEntrada} />}
        {presentando && (
          <Suspense fallback={null}>
            <Recorrido control={controlRecorrido} alTerminar={() => setPresentando(false)} />
          </Suspense>
        )}
      </main>
      </Cubierta.Provider>
    </LayoutGroup>
    </MotionConfig>
    </LazyMotion>
  );
}
