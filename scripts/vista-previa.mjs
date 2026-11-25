// Iconos y revisión de la vista previa del enlace.
//   node scripts/vista-previa.mjs                  → app/apple-icon.png (180×180) desde app/icon.svg, con margen y
//                                                    fondo noche a sangre (iOS redondea las esquinas por su cuenta)
//   node scripts/vista-previa.mjs revisar <dir>    → hojas para revisar a ojo: el icono rasterizado a 16, 32 y 180 px
//                                                    (ampliado con píxeles duros) y out/og.png y out/en/og.png a 400 y
//                                                    200 px de ancho, como se ven en un chat. Necesita `npm run build`.
// Usa el Chromium de Playwright (devDependency). Correr con `nice -n 19 taskset -c 0-3`.
import { chromium } from "playwright";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const raiz = new URL("..", import.meta.url).pathname;
const icono = readFileSync(join(raiz, "app/icon.svg"), "utf8");
const datos = (tipo, buf) => `data:${tipo};base64,${Buffer.from(buf).toString("base64")}`;

/** el icono de la pestaña sin su cuadro redondeado, a sangre y con la cara al 78 % */
function iconoApple() {
  const dentro = icono.replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "").replace(/<rect[^>]*\/>/, "");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#0B1220"/><g transform="translate(32 33) scale(0.78) translate(-32 -32)">${dentro}</g></svg>`;
}

async function rasterizar(pagina, svg, lado) {
  await pagina.setViewportSize({ width: lado, height: lado });
  await pagina.setContent(`<body style="margin:0;background:transparent"><img src="${datos("image/svg+xml", svg)}" style="display:block;width:${lado}px;height:${lado}px"></body>`);
  await pagina.locator("img").evaluate((img) => img.decode());
  return pagina.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: lado, height: lado } });
}

const navegador = await chromium.launch();
const pagina = await navegador.newPage({ deviceScaleFactor: 1 });
try {
  if (process.argv[2] !== "revisar") {
    writeFileSync(join(raiz, "app/apple-icon.png"), await rasterizar(pagina, iconoApple(), 180));
    console.log("app/apple-icon.png (180×180)");
  } else {
    const dir = process.argv[3] || join(raiz, "capturas");
    mkdirSync(dir, { recursive: true });
    const cuadros = [];
    for (const lado of [16, 32]) cuadros.push({ src: datos("image/png", await rasterizar(pagina, icono, lado)), lado, zoom: lado === 16 ? 10 : 6 });
    cuadros.push({ src: datos("image/png", readFileSync(join(raiz, "app/apple-icon.png"))), lado: 180, zoom: 1 });
    await pagina.setViewportSize({ width: 900, height: 400 });
    await pagina.setContent(`<body style="margin:0;padding:20px;display:flex;gap:24px;align-items:flex-start;background:#d9d9d9">${cuadros
      .map((c) => `<figure style="margin:0"><img src="${c.src}" style="display:block;width:${c.lado * c.zoom}px;image-rendering:pixelated"><figcaption style="font:13px sans-serif">${c.lado} px ×${c.zoom}</figcaption></figure>`)
      .join("")}</body>`);
    await pagina.screenshot({ path: join(dir, "icono.png"), fullPage: true });
    for (const [nombre, ruta] of [["es", "out/og.png"], ["en", "out/en/og.png"]]) {
      const src = datos("image/png", readFileSync(join(raiz, ruta)));
      await pagina.setViewportSize({ width: 700, height: 300 });
      await pagina.setContent(`<body style="margin:0;padding:20px;display:flex;gap:24px;align-items:flex-start;background:#fff">${[400, 200]
        .map((w) => `<img src="${src}" style="display:block;width:${w}px">`)
        .join("")}</body>`);
      await pagina.screenshot({ path: join(dir, `og-${nombre}-chica.png`), fullPage: true });
    }
    console.log(`hojas en ${dir}`);
  }
} finally {
  await navegador.close();
}
