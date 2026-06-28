/* Port van StyledHighlightText.swift
 * - Locatie: bij precies één ';' wordt het deel ná ';' vet + donkerblauw
 * - Zoektermen: geel gemarkeerd, met anker-logica (. prefix / suffix .)
 * - 3 hoofdletter-codes: geel (case-sensitive exact)
 */
(function (LCH) {
  "use strict";

  // Lengte-behoudende vouw: diacriet weg + lowercase, per teken
  function fold(str) {
    var out = "";
    for (var i = 0; i < str.length; i++) {
      var c = str[i].normalize("NFD")[0] || str[i];
      out += c.toLowerCase();
    }
    return out;
  }

  function isThreeUpper(s) {
    return s.length === 3 && /^\p{L}{3}$/u.test(s) && s === s.toUpperCase() && s !== s.toLowerCase();
  }

  // tokens van letters/cijfers met [start,end) in de (gevouwen) string
  function tokenize(folded) {
    var re = /[\p{L}\p{N}]+/gu, m, out = [];
    while ((m = re.exec(folded))) out.push([m[0], m.index, m.index + m[0].length]);
    return out;
  }

  function parseTerm(s) {
    var pre = false, suf = false, t = s;
    if (t[0] === ".") { pre = true; t = t.slice(1); }
    if (t[t.length - 1] === ".") { suf = true; t = t.slice(0, -1); }
    return { core: t, prefix: pre, suffix: suf };
  }

  // Bouw HTML-string met markeringen
  LCH.highlightHTML = function (text, search) {
    text = text == null ? "" : String(text);
    var n = text.length;
    var hl = new Array(n).fill(false);
    var loc = new Array(n).fill(false);

    // 1) Locatie (precies één ';')
    var first = text.indexOf(";");
    if (first !== -1 && text.indexOf(";", first + 1) === -1) {
      for (var i = first + 1; i < n; i++) loc[i] = true;
    }

    // 2) Zoektermen
    var rawTerms = (search || "").split(/\s+/).map(function (t) { return t.trim(); }).filter(Boolean);
    var codes = rawTerms.filter(isThreeUpper);
    var wordSpecs = rawTerms
      .filter(function (t) { return !isThreeUpper(t) && t[0] !== "@"; })
      .map(parseTerm)
      .filter(function (s) { return s.core.length > 0; });

    if (wordSpecs.length) {
      var folded = fold(text);
      var toks = tokenize(folded);
      wordSpecs.forEach(function (spec) {
        var needle = fold(spec.core);
        if (spec.prefix && spec.suffix) {
          toks.forEach(function (t) {
            if (t[0] === needle) for (var k = t[1]; k < t[2]; k++) hl[k] = true;
          });
        } else if (spec.prefix) {
          toks.forEach(function (t) {
            if (t[0].indexOf(needle) === 0) {
              var end = t[1] + Math.min(needle.length, t[0].length);
              for (var k = t[1]; k < end; k++) hl[k] = true;
            }
          });
        } else if (spec.suffix) {
          toks.forEach(function (t) {
            if (t[0].slice(-needle.length) === needle && needle.length <= t[0].length) {
              var start = t[2] - Math.min(needle.length, t[0].length);
              for (var k = start; k < t[2]; k++) hl[k] = true;
            }
          });
        } else {
          var from = 0, idx;
          while ((idx = folded.indexOf(needle, from)) !== -1) {
            for (var k = idx; k < idx + needle.length; k++) hl[k] = true;
            from = idx + needle.length;
          }
        }
      });
    }

    // 3) Codes (case-sensitive exact)
    codes.forEach(function (code) {
      var from = 0, idx;
      while ((idx = text.indexOf(code, from)) !== -1) {
        for (var k = idx; k < idx + code.length; k++) hl[k] = true;
        from = idx + code.length;
      }
    });

    // 4) Emit spans
    var html = "", run = "", curHl = false, curLoc = false;
    function flush() {
      if (!run) return;
      var esc = LCH.escapeHtml(run);
      var cls = (curHl ? "hl " : "") + (curLoc ? "loc" : "");
      cls = cls.trim();
      html += cls ? '<span class="' + cls + '">' + esc + "</span>" : esc;
      run = "";
    }
    for (var j = 0; j < n; j++) {
      if (hl[j] !== curHl || loc[j] !== curLoc) { flush(); curHl = hl[j]; curLoc = loc[j]; }
      run += text[j];
    }
    flush();
    return html;
  };

  // Gemak: geef een <span> (of ander tag) met highlight-innerHTML
  LCH.hlNode = function (text, search, opts) {
    opts = opts || {};
    var node = LCH.el(opts.tag || "span", { class: opts.class || "" });
    node.innerHTML = LCH.highlightHTML(text, search);
    return node;
  };

})(window.LCH);
