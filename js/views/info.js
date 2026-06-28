/* Info (port van InfoView.swift) */
(function (LCH) {
  "use strict";
  var el = LCH.el;

  LCH.views.info = function () {
    var m = LCH.model.metadata;
    var wrap = el("div");
    if (!m) {
      wrap.appendChild(el("div", { class: "empty", text: "Metadata wordt geladen..." }));
      return { title: "Informatie", node: wrap, backLabel: "Menu" };
    }

    var rows = [
      ["CompLOCaties:", m.AantalRecords],
      ["Actieve compLOCaties:", m.AantalRecords - m.NInactief],
      ["Hoofdgroepen:", m.NGRPcodes],
      ["Soorten:", m.NSRTcodes],
      ["Specificaties:", m.NSPCcodes],
      ["Locaties:", m.NLOCcodes],
      ["Aanmaakdatum:", LCH.formatDate(m.Aanmaakdatum, false)],
      ["Exportdatum:", LCH.formatDate(m.Exportdatum, true)],
      ["Exportprefix:", m.ExportPrefix]
    ];
    var grid = el("div", { class: "info-grid" });
    rows.forEach(function (r) {
      grid.appendChild(el("div", { text: r[0] }));
      grid.appendChild(el("div", { class: "v", text: String(r[1]) }));
    });
    wrap.appendChild(grid);
    wrap.appendChild(el("div", { class: "snomedver", text: "SNOMED-versie: " + m.Snomedversie }));
    wrap.appendChild(el("div", { style: "text-align:center;margin-top:30px" }, [
      el("img", { src: "assets/LCHlogo.png", style: "width:144px;max-width:50vw" })
    ]));

    return { title: "Informatie", node: wrap, backLabel: "Menu" };
  };

})(window.LCH);
