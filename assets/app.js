(function () {
  var ROOT = window.ROOT || "";
  var CURRENT = window.CURRENT || "";
  var enc = function (p) { return ROOT + p.split("/").map(encodeURIComponent).join("/"); };
  var escH = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };

  // Navigation: Ordnerbaum aus der Seitenliste
  var tree = { dirs: {}, files: [] };
  (window.VAULT_TREE || []).forEach(function (p) {
    var parts = p.u.split("/");
    var node = tree;
    for (var i = 0; i < parts.length - 1; i++) {
      node.dirs[parts[i]] = node.dirs[parts[i]] || { dirs: {}, files: [] };
      node = node.dirs[parts[i]];
    }
    node.files.push(p);
  });
  var cmp = function (a, b) { return a.localeCompare(b, "de", { numeric: true }); };
  function render(node, prefix) {
    var html = "<ul>";
    Object.keys(node.dirs).sort(cmp).forEach(function (d) {
      var path = prefix + d + "/";
      var open = CURRENT.indexOf(path) === 0 ? " open" : "";
      html += "<li><details" + open + "><summary>" + escH(d) + "</summary>" + render(node.dirs[d], path) + "</details></li>";
    });
    node.files.sort(function (a, b) { return cmp(a.t, b.t); }).forEach(function (f) {
      var cls = f.u === CURRENT ? ' class="active"' : "";
      html += "<li><a" + cls + ' href="' + escH(enc(f.u)) + '">' + escH(f.t) + "</a></li>";
    });
    return html + "</ul>";
  }
  var sidebar = document.getElementById("sidebar");
  sidebar.innerHTML = render(tree, "");
  var active = sidebar.querySelector("a.active");
  if (active) active.scrollIntoView({ block: "center" });

  document.getElementById("menu-btn").addEventListener("click", function () {
    document.body.classList.toggle("nav-open");
  });

  // Volltextsuche
  var input = document.getElementById("search");
  var results = document.getElementById("results");
  var index = (window.VAULT_SEARCH || []).map(function (p) {
    return { p: p, t: p.t.toLowerCase(), x: p.x.toLowerCase() };
  });
  function search(q) {
    var terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) { results.innerHTML = ""; results.classList.remove("show"); return; }
    var hits = [];
    index.forEach(function (e) {
      var score = 0;
      for (var i = 0; i < terms.length; i++) {
        var inT = e.t.indexOf(terms[i]) >= 0, inX = e.x.indexOf(terms[i]) >= 0;
        if (!inT && !inX) return;
        score += inT ? 10 : 1;
      }
      hits.push({ e: e, s: score });
    });
    hits.sort(function (a, b) { return b.s - a.s || cmp(a.e.p.t, b.e.p.t); });
    results.innerHTML = hits.length ? hits.slice(0, 40).map(function (h) {
      var pos = h.e.x.indexOf(terms[0]);
      var snip = pos >= 0 ? h.e.p.x.slice(Math.max(0, pos - 50), pos + 90) : h.e.p.x.slice(0, 120);
      return '<a href="' + escH(enc(h.e.p.u)) + '"><b>' + escH(h.e.p.t) + "</b><small>" + escH(h.e.p.u.replace(/\.html$/, "")) + "</small><span>" + escH(snip) + "</span></a>";
    }).join("") : '<div class="none">Keine Treffer</div>';
    results.classList.add("show");
  }
  input.addEventListener("input", function () { search(input.value); });
  input.addEventListener("keydown", function (ev) {
    if (ev.key === "Enter") { var a = results.querySelector("a"); if (a) location.href = a.href; }
    if (ev.key === "Escape") { input.value = ""; search(""); }
  });
  document.addEventListener("click", function (ev) {
    if (!ev.target.closest(".search")) results.classList.remove("show");
  });
  document.addEventListener("keydown", function (ev) {
    if (ev.key === "/" && document.activeElement !== input) { ev.preventDefault(); input.focus(); }
  });
})();
