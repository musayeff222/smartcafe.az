(function () {
  "use strict";

  var API_BASE =
    window.SMARTCAFE_API_BASE ||
    document.body.getAttribute("data-api-base") ||
    "https://api.smartcafe.az/api";

  function esc(s) {
    if (s == null) return "";
    var d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function render(data) {
    var c = data.content || {};
    var plans = data.plans || [];
    var promos = data.promos || [];
    var root = document.getElementById("sc-root");
    if (!root) return;

    var loginUrl = c.login_url || "https://login.smartcafe.az/";
    var mail = c.contact_email || "info@smartcafe.az";

    var promoHtml = promos
      .map(function (p) {
        var d =
          p.discount_type === "percent"
            ? esc(String(p.discount_value)) + "%"
            : esc(String(p.discount_value)) + " AZN";
        return (
          '<span class="sc-promo-pill" title="' +
          esc(p.description || "") +
          '">' +
          esc(p.title || p.code) +
          " · " +
          d +
          "</span>"
        );
      })
      .join("");

    var plansHtml = plans
      .map(function (p) {
        var feats = (p.features || [])
          .map(function (f) {
            return "<li>" + esc(f) + "</li>";
          })
          .join("");
        var featCls = p.is_featured ? "sc-plan sc-plan--feat" : "sc-plan";
        var badge = p.is_featured
          ? '<div class="sc-plan__badge">Seçilmiş</div>'
          : "";
        return (
          '<article class="' +
          featCls +
          '">' +
          badge +
          '<div class="sc-plan__head"><h3 class="sc-plan__name">' +
          esc(p.name) +
          '</h3><span class="sc-plan__tag">' +
          esc(p.tag || "") +
          "</span></div>" +
          '<p class="sc-plan__pitch">' +
          esc(p.pitch || "") +
          "</p>" +
          '<p class="sc-plan__price">' +
          esc(p.price_label || "") +
          "</p>" +
          "<ul>" +
          feats +
          "</ul>" +
          '<a class="sc-btn sc-btn--ghost" style="width:100%;margin-top:.75rem" href="' +
          esc(loginUrl) +
          '">Panelə keç</a></article>'
        );
      })
      .join("");

    var faq = (c.faq || [])
      .map(function (item) {
        return (
          "<dt>" + esc(item.q) + "</dt><dd>" + esc(item.a) + "</dd>"
        );
      })
      .join("");

    root.innerHTML =
      '<header class="sc-top">' +
      '<div class="sc-wrap sc-top__inner">' +
      '<a class="sc-logo" href="#">Smart<span>Cafe</span></a>' +
      '<nav class="sc-nav">' +
      '<a href="#proqram">Proqram</a>' +
      '<a href="#planlar">Planlar</a>' +
      '<a href="#qiymet">Qiymət</a>' +
      '<a href="#suallar">Suallar</a>' +
      "</nav>" +
      '<a class="sc-btn sc-btn--pri" href="' +
      esc(loginUrl) +
      '">Sistemə giriş</a>' +
      "</div></header>" +
      "<main>" +
      '<section class="sc-hero"><div class="sc-wrap sc-hero__grid">' +
      "<div>" +
      '<p class="sc-eyebrow">' +
      esc(c.eyebrow || "") +
      "</p>" +
      '<h1 class="sc-h1">' +
      esc(c.hero_title || "") +
      "</h1>" +
      '<p class="sc-lead">' +
      esc(c.hero_lead || "") +
      "</p>" +
      '<div class="sc-hero__cta">' +
      '<a class="sc-btn sc-btn--pri" href="' +
      esc(loginUrl) +
      '">İdarə paneli</a>' +
      '<a class="sc-btn sc-btn--ghost" href="#planlar">Planlar</a>' +
      "</div>" +
      (promoHtml
        ? '<div class="sc-promo-strip">' + promoHtml + "</div>"
        : "") +
      "</div>" +
      '<div class="sc-glass"><p style="margin:0 0 .75rem;font-size:.75rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#7dd3fc">Üstünlüklər</p><ul style="margin:0;padding-left:1rem;color:#94a3b8;font-size:.9rem"><li>Bulud əsaslı</li><li>POS və masa</li><li>Anbar və hesabat</li><li>Rol və PIN təhlükəsizliyi</li></ul></div>' +
      "</div></section>" +
      '<section id="proqram" class="sc-section"><div class="sc-wrap">' +
      '<h2 class="sc-h2">Proqram haqqında</h2>' +
      '<p class="sc-section-lead">SmartCafe restoran və kafelər üçün inteqrasiya olunmuş həlldir. Məzmun və planlar admin paneldən yenilənir.</p>' +
      "</div></section>" +
      '<section id="planlar" class="sc-section"><div class="sc-wrap">' +
      '<h2 class="sc-h2">Abunəlik planları</h2>' +
      '<p class="sc-section-lead">Aşağıdakı paketlər cari təklifdir; dəqiq şərtlər müqavilə ilə təsdiqlənir.</p>' +
      '<div class="sc-plans">' +
      plansHtml +
      "</div>" +
      "</div></section>" +
      '<section id="qiymet" class="sc-section"><div class="sc-wrap">' +
      '<h2 class="sc-h2">Qiymətləndirmə</h2>' +
      '<p class="sc-section-lead">' +
      esc(c.pricing_intro || "") +
      "</p>" +
      '<div class="sc-table-wrap"><table class="sc-table"><thead><tr><th>Amil</th><th>Təsir</th></tr></thead><tbody>' +
      "<tr><td>Restoran sayı</td><td>Hər obyekt üçün lisenziya və ya paket artımı.</td></tr>" +
      "<tr><td>İstifadəçi sayı</td><td>Ofisiant, kassa, anbar üçün oturum paketləri.</td></tr>" +
      "<tr><td>Modullar</td><td>Anbar, geniş hesabat, korporativ idarəetmə.</td></tr>" +
      "<tr><td>Dəstək</td><td>Standart və ya SLA (korporativ).</td></tr>" +
      "</tbody></table></div>" +
      "</div></section>" +
      '<section id="suallar" class="sc-section"><div class="sc-wrap">' +
      '<h2 class="sc-h2">Suallar</h2>' +
      '<dl class="sc-faq">' +
      faq +
      "</dl>" +
      "</div></section>" +
      '<section class="sc-section"><div class="sc-wrap sc-cta">' +
      "<div><h2 class=\"sc-h2\" style=\"margin-bottom:.5rem\">Əlaqə</h2>" +
      '<p class="sc-section-lead" style="margin:0">Panel və ya təklif üçün:</p></div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:.65rem">' +
      '<a class="sc-btn sc-btn--pri" href="' +
      esc(loginUrl) +
      '">login.smartcafe.az</a>' +
      '<a class="sc-btn sc-btn--ghost" href="mailto:' +
      esc(mail) +
      '">' +
      esc(mail) +
      "</a></div></div></section>" +
      "</main>" +
      '<footer class="sc-footer"><div class="sc-wrap sc-footer__inner">' +
      "<span>© SmartCafe</span>" +
      '<a href="' +
      esc(loginUrl) +
      '">Sistemə giriş</a>' +
      "</div></footer>";
  }

  function renderError(msg) {
    var root = document.getElementById("sc-root");
    if (!root) return;
    root.innerHTML =
      '<div class="sc-err">' +
      esc(msg) +
      "<br/><small>API: " +
      esc(API_BASE + "/marketing-page") +
      "</small></div>";
  }

  function skeleton() {
    var root = document.getElementById("sc-root");
    if (!root) return;
    root.innerHTML =
      '<div class="sc-wrap" style="padding:3rem 0"><div class="sc-skel" style="width:40%"></div><div class="sc-skel" style="width:80%;height:2.5rem"></div><div class="sc-skel" style="width:90%"></div><div class="sc-skel" style="width:70%"></div></div>';
  }

  skeleton();
  fetch(API_BASE.replace(/\/+$/, "") + "/marketing-page", {
    method: "GET",
    headers: { Accept: "application/json" },
  })
    .then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    })
    .then(render)
    .catch(function (e) {
      renderError(
        "Səhifə məlumatı yüklənmədi. API ünvanını yoxlayın və ya bir az sonra yenidən cəhd edin."
      );
      console.error(e);
    });
})();
