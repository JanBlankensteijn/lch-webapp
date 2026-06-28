/* App: router, opstart/laden, navigatiebalk (port van LCHappiOSApp + StartupView) */
(function (LCH) {
  "use strict";
  var el = LCH.el;

  var screen = document.getElementById("screen");
  var navTitle = document.getElementById("nav-title");
  var navLeft = document.getElementById("nav-left");
  var navRight = document.getElementById("nav-right");

  var stack = [];
  var curOnBack = null;

  /* ---------- Navigatie ----------
   * Elk schermexemplaar wordt per stack-entry gecachet (entry.r) zodat je bij
   * 'terug' exact dezelfde lijst, zoekterm én scrollpositie terugkrijgt
   * (zoals iOS de view in de NavigationStack levend houdt).
   */
  LCH.navigate = function (name, params, backLabel) {
    if (stack.length) stack[stack.length - 1].scrollY = window.scrollY; // huidige scroll bewaren
    stack.push({ name: name, params: params || {}, backLabel: backLabel, r: null, scrollY: 0 });
    try { history.pushState({ d: stack.length }, ""); } catch (e) {}
    render(false);
  };

  LCH.back = function () {
    if (stack.length > 1) { try { history.back(); } catch (e) { doPop(); } }
  };

  function doPop() {
    if (stack.length <= 1) return;
    var top = stack[stack.length - 1];
    if (top.r && top.r.onBack) { try { top.r.onBack(); } catch (e) {} }
    stack.pop();                 // gecachte node van dit scherm wordt verwijderd
    render(true);                // vorige scherm hergebruiken + scroll herstellen
  }

  window.addEventListener("popstate", function () {
    if (stack.length > 1) doPop();
  });

  /* ---------- Rendering ---------- */
  function render(restoreScroll) {
    var route = stack[stack.length - 1];
    var view = LCH.views[route.name];
    if (!view) return;

    // Bouw alleen als nog niet gecachet; anders hergebruik het bestaande exemplaar
    if (!route.r) route.r = view(route.params, route) || {};
    var result = route.r;

    navTitle.textContent = result.title || "";

    // Linkerknop
    navLeft.innerHTML = "";
    navLeft.onclick = null;
    if (result.left) {
      if (result.left.type === "back") {
        setBack(result.left.label);
      } else {
        navLeft.disabled = false;
        navLeft.appendChild(LCH.icon(result.left.icon, { size: 24, color: "var(--blue)" }));
        navLeft.onclick = result.left.onClick;
      }
    } else if (stack.length > 1) {
      setBack(route.backLabel || result.backLabel || "Terug");
    } else {
      navLeft.disabled = true;
    }

    // Rechterknoppen
    navRight.innerHTML = "";
    (result.right || []).forEach(function (r) {
      navRight.appendChild(el("button", { class: "nav-icon-btn", onclick: r.onClick }, [
        LCH.icon(r.icon, { size: 24, color: r.color || "var(--blue)" })
      ]));
    });

    screen.innerHTML = "";       // detacht vorige node (blijft in zijn eigen entry.r bewaard)
    screen.appendChild(result.node);

    var y = restoreScroll ? (route.scrollY || 0) : 0;
    requestAnimationFrame(function () { window.scrollTo(0, y); });
  }

  function setBack(label) {
    navLeft.disabled = false;
    navLeft.appendChild(LCH.icon("chevron-left", { size: 22, color: "var(--blue)" }));
    navLeft.appendChild(el("span", { text: label, style: "margin-left:-2px" }));
    navLeft.onclick = LCH.back;
  }

  /* ---------- Opstartscherm ---------- */
  function showStartup() {
    var count = el("div", { class: "count" });
    var bar = el("div");
    var progress = el("div", { class: "progress" }, [bar]);
    var loading = el("div", { class: "loading", text: "🔄 Laden…" });
    var errorBox = el("div", { class: "error" });

    var node = el("div", { class: "startup" }, [
      el("img", { class: "logo", src: "assets/LCHlogo.png", alt: "LCH" }),
      el("div", { class: "title", text: "Lijst Complicaties Heelkunde" }),
      el("div", { class: "author", text: "© Jan D. Blankensteijn" }),
      el("div", { class: "version", text: "Lijst Complicaties Heelkunde" }),
      count, progress, loading, errorBox
    ]);

    navTitle.textContent = "";
    navLeft.disabled = true; navLeft.innerHTML = "";
    navRight.innerHTML = "";
    screen.innerHTML = "";
    screen.appendChild(node);

    // Schijnbare voortgang tot ~90%, daarna 100% bij voltooiing
    var p = 0;
    var timer = setInterval(function () {
      p = Math.min(0.9, p + 0.04);
      bar.style.width = (p * 100) + "%";
    }, 120);

    LCH.loadData().then(function (m) {
      clearInterval(timer);
      bar.style.width = "100%";
      count.textContent = "✅ " + m.allItems.length + " ingelezen records";
      loading.textContent = "";
      node.querySelector(".version").textContent =
        "versie " + LCH.formatDate(m.metadata ? m.metadata.Exportdatum : "-", true);
      setTimeout(function () {
        stack = [{ name: "menu", params: {}, backLabel: null }];
        try { history.replaceState({ d: 1 }, ""); } catch (e) {}
        render();
      }, 700);
    }).catch(function (err) {
      clearInterval(timer);
      loading.textContent = "";
      errorBox.innerHTML = "❌ Laden mislukt: " + LCH.escapeHtml(err.message || String(err)) +
        "<br><br>Controleer je internetverbinding.";
      var retry = el("button", { class: "btn-primary", style: "margin-top:14px", text: "Opnieuw proberen", onclick: showStartup });
      errorBox.appendChild(retry);
    });
  }

  document.addEventListener("DOMContentLoaded", showStartup);

})(window.LCH);
