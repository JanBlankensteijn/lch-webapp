/* CompLOCaties (port van ComplicatieView.swift) */
(function (LCH) {
  "use strict";
  var el = LCH.el;

  function tokens(s) { return s.split(/[^\p{L}\p{N}]+/u).filter(Boolean); }

  function matchesWord(tekst, exclusie, shcode, word) {
    var isPrefix = word[0] === ".";
    var isSuffix = word[word.length - 1] === ".";
    var core = word.toLowerCase();
    if (isPrefix) core = core.slice(1);
    if (isSuffix) core = core.slice(0, -1);
    if (core === "") return true;
    if (shcode.toLowerCase().indexOf(core) !== -1) return false;
    if (exclusie !== "" && exclusie.indexOf(core) !== -1) return false;

    var toks = tokens(tekst);
    if (isPrefix && isSuffix) return toks.some(function (t) { return t === core; });
    if (isPrefix) return toks.some(function (t) { return t.indexOf(core) === 0; });
    if (isSuffix) return toks.some(function (t) { return t.slice(-core.length) === core; });
    return tekst.indexOf(core) !== -1;
  }

  function filterItems(searchText, showOnlyActive, excluded) {
    var m = LCH.model;
    var terms = searchText.split(/\s+/).filter(Boolean);
    var prefix = (m.metadata && m.metadata.ExportPrefix ? m.metadata.ExportPrefix : "").toLowerCase();

    return m.allItems.filter(function (item) {
      var tekst = (item.CxTekst_zoek || "").toLowerCase();
      if (prefix && tekst.indexOf(prefix) === 0) tekst = tekst.slice(prefix.length);
      var exclusie = (item.Exclusietermen || "").toLowerCase();
      var code = item.Code.toUpperCase();
      var locCode = code.slice(9);
      var shCode = (item.SHcode || "").toUpperCase();

      var voldoet = terms.every(function (word) {
        if (word[0] === "@") return shCode === word.slice(1).toUpperCase();
        if (word.length === 3 && word === word.toUpperCase()) {
          return code.slice(0, 3) === word || code.slice(3, 6) === word ||
                 code.slice(6, 9) === word || locCode === word;
        }
        return matchesWord(tekst, exclusie, item.SHcode || "", word);
      });

      return (!showOnlyActive || item.Actief) && voldoet && excluded.indexOf(item.Code) === -1;
    });
  }

  function buildGroups(items) {
    var map = {};
    items.forEach(function (it) {
      var key = it.Code.slice(0, 9);
      (map[key] = map[key] || []).push(it);
    });
    var groups = Object.keys(map).map(function (key) {
      var children = map[key].slice().sort(function (a, b) {
        var sa = a.Code.slice(3, 12), sb = b.Code.slice(3, 12);
        if (sa !== sb) return sa < sb ? -1 : 1;
        var la = a.Code.slice(9), lb = b.Code.slice(9);
        return la < lb ? -1 : la > lb ? 1 : 0;
      });
      var first = children[0];
      var title = first.CxTekst.split(";")[0];
      return { id: key, title: title, items: children, sortKey: key.slice(3), locKey: key.slice(0, 3) };
    });
    groups.sort(function (a, b) {
      if (a.sortKey !== b.sortKey) return a.sortKey < b.sortKey ? -1 : 1;
      return a.locKey < b.locKey ? -1 : a.locKey > b.locKey ? 1 : 0;
    });
    return groups;
  }

  LCH.views.complocaties = function () {
    var state = { search: "", onlyActive: true, excluded: [], expanded: {}, showUnfiltered: false, showHint: false };

    var root = el("div");

    // ---- Header ----
    var input = el("input", {
      class: "search", type: "text", placeholder: "Zoek compLOCatie",
      autocapitalize: "off", autocorrect: "off", spellcheck: "false"
    });
    var clearBtn = el("button", { class: "clearbtn", title: "Wissen", onclick: function () {
      state.search = ""; input.value = ""; state.excluded = []; state.expanded = {}; state.showUnfiltered = false; render();
    } }, [LCH.icon("xmark-circle", { color: "var(--gray)", size: 20 })]);
    var toggleBtn = el("button", { class: "iconbtn", title: "Actief / alle", style: "position:relative" });
    var counter = el("div");
    var subcount = el("div", { class: "subcount" });

    input.addEventListener("input", function () {
      state.search = input.value;
      if (state.search === "") state.showUnfiltered = false;
      render();
    });
    toggleBtn.addEventListener("click", function () { state.onlyActive = !state.onlyActive; render(); });

    var header = el("div", { class: "bluebox" }, [
      el("div", { class: "searchrow" }, [input, clearBtn]),
      el("div", { class: "searchrow", style: "margin-top:10px;align-items:flex-start" }, [
        toggleBtn,
        el("div", { style: "flex:1" }, [counter, subcount])
      ])
    ]);

    var hintBar = el("div");
    var excludeBar = el("div");
    var listArea = el("div");

    root.appendChild(header);
    root.appendChild(hintBar);
    root.appendChild(excludeBar);
    root.appendChild(listArea);

    var hintTimer = null;
    function renderHint(visible, hasClusters) {
      hintBar.innerHTML = "";
      // zoals iOS: lampje alleen tonen als de lijst zichtbaar is en er clusters zijn
      if (!visible || !hasClusters) return;
      var lamp = el("button", { class: "iconbtn hintbtn", title: "Tip", style: "padding:4px" }, [
        LCH.icon("lightbulb", { color: "var(--orange)", size: 22 })
      ]);
      var row = el("div", { style: "display:flex;align-items:center;gap:6px;padding:4px 14px" }, [lamp]);
      if (state.showHint) {
        row.appendChild(el("span", { class: "hinttext", text: "Veeg een item of cluster naar links (of houd de muis erboven) om uit te sluiten of te isoleren." }));
      }
      lamp.addEventListener("click", function () {
        state.showHint = !state.showHint;
        if (hintTimer) clearTimeout(hintTimer);
        if (state.showHint) hintTimer = setTimeout(function () { state.showHint = false; render(); }, 5000);
        render();
      });
      hintBar.appendChild(row);
    }

    // Actie-specs voor swipe (oranje uitsluiten, groen isoleren) — zoals iOS .swipeActions
    function excludeAction(codes) {
      return { icon: "tray-up", bg: "var(--orange)", label: "Uitsluiten", onClick: function () {
        codes.forEach(function (c) { if (state.excluded.indexOf(c) === -1) state.excluded.push(c); });
        render();
      } };
    }
    function isolateAction(codes, groupId, allFiltered) {
      return { icon: "pin", bg: "var(--green)", label: "Isoleren", onClick: function () {
        var gp = codes[0].slice(0, 9);
        allFiltered.forEach(function (it) {
          if (it.Code.slice(0, 9) !== gp && state.excluded.indexOf(it.Code) === -1) state.excluded.push(it.Code);
        });
        state.expanded[groupId] = true;
        render();
      } };
    }

    function itemRowNode(item, isChild, allFiltered) {
      var body = el("div", { class: "grow" });
      body.appendChild(LCH.hlNode(item.CxTekst, state.search, { class: item.Actief ? "actief" : "inactief" }));
      if (item.Inclusietermen) {
        body.appendChild(LCH.hlNode("Synoniemen: " + item.Inclusietermen + " [" + item.Code + "]", state.search, { class: "caption" }));
      }
      return LCH.makeSwipeRow({
        extraClass: isChild ? "child-row" : "",
        content: [
          isChild ? LCH.icon("paperclip", { color: "var(--gray)", size: 15, cls: "clip" }) : null,
          body,
          LCH.icon("chevron-right", { color: "var(--green)", size: 18 })
        ],
        onClick: function () { LCH.navigate("detail", { code: item.Code, searchText: state.search }, "CompLOCaties"); },
        actions: [excludeAction([item.Code])]
      });
    }

    function render() {
      // counters
      var total = LCH.model.allItems.filter(function (it) { return !state.onlyActive || it.Actief; }).length;
      var filtered = filterItems(state.search, state.onlyActive, state.excluded);
      var groups = buildGroups(filtered);
      var clusters = groups.filter(function (g) { return g.items.length > 1; });
      var singles = groups.filter(function (g) { return g.items.length === 1; });

      // Actief/alle-toggle: gelaagde-stapel (square.stack.3d.up), blauw met 'A' = alleen actief, rood = alle
      toggleBtn.innerHTML = "";
      toggleBtn.appendChild(LCH.icon("stack", { color: state.onlyActive ? "var(--blue)" : "var(--red)", size: 28 }));
      if (state.onlyActive) {
        toggleBtn.appendChild(el("span", { text: "A", style: "position:absolute;right:0;bottom:-1px;font-size:9px;font-weight:800;color:var(--blue);background:#fff;border-radius:3px;line-height:1;padding:0 1px" }));
      }
      counter.className = "counter " + (state.onlyActive ? "blue" : "red");
      counter.innerHTML = filtered.length + " van " + total + " <b>" +
        (state.onlyActive ? "actieve" : "(alle)") + "</b> compLOCaties";
      subcount.textContent = clusters.length + " clusters, " + singles.length + " enkel";

      clearBtn.style.visibility = state.search ? "visible" : "hidden";

      // hint-lampje (zoals iOS): alleen als de lijst zichtbaar is, er clusters zijn en geen uitsluitingen
      renderHint((state.showUnfiltered || state.search !== "") && state.excluded.length === 0, clusters.length > 0);

      // exclude bar
      excludeBar.innerHTML = "";
      if (state.excluded.length) {
        excludeBar.appendChild(el("div", { style: "text-align:center;padding:6px;color:var(--orange);font-size:13px" }, [
          "Uitsluitingen actief (n=" + state.excluded.length + ") ",
          el("button", { class: "linkbtn", style: "color:var(--orange);vertical-align:middle", title: "Wis uitsluitingen", onclick: function () {
            state.excluded = []; render();
          } }, [LCH.icon("xmark-circle", { color: "var(--orange)", size: 18 })])
        ]));
      }

      // list
      listArea.innerHTML = "";
      var isVisible = state.showUnfiltered || state.search !== "";
      if (!isVisible) {
        listArea.appendChild(el("div", { class: "empty" }, [
          el("button", { class: "linkbtn", style: "display:inline-flex;align-items:center;gap:6px", onclick: function () {
            state.showUnfiltered = true; render();
          } }, [LCH.icon("list", { color: "var(--blue)", size: 18 }), "Toon ongefilterde lijst"])
        ]));
        return;
      }

      if (groups.length === 0) {
        listArea.appendChild(emptyResult(state.search));
        return;
      }

      var ul = el("ul", { class: "list" });
      groups.forEach(function (g) {
        if (g.items.length > 1) {
          var open = !!state.expanded[g.id];
          var codes = g.items.map(function (i) { return i.Code; });
          ul.appendChild(LCH.makeSwipeRow({
            extraClass: "cluster-head",
            content: [
              LCH.hlNode(g.title, state.search, { class: "grow" }),
              el("span", { class: "cluster-folder" }, [
                LCH.icon("folder", { color: "var(--blue)", size: 24 }),
                el("span", { class: "badge", text: String(g.items.length) })
              ]),
              LCH.icon(open ? "chevron-up" : "chevron-down", { color: "var(--gray)", size: 18 })
            ],
            onClick: function () { state.expanded[g.id] = !open; render(); },
            actions: [excludeAction(codes), isolateAction(codes, g.id, filtered)]
          }));
          if (open) {
            g.items.forEach(function (it) { ul.appendChild(itemRowNode(it, true, filtered)); });
            ul.appendChild(el("li", { class: "close-row", onclick: function () {
              state.expanded[g.id] = false; render();
            } }, [
              LCH.icon("folder-open", { color: "var(--blue)", size: 20 }),
              el("span", { text: "sluiten", style: "margin:0 6px" }),
              LCH.icon("chevron-up", { color: "var(--gray)", size: 16 })
            ]));
          }
        } else {
          ul.appendChild(itemRowNode(g.items[0], false, filtered));
        }
      });
      listArea.appendChild(ul);
    }

    render();
    setTimeout(function () { input.focus(); }, 50);

    return { title: "CompLOCaties", node: root, backLabel: "Menu" };
  };

  function emptyResult(searchText) {
    return el("div", { class: "empty" }, [
      el("div", { html: "<b>Geen resultaten.</b>" }),
      el("div", { text: "Pas zoektermen aan." }),
      el("button", { class: "linkbtn", style: "display:inline-flex;align-items:center;gap:6px;color:var(--blue)", onclick: function () {
        LCH.navigate("feedback", { categorie: "Inhoud", actie: "Voeg compLOCatie toe", vooraf: "Zoekterm: " + searchText, herkomst: "CompLOCaties" }, "CompLOCaties");
      } }, [LCH.icon("send", { color: "var(--purple)", size: 18 }), "Geef feedback"])
    ]);
  }
  LCH._emptyResult = emptyResult;

})(window.LCH);
