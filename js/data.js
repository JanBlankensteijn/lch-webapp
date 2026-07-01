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

        var items = wrapper.data || [];
        items.forEach(function (item) {
          if (prefix && item.CxTekst && item.CxTekst.indexOf(prefix) === 0) {
            item.CxTekst = item.CxTekst.slice(prefix.length).trim();
          }
        });

        m.allItems = items;
        m.grpItems = wrapper.GRP || [];
        m.comItems = wrapper.COM || [];
        m.srtItems = wrapper.SRT || [];
        m.spcItems = wrapper.SPC || [];
        m.locItems = wrapper.LOC || [];
        m.loadProgress = 1;
        if (onProgress) onProgress(1);
        return m;
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
