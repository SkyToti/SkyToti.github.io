import type { NextConfig } from "next";

// Sitio estático: `next build` deja todo en `out/` y cualquier servidor de archivos lo sirve.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  poweredByHeader: false,
  // Con dos root layouts (app/(es) y app/(en)/en) no hay un layout común para el 404: va en app/global-not-found.tsx.
  experimental: { globalNotFound: true },
};

export default nextConfig;
