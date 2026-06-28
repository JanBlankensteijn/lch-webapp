/* Vlakke SVG-iconen in SF-Symbols-stijl (geen externe library).
 * LCH.icon(name, {size, color, cls}) -> <svg>
 */
(function (LCH) {
  "use strict";

  // fill = true  -> gevulde vorm (folder, pin, send)
  // fill = false -> lijn-icoon (chevrons, tray, paperclip, table, grid, ...)
  var ICONS = {
    "chevron-down":  { paths: ["M5 8.5l7 7 7-7"] },
    "chevron-up":    { paths: ["M5 15.5l7-7 7 7"] },
    "chevron-right": { paths: ["M9 5l7 7-7 7"] },
    "chevron-left":  { paths: ["M15 5l-7 7 7 7"] },
    "arrow-down":    { paths: ["M12 4v15", "M6 13l6 6 6-6"] },
    "arrow-right":   { paths: ["M4 12h15", "M13 6l6 6-6 6"] },
    "nosign":        { paths: ["M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z", "M5.6 5.6l12.8 12.8"] },
    "lightbulb":     { paths: ["M9.5 18h5", "M10 21h4", "M12 3a6 6 0 0 0-3.8 10.6c.7.6 1.3 1.4 1.3 2.4h5c0-1 .6-1.8 1.3-2.4A6 6 0 0 0 12 3z"] },
    "list":          { paths: ["M8 6h12", "M8 12h12", "M8 18h12", "M4 6h.01", "M4 12h.01", "M4 18h.01"] },
    "stack":         { paths: ["M12 2 2 7l10 5 10-5-10-5z", "M2 12l10 5 10-5", "M2 17l10 5 10-5"] },
    "tray":          { paths: ["M3 13l3 0 1.5 2.5h9L21 13l0 0", "M3 13 5.5 6a1.5 1.5 0 0 1 1.4-1h10.2a1.5 1.5 0 0 1 1.4 1L21 13v4a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"] },
    "paperclip":     { paths: ["M19 8.5l-8.6 8.6a3 3 0 0 1-4.24-4.24l8.95-8.95a2 2 0 0 1 2.83 2.83l-8.6 8.6a1 1 0 0 1-1.42-1.42l7.6-7.6"] },
    "tray-up":       { paths: [
        "M4 14h3.5l1.2 2h6.6l1.2-2H20",
        "M4 14v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3",
        "M12 3.5v8",
        "M8.7 6.8 12 3.5l3.3 3.3"
      ] },
    "table":         { paths: ["M4 5h16v14H4z", "M4 10h16", "M10 5v14"] },
    "grid":          { paths: ["M4 4h16v16H4z", "M4 9.33h16", "M4 14.67h16", "M9.33 4v16", "M14.67 4v16"] },
    "send":          { paths: ["M21.5 3 10.5 14", "M21.5 3l-7 18-4-8-7-4z"] },
    "search":        { paths: ["M10.5 4a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13z", "M20 20l-4.6-4.6"] },
    "info":          { paths: ["M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z", "M12 11v5", "M12 7.6h.01"] },
    "question":      { paths: ["M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z", "M9.6 9a2.5 2.5 0 1 1 3.3 2.36c-.86.33-1.4.9-1.4 1.84v.3", "M12 16.2h.01"] },
    "envelope":      { paths: ["M3.5 6h17v12h-17z", "M4 7l8 5.5L20 7"] },
    "xmark-circle":  { paths: ["M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z", "M9 9l6 6", "M15 9l-6 6"] },
    "copy":          { paths: ["M9 9h9a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1z", "M16 9V6a1 1 0 0 0-1-1H6a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h2"] },
    "info-bubble":   { paths: ["M4 5h16v11H9l-4 4v-4H4z", "M12 9.2h.01", "M12 12v2.2"] },

    // gevulde iconen
    "folder":        { fill: true, paths: ["M3 6.5A1.5 1.5 0 0 1 4.5 5h4.1a1.5 1.5 0 0 1 1.06.44L11 7h8.5A1.5 1.5 0 0 1 21 8.5v9A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5z"] },
    "folder-open":   { paths: ["M3 7.5A1.5 1.5 0 0 1 4.5 6h4.1a1.5 1.5 0 0 1 1.06.44L11 7.9h7A1.5 1.5 0 0 1 19.5 9.4", "M3 17.5 5.2 11a1.5 1.5 0 0 1 1.42-1h14a1 1 0 0 1 .96 1.3L19.8 18a1.5 1.5 0 0 1-1.43 1H4.5A1.5 1.5 0 0 1 3 17.5z"] },
    "pin":           { fill: true, evenodd: true, paths: ["M12 2a6.5 6.5 0 0 0-6.5 6.5C5.5 13 12 21 12 21s6.5-8 6.5-12.5A6.5 6.5 0 0 0 12 2zm0 9a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"] }
  };

  LCH.icon = function (name, opts) {
    opts = opts || {};
    var def = ICONS[name];
    var size = opts.size || 20;
    var svgNS = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("width", size);
    svg.setAttribute("height", size);
    svg.setAttribute("class", "svg-ic " + (opts.cls || ""));
    if (opts.color) svg.style.color = opts.color;
    if (!def) return svg;
    (def.paths || []).forEach(function (d) {
      var p = document.createElementNS(svgNS, "path");
      p.setAttribute("d", d);
      if (def.fill) {
        p.setAttribute("fill", "currentColor");
        if (def.evenodd) p.setAttribute("fill-rule", "evenodd");
      } else {
        p.setAttribute("fill", "none");
        p.setAttribute("stroke", "currentColor");
        p.setAttribute("stroke-width", opts.stroke || 1.8);
        p.setAttribute("stroke-linecap", "round");
        p.setAttribute("stroke-linejoin", "round");
      }
      svg.appendChild(p);
    });
    return svg;
  };

})(window.LCH);
