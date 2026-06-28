/* Menu (port van MenuView.swift) */
(function (LCH) {
  "use strict";
  var el = LCH.el;

  var TILES = [
    { name: "complocaties", title: "CompLOCaties", sub: "Zoek complicatie;locatie", icon: "search", color: "var(--accentBlauw)" },
    { name: "codes",       title: "Codes",        sub: "Bekijk GRP, COM, SRT, SPC en LOC", icon: "tray", color: "var(--pink)" },
    { name: "structuur",   title: "Structuur",    sub: "Bekijk complicaties en locaties", icon: "table", color: "var(--orange)" },
    { name: "matrix",      title: "Matrix",       sub: "Groepsoverzicht complicaties vs locaties", icon: "grid", color: "var(--green)" },
    { name: "feedback",    title: "Feedback",     sub: "Geef suggesties of meld een probleem", icon: "send", color: "var(--purple)" }
  ];

  LCH.views.menu = function () {
    var wrap = el("div", { class: "menu" });

    TILES.forEach(function (t) {
      wrap.appendChild(
        el("button", { class: "menu-tile", onclick: function () { LCH.navigate(t.name, {}, "Menu"); } }, [
          el("div", { class: "ico", style: "background:" + t.color }, [LCH.icon(t.icon, { color: "#fff", size: 24 })]),
          el("div", { class: "txt" }, [
            el("div", { class: "t", text: t.title }),
            el("div", { class: "s", text: t.sub })
          ])
        ])
      );
    });

    return {
      title: "Menu",
      node: wrap,
      left: { type: "icon", icon: "info", onClick: function () { LCH.navigate("info", {}, "Menu"); } },
      right: [{ icon: "question", onClick: function () { LCH.navigate("help", {}, "Menu"); } }]
    };
  };

})(window.LCH);
