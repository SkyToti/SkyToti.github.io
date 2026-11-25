#!/usr/bin/bash
# Publica el portafolio en GitHub Pages (https://skytoti.github.io/).
#   scripts/publicar-pages.sh ["mensaje de la publicación"]
# Qué hace:
#   1. Compila con la dirección pública y pasa TODAS las compuertas (`npm run check`); si algo falla, no publica.
#   2. Sube el CÓDIGO como una foto del árbol actual a la rama `main` del repo público (rama local `publico`).
#      El historial de trabajo local (rama `main` de aquí) NO se sube: tiene versiones viejas que no deben verse.
#   3. Sube el SITIO compilado (out/) a la rama `gh-pages`, de la que sirve GitHub Pages.
# Nunca hagas `git push pages main` a mano: publicaría el historial completo.
set -euo pipefail
cd "$(dirname "$0")/.."
REPO="SkyToti/SkyToti.github.io"
URL="https://github.com/$REPO.git"
SITIO="https://skytoti.github.io"
MENSAJE="${1:-Publicación del $(date +%F)}"
export GIT_AUTHOR_NAME="SkyToti" GIT_AUTHOR_EMAIL="SkyToti@users.noreply.github.com"
export GIT_COMMITTER_NAME="SkyToti" GIT_COMMITTER_EMAIL="SkyToti@users.noreply.github.com"

[ -z "$(git status --porcelain)" ] || { echo "Hay cambios sin guardar: haz commit antes de publicar."; exit 1; }

echo "1/3 Compilando y revisando…"
NEXT_PUBLIC_SITIO="$SITIO" npm run check > /tmp/publicar-pages.log 2>&1 || { tail -n 30 /tmp/publicar-pages.log; echo "La revisión falló: no se publica."; exit 1; }
touch out/.nojekyll   # sin esto GitHub Pages ignora la carpeta _next

echo "2/3 Subiendo el código…"
arbol=$(git rev-parse 'HEAD^{tree}')
if git rev-parse -q --verify refs/heads/publico > /dev/null; then
  if [ "$(git rev-parse 'publico^{tree}')" = "$arbol" ]; then nuevo=$(git rev-parse publico)
  else nuevo=$(git commit-tree "$arbol" -p publico -m "$MENSAJE"); fi
else
  nuevo=$(git commit-tree "$arbol" -m "$MENSAJE")
fi
git update-ref refs/heads/publico "$nuevo"
git push -q "$URL" publico:main

echo "3/3 Subiendo el sitio…"
tmp=$(mktemp -d)
cp -a out/. "$tmp/"
git -C "$tmp" init -q -b gh-pages
git -C "$tmp" add -A
git -C "$tmp" commit -q -m "$MENSAJE"
git -C "$tmp" push -q -f "$URL" gh-pages
rm -rf "$tmp"
echo "Listo: $SITIO/ (GitHub tarda uno o dos minutos en mostrar el cambio)"
