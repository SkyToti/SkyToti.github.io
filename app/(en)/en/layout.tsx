// Root layout del inglés (/en/ y /en/work/<slug>/). El español tiene el suyo en app/(es)/layout.tsx.
import type { ReactNode } from "react";
import RaizHtml from "@/components/RaizHtml";
import { metadatosRaiz } from "@/lib/metadatos";
import "../../globals.css";

export const generateMetadata = () => metadatosRaiz("en");

export default function LayoutEn({ children }: { children: ReactNode }) {
  return <RaizHtml idioma="en">{children}</RaizHtml>;
}
