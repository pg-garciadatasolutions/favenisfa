/* Polo FAVENI São Francisco de Assis/RS — formulário de inscrição */
(function () {
  "use strict";
  var CFG = window.SITE || {};
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var form = $("#form-inscricao");
  if (!form) return;

  var etapas = $$(".etapa", form), passos = $$(".ins-passos li"), atual = 0;
  var CHAVE_RASCUNHO = "inscricao-" + location.pathname;
  var NAO_SALVAR = ["aceite", "site_url", "tipo", "nivel"];

  function guardar(chave, valor) { try { localStorage.setItem(chave, valor); } catch (e) { /* sem armazenamento */ } }
  function ler(chave) { try { return localStorage.getItem(chave); } catch (e) { return null; } }
  function apagar(chave) { try { localStorage.removeItem(chave); } catch (e) { /* sem armazenamento */ } }
  function semAcento(t) { return (t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); }
  function digitos(t) { return (t || "").replace(/\D/g, ""); }

  /* ---------- Máscaras ---------- */
  function mascara(valor, modelo) {
    var d = digitos(valor), saida = "", i = 0;
    for (var j = 0; j < modelo.length && i < d.length; j++) saida += modelo[j] === "9" ? d[i++] : modelo[j];
    return saida;
  }
  function mascaraTel(v) {
    var d = digitos(v).slice(0, 11);
    return d.length > 10 ? mascara(d, "(99) 99999-9999") : mascara(d, "(99) 9999-9999");
  }
  $$("[data-cpf]").forEach(function (i) { i.addEventListener("input", function () { i.value = mascara(i.value, "999.999.999-99"); }); });
  $$("[data-data]").forEach(function (i) { i.addEventListener("input", function () { i.value = mascara(i.value, "99/99/9999"); }); });
  $$("[data-cep]").forEach(function (i) { i.addEventListener("input", function () { i.value = mascara(i.value, "99999-999"); }); });
  $$("[data-ano]").forEach(function (i) { i.addEventListener("input", function () { i.value = digitos(i.value).slice(0, 4); }); });
  $$("input[type=tel]", form).forEach(function (i) { i.addEventListener("input", function () { i.value = mascaraTel(i.value); }); });

  /* ---------- Validações ---------- */
  function cpfValido(v) {
    var c = digitos(v);
    if (c.length !== 11 || /^(\d)\1+$/.test(c)) return false;
    for (var t = 9; t < 11; t++) {
      var s = 0;
      for (var i = 0; i < t; i++) s += +c[i] * (t + 1 - i);
      if (((s * 10) % 11) % 10 !== +c[t]) return false;
    }
    return true;
  }
  function lerData(v) {
    var m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(v || "");
    if (!m) return null;
    var d = new Date(+m[3], +m[2] - 1, +m[1]);
    return d.getDate() === +m[1] && d.getMonth() === +m[2] - 1 ? d : null;
  }
  function idade(d) {
    var h = new Date(), a = h.getFullYear() - d.getFullYear();
    if (h < new Date(h.getFullYear(), d.getMonth(), d.getDate())) a--;
    return a;
  }
  function visivel(el) { return el.type === "hidden" || el.offsetParent !== null; }

  function campoValido(el) {
    var v = el.value.trim();
    if (el.type === "checkbox") return !el.required || el.checked;
    if (!v) return !el.required;
    if (el.hasAttribute("data-cpf")) return cpfValido(v);
    if (el.hasAttribute("data-data")) { var d = lerData(v); return !!d && idade(d) >= 12 && idade(d) <= 100; }
    if (el.hasAttribute("data-cep")) return digitos(v).length === 8;
    if (el.hasAttribute("data-ano")) return /^(19[4-9]\d|20\d\d)$/.test(v) && +v <= new Date().getFullYear() + 6;
    if (el.type === "tel") return digitos(v).length >= 10;
    if (el.type === "email") return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    if (el.name === "nome" || el.name === "resp_nome") return v.split(/\s+/).length >= 2;
    return true;
  }

  function validarEtapa(etapa) {
    var primeiro = null;
    $$("input[name], select[name]", etapa).forEach(function (el) {
      if (!visivel(el) || el.classList.contains("pote")) return;
      var ok = campoValido(el), campo = el.closest(".campo");
      if (campo) campo.classList.toggle("invalido", !ok);
      if (el.name === "aceite") $(".erro-aceite").classList.toggle("visivel", !ok);
      if (!ok && !primeiro) primeiro = el;
    });
    if (primeiro) {
      var alvo = primeiro.type === "hidden" ? $("#f-busca") : primeiro;
      alvo.focus();
      alvo.scrollIntoView({ block: "center", behavior: "smooth" });
    }
    return !primeiro;
  }
  form.addEventListener("input", function (ev) {
    var campo = ev.target.closest(".campo");
    if (campo && campo.classList.contains("invalido") && campoValido(ev.target)) campo.classList.remove("invalido");
  });
  form.addEventListener("change", function (ev) {
    var campo = ev.target.closest(".campo");
    if (campo && campo.classList.contains("invalido") && campoValido(ev.target)) campo.classList.remove("invalido");
    if (ev.target.name === "aceite") $(".erro-aceite").classList.remove("visivel");
  });

  /* ---------- Busca de curso ---------- */
  var cursos = [], busca = $("#f-busca"), listaEl = $("#lista-cursos"), escolhido = $(".curso-escolhido");
  var campoCurso = $("[name=curso]", form);
  var infoCurso = document.createElement("input");
  infoCurso.type = "hidden"; infoCurso.name = "curso_info"; form.appendChild(infoCurso);

  function escapar(t) { var d = document.createElement("div"); d.textContent = t; return d.innerHTML; }
  function info(c) { return c.h ? c.h + (c.d ? " · " + c.d : "") : ""; }

  function mostrarLista() {
    var termos = semAcento(busca.value).split(/\s+/).filter(Boolean);
    if (!termos.length) { listaEl.innerHTML = ""; return; }
    var achados = cursos.filter(function (c) { return termos.every(function (t) { return c._b.indexOf(t) >= 0; }); }).slice(0, 40);
    listaEl.innerHTML = achados.length
      ? achados.map(function (c, i) {
          return '<li role="option" data-i="' + cursos.indexOf(c) + '"' + (i === 0 ? ' aria-selected="true"' : "") + ">" +
            escapar(c.t) + (info(c) ? "<small>" + escapar(info(c)) + "</small>" : "") + "</li>";
        }).join("")
      : '<li class="nada">Nenhum curso com esse nome. Tente outra palavra ou chame o polo no WhatsApp.</li>';
  }
  function escolher(c) {
    campoCurso.value = c.t;
    infoCurso.value = info(c);
    escolhido.innerHTML = "<div><strong>" + escapar(c.t) + "</strong>" + (info(c) ? "<small>" + escapar(info(c)) + "</small>" : "") +
      '</div><button type="button">Trocar</button>';
    escolhido.hidden = false;
    busca.hidden = true;
    listaEl.innerHTML = "";
    busca.closest(".campo").classList.remove("invalido");
    salvarRascunho();
  }
  function trocar() {
    campoCurso.value = ""; infoCurso.value = "";
    escolhido.hidden = true; busca.hidden = false; busca.value = ""; busca.focus();
    salvarRascunho();
  }
  escolhido.addEventListener("click", function (ev) { if (ev.target.tagName === "BUTTON") trocar(); });
  busca.addEventListener("input", mostrarLista);
  busca.addEventListener("keydown", function (ev) {
    var itens = $$("li[data-i]", listaEl), sel = itens.findIndex(function (li) { return li.getAttribute("aria-selected") === "true"; });
    if (ev.key === "ArrowDown" || ev.key === "ArrowUp") {
      ev.preventDefault();
      if (!itens.length) return;
      if (sel >= 0) itens[sel].removeAttribute("aria-selected");
      sel = (sel + (ev.key === "ArrowDown" ? 1 : -1) + itens.length) % itens.length;
      itens[sel].setAttribute("aria-selected", "true");
      itens[sel].scrollIntoView({ block: "nearest" });
    } else if (ev.key === "Enter") {
      ev.preventDefault();
      if (sel >= 0) escolher(cursos[+itens[sel].getAttribute("data-i")]);
    }
  });
  listaEl.addEventListener("click", function (ev) {
    var li = ev.target.closest("li[data-i]");
    if (li) escolher(cursos[+li.getAttribute("data-i")]);
  });

  fetch(form.getAttribute("data-cursos")).then(function (r) { return r.json(); }).then(function (dados) {
    cursos = dados.map(function (c) { c._b = semAcento(c.t + " " + (c.an || "")); return c; });
    var pedido = new URLSearchParams(location.search).get("curso");
    var salvo = campoCurso.value;
    var alvo = null;
    if (salvo) alvo = cursos.find(function (c) { return c.t === salvo; });
    if (pedido) {
      var p = semAcento(pedido).replace(/-/g, " ").trim();
      alvo = cursos.find(function (c) { return c.s === pedido || semAcento(c.t) === p; }) || alvo;
      if (!alvo) { busca.value = pedido.replace(/-/g, " "); mostrarLista(); }
    }
    if (alvo) escolher(alvo);
    else if (salvo) { campoCurso.value = ""; }
  }).catch(function () {
    listaEl.innerHTML = '<li class="nada">Não conseguimos carregar a lista de cursos. Recarregue a página.</li>';
  });

  /* ---------- Campos condicionais ---------- */
  var necessidade = $("[name=necessidade_especial]", form), blocoQual = $(".se-necessidade");
  function atualizarNecessidade() { blocoQual.classList.toggle("visivel", necessidade.value === "Sim"); }
  necessidade.addEventListener("change", atualizarNecessidade);

  var blocoResp = $(".bloco-responsavel");
  function atualizarResponsavel() {
    var d = lerData($("[name=nascimento]", form).value);
    blocoResp.hidden = !(d && idade(d) < 18);
  }

  /* ---------- Parcelas: boleto até 20x, cartão até 12x sem juros ---------- */
  var forma = $("[name=forma_pagamento]", form), parcelas = $("[name=parcelas]", form);
  function atualizarParcelas() {
    var max = forma.value === "Boleto" ? 20 : forma.value === "Cartão de crédito" ? 12 : 0;
    var atual = parcelas.value, html = "";
    if (!max) html = '<option value="">Escolha antes a forma de pagamento</option>';
    else {
      html = '<option value="">Selecione…</option>';
      for (var n = 1; n <= max; n++) {
        var texto = n === 1 ? "1x (à vista)" : n + "x" + (max === 12 ? " sem juros" : "");
        html += '<option value="' + texto + '">' + texto + "</option>";
      }
    }
    parcelas.innerHTML = html;
    if ($('option[value="' + atual + '"]', parcelas)) parcelas.value = atual;
  }
  forma.addEventListener("change", atualizarParcelas);

  /* ---------- CEP ---------- */
  var cep = $("[name=cep]", form);
  cep.addEventListener("input", function () {
    var c = digitos(cep.value);
    if (c.length !== 8) return;
    fetch("https://viacep.com.br/ws/" + c + "/json/").then(function (r) { return r.json(); }).then(function (d) {
      if (d.erro) { cep.closest(".campo").classList.add("invalido"); return; }
      [["endereco", d.logradouro], ["bairro", d.bairro], ["cidade", d.localidade], ["uf", d.uf]].forEach(function (par) {
        var el = $("[name=" + par[0] + "]", form);
        if (par[1]) { el.value = par[1]; var cp = el.closest(".campo"); cp && cp.classList.remove("invalido"); }
      });
      $("[name=numero]", form).focus();
      salvarRascunho();
    }).catch(function () { /* sem internet: preenche à mão */ });
  });

  /* ---------- Rascunho ---------- */
  function dadosDoForm() {
    var d = {};
    $$("input[name], select[name]", form).forEach(function (el) {
      if (el.type === "checkbox") d[el.name] = el.checked ? el.value : "";
      else d[el.name] = el.value.trim();
    });
    return d;
  }
  function salvarRascunho() {
    var d = dadosDoForm();
    NAO_SALVAR.forEach(function (k) { delete d[k]; });
    guardar(CHAVE_RASCUNHO, JSON.stringify(d));
  }
  (function restaurar() {
    var bruto = ler(CHAVE_RASCUNHO);
    if (!bruto) return;
    try {
      var d = JSON.parse(bruto);
      Object.keys(d).forEach(function (k) {
        var el = $("[name=" + k + "]", form);
        if (el === parcelas) atualizarParcelas(); // as opções dependem da forma de pagamento
        if (el && d[k] && el.type !== "checkbox") el.value = d[k];
      });
    } catch (e) { apagar(CHAVE_RASCUNHO); }
  })();
  atualizarNecessidade();
  form.addEventListener("change", salvarRascunho);
  window.addEventListener("pagehide", function () { if (!form.hidden) salvarRascunho(); });
  form.addEventListener("input", function () { clearTimeout(form._t); form._t = setTimeout(salvarRascunho, 400); });

  /* ---------- Resumo ---------- */
  var GRUPOS = [
    ["Curso", ["curso", "curso_info", "formacao_nivel", "formacao_curso", "formacao_concluido", "formacao_ano", "formacao_instituicao"]],
    ["Dados pessoais", ["nome", "cpf", "rg", "nascimento", "sexo", "estado_civil", "etnia", "nacionalidade", "cidade_nascimento",
      "uf_nascimento", "nome_mae", "nome_pai", "necessidade_especial", "necessidade_qual"]],
    ["Contato e endereço", ["celular", "email", "cep", "endereco", "numero", "complemento", "bairro", "cidade", "uf"]],
    ["Responsável", ["resp_nome", "resp_cpf", "resp_parentesco", "resp_celular"]]
  ];
  var ROTULOS = { curso: "Curso", curso_info: "Detalhes", formacao_nivel: "Formação", formacao_curso: "Curso anterior" };
  function rotulo(nome) {
    if (ROTULOS[nome]) return ROTULOS[nome];
    var l = $('label[for="f-' + nome + '"]');
    return l ? l.childNodes[0].textContent.trim() : nome;
  }
  function montarResumo() {
    var d = dadosDoForm(), html = "";
    GRUPOS.forEach(function (g) {
      var linhas = g[1].filter(function (k) {
        var el = $("[name=" + k + "]", form);
        var oculto = el && (el.closest(".se-necessidade:not(.visivel)") || el.closest(".bloco-responsavel[hidden]"));
        return d[k] && el && !oculto && !(k === "formacao_curso" && d[k] === "Ensino Médio");
      }).map(function (k) { return "<dt>" + escapar(rotulo(k)) + "</dt><dd>" + escapar(d[k]) + "</dd>"; });
      if (linhas.length) html += "<h4>" + g[0] + "</h4><dl>" + linhas.join("") + "</dl>";
    });
    $(".resumo").innerHTML = html;
  }

  /* ---------- Navegação ---------- */
  var btVoltar = $("[data-voltar]"), btAvancar = $("[data-avancar]"), btEnviar = $("[data-enviar]");
  function irPara(n) {
    etapas[atual].classList.remove("ativa");
    atual = n;
    etapas[atual].classList.add("ativa");
    passos.forEach(function (p, i) { p.classList.toggle("ativo", i === atual); p.classList.toggle("feito", i < atual); });
    btVoltar.hidden = atual === 0;
    btAvancar.hidden = atual === etapas.length - 1;
    btEnviar.hidden = atual !== etapas.length - 1;
    if (atual === 2) atualizarResponsavel();
    if (atual === etapas.length - 1) montarResumo();
    $(".ins-passos").scrollIntoView({ behavior: "smooth" });
  }
  btAvancar.addEventListener("click", function () { if (validarEtapa(etapas[atual])) irPara(atual + 1); });
  btVoltar.addEventListener("click", function () { irPara(atual - 1); });

  /* ---------- Envio ---------- */
  function mensagemWhats(d, completa) {
    var l = ["Olá! Acabei de preencher a inscrição pelo formulário do polo.", "",
      "*" + form.getAttribute("data-titulo") + ":* " + d.curso, "*Nome:* " + d.nome];
    if (!completa) return l.join("\n");
    GRUPOS.slice(1).forEach(function (g) {
      g[1].forEach(function (k) { if (d[k]) l.push(rotulo(k) + ": " + d[k]); });
    });
    ["formacao_curso", "formacao_concluido", "formacao_ano", "formacao_instituicao", "forma_pagamento", "parcelas", "cupom", "indicado_por"]
      .forEach(function (k) { if (d[k]) l.push(rotulo(k) + ": " + d[k]); });
    return l.join("\n");
  }

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    if (!validarEtapa(etapas[atual])) return;
    var d = dadosDoForm();
    if (d.site_url) return; // robô preencheu o campo escondido
    delete d.site_url;
    if (blocoResp.hidden) ["resp_nome", "resp_cpf", "resp_parentesco", "resp_celular"].forEach(function (k) { d[k] = ""; });
    if (necessidade.value !== "Sim") d.necessidade_qual = "";
    d.pagina = location.pathname + location.search;

    btEnviar.disabled = true;
    btEnviar.textContent = "Enviando…";
    var envio = CFG.webhook
      ? fetch(CFG.webhook, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain" }, body: JSON.stringify(d) })
      : Promise.resolve();
    envio.then(function () {
      apagar(CHAVE_RASCUNHO);
      form.hidden = true;
      $(".ins-passos").hidden = true;
      $(".ins-ok").hidden = false;
      // sem planilha configurada, os dados completos vão na mensagem do WhatsApp
      $("[data-wa-final]").href = "https://wa.me/" + CFG.whats + "?text=" + encodeURIComponent(mensagemWhats(d, !CFG.webhook));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }).catch(function () {
      btEnviar.disabled = false;
      btEnviar.textContent = "Enviar inscrição";
      alert("Não conseguimos enviar agora. Verifique sua internet e tente de novo.");
    });
  });
})();
