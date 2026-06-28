/* Feedback (port van FeedbackView.swift) */
(function (LCH) {
  "use strict";
  var el = LCH.el;

  // Zelfde endpoint als de iOS-app
  var WEBHOOK = "https://webhook.site/2f4562ec-11b3-4ef8-9280-a1cf8d1cec77";

  var CATEGORIEEN = ["UX", "Inhoud", "Fout", "Overig"];
  var SCHERMEN = ["Hoofdmenu", "Complicaties", "Codes", "Structuur", "Matrix", "Feedback", "Details", "Info", "Help"];
  var ACTIES = ["Voeg compLOCatie toe", "Inactiveer compLOCatie", "Verander omschrijving",
    "Verander synoniemen/excl.-termen", "Bewerk definitie", "Herzie Snomed"];

  LCH.views.feedback = function (params) {
    params = params || {};
    var state = {
      categorie: CATEGORIEEN.indexOf(params.categorie) !== -1 ? params.categorie : "UX",
      scherm: "Hoofdmenu",
      actie: ACTIES.indexOf(params.actie) !== -1 ? params.actie : ACTIES[0],
      feedback: params.vooraf || "",
      verzender: ""
    };

    var form = el("form", { class: "form", onsubmit: function (e) { e.preventDefault(); } });

    // Categorie segmented
    var seg = el("div", { class: "seg" });
    var segBtns = {};
    CATEGORIEEN.forEach(function (c) {
      var b = el("button", { type: "button", text: c, onclick: function () { state.categorie = c; updateSeg(); renderCond(); } });
      segBtns[c] = b; seg.appendChild(b);
    });
    function updateSeg() { CATEGORIEEN.forEach(function (c) { segBtns[c].className = state.categorie === c ? "active" : ""; }); }

    var condBox = el("div");
    function renderCond() {
      condBox.innerHTML = "";
      if (state.categorie === "UX") {
        var sel = el("select");
        SCHERMEN.forEach(function (s) { sel.appendChild(el("option", { value: s, text: s, selected: s === state.scherm })); });
        sel.addEventListener("change", function () { state.scherm = sel.value; });
        condBox.appendChild(el("div", { class: "group" }, [el("label", { text: "Scherm" }), sel]));
      } else if (state.categorie === "Inhoud") {
        var sel2 = el("select");
        ACTIES.forEach(function (a) { sel2.appendChild(el("option", { value: a, text: a, selected: a === state.actie })); });
        sel2.addEventListener("change", function () { state.actie = sel2.value; });
        condBox.appendChild(el("div", { class: "group" }, [el("label", { text: "Actie" }), sel2]));
      }
    }

    var textarea = el("textarea", { placeholder: "Je feedback…" });
    textarea.value = state.feedback;
    textarea.addEventListener("input", function () { state.feedback = textarea.value; submitBtn.disabled = !state.feedback.trim(); });

    var verzender = el("input", { type: "email", placeholder: "e-mail of leeg laten", autocapitalize: "off" });
    verzender.addEventListener("input", function () { state.verzender = verzender.value; });

    var statusLine = el("div");
    var submitBtn = el("button", { class: "btn-primary", type: "button", text: "Verzend feedback" });
    submitBtn.disabled = !state.feedback.trim();
    submitBtn.addEventListener("click", function () {
      var subcat = state.categorie === "UX" ? state.scherm : (state.categorie === "Inhoud" ? state.actie : null);
      var payload = {
        datum: new Date().toISOString(),
        verzender: state.verzender,
        categorie: state.categorie,
        subcategorie: subcat,
        feedback: state.feedback
      };
      submitBtn.disabled = true;
      fetch(WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        mode: "cors"
      }).then(function () {
        statusLine.className = "success"; statusLine.textContent = "✅ Feedback verzonden";
        textarea.value = ""; state.feedback = ""; state.verzender = ""; verzender.value = "";
        state.categorie = "UX"; updateSeg(); renderCond();
      }).catch(function () {
        statusLine.className = "success"; statusLine.style.color = "var(--red)";
        statusLine.textContent = "⚠️ Verzenden mislukt (controleer verbinding)";
        submitBtn.disabled = false;
      });
    });

    form.appendChild(el("div", { class: "group" }, [el("label", { text: "Categorie" }), seg]));
    form.appendChild(condBox);
    form.appendChild(el("div", { class: "group" }, [el("label", { text: "Feedback" }), textarea]));
    form.appendChild(el("div", { class: "group" }, [el("label", { text: "Verzender (optioneel)" }), verzender]));
    form.appendChild(submitBtn);
    form.appendChild(statusLine);

    updateSeg();
    renderCond();

    return { title: "Feedback", node: form, backLabel: params.herkomst || "Menu" };
  };

})(window.LCH);
