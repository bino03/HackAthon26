// ── DADOS ─────────────────────────────────────────────────────────────────────

const NOTIFICACOES = [
  {
    id: 1, lida: false, tipo: "critico",
    icon: "💜", modulo: "GoldCare",
    titulo: "Avó Maria — consumo muito baixo",
    desc: "Consumo 87% abaixo do normal desde as 07h00. Verifica se está bem.",
    hora: "Há 23 min",
    acao: { label: "Ver GoldCare", href: "goldcare.html" }
  },
  {
    id: 2, lida: false, tipo: "aviso",
    icon: "💜", modulo: "GoldCare",
    titulo: "Tia Rosa — aquecedor desligado",
    desc: "Temperatura da casa em 18°C com aquecedor desligado.",
    hora: "Há 2 horas",
    acao: { label: "Ver GoldCare", href: "goldcare.html" }
  },
  {
    id: 3, lida: false, tipo: "info",
    icon: "☀️", modulo: "SolarMatch",
    titulo: "Simulação guardada",
    desc: "O teu resultado SolarMatch foi guardado. Payback estimado em 7.2 anos.",
    hora: "Hoje, 14:30",
    acao: { label: "Ver resultado", href: "solar-match.html" }
  },
  {
    id: 4, lida: true, tipo: "info",
    icon: "🧾", modulo: "Faturas",
    titulo: "Fatura de Janeiro disponível",
    desc: "A tua fatura de 41,20€ está disponível para consulta.",
    hora: "Ontem, 09:00",
    acao: { label: "Ver fatura", href: "faturas.html" }
  },
  {
    id: 5, lida: true, tipo: "sucesso",
    icon: "🌿", modulo: "Green Score",
    titulo: "Green Score subiu para 73!",
    desc: "Parabéns! Subiste 4 pontos este mês. Estás acima de 68% dos utilizadores.",
    hora: "Ontem, 08:15",
    acao: { label: "Ver score", href: "green-score.html" }
  },
  {
    id: 6, lida: true, tipo: "dica",
    icon: "💡", modulo: "Dica",
    titulo: "Poupa até 30% nas horas de ponta",
    desc: "Usa eletrodomésticos entre as 22h e as 8h para reduzir custos.",
    hora: "Há 2 dias",
    acao: null
  },
];

// ── ESTADO ────────────────────────────────────────────────────────────────────

let painelAberto = false;

// ── HELPERS ───────────────────────────────────────────────────────────────────

function corTipo(tipo) {
  return {
    critico: "#f87171",
    aviso:   "#f59e0b",
    info:    "#60a5fa",
    sucesso: "#2DDBA4",
    dica:    "#a855f7",
  }[tipo] || "#7a8fa6";
}

function naoLidas() {
  return NOTIFICACOES.filter(n => !n.lida).length;
}

function atualizarBadge() {
  const count = naoLidas();
  const dot   = document.getElementById("notif-dot");
  const badge = document.getElementById("notif-badge");

  if (dot)   dot.style.display   = count > 0 ? "block" : "none";
  if (badge) badge.textContent   = count > 0 ? count : "";
  if (badge) badge.style.display = count > 0 ? "flex" : "none";
}

// ── RENDER PAINEL ─────────────────────────────────────────────────────────────

function renderPainel() {
  const lista = document.getElementById("notif-lista");
  if (!lista) return;

  const naoLidasItens = NOTIFICACOES.filter(n => !n.lida);
  const lidasItens    = NOTIFICACOES.filter(n => n.lida);

  function renderGrupo(items, titulo) {
    if (items.length === 0) return "";
    return `
      <div class="notif-grupo-titulo">${titulo}</div>
      ${items.map(n => renderItem(n)).join("")}
    `;
  }

  lista.innerHTML =
    renderGrupo(naoLidasItens, "Novas") +
    renderGrupo(lidasItens, "Anteriores");
}

function renderItem(n) {
  const cor = corTipo(n.tipo);
  return `
    <div class="notif-item ${n.lida ? "lida" : ""}" data-id="${n.id}">
      <div class="ni-icon" style="background:${cor}18; color:${cor};">${n.icon}</div>
      <div class="ni-body">
        <div class="ni-modulo" style="color:${cor};">${n.modulo}</div>
        <div class="ni-titulo">${n.titulo}</div>
        <div class="ni-desc">${n.desc}</div>
        <div class="ni-footer">
          <span class="ni-hora">${n.hora}</span>
          ${n.acao ? `<a class="ni-acao" href="${n.acao.href}">${n.acao.label} →</a>` : ""}
        </div>
      </div>
      ${!n.lida ? `<div class="ni-dot" style="background:${cor};"></div>` : ""}
    </div>
  `;
}

// ── ABRIR / FECHAR ────────────────────────────────────────────────────────────

function abrirPainel() {
  const painel   = document.getElementById("notif-painel");
  const overlay  = document.getElementById("notif-overlay");
  if (!painel || !overlay) return;

  // marcar todas como lidas ao abrir
  NOTIFICACOES.forEach(n => n.lida = true);

  renderPainel();
  atualizarBadge();

  overlay.style.display = "block";
  painel.style.display  = "flex";
  requestAnimationFrame(() => {
    overlay.classList.add("visivel");
    painel.classList.add("aberto");
  });

  painelAberto = true;
}

function fecharPainel() {
  const painel  = document.getElementById("notif-painel");
  const overlay = document.getElementById("notif-overlay");
  if (!painel || !overlay) return;

  overlay.classList.remove("visivel");
  painel.classList.remove("aberto");

  setTimeout(() => {
    overlay.style.display = "none";
    painel.style.display  = "none";
  }, 300);

  painelAberto = false;
}

// ── INIT ──────────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", function () {
  // Injetar HTML do painel no body
  const html = `
    <!-- Overlay escuro -->
    <div id="notif-overlay" style="display:none;"
         onclick="fecharPainel()"></div>

    <!-- Painel deslizante -->
    <div id="notif-painel" style="display:none;">
      <div class="notif-header">
        <div class="notif-header-left">
          <div class="notif-titulo">Notificações</div>
          <div id="notif-badge" class="notif-badge">${naoLidas()}</div>
        </div>
        <div class="notif-header-btns">
          <button class="notif-marcar-btn" onclick="marcarTodasLidas()">Marcar lidas</button>
          <button class="notif-fechar-btn" onclick="fecharPainel()">✕</button>
        </div>
      </div>
      <div id="notif-lista" class="notif-lista"></div>
    </div>
  `;
  const phone = document.querySelector(".phone");
  if (phone) phone.insertAdjacentHTML("beforeend", html);
  else document.body.insertAdjacentHTML("beforeend", html);

  // Ligar botão 🔔
  const btnNotif = document.querySelector(".header-notif");
  if (btnNotif) btnNotif.addEventListener("click", abrirPainel);

  // Badge inicial
  atualizarBadge();
});

function marcarTodasLidas() {
  NOTIFICACOES.forEach(n => n.lida = true);
  renderPainel();
  atualizarBadge();
}