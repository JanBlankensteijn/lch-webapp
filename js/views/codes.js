/* Codes (port van CodeView.swift) */
(function (LCH) {
  "use strict";
  var el = LCH.el;

  var TYPES = ["GRP", "COM", "SRT", "SPC", "LOC"];
  var TITELS = { GRP: "Hoofdgroep", COM: "Complicatie", SRT: "Soort", SPC: "Specificatie", LOC: "Locatie" };

  function itemsFor(type) {
    var m = LCH.model;
    var arr = { GRP: m.grpItems, COM: m.comItems, SRT: m.srtItems, SPC: m.spcItems, LOC: m.locItems }[type] || [];
    return arr.slice().sort(function (a, b) {
      if (a.Code !== b.Code) return a.Code < b.Code ? -1 : 1;
      return a.Tekst.toLowerCase() < b.Tekst.toLowerCase() ? -1 : 1;
    });
  }

  function filterCodes(items, searchText) {
    var terms = searchText.trim().split(/\s+/).filter(Boolean);
    return items.filter(function (item) {
      if (!terms.length) return true;
      return terms.every(function (term) {
        if (term === term.toUpperCase() && term.length === 3) return item.Code.indexOf(term) !== -1;
        return (item.Code + " " + item.Tekst).toLowerCase().indexOf(term.toLowerCase()) !== -1;
      });
    });
  }

  LCH.views.codes = function () {
    var state = { type: "GRP", search: "" };
    var root = el("div");

    var seg = el("div", { class: "segmented" });
    var segBtns = {};
    TYPES.forEach(function (t) {
      var b = el("button", { text: t, onclick: function () { state.type = t; updateSeg(); render(); } });
      segBtns[t] = b; seg.appendChild(b);
    });
    function updateSeg() { TYPES.forEach(function (t) { segBtns[t].className = state.type === t ? "active" : ""; }); }

    var titel = el("div", { style: "font-weight:600;color:var(--accentBlauw)" });
    var graphBtn = el("button", { class: "iconbtn", style: "color:var(--blue)", title: "Schema", onclick: LCH.showCodeGraph }, [LCH.icon("info-bubble", { color: "var(--blue)", size: 22 })]);

    var input = el("input", { class: "search", type: "text", placeholder: "Zoek code of tekst", autocapitalize: "off", autocorrect: "off", spellcheck: "false" });
    var clearBtn = el("button", { class: "clearbtn", title: "Wissen", onclick: function () { state.search = ""; input.value = ""; render(); } }, [LCH.icon("xmark-circle", { color: "var(--gray)", size: 20 })]);
    input.addEventListener("input", function () { state.search = input.value; render(); });

    var counter = el("div", { class: "counter", style: "color:#1c1c1e" });

    var header = el("div", { class: "bluebox" }, [
      seg,
      el("div", { class: "searchrow", style: "justify-content:space-between" }, [titel, graphBtn]),
      el("div", { class: "searchrow", style: "margin-top:8px" }, [input, clearBtn]),
      counter
    ]);

    var listArea = el("div");
    root.appendChild(header);
    root.appendChild(listArea);

    function render() {
      titel.textContent = TITELS[state.type];
      var all = itemsFor(state.type);
      var filtered = filterCodes(all, state.search);
      counter.textContent = filtered.length + " van " + all.length + " codes";
      clearBtn.style.visibility = state.search ? "visible" : "hidden";

      listArea.innerHTML = "";
      if (!filtered.length) {
        listArea.appendChild(el("div", { class: "empty" }, [
          el("div", { html: "<b>Geen resultaten.</b>" }),
          el("div", { text: "Pas zoektermen aan." }),
          el("button", { class: "linkbtn", style: "display:inline-flex;align-items:center;gap:6px;color:var(--blue)", onclick: function () {
            LCH.navigate("feedback", { categorie: "Inhoud", actie: "Voeg compLOCatie toe", vooraf: "Categorie: " + state.type + ", Zoekterm: " + state.search, herkomst: "Codes" }, "Codes");
          } }, [LCH.icon("send", { color: "var(--purple)", size: 18 }), "Geef feedback"])
        ]));
        return;
      }

      var ul = el("ul", { class: "list" });
      filtered.forEach(function (item) {
        var actions = [
          { icon: "send", bg: "var(--purple)", label: "Feedback", onClick: function () {
            LCH.navigate("feedback", { categorie: "Inhoud", actie: "Verander omschrijving", vooraf: "Betreft: " + TITELS[state.type] + ": " + item.Code + ", " + item.Tekst, herkomst: "Codes" }, "Codes");
          } },
          { icon: "table", bg: "#caa800", label: "Structuur", onClick: function () {
            LCH.model.filter = { type: state.type, code: item.Code };
            LCH.navigate("structuur", {}, "Codes");
          } }
        ];
        if (state.type === "GRP") {
          actions.push({ icon: "grid", bg: "var(--green)", label: "Matrix", onClick: function () {
            LCH.navigate("matrix", { initialGRP: item.Code.slice(0, 3) }, "Codes");
          } });
        }
        ul.appendChild(LCH.makeSwipeRow({
          content: [
            el("span", { class: "code-tag", text: item.Code }),
            LCH.hlNode(item.Tekst, state.search, { class: "grow" })
          ],
          actions: actions
        }));
      });
      listArea.appendChild(ul);
    }

    updateSeg();
    render();
    return { title: "Codes", node: root, backLabel: "Menu" };
  };

})(window.LCH);
