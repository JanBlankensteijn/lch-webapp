#!/usr/bin/env bash
# Deploy-script voor de LCH web-app.
# Hoogt het ?v=… versienummer in index.html op (cache-busting), commit en pusht.
# Cloudflare Pages deployt daarna automatisch.
#
# Gebruik:  ./deploy.sh "korte omschrijving van de wijziging"

set -e
cd "$(dirname "$0")"

V="$(date +%Y%m%d%H%M%S)"
MSG="${1:-update}"

# Vervang elk ?v=<token> door het nieuwe versienummer
sed -i '' -E "s/\?v=[0-9A-Za-z]+/?v=$V/g" index.html

git add -A
if git diff --cached --quiet; then
  echo "Geen wijzigingen om te deployen."
  exit 0
fi

git commit -q -m "$MSG (v=$V)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
git push -q origin main
echo "✓ Gedeployed met versie v=$V"
echo "  Live op ~15s: https://lch-webapp.pages.dev"
