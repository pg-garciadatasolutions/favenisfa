/* Polo FAVENI São Francisco de Assis/RS — comportamento do site */
(function () {
  "use strict";
  var CFG = window.SITE || {};
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  function guardar(tipo, chave, valor) {
    try { window[tipo].setItem(chave, valor); } catch (e) { /* armazenamento indisponível */ }
  }
  function ler(tipo, chave) {
    try { return window[tipo].getItem(chave); } catch (e) { return null; }
  }

  function linkWhats(texto) {
    return "https://wa.me/" + CFG.whats + "?text=" + encodeURIComponent(texto);
  }
  function abrirWhats(texto) {
    var url = linkWhats(texto);
    var mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (mobile) { window.location.href = url; return; }
    var w = window.open(url, "_blank", "noopener");
    if (!w) window.location.href = url;
  }

  /* ---------- Menu ---------- */
  var menu = $(".menu"), veu = $(".veu");
  function fecharMenu() {
    if (!menu) return;
    menu.classList.remove("aberto"); veu && veu.classList.remove("ativo");
    document.body.style.overflow = "";
  }
  $$("[data-abrir-menu]").forEach(function (b) {
    b.addEventListener("click", function () {
      menu.classList.add("aberto"); veu && veu.classList.add("ativo");
      document.body.style.overflow = "hidden";
    });
  });
  $$("[data-fechar-menu]").forEach(function (b) { b.addEventListener("click", fecharMenu); });
  veu && veu.addEventListener("click", function () { fecharMenu(); fecharModais(); });
  $$(".menu [data-sub]").forEach(function (b) {
    b.addEventListener("click", function (e) {
      e.preventDefault();
      var li = b.parentElement, estava = li.classList.contains("aberto");
      $$(".menu li.aberto").forEach(function (x) { x.classList.remove("aberto"); });
      if (!estava) li.classList.add("aberto");
      b.setAttribute("aria-expanded", String(!estava));
    });
  });
  document.addEventListener("click", function (e) {
    if (window.innerWidth > 1240 && !e.target.closest(".menu")) {
      $$(".menu li.aberto").forEach(function (x) { x.classList.remove("aberto"); });
    }
  });

  /* ---------- Modais ---------- */
  function abrirModal(id) {
    var m = document.getElementById(id);
    if (!m) return;
    m.classList.add("ativo");
    m.setAttribute("aria-hidden", "false");
    var foco = m.querySelector("input, select, button.btn");
    setTimeout(function () { foco && foco.focus({ preventScroll: true }); }, 60);
  }
  function fecharModais() {
    $$(".modal.ativo").forEach(function (m) { m.classList.remove("ativo"); m.setAttribute("aria-hidden", "true"); });
  }
  $$(".modal").forEach(function (m) {
    m.addEventListener("click", function (e) { if (e.target === m) fecharModais(); });
  });
  $$("[data-fechar-modal]").forEach(function (b) { b.addEventListener("click", fecharModais); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { fecharModais(); fecharMenu(); }
  });

  // Botões "Quero me inscrever" abrem o formulário já com o curso
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-inscrever]");
    if (!b) return;
    e.preventDefault();
    var form = $("#modal-inscricao form");
    if (form) {
      form.classList.remove("enviado");
      form.reset();
      var c = form.querySelector("[name=curso]");
      if (c) c.value = b.getAttribute("data-inscrever") || "";
      var t = $("#modal-inscricao .titulo-curso");
      if (t) t.textContent = b.getAttribute("data-inscrever") || "seu curso";
    }
    abrirModal("modal-inscricao");
  });

  /* ---------- Formulários de captação ---------- */
  function mascaraTelefone(v) {
    v = v.replace(/\D/g, "").slice(0, 11);
    if (v.length > 10) return v.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
    if (v.length > 6) return v.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
    if (v.length > 2) return v.replace(/(\d{2})(\d{0,5})/, "($1) $2");
    return v;
  }
  $$("input[type=tel]").forEach(function (i) {
    i.addEventListener("input", function () { i.value = mascaraTelefone(i.value); });
  });

  function validar(form) {
    var ok = true;
    $$("[required]", form).forEach(function (el) {
      var campo = el.closest(".campo"), valido = !!el.value.trim();
      if (el.type === "tel") valido = el.value.replace(/\D/g, "").length >= 10;
      if (el.type === "email" && el.value) valido = /.+@.+\..+/.test(el.value);
      campo && campo.classList.toggle("invalido", !valido);
      if (!valido) ok = false;
    });
    return ok;
  }

  $$("form[data-lead]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!validar(form)) { var inv = $(".invalido input, .invalido select", form); inv && inv.focus(); return; }
      var d = {};
      $$("input, select, textarea", form).forEach(function (el) { if (el.name) d[el.name] = el.value.trim(); });
      d.origem = form.getAttribute("data-lead");
      d.pagina = location.pathname;

      var linhas = ["Olá! Vim pelo site do Polo FAVENI São Francisco de Assis."];
      if (d.nome) linhas.push("Meu nome é " + d.nome + ".");
      if (d.curso) linhas.push("Tenho interesse no curso: " + d.curso + ".");
      else if (d.interesse) linhas.push("Tenho interesse em: " + d.interesse + ".");
      if (d.mensagem) linhas.push(d.mensagem);
      if (d.email) linhas.push("E-mail: " + d.email);
      if (d.telefone) linhas.push("Meu WhatsApp: " + d.telefone);

      // Registro opcional do lead (planilha/CRM), se configurado
      if (CFG.webhook) {
        try {
          fetch(CFG.webhook, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain" }, body: JSON.stringify(d), keepalive: true });
        } catch (err) { /* segue para o WhatsApp mesmo assim */ }
      }
      form.classList.add("enviado");
      guardar("localStorage", "lead-enviado", "1");
      abrirWhats(linhas.join("\n"));
    });
  });

  /* ---------- WhatsApp flutuante ---------- */
  var balao = $(".wa-balao");
  $$("[data-wa-toggle]").forEach(function (b) {
    b.addEventListener("click", function () { balao && balao.classList.toggle("ativo"); guardar("sessionStorage", "wa-visto", "1"); });
  });
  $$("[data-wa-fechar]").forEach(function (b) {
    b.addEventListener("click", function () { balao.classList.remove("ativo"); guardar("sessionStorage", "wa-visto", "1"); });
  });
  if (balao && !ler("sessionStorage", "wa-visto") && window.innerWidth > 640) {
    setTimeout(function () { if (!$(".modal.ativo")) balao.classList.add("ativo"); }, 6000);
  }
  $$("[data-whats]").forEach(function (a) {
    a.setAttribute("href", linkWhats(a.getAttribute("data-whats") || "Olá! Vim pelo site e gostaria de mais informações."));
    a.setAttribute("target", "_blank"); a.setAttribute("rel", "noopener");
  });

  /* ---------- Pop-up de oferta ---------- */
  var promo = document.getElementById("modal-promo");
  if (promo && !ler("sessionStorage", "promo-visto") && !ler("localStorage", "lead-enviado")) {
    var mostrou = false;
    var mostrar = function () {
      if (mostrou || $(".modal.ativo") || (menu && menu.classList.contains("aberto"))) return;
      mostrou = true; guardar("sessionStorage", "promo-visto", "1");
      balao && balao.classList.remove("ativo");
      abrirModal("modal-promo");
    };
    setTimeout(mostrar, 18000);
    document.addEventListener("mouseout", function (e) { if (!e.relatedTarget && e.clientY < 10) mostrar(); });
  }

  /* ---------- Cookies (LGPD) ---------- */
  var ck = $(".cookies");
  if (ck && !ler("localStorage", "cookies-ok")) setTimeout(function () { ck.classList.add("ativo"); }, 1200);
  $$("[data-cookies]").forEach(function (b) {
    b.addEventListener("click", function () { guardar("localStorage", "cookies-ok", b.getAttribute("data-cookies")); ck.classList.remove("ativo"); });
  });

  /* ---------- Trilhos (carrossel) ---------- */
  $$("[data-trilho]").forEach(function (nav) {
    var alvo = document.getElementById(nav.getAttribute("data-trilho"));
    $$("button", nav).forEach(function (b) {
      b.addEventListener("click", function () {
        var passo = alvo.clientWidth * 0.85 * (b.hasAttribute("data-volta") ? -1 : 1);
        alvo.scrollBy({ left: passo, behavior: "smooth" });
      });
    });
  });

  /* ---------- Abas (graduação) ---------- */
  $$("[data-aba]").forEach(function (b) {
    b.addEventListener("click", function () {
      var grupo = b.closest("[data-abas]");
      $$("[data-aba]", grupo).forEach(function (x) { x.classList.toggle("ativo", x === b); });
      $$(".aba-painel", grupo).forEach(function (p) { p.classList.toggle("ativo", p.id === b.getAttribute("data-aba")); });
      history.replaceState(null, "", "#" + b.getAttribute("data-aba"));
    });
  });
  if (location.hash) {
    var aba = $('[data-aba="' + location.hash.slice(1) + '"]');
    aba && aba.click();
  }

  /* ---------- Catálogos com busca ---------- */
  function normalizar(s) {
    return (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; });
  }
  var ICO_WA = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>';
  var ICO_REL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';

  function iniciarCatalogo(el) {
    var tipo = el.getAttribute("data-catalogo");
    var lista = $(".lista", el), info = $(".resultado-info", el), busca = $(".busca input", el);
    var maisBtn = $(".mais-wrap button", el), chips = $$(".chip", el);
    var params = new URLSearchParams(location.search);
    var estado = { area: params.get("area") || el.getAttribute("data-area-padrao") || "", q: params.get("q") || "", limite: 24 };
    var dados = [];
    if (busca) busca.value = estado.q;

    function card(c) {
      if (tipo === "pos") {
        var preco = c.p ? '<div class="rodape-card"><span>até <b style="font:800 1.05rem var(--fonte-titulo);color:var(--verde)">' + c.x + 'x R$ ' + c.p + '</b></span></div>' : "";
        return '<article class="card-curso"><div class="area">' + esc(c.an) + '</div><h3><a href="/pos-graduacao/' + c.s + '/">' + esc(c.t) + '</a></h3>' +
          '<div class="tags"><span class="tag verde">' + ICO_REL + esc(c.h) + '</span><span class="tag">' + esc(c.d) + '</span>' + (c.top ? '<span class="tag ouro">Mais procurado</span>' : "") + '</div>' + preco + '</article>';
      }
      var msg = "Olá! Vim pelo site e tenho interesse na capacitação: " + c.t + " (" + c.h + ").";
      return '<article class="card-curso"><div class="area">Capacitação EAD</div><h3 style="margin-bottom:12px">' + esc(c.t) + '</h3>' +
        '<div class="tags"><span class="tag verde">' + ICO_REL + esc(c.h) + '</span><span class="tag">Certificado digital</span></div>' +
        '<div class="rodape-card"><span>Matrícula pelo polo</span><a class="wa" target="_blank" rel="noopener" href="' + esc(linkWhats(msg)) + '">' + ICO_WA + 'Quero</a></div></article>';
    }

    function render() {
      var q = normalizar(estado.q);
      var termos = q.split(/\s+/).filter(Boolean);
      var filtrados = dados.filter(function (c) {
        if (estado.area === "top" && !c.top) return false;
        if (estado.area && estado.area !== "top" && c.a.indexOf(estado.area) === -1 && c.h !== estado.area) return false;
        if (!termos.length) return true;
        var alvo = c._n || (c._n = normalizar(c.t + " " + (c.k || "")));
        return termos.every(function (t) { return alvo.indexOf(t) !== -1; });
      });
      chips.forEach(function (ch) { ch.classList.toggle("ativo", ch.getAttribute("data-valor") === estado.area); });
      var total = filtrados.length;
      info.textContent = total === 0 ? "" : total + (total === 1 ? " curso encontrado" : " cursos encontrados");
      if (!total) {
        lista.innerHTML = '<div class="vazio" style="grid-column:1/-1"><h3>Não encontramos esse curso na lista</h3><p>Fale com a gente: a FAVENI tem cursos novos toda semana e podemos verificar para você.</p><a class="btn btn-wa" target="_blank" rel="noopener" href="' +
          esc(linkWhats("Olá! Procurei no site um curso de \"" + estado.q + "\" e não encontrei. Vocês têm?")) + '">' + ICO_WA + ' Perguntar no WhatsApp</a></div>';
      } else {
        lista.innerHTML = filtrados.slice(0, estado.limite).map(card).join("");
      }
      if (maisBtn) maisBtn.parentElement.style.display = total > estado.limite ? "" : "none";
      var p = new URLSearchParams();
      if (estado.area) p.set("area", estado.area);
      if (estado.q) p.set("q", estado.q);
      history.replaceState(null, "", location.pathname + (p.toString() ? "?" + p : ""));
    }

    var t;
    busca && busca.addEventListener("input", function () {
      clearTimeout(t);
      t = setTimeout(function () { estado.q = busca.value; estado.limite = 24; render(); }, 160);
    });
    chips.forEach(function (ch) {
      ch.addEventListener("click", function () { estado.area = ch.getAttribute("data-valor"); estado.limite = 24; render(); });
    });
    maisBtn && maisBtn.addEventListener("click", function () { estado.limite += 36; render(); });

    lista.innerHTML = '<p class="resultado-info">Carregando cursos…</p>';
    fetch(el.getAttribute("data-fonte")).then(function (r) { return r.json(); }).then(function (j) { dados = j; render(); })
      .catch(function () { lista.innerHTML = '<div class="vazio">Não foi possível carregar a lista agora. <a data-whats href="#">Fale conosco no WhatsApp</a>.</div>'; });
  }
  $$("[data-catalogo]").forEach(iniciarCatalogo);
})();
