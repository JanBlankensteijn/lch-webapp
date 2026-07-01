// Cloudflare Pages Function — same-origin data-endpoint voor CxView.
// Draait op  cxview.cxreg.dev/api/export , achter Cloudflare Access (dezelfde
// zone-Access als cxreg.dev). We lezen de e-mail uit de door Cloudflare
// ondertekende Access-JWT (geverifieerd — zie onderaan; de losse convenience-
// header wordt niet naar Pages Functions doorgestuurd én is op de onbeschermde
// *.pages.dev spoofbaar). Daarna mappen we e-mail → registratie (KV MEMBERS) en
// serveren de bevroren export (KV EXPORTS). Membership is de bron van waarheid:
// staat een e-mail niet in MEMBERS → 403 (Access laat "any email" toe).
//
// Bindings (Pages project → Settings → Bindings → KV namespace):
//   MEMBERS = sleutel = e-mail, waarde = JSON-array registraties (bv. ["LCH"])
//   EXPORTS = sleutel = <REGISTRY>/latest.json, waarde = platte export-JSON
//
// Env-var (optioneel, ALLEEN lokaal voor `wrangler pages dev`):
//   CXVIEW_DEV_EMAIL — fallback-identiteit als er geen Access-header is.
//
// Multitenancy: een tenant erbij (bv. LCP) = puur KV-rijen in MEMBERS + een
// export in EXPORTS. Geen code-wijziging. Zie geheugen
// project_cxreg_multitenancy_viewer.

// Registratie(s) voor een e-mail uit KV MEMBERS (bron van waarheid).
// Waarde = JSON-array, bv. ["LCH"] of ["LCH","LCP"]. Onbekend/leeg → [].
async function registriesVoorEmail(env, email) {
  let raw = null
  try { raw = await env.MEMBERS.get(email) } catch { raw = null }
  if (!raw) return []
  try {
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr.map((c) => String(c).toUpperCase()) : []
  } catch {
    return []
  }
}

export async function onRequestGet(context) {
  const { request, env } = context

  // Slot 1 — host-check: serveer alleen op het Access-beschermde domein. Dezelfde
  // Function draait óók op de onbeschermde *.pages.dev; daar geven we niets terug.
  // (Naast, niet in plaats van, de JWT-verificatie hieronder.)
  const host = new URL(request.url).hostname
  const isDev = host === 'localhost' || host === '127.0.0.1'
  if (!isDev && host !== 'cxview.cxreg.dev') {
    return json({ error: 'niet beschikbaar' }, 404)
  }

  // Slot 2 — identiteit uit de geverifieerde Cloudflare Access-JWT (cookie
  // CF_Authorization of header Cf-Access-Jwt-Assertion), niet uit een los header.
  const email = await emailFromAccess(request, env)

  if (!email) return json({ error: 'niet ingelogd' }, 401)

  const registries = await registriesVoorEmail(env, email)
  if (registries.length === 0) {
    return json({ error: 'geen registratie voor dit account' }, 403)
  }

  // ?registry=LCP kiest expliciet; anders de eerste waartoe de gebruiker toegang heeft.
  const url = new URL(request.url)
  const gevraagd = (url.searchParams.get('registry') || '').toUpperCase()
  const code = gevraagd && registries.includes(gevraagd) ? gevraagd : registries[0]

  // EXPORTS is een KV-namespace; de waarde is de platte export-JSON. We streamen
  // 'm rechtstreeks door (2,5 MB) zonder in het geheugen te parsen.
  const body = await env.EXPORTS.get(`${code}/latest.json`, { type: 'stream' })
  if (!body) return json({ error: `geen export voor ${code}` }, 404)

  return new Response(body, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-CxView-Registry': code,
    },
  })
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}

/* =========================================================================
 * Cloudflare Access — identiteit uit de geverifieerde JWT
 * ========================================================================= */
// Achter Access zit een door Cloudflare ondertekende JWT in de cookie
// CF_Authorization (en header Cf-Access-Jwt-Assertion). We verifiëren handtekening
// + aud + iss + exp en lezen de e-mail. Verificatie is nodig omdat de Functions
// óók op de onbeschermde lch-webapp.pages.dev draaien; een los door te sturen
// header/JWT zou daar spoofbaar zijn.
const TEAM_DOMAIN = 'https://lch-users.cloudflareaccess.com'
const APP_AUD = '37a8525d838bd7d05001622ab2ad3ea62537ecb8d0117060114efedf5c6c98c5'

let _jwks = null
async function accessKeys() {
  if (_jwks) return _jwks
  const resp = await fetch(`${TEAM_DOMAIN}/cdn-cgi/access/certs`)
  const data = await resp.json()
  _jwks = data.keys || []
  return _jwks
}

function b64urlBytes(s) {
  s = s.replace(/-/g, '+').replace(/_/g, '/')
  s += '='.repeat((4 - (s.length % 4)) % 4)
  const bin = atob(s)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}
function b64urlJson(s) {
  return JSON.parse(new TextDecoder().decode(b64urlBytes(s)))
}

function cookie(request, naam) {
  const c = request.headers.get('Cookie') || ''
  const m = c.match(new RegExp('(?:^|;\\s*)' + naam + '=([^;]+)'))
  return m ? m[1] : ''
}

async function emailFromAccess(request, env) {
  const token =
    request.headers.get('Cf-Access-Jwt-Assertion') ||
    cookie(request, 'CF_Authorization')
  if (token) {
    const payload = await verifyAccessJwt(token)
    if (payload && payload.email) return String(payload.email).trim().toLowerCase()
  }
  // Alleen lokaal (wrangler pages dev): expliciete dev-identiteit.
  return (env.CXVIEW_DEV_EMAIL || '').trim().toLowerCase()
}

async function verifyAccessJwt(token) {
  try {
    const [h, p, s] = token.split('.')
    if (!h || !p || !s) return null
    const header = b64urlJson(h)
    const payload = b64urlJson(p)

    const now = Math.floor(Date.now() / 1000)
    if (payload.exp && now >= payload.exp) return null
    if (payload.nbf && now < payload.nbf) return null
    if (payload.iss && payload.iss !== TEAM_DOMAIN) return null
    const auds = Array.isArray(payload.aud) ? payload.aud : [payload.aud]
    if (!auds.includes(APP_AUD)) return null

    const jwk = (await accessKeys()).find((k) => k.kid === header.kid)
    if (!jwk) return null
    const key = await crypto.subtle.importKey(
      'jwk', jwk,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false, ['verify']
    )
    const ok = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5', key,
      b64urlBytes(s),
      new TextEncoder().encode(`${h}.${p}`)
    )
    return ok ? payload : null
  } catch {
    return null
  }
}
