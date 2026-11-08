(function () {
  "use strict";

  // ---------- Menu mobile ----------
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.getElementById("menu");

  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
  });

  nav.addEventListener("click", (e) => {
    if (e.target.closest("a")) {
      nav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });

  // ---------- Cursos -> select do formulário ----------
  const select = document.getElementById("curso");
  const courses = document.querySelectorAll(".course[data-course]");

  courses.forEach((card) => {
    const name = card.dataset.course;
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    select.appendChild(opt);

    card.querySelector(".js-choose").addEventListener("click", () => {
      select.value = name;
      clearError(select);
      document.getElementById("matricula").scrollIntoView({ behavior: "smooth" });
      setTimeout(() => document.getElementById("nome").focus({ preventScroll: true }), 400);
    });
  });

  // ---------- Formulário de matrícula ----------
  const form = document.getElementById("enroll-form");
  const submitBtn = document.getElementById("enroll-submit");
  const success = document.getElementById("enroll-success");

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const PHONE_RE = /^\(?\d{2}\)?\s?9?\d{4}-?\d{4}$/;

  function setError(input, msg) {
    input.setAttribute("aria-invalid", "true");
    document.getElementById(input.id + "-erro").textContent = msg;
  }

  function clearError(input) {
    input.removeAttribute("aria-invalid");
    const el = document.getElementById(input.id + "-erro");
    if (el) el.textContent = "";
  }

  function validate() {
    let firstInvalid = null;
    const mark = (input, msg) => {
      setError(input, msg);
      if (!firstInvalid) firstInvalid = input;
    };

    const nome = form.nome;
    const email = form.email;
    const tel = form.telefone;
    const aceite = form.aceite;

    [nome, email, tel, select, aceite].forEach(clearError);

    if (nome.value.trim().length < 3) mark(nome, "Informe seu nome completo.");
    if (!EMAIL_RE.test(email.value.trim())) mark(email, "Informe um e-mail válido.");
    if (tel.value.trim() && !PHONE_RE.test(tel.value.trim())) mark(tel, "Use o formato (11) 91234-5678.");
    if (!select.value) mark(select, "Escolha um curso.");
    if (!aceite.checked) mark(aceite, "É necessário aceitar os termos.");

    if (firstInvalid) firstInvalid.focus();
    return !firstInvalid;
  }

  form.addEventListener("input", (e) => {
    if (e.target.getAttribute("aria-invalid") === "true") clearError(e.target);
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!validate()) return;

    submitBtn.disabled = true;
    submitBtn.textContent = "Enviando…";

    // Site estático: não há backend. A confirmação é gerada no navegador.
    // Para persistir as matrículas, integre aqui uma API (ex.: API Gateway + Lambda + DynamoDB).
    setTimeout(() => {
      const firstName = form.nome.value.trim().split(/\s+/)[0];
      const protocol = "ET-" + new Date().getFullYear() + "-" +
        Math.random().toString(36).slice(2, 8).toUpperCase();

      document.getElementById("success-text").textContent =
        `${firstName}, recebemos sua matrícula em ${select.value} (turno: ${form.turno.value}). ` +
        `Enviaremos os próximos passos para ${form.email.value.trim()}.`;
      document.getElementById("protocol").textContent = protocol;

      form.hidden = true;
      success.hidden = false;
      success.focus();
    }, 700);
  });

  document.getElementById("enroll-reset").addEventListener("click", () => {
    form.reset();
    submitBtn.disabled = false;
    submitBtn.textContent = "Confirmar matrícula";
    success.hidden = true;
    form.hidden = false;
    form.nome.focus();
  });

  // ---------- Informações da instância EC2 (gerado pelo user data) ----------
  const srv = {
    dot: document.getElementById("server-dot"),
    instance: document.getElementById("srv-instance"),
    az: document.getElementById("srv-az"),
    ip: document.getElementById("srv-ip"),
  };

  async function loadInstanceInfo() {
    try {
      const res = await fetch("instance.json?t=" + Date.now(), { cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      srv.instance.textContent = data.instanceId || "?";
      srv.az.textContent = data.availabilityZone || "?";
      srv.ip.textContent = data.privateIp || "?";
      srv.dot.className = "dot on";
    } catch (err) {
      srv.instance.textContent = "ambiente local";
      srv.az.textContent = "-";
      srv.ip.textContent = "-";
      srv.dot.className = "dot off";
    }
  }

  document.getElementById("srv-refresh").addEventListener("click", loadInstanceInfo);
  loadInstanceInfo();

  document.getElementById("year").textContent = new Date().getFullYear();
})();
