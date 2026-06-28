/* Structuur (port van StructuurView.swift + StructuurScreen.swift) */
(function (LCH) {
  "use strict";
  var el = LCH.el;

  function matchesAllTerms(item, terms, variant) {
    if (!terms.length) return true;
    return terms.every(function (term) {
      if (term === term.toUpperCase()) {
        if (term.length === 3) {
          var code = item.Code;
          if (variant === "A") return [code.slice(0, 3), code.slice(3, 6), code.slice(6, 9)].indexOf(term) !== -1;
          if (variant === "B") return [code.slice(0, 3), code.slice(9)].indexOf(term) !== -1;
          return false;
        }
        if (term.length === 6) return variant === "A" && item.Code.slice(3, 9) === term;
      }
      var tekst = (variant === "A" ? item.CXBtekst : item.LOCtekst) || "";
      return tekst.toLowerCase().indexOf(term.toLowerCase()) !== -1;
    });
  }

  function canonicalText(texts) {
    var counts = {};
    texts.forEach(function (t) { t = (t || "").trim(); counts[t] = (counts[t] || 0) + 1; });
    var best = "", bestN = -1;
    Object.keys(counts).sort().forEach(function (k) { if (counts[k] > bestN) { bestN = counts[k]; best = k; } });
    return best;
  }

  LCH.views.structuur = function () {
    var state = { search: "", variant: "A", selectedGRPs: {}, pulldownOpen: false };

    // Filter overnemen (vanuit Codes / Detail)
    if (LCH.model.filter) {
      var f = LCH.model.filter;
      state.variant = "A"; state.search = f.code;
      if (f.type === "GRP") { state.search = ""; state.selectedGRPs = {}; state.selectedGRPs[f.code] = true; }
      else if (f.type === "LOC") { state.variant = "B"; }
      LCH.model.filter = null;
    }
    if (Object.keys(state.selectedGRPs).length === 0) {
      LCH.uniekeGRPs().forEach(function (g) { state.selectedGRPs[g] = true; });
    }

    var root = el("div");
    var header = el("div", { class: "bluebox" });
    var listArea = el("div");
    root.appendChild(header);
    root.appendChild(listArea);

    function selectedList() { return Object.keys(state.selectedGRPs).filter(function (k) { return state.selectedGRPs[k]; }); }

    function computeTotaal() {
      var sel = selectedList(), all = LCH.uniekeGRPs();
      var filterAll = sel.length === 0;
      var uniq = {};
      LCH.model.allItems.forEach(function (it) {
        if (!it.Actief) return;
        if (!filterAll && sel.indexOf(it.Code.slice(0, 3)) === -1) return;
        uniq[state.variant === "A" ? it.Code.slice(3, 9) : it.Code.slice(9)] = true;
      });
      return Object.keys(uniq).length;
    }

    function compute() {
      var sel = selectedList();
      var filterAll = sel.length === 0;
      var terms = state.search.trim().split(/\s+/).filter(Boolean);

      var items = LCH.model.allItems.filter(function (it) {
        return it.Actief &&
          (filterAll || sel.indexOf(it.Code.slice(0, 3)) !== -1) &&
          matchesAllTerms(it, terms, state.variant);
      });

      var groupMap = {};
      items.forEach(function (it) {
        var key = state.variant === "A" ? it.Code.slice(3, 9) : it.Code.slice(9);
        (groupMap[key] = groupMap[key] || []).push(it);
      });

      var rows = Object.keys(groupMap).map(function (key) {
        var arr = groupMap[key];
        var tekst = canonicalText(arr.map(function (i) { return state.variant === "A" ? i.CXBtekst : i.LOCtekst; }));
        var perGRP = {};
        arr.forEach(function (i) { var g = i.Code.slice(0, 3); perGRP[g] = (perGRP[g] || 0) + 1; });
        var codes = Object.keys(perGRP).map(function (g) {
          var c = state.variant === "A" ? "[" + g + key + "*]" : "[" + g + "**" + key + "]";
          return { code: c, aantal: perGRP[g] };
        }).sort(function (a, b) { return a.code < b.code ? -1 : 1; });
        return { id: key, tekst: tekst, codes: codes };
      });
      rows.sort(function (a, b) { return a.tekst.toLowerCase() < b.tekst.toLowerCase() ? -1 : 1; });
      return rows;
    }

    function pulldownLabel() {
      var sel = selectedList(), all = LCH.uniekeGRPs(), txt = LCH.grpTeksten();
      if (sel.length === 0 || sel.length === all.length) return { main: "Alle " + all.length + " groepen geselecteerd", sub: "" };
      if (sel.length === 1) return { main: sel[0] + " geselecteerd", sub: txt[sel[0]] || "-" };
      return { main: sel.length + " groepen geselecteerd", sub: "(" + sel.sort().join(", ") + ")" };
    }

    function renderHeader() {
      header.innerHTML = "";
      var lab = pulldownLabel();
      var labelBox = el("div", { class: "pulldown-label", onclick: function () {
        if (state.pulldownOpen) { state.pulldownOpen = false; }
        else { if (selectedList().length === LCH.uniekeGRPs().length) state.selectedGRPs = {}; state.pulldownOpen = true; }
        renderHeader();
      } }, [
        el("div", null, [el("div", { class: "code", text: lab.main }), lab.sub ? el("div", { class: "sub", text: lab.sub }) : null]),
        LCH.icon(state.pulldownOpen ? "chevron-up" : "chevron-down", { color: "var(--gray)", size: 18 })
      ]);
      header.appendChild(labelBox);

      if (state.pulldownOpen) {
        var pd = el("div", { class: "pulldown" });
        var txt = LCH.grpTeksten();
        LCH.uniekeGRPs().forEach(function (g) {
          var cb = el("input", { type: "checkbox" });
          cb.checked = !!state.selectedGRPs[g];
          cb.addEventListener("change", function () {
            if (cb.checked) state.selectedGRPs[g] = true; else delete state.selectedGRPs[g];
            if (selectedList().length === 1) state.pulldownOpen = false;
            renderHeader(); renderList();
          });
          pd.appendChild(el("div", { class: "row", onclick: function (e) { if (e.target !== cb) { cb.checked = !cb.checked; cb.dispatchEvent(new Event("change")); } } }, [
            el("span", { class: "grp", text: g }),
            el("span", { class: "txt", text: txt[g] || "" }),
            cb
          ]));
        });
        header.appendChild(pd);
        if (selectedList().length > 1) {
          header.appendChild(el("div", { style: "text-align:right" }, [
            el("button", { class: "linkbtn", text: "Klaar", onclick: function () { state.pulldownOpen = false; renderHeader(); } })
          ]));
        }
      }

      // variant segmented
      var segm = el("div", { class: "segmented", style: "margin-top:10px" });
      [["A", "Complicaties"], ["B", "Locaties"]].forEach(function (p) {
        segm.appendChild(el("button", { text: p[1], class: state.variant === p[0] ? "active" : "", onclick: function () {
          state.variant = p[0]; renderHeader(); renderList();
        } }));
      });
      header.appendChild(segm);

      var input = el("input", { class: "search", type: "text", value: state.search,
        placeholder: state.variant === "A" ? "Zoek complicatie" : "Zoek locatie",
        autocapitalize: "off", autocorrect: "off", spellcheck: "false" });
      var clr = el("button", { class: "clearbtn", title: "Wissen", style: state.search ? "" : "visibility:hidden", onclick: function () {
        state.search = ""; renderHeader(); renderList();
      } }, [LCH.icon("xmark-circle", { color: "var(--gray)", size: 20 })]);
      input.addEventListener("input", function () { state.search = input.value; clr.style.visibility = state.search ? "visible" : "hidden"; renderList(); });
      header.appendChild(el("div", { class: "searchrow", style: "margin-top:8px" }, [input, clr]));

      counterEl = el("div", { class: "counter", style: "color:#000" });
      header.appendChild(counterEl);
      updateCounter();
    }

    var lastCount = 0;
    var counterEl = null;
    function updateCounter() {
      if (counterEl) counterEl.textContent = lastCount + " van " + computeTotaal() + " " + (state.variant === "A" ? "complicaties" : "locaties");
    }

    function renderList() {
      var rows = compute();
      lastCount = rows.length;
      updateCounter();
      listArea.innerHTML = "";
      if (!rows.length) {
        listArea.appendChild(el("div", { class: "empty", text: "Geen resultaten." }));
        return;
      }
      var ul = el("ul", { class: "list" });
      rows.forEach(function (r) {
        var codesStr = r.codes.map(function (c) { return c.code + " (" + c.aantal + ")"; }).join(", ");
        ul.appendChild(el("li", { style: "cursor:default;display:block" }, [
          LCH.hlNode(r.tekst, state.search, { tag: "div", class: "struct-item" }),
          LCH.hlNode(codesStr, state.search, { tag: "div", class: "codes" })
        ]));
      });
      listArea.appendChild(ul);
    }

    renderHeader();
    renderList();
    return { title: "Structuur", node: root, backLabel: "Menu" };
  };

})(window.LCH);
