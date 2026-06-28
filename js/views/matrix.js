/* Matrix (port van MatrixScreen.swift + MatrixCollectionViewGrid.swift) */
(function (LCH) {
  "use strict";
  var el = LCH.el;

  LCH.views.matrix = function (params) {
    params = params || {};
    var state = {
      grp: params.initialGRP || "ART",
      marked: params.gemarkeerdeCode || null,
      pulldownOpen: false
    };

    var root = el("div");
    var headerBox = el("div");
    var scrollBox = el("div", { class: "matrix-scroll" });
    root.appendChild(headerBox);
    root.appendChild(scrollBox);

    function data() {
      var filtered = LCH.model.allItems.filter(function (it) { return it.Code.slice(0, 3) === state.grp; });
      var seen = {}, rows = [];
      filtered.forEach(function (it) {
        var k = it.Code.slice(3, 9);
        if (!seen[k]) { seen[k] = true; rows.push(it); }
      });
      rows.sort(function (a, b) { return a.Code < b.Code ? -1 : 1; });

      var locSet = {};
      filtered.forEach(function (it) { locSet[it.Code.slice(9)] = true; });
      var locaties = Object.keys(locSet).sort();

      var bestaande = {}, actieve = {}, locTekst = {};
      filtered.forEach(function (it) {
        bestaande[it.Code] = true;
        if (it.Actief) actieve[it.Code] = true;
        var lc = it.Code.slice(9);
        if (locTekst[lc] == null && it.LOCtekst) locTekst[lc] = it.LOCtekst;
      });
      return { rows: rows, locaties: locaties, bestaande: bestaande, actieve: actieve, locTekst: locTekst, filtered: filtered };
    }

    function grpText() {
      var g = LCH.model.grpItems.filter(function (c) { return c.Code === state.grp; })[0];
      return g ? g.Tekst : (LCH.grpTeksten()[state.grp] || "");
    }

    function renderHeader(d) {
      headerBox.innerHTML = "";
      var box = el("div", { class: "bluebox" });

      var label = el("div", { class: "pulldown-label", onclick: function () { state.pulldownOpen = !state.pulldownOpen; renderHeader(d); } }, [
        el("div", null, [el("div", { class: "code", text: state.grp }), el("div", { class: "sub", text: grpText() })]),
        LCH.icon(state.pulldownOpen ? "chevron-up" : "chevron-down", { color: "var(--gray)", size: 18 })
      ]);
      box.appendChild(label);

      if (state.pulldownOpen) {
        var pd = el("div", { class: "pulldown" });
        var txt = LCH.grpTeksten();
        LCH.uniekeGRPs().forEach(function (g) {
          pd.appendChild(el("div", { class: "row", onclick: function () {
            state.grp = g; state.marked = null; state.pulldownOpen = false; renderAll();
          } }, [el("span", { class: "grp", text: g }), el("span", { class: "txt", text: txt[g] || "" })]));
        });
        box.appendChild(pd);
      }

      var inactief = Object.keys(d.bestaande).length - Object.keys(d.actieve).length;
      box.appendChild(el("div", { class: "matrix-stats" }, [
        el("div", { class: "col" }, [
          el("div", { class: "row" }, [LCH.icon("arrow-down", { color: "#1c1c1e", size: 15 }), "Complicaties: " + d.rows.length]),
          el("div", { class: "row" }, [el("span", { class: "dot-filled" }), "Actief: " + Object.keys(d.actieve).length])
        ]),
        el("div", { class: "col right" }, [
          el("div", { class: "row" }, [LCH.icon("arrow-right", { color: "#1c1c1e", size: 15 }), "Locaties: " + d.locaties.length]),
          el("div", { class: "row" }, [el("span", { class: "dot-ring" }), "Inactief: " + inactief])
        ])
      ]));
      headerBox.appendChild(box);
      headerBox.appendChild(el("div", { class: "matrix-hint", style: "display:flex;align-items:center;justify-content:flex-end;gap:6px;padding:4px 12px" }, [
        LCH.icon("lightbulb", { color: "var(--orange)", size: 18 }),
        el("span", { class: "hinttext", text: "Klik op rij/kolom-kop voor toelichting" })
      ]));
    }

    function renderGrid(d) {
      scrollBox.innerHTML = "";
      var table = el("table", { class: "matrix" });

      // header rij
      var headTr = el("tr");
      headTr.appendChild(el("th", { class: "corner" }));
      d.locaties.forEach(function (loc) {
        var th = el("th", { class: "colhead", onclick: function () {
          var t = d.locTekst[loc] || "";
          LCH.toast(t ? loc + ": " + t : loc);
        } }, [el("span", { class: "v", text: loc })]);
        headTr.appendChild(th);
      });
      table.appendChild(headTr);

      // datarijen
      d.rows.forEach(function (item) {
        var srtspc = item.Code.slice(3, 9);
        var tr = el("tr");
        var rh = el("th", { class: "rowhead", onclick: function () {
          var t = ((item.SRTtekst || "") + " " + (item.SPCtekst || "")).trim();
          LCH.toast(srtspc + ": " + t);
        }, text: "[" + srtspc + "]" });
        tr.appendChild(rh);

        d.locaties.forEach(function (loc) {
          var full = state.grp + srtspc + loc;
          var bestaat = !!d.bestaande[full];
          var actief = !!d.actieve[full];
          var td = el("td", { class: "cell" + (full === state.marked ? " marked" : "") });
          if (bestaat) {
            var dot = el("span", { class: actief ? "dot-filled" : "dot-ring" });
            td.appendChild(dot);
            td.addEventListener("click", function () {
              LCH.navigate("detail", { code: full, searchText: "" }, "Matrix");
            });
          } else {
            td.appendChild(el("span", { style: "width:6px;height:6px;border-radius:50%;background:var(--gray);display:inline-block" }));
            td.addEventListener("click", function () { LCH.toast("Geen complicatie op deze positie"); });
          }
          tr.appendChild(td);
        });
        table.appendChild(tr);
      });

      scrollBox.appendChild(table);

      // scroll naar gemarkeerde cel
      if (state.marked) {
        setTimeout(function () {
          var cell = scrollBox.querySelector(".cell.marked");
          if (cell && cell.scrollIntoView) cell.scrollIntoView({ block: "center", inline: "center" });
        }, 60);
      }
    }

    function renderAll() {
      var d = data();
      renderHeader(d);
      renderGrid(d);
    }

    renderAll();
    return { title: "Matrix", node: root, backLabel: params.backLabel || "Menu", onBack: function () { LCH.model.filter = null; } };
  };

})(window.LCH);
