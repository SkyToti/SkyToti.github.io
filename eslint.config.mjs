import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Se enlaza con <a>, no con <Link>: en la exportación estática con trailingSlash la precarga de <Link> pide
  // archivos __next.<ruta>.__PAGE__.txt que Next escribe como carpeta y dan 404 (pagado en la landing de
  // YaContesto, 12-oct-2026). Además, pasar de /es a /en cambia de root layout: carga completa de todos modos.
  {
    files: ["app/**", "components/**"],
    rules: { "@next/next/no-html-link-for-pages": "off" },
  },
  globalIgnores([".claude/**", ".next/**", "out/**", "build/**", "capturas/**", "recorrido/**", "demos/**", "public/demo/**", "next-env.d.ts"]),
]);

export default eslintConfig;
