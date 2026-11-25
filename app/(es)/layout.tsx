// Root layout del español (/ y /trabajo/<slug>/). El inglés tiene el suyo en app/(en)/en/layout.tsx.
import type { ReactNode } from "react";
import RaizHtml from "@/components/RaizHtml";
import { metadatosRaiz } from "@/lib/metadatos";
import "../globals.css";

export const generateMetadata = () => metadatosRaiz("es");

export default function LayoutEs({ children }: { children: ReactNode }) {
  return <RaizHtml idioma="es">{children}</RaizHtml>;
}
