/* Globale namespace */
window.LCH = window.LCH || {};

(function (LCH) {
  "use strict";

  LCH.views = LCH.views || {};

  /* ---------- DOM helpers ---------- */
  LCH.el = function (tag, attrs, children) {
    const node = document.createElement(tag);
    if (attrs) {
      for (const k in attrs) {
        if (k === "class") node.className = attrs[k];
        else if (k === "html") node.innerHTML = attrs[k];
        else if (k === "text") node.textContent = attrs[k];
        else if (k.startsWith("on") && typeof attrs[k] === "function") {
          node.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
        } else if (attrs[k] === true) node.setAttribute(k, "");
        else if (attrs[k] !== false && attrs[k] != null) node.setAttribute(k, attrs[k]);
      }
    }
    if (children != null) {
      (Array.isArray(children) ? children : [children]).forEach(function (c) {
        if (c == null) return;
        node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
      });
    }
    return node;
  };

  LCH.escapeHtml = function (s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  };

  /* ---------- Datum formattering (port van DateHelpers.swift) ---------- */
  var MAAND = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];

  function parseDate(s) {
    if (!s || s === "-") return null;
    // ISO of "yyyy-MM-dd HH:mm:ss"
    var d = new Date(s.indexOf("T") === -1 ? s.replace(" ", "T") : s);
    if (!isNaN(d.getTime())) return d;
    d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }

  // format: ondersteunt "dd MMM yyyy" en "dd MMM yyyy HH:mm:ss"
  LCH.formatDate = function (iso, withTime) {
    if (!iso || iso === "-") return "-";
    var d = parseDate(iso);
    if (!d) return iso;
    var p = function (n) { return n < 10 ? "0" + n : "" + n; };
    var base = p(d.getDate()) + " " + MAAND[d.getMonth()] + " " + d.getFullYear();
    if (withTime) base += " " + p(d.getHours()) + ":" + p(d.getMinutes()) + ":" + p(d.getSeconds());
    return base;
  };

  /* ---------- Toast ---------- */
  var toastTimer = null;
  LCH.toast = function (text, opts) {
    opts = opts || {};
    var t = document.getElementById("toast");
    t.textContent = text;
    t.className = "toast" + (opts.dark ? " dark" : "");
    t.hidden = false;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.hidden = true; }, opts.duration || 2000);
  };

  /* ---------- Modal ---------- */
  LCH.openModal = function (contentNode) {
    var backdrop = document.getElementById("modal-backdrop");
    var modal = document.getElementById("modal");
    modal.innerHTML = "";
    modal.appendChild(contentNode);
    backdrop.hidden = false;
    backdrop.onclick = function (e) { if (e.target === backdrop) LCH.closeModal(); };
  };
  LCH.closeModal = function () {
    document.getElementById("modal-backdrop").hidden = true;
  };

  /* ---------- Kopiëren ---------- */
  LCH.copyText = function (text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); } catch (e) {}
    document.body.removeChild(ta);
    return Promise.resolve();
  };

  /* ---------- CodeGraph popup (gedeeld door Detail & Codes) ---------- */
  LCH.showCodeGraph = function () {
    var box = LCH.el("div", null, [
      LCH.el("div", { text: "Schema Code Structuur", style: "font-size:18px" }),
      LCH.el("img", { src: "assets/CodeGraph.png", alt: "Code structuur" }),
      LCH.el("button", { text: "Sluiten", onclick: LCH.closeModal })
    ]);
    LCH.openModal(box);
  };

})(window.LCH);
