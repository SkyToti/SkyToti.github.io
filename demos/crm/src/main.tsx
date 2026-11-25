import { createRoot } from "react-dom/client";
import "./estilos.css";
// las hojas de las pantallas completas van en la inicial: comparten clases y se cargan al abrirse (BRIEF-5 §2.B3)
import "./agenda/agenda.css";
import "./agenda/agenda-extra.css";
import "./negocio/negocio.css";
import "./armar/armar.css";
import "./recorrido/recorrido.css";
import App from "./App";
import FranjaDemo from "./ui/FranjaDemo";

createRoot(document.getElementById("raiz")!).render(
  <>
    <App />
    <FranjaDemo />
  </>,
);
