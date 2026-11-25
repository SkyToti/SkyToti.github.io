import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Se sirve dentro del portafolio en /demo/crm/ y se compila directo a su public/: la exportación estática
// de Next lo copia tal cual a out/demo/crm/. Sin mapas de fuente: no se publica el código original.
export default defineConfig({
  base: "/demo/crm/",
  plugins: [react(), tailwindcss()],
  build: {
    target: "es2022",
    outDir: "../../public/demo/crm",
    emptyOutDir: true,
    sourcemap: false,
    reportCompressedSize: false,
  },
});
