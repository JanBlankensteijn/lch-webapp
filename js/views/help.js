/* Help (port van HelpView.swift) */
(function (LCH) {
  "use strict";
  var el = LCH.el;

  var ITEMS = [
    ["search", "var(--blue)", "CompLOCaties",
      "Zoeken in de lijst met complicatie~locatie-termen ('CompLOCatie'). De zoekfunctie maakt een filter op de totale lijst. Met goed gekozen woordsegmenten van complicatie én locatie kom je snel tot een klein aantal opties. De lijst bestaat uit individuele compLOCaties en (als meerdere locaties van één complicatie matchen) uit <u>clusters</u>. Tik op een enkele compLOCatie voor de details. Tik op een cluster (📁) om het uit te klappen; elke regel begint dan met 📎. Tik op de sluitregel (📂) om het cluster te sluiten."],
    ["tray", "var(--pink)", "Codes",
      "Zoeken in één van de 4 tripletten van de code: Hoofdgroepen (GRP), Soorten (SRT), Specificaties (SPC) en Locaties (LOC) — plus de complicatie (COM). Via de actieknoppen kun je de code in het Structuur-overzicht (▦) inspecteren, (alleen GRP) de Matrix (▩) tonen, of er feedback (✉️) over geven."],
    ["table", "var(--orange)", "Structuur",
      "Zoeken in óf de complicatiecode (los van locatie: SRT+SPC), óf de locatiecode (los van complicatie: LOC). Kies bovenaan één of meer hoofdgroepen (GRP)."],
    ["grid", "var(--green)", "Matrix",
      "Toont per gekozen groep de matrix van complicaties (rijen) versus locaties (kolommen). Een <b>groene bol</b> (●) staat voor een <u>actieve</u> compLOCatie, een <b>groene ring</b> (○) voor een <u>inactieve</u>, en een <b>grijze stip</b> voor een <u>niet-bestaande</u> compLOCatie. Tik op een bol/ring voor de details. Tik op een rij- of kolomkop voor de toelichting. Scroll de matrix zo nodig."],
    ["send", "var(--purple)", "Feedback",
      "In het formulier geef je de categorie aan: UX (werking van de app), Inhoud (over de complicaties), Fout of Overig. Ook kun je het scherm aangeven waaraan de feedback refereert. Contextuele feedback (via het ✉️-icoon op Details, Codes of bij 0 resultaten) heeft de voorkeur: die voegt automatisch de herkomst toe."],
    ["search", "#333", "Zoekfunctie",
      "Typ termen om de lijst te filteren (logica 'LIKE *term*'). Anker een term met een punt vóór (prefix), erachter (suffix) of beide (exact woord). Meerdere termen (gescheiden door spaties) worden gecombineerd (EN-filter). Een term van drie hoofdletters zoekt in de code (GRP/SRT/SPC/LOC). De Short Hand Code (SHcode) zoek je met een '@' ervoor, bijv. @AP3."],
    ["swatch:var(--zachtGeel)", "#333", "Gematchte termen",
      "Gematchte (delen van) woorden worden geel gemarkeerd."],
    ["swatch:var(--red)", "var(--red)", "Inactieve complicaties",
      "Standaard worden alleen actieve compLOCaties getoond. Met de stapel-toggle (blauw met 'A' = alleen actief, rood = alle) schakel je tussen alleen-actief en alle codes (inactieve rood en doorgestreept)."],
    ["tray-up", "var(--orange)", "Uitsluiten / Isoleren",
      "In de compLOCatie-lijst kun je via de actieknoppen een item of cluster tijdelijk uitsluiten (⊟), of een cluster isoleren (📍) — dan worden alle andere items uitgesloten. Boven de lijst zie je het aantal uitsluitingen in oranje; wis ze met ✕ of door opnieuw te zoeken."]
  ];

  LCH.views.help = function () {
    var wrap = el("div", { class: "help" });
    wrap.appendChild(el("h2", { text: "Uitleg & gebruiksfuncties" }));
    ITEMS.forEach(function (it) {
      var icoNode;
      if (it[0].indexOf("swatch:") === 0) {
        icoNode = el("span", { style: "display:inline-block;width:16px;height:16px;border-radius:3px;border:1px solid rgba(0,0,0,0.2);background:" + it[0].slice(7) });
      } else {
        icoNode = LCH.icon(it[0], { color: it[1], size: 20 });
      }
      wrap.appendChild(el("div", { class: "item" }, [
        el("div", { class: "ic" }, [icoNode]),
        el("div", { class: "bd" }, [
          el("div", { html: "<b>" + it[2] + "</b>" }),
          el("div", { class: "sub", html: it[3] })
        ])
      ]));
    });
    return { title: "Info", node: wrap, backLabel: "Menu" };
  };

})(window.LCH);
