// Cloudflare Pages Function — same-origin data-endpoint voor CxView.
// Draait op  cxview.cxreg.dev/api/export , achter Cloudflare Access (dezelfde
// zone-Access als cxreg.dev). Access zet `Cf-Access-Authenticated-User-Email`;
// wij mappen e-mail → registratie (KV MEMBERS) en serveren de bevroren export
// (KV EXPORTS). Membership is de bron van waarheid: staat een e-mail niet in
// MEMBERS → 403 (Access laat "any email" toe; de autorisatie zit hier).
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

  const email = (
    request.headers.get('Cf-Access-Authenticated-User-Email') ||
    env.CXVIEW_DEV_EMAIL ||
    ''
  ).trim().toLowerCase()

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
