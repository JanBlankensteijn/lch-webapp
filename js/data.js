/* Data-laag: laadt en ontsleutelt de LCH-database van GitHub.
 * Port van LCHModel.swift (XOR-decryptie + ExportPrefix strippen).
 */
(function (LCH) {
  "use strict";

  // Zelfde bron en wachtwoord als de iOS-app (Secrets.plist).
  var DATA_URL = "https://raw.githubusercontent.com/JanBlankensteijn/CxReg/main/LCH/LCH_encrypted.json";
  var PASSWORD = "LCH#iOSKey@99";

  // Gedeelde applicatiestate (equivalent van LCHModel)
  LCH.model = {
    allItems: [],
    metadata: null,
    grpItems: [], comItems: [], srtItems: [], spcItems: [], locItems: [],
    loadProgress: 0,
    filter: null // { type, code }
  };

  function xorDecrypt(bytes, password) {
    var pw = new TextEncoder().encode(password);
    var out = new Uint8Array(bytes.length);
    for (var i = 0; i < bytes.length; i++) out[i] = bytes[i] ^ pw[i % pw.length];
    return out;
  }

  LCH.loadData = function (onProgress) {
    var url = DATA_URL + "?" + Date.now(); // cache-buster, net als de iOS-app
    return fetch(url, { cache: "no-store" })
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.arrayBuffer();
      })
      .then(function (buf) {
        var decrypted = xorDecrypt(new Uint8Array(buf), PASSWORD);
        // BOM strippen
        if (decrypted[0] === 0xEF && decrypted[1] === 0xBB && decrypted[2] === 0xBF) {
          decrypted = decrypted.subarray(3);
        }
        var text = new TextDecoder("utf-8").decode(decrypted).trim();
        var wrapper = JSON.parse(text);

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
