/* Detail (port van DetailView.swift) */
(function (LCH) {
  "use strict";
  var el = LCH.el;

  var BG = { GRP: "bg-grp", COM: "bg-com", SRT: "bg-srt", SPC: "bg-spc", LOC: "bg-loc" };

  LCH.views.detail = function (params) {
    var search = params.searchText || "";
    var item = LCH.model.allItems.filter(function (i) { return i.Code === params.code; })[0];
    if (!item) { LCH.back(); return { title: "Details", node: el("div") }; }

    var code = (item.Code + "------------").slice(0, 12);
    var wrap = el("div", { class: "detail" });

    // Titel
    wrap.appendChild(LCH.hlNode(item.CxTekst, search, { tag: "div", class: "titlebox" }));
    wrap.appendChild(el("hr"));

    // Status + codesegmenten + SH
    var segLabels = ["GRP", "SRT", "SPC", "LOC"];
    var codeseg = el("div", { class: "codeseg" });
    segLabels.forEach(function (lab, i) {
      codeseg.appendChild(el("span", { class: BG[lab], html: LCH.highlightHTML(code.slice(i * 3, i * 3 + 3), search) }));
    });
    wrap.appendChild(el("div", { class: "rowline" }, [
      el("span", { style: "font-weight:700;color:" + (item.Actief ? "#1c1c1e" : "var(--red)"), text: item.Actief ? "Actief" : "INactief" }),
      el("span", { style: "flex:1" }),
      codeseg,
      el("button", { class: "iconbtn", style: "color:var(--blue)", title: "Schema", onclick: LCH.showCodeGraph }, [LCH.icon("info-bubble", { color: "var(--blue)", size: 22 })]),
      el("span", { style: "flex:1" }),
      el("span", { text: "SH:" }),
      el("span", { style: "font-weight:700", text: item.Actief ? item.SHcode : "---" })
    ]));
    wrap.appendChild(el("hr"));

    // Info blokken
    var infoBlokken = [
      ["Synoniemen", item.Inclusietermen],
      ["Exclusietermen", item.Exclusietermen],
      ["Definitie", item.Definitie || ""]
    ];
    infoBlokken.forEach(function (b) {
      if (!b[1] || !b[1].trim()) {
        wrap.appendChild(el("div", { class: "blok-label", style: "display:flex;align-items:center;gap:6px" }, [b[0] + ":", LCH.icon("nosign", { color: "var(--gray)", size: 18 })]));
      } else {
        wrap.appendChild(el("div", null, [
          el("div", { class: "blok-label", text: b[0] + ":" }),
          LCH.hlNode(b[1], search, { tag: "div", class: "blok-body" })
        ]));
      }
    });
    wrap.appendChild(el("hr"));

    // Structuur blokken
    var structuur = [
      ["Hoofdgroep (GRP):", code.slice(0, 3), item.GRPtekst, "GRP"],
      ["Complicatie (COM):", code.slice(3, 9), item.CXBtekst, "COM"],
      ["Soort (SRT):", code.slice(3, 6), item.SRTtekst, "SRT"],
      ["Specificatie (SPC):", code.slice(6, 9), item.SPCtekst, "SPC"],
      ["Locatie (LOC):", code.slice(9, 12), item.LOCtekst, "LOC"]
    ];
    structuur.forEach(function (b) {
      var actions = el("div", { class: "rowline", style: "gap:10px" });
      if (b[3] === "GRP") {
        actions.appendChild(el("button", { class: "act", title: "Matrix", onclick: function () {
          LCH.navigate("matrix", { initialGRP: item.Code.slice(0, 3), gemarkeerdeCode: item.Code }, "Details");
        } }, [LCH.icon("grid", { color: "var(--green)", size: 22 })]));
      }
      actions.appendChild(el("button", { class: "act", title: "Structuur", onclick: function () {
        LCH.model.filter = { type: b[3], code: b[1] };
        LCH.navigate("structuur", {}, "Codes");
      } }, [LCH.icon("table", { color: "#E0A800", size: 22 })]));

      wrap.appendChild(el("div", null, [
        el("div", { class: "struct-row" }, [
          el("span", { class: "lab", text: b[0] }),
          el("span", { class: "code-pill " + BG[b[3]], html: LCH.highlightHTML(b[1], search) }),
          el("span", { class: "spacer" }),
          actions
        ]),
        LCH.hlNode(b[2] || "-", search, { tag: "div", class: "blok-body" })
      ]));
    });
    wrap.appendChild(el("hr"));

    // Snomed
    var snomed = item.Snomed || "-";
    wrap.appendChild(el("div", { class: "rowline" }, [
      el("span", { style: "font-weight:700", text: "Snomed:" }),
      item.Snomed ? el("button", { class: "copybtn", title: "Kopieer SNOMED", onclick: function () {
        LCH.copyText(item.Snomed).then(function () { LCH.toast("Snomed gekopieerd", { dark: true }); });
      } }, [LCH.icon("copy", { color: "var(--blue)", size: 19 })]) : null
    ]));
    wrap.appendChild(LCH.hlNode(snomed, search, { tag: "div", class: "blok-body" }));

    return {
      title: "Details",
      node: wrap,
      backLabel: params.backLabel || "Terug",
      right: [{ icon: "send", color: "var(--purple)", onClick: function () {
        LCH.navigate("feedback", { categorie: "Inhoud", actie: "Verander omschrijving", vooraf: item.Code, herkomst: "Details" }, "Details");
      } }]
    };
  };

})(window.LCH);
