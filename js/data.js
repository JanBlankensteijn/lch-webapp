/* Data-laag: laadt de registratie-export van het same-origin /api/export
 * (Pages Function → R2, achter Cloudflare Access). Platte JSON, geen decryptie.
 * ExportPrefix wordt nog wel gestript (port van LCHModel.swift).
 */
(function (LCH) {
  "use strict";

  // Same-origin data-endpoint (Pages Function, achter Cloudflare Access).
  // De Access-cookie rijdt vanzelf mee; géén sleutel/token in de client.
  // Was: publieke raw-GitHub-URL + XOR-"encryptie" (sleutel stond in deze JS).
  var DATA_URL = "/api/export";

  // Gedeelde applicatiestate (equivalent van LCHModel)
  LCH.model = {
    allItems: [],
    metadata: null,
    grpItems: [], comItems: [], srtItems: [], spcItems: [], locItems: [],
    loadProgress: 0,
    filter: null // { type, code }
  };

  LCH.loadData = function (onProgress) {
    var url = DATA_URL + "?t=" + Date.now(); // cache-buster
    return fetch(url, { cache: "no-store", credentials: "include" })
      .then(function (r) {
        if (r.status === 401 || r.status === 403) {
          var status = r.status;
          return r.json().then(function (b) { return b; }, function () { return {}; })
            .then(function (body) {
              var e = new Error(status === 403 ? "Geen toegang" : "Niet ingelogd");
              if (status === 403) { e.noAccess = true; e.email = (body && body.email) || ""; }
              else { e.sessieVerlopen = true; }
              throw e;
            });
        }
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json(); // platte JSON uit KV (geen decryptie meer)
      })
      .then(function (wrapper) {
        var m = LCH.model;
        m.metadata = wrapper.metadata;
        var prefix = wrapper.metadata.ExportPrefix || "";
        var src = wrapper.data || [];

        // Bewuste, COSMETISCHE laadtijd (port van de 1 ms/item-vertraging in
        // LCHModel.swift): zonder dit flitst het laden voorbij. We verwerken de
        // items in blokjes met een korte pauze en updaten loadProgress geleidelijk,
        // i.p.v. direct naar 100% te springen. ~COSMETIC_MS totaal, ongeacht #items.
        var COSMETIC_MS = 1500;
        var TICKS = 45;
        var DELAY = COSMETIC_MS / TICKS;               // ~33 ms per blokje
        var CHUNK = Math.max(1, Math.ceil(src.length / TICKS));
        var total = src.length || 1;

        return new Promise(function (resolve) {
          var items = [];
          var i = 0;
          function stap() {
            var end = Math.min(i + CHUNK, src.length);
            for (; i < end; i++) {
              var item = src[i];
              if (prefix && item.CxTekst && item.CxTekst.indexOf(prefix) === 0) {
                item.CxTekst = item.CxTekst.slice(prefix.length).trim();
              }
              items.push(item);
            }
            m.loadProgress = i / total;
            if (onProgress) onProgress(m.loadProgress);
            if (i < src.length) {
              setTimeout(stap, DELAY);
            } else {
              m.allItems = items;
              m.grpItems = wrapper.GRP || [];
              m.comItems = wrapper.COM || [];
              m.srtItems = wrapper.SRT || [];
              m.spcItems = wrapper.SPC || [];
              m.locItems = wrapper.LOC || [];
              m.loadProgress = 1;
              if (onProgress) onProgress(1);
              resolve(m);
            }
          }
          stap();
        });
      });
  };

  /* ---------- Afgeleide helpers (port van LCHModel-extensies) ---------- */
  LCH.uniekeGRPs = function () {
    var set = {};
    LCH.model.allItems.forEach(function (it) { set[it.Code.slice(0, 3)] = true; });
    return Object.keys(set).sort();
  };

  LCH.grpTeksten = function () {
    var dict = {};
    LCH.model.allItems.forEach(function (it) {
      var grp = it.Code.slice(0, 3);
      if (dict[grp] == null && it.GRPtekst) dict[grp] = it.GRPtekst;
    });
    return dict;
  };

})(window.LCH);
