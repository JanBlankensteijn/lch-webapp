/* Swipe-to-reveal lijstrijen (zoals iOS .swipeActions).
 * Touch: veeg naar links om actieknoppen te onthullen.
 * Desktop: knoppen verschijnen bij hover (via CSS, --sw breedte).
 *
 * LCH.makeSwipeRow({ content, onClick, actions:[{icon,bg,label,onClick}], extraClass })
 */
(function (LCH) {
  "use strict";
  var el = LCH.el;
  var BTN_W = 64;

  // Sluit de momenteel geopende rij (indien een andere dan opgegeven)
  LCH._openSwipe = null;

  LCH.makeSwipeRow = function (opts) {
    var actions = opts.actions || [];
    var li = el("li", { class: "swipe " + (opts.extraClass || "") });
    var content = el("div", { class: "swipe-content" }, opts.content);
    li.appendChild(content);

    if (!actions.length) {
      if (opts.onClick) content.addEventListener("click", opts.onClick);
      return li;
    }

    var panel = el("div", { class: "swipe-actions" });
    actions.forEach(function (a) {
      var b = el("button", { style: "background:" + a.bg, title: a.label, type: "button" }, [
        LCH.icon(a.icon, { color: "#fff", size: 20 }),
        a.label ? el("span", { text: a.label }) : null
      ]);
      b.addEventListener("click", function (e) {
        e.stopPropagation();
        close();
        a.onClick();
      });
      panel.appendChild(b);
    });
    li.appendChild(panel);

    var width = actions.length * BTN_W;
    li.style.setProperty("--sw", width + "px");

    var startX = 0, startY = 0, dragging = false, moved = false, offset = 0, base = 0;

    function applyOffset(x, animate) {
      offset = x;
      content.style.transition = animate ? "transform .2s ease" : "none";
      content.style.transform = x ? "translateX(" + x + "px)" : "";
    }
    function open() { applyOffset(-width, true); LCH._openSwipe = close; }
    function close() {
      applyOffset(0, true);
      if (LCH._openSwipe === close) LCH._openSwipe = null;
    }
    function closeOthers() { if (LCH._openSwipe && LCH._openSwipe !== close) LCH._openSwipe(); }

    content.addEventListener("touchstart", function (e) {
      var t = e.touches[0];
      startX = t.clientX; startY = t.clientY; base = offset; dragging = true; moved = false;
    }, { passive: true });

    content.addEventListener("touchmove", function (e) {
      if (!dragging) return;
      var t = e.touches[0], dx = t.clientX - startX, dy = t.clientY - startY;
      if (!moved && Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 6) { moved = true; closeOthers(); }
      if (moved) applyOffset(Math.max(-width, Math.min(0, base + dx)), false);
    }, { passive: true });

    content.addEventListener("touchend", function () {
      if (!dragging) return;
      dragging = false;
      if (moved) (offset < -width / 2 ? open : close)();
    });

    content.addEventListener("click", function () {
      if (moved) { moved = false; return; }       // was een veeg, geen tik
      if (offset !== 0) { close(); return; }       // open rij eerst sluiten
      closeOthers();
      if (opts.onClick) opts.onClick();
    });

    return li;
  };

})(window.LCH);
