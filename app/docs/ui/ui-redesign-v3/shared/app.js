// NexosX — shared mockup interactions (mobile nav, segmented tabs, demo modals)
(function () {
  function qs(sel, ctx) { return (ctx || document).querySelector(sel); }
  function qsa(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); }

  // Mobile sidebar toggle
  var sidebar = qs(".sidebar");
  var scrim = qs(".sidebar-scrim");
  qsa("[data-menu-toggle]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      sidebar && sidebar.classList.toggle("open");
      scrim && scrim.classList.toggle("open");
    });
  });
  scrim && scrim.addEventListener("click", function () {
    sidebar.classList.remove("open");
    scrim.classList.remove("open");
  });

  // Segmented control (status filters, tabs)
  qsa("[data-segmented]").forEach(function (group) {
    qsa("button", group).forEach(function (btn) {
      btn.addEventListener("click", function () {
        qsa("button", group).forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
      });
    });
  });

  // Demo modal open/close
  qsa("[data-open-modal]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var target = qs(btn.getAttribute("data-open-modal"));
      if (target) target.style.display = "block";
      var scrimEl = qs("[data-modal-scrim]");
      if (scrimEl) scrimEl.style.display = "block";
    });
  });
  qsa("[data-close-modal]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      qsa(".modal").forEach(function (m) { m.style.display = "none"; });
      var scrimEl = qs("[data-modal-scrim]");
      if (scrimEl) scrimEl.style.display = "none";
    });
  });
})();
