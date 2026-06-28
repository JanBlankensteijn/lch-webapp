# LCHappWeb — Lijst Complicaties Heelkunde (web-versie)

Web-versie van de iOS-app `LCHappIOS`. Leest dezelfde versleutelde database van GitHub
(`JanBlankensteijn/CxReg`), ontsleutelt deze in de browser (XOR) en biedt dezelfde schermen:

- **CompLOCaties** — zoeken met clustering, uitsluiten/isoleren, actief/alle-toggle
- **Codes** — GRP / COM / SRT / SPC / LOC met zoekfilter
- **Structuur** — complicaties of locaties per hoofdgroep
- **Matrix** — grid van complicaties × locaties per groep
- **Detail** — volledige gegevens van één compLOCatie + SNOMED kopiëren
- **Info**, **Help**, **Feedback**

## Technologie

Pure statische web-app: HTML + CSS + vanilla JavaScript, **geen build-stap en geen dependencies**.
Bewust gebouwd met klassieke `<script>`-tags (geen ES-modules) zodat het ook werkt door
`index.html` direct te openen.

## Lokaal draaien

```bash
cd LCHappWeb
python3 -m http.server 8080
# open http://localhost:8080
```

Of open `index.html` direct in een browser (de data wordt cross-origin van GitHub geladen,
wat is toegestaan via CORS).

## Hosten op Cloudflare Pages (eigen domein)

Statische site, geen build-stap. Snelste route:

**Optie A — drag-and-drop**
1. Cloudflare-dashboard → **Workers & Pages** → **Create** → **Pages** → **Upload assets**.
2. Sleep de **inhoud** van deze map erin (`index.html`, `css/`, `js/`, `assets/`, `_headers`) — niet de map zelf.
3. Je krijgt een URL zoals `https://lchapp.pages.dev`.

**Optie B — Git-gekoppeld (auto-deploy)**
1. Zet `LCHappWeb` in een GitHub-repo.
2. Pages → **Connect to Git** → repo kiezen.
3. Build command: *(leeg)* · Build output directory: `/` (of `LCHappWeb` als je de hele Code-map pusht).

**Eigen domein koppelen**
- Domein staat al in Cloudflare: project → **Custom domains** → **Set up a domain** → bv. `lch.jouwdomein.nl`. DNS wordt automatisch aangemaakt, HTTPS automatisch.
- Domein elders: óf de zone naar Cloudflare verhuizen (**Add a site**, nameservers omzetten) en dan bovenstaande, óf bij je huidige DNS een **CNAME** `lch` → `<project>.pages.dev` zetten (subdomein; root-domein vereist de zone in Cloudflare).

Het `_headers`-bestand zorgt dat een nieuwe deploy meteen zichtbaar is (geen oude cache).

## Roadmap: van static naar backend

Huidige keuze: **nu static hosten, later naar een backend**.

LCH is de alleen-lezen weergave van de data die in **CxReg** wordt geregistreerd. Zodra de
CxReg-webapp (PostgreSQL-backend, branch `claude/...` in de CxReg-repo) een read-only API
biedt, leest deze web-app daaruit in plaats van het versleutelde bestand. Dan:
- vervalt de XOR-sleutel in `js/data.js` volledig (geen client-side geheim meer);
- bepaalt de backend wat publiek is.

Concreet aan te passen wanneer het zover is: alleen `js/data.js` (vervang `loadData` door een
`fetch` naar de CxReg-API; de rest van de app blijft gelijk omdat het datamodel hetzelfde is).

## Structuur

```
index.html
css/styles.css
js/
  util.js          DOM-helpers, datum, toast, modal
  highlight.js     zoek-highlighting (port van StyledHighlightText)
  data.js          laden + XOR-decryptie + state (port van LCHModel)
  app.js           router, opstartscherm, navigatiebalk
  views/           menu, complocaties, codes, structuur, matrix, detail, info, help, feedback
assets/            logo's + code-schema (gekopieerd uit de iOS-assets)
```

## Let op

De ontsleutel-sleutel staat — net als in de iOS-app (Secrets.plist) — in de client-code
(`js/data.js`). Dit is obfuscatie, geen echte beveiliging; gelijk aan het iOS-origineel.

De originele iOS-app blijft volledig ongewijzigd in de map `../LCHappIOS`.
