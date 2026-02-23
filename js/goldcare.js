// ── DADOS SINTÉTICOS ─────────────────────────────────────────────────────────

const PESSOAS = [
  {
    id: 1,
    nome: "Avó Maria",
    idade: 78,
    relacao: "Avó",
    avatar: "👵",
    morada: "Rua das Flores, Lisboa",
    status: "alerta",
    ultimaAtividade: "Há 6 horas",
    consumoHoje: 0.4,
    consumoNormal: 3.2,
    temperatura: 19,
    dispositivos: [
      { nome: "Aquecedor", ligado: false, consumo: 0 },
      { nome: "Frigorífico", ligado: true, consumo: 0.3 },
      { nome: "TV", ligado: false, consumo: 0 },
      { nome: "Fogão", ligado: false, consumo: 0 },
    ],
    alertas: [
      { tipo: "critico", icon: "🔴", msg: "Consumo muito baixo desde as 07h00", hora: "13:42" },
      { tipo: "aviso",   icon: "🟡", msg: "Temperatura da casa abaixo de 20°C", hora: "11:20" },
    ],
    historico: [2.8, 3.1, 3.4, 3.0, 3.2, 2.9, 0.4],
    dias: ["Seg","Ter","Qua","Qui","Sex","Sáb","Hoj"],
  },
  {
    id: 2,
    nome: "Avô António",
    idade: 82,
    relacao: "Avô",
    avatar: "👴",
    morada: "Av. da Liberdade, Porto",
    status: "ok",
    ultimaAtividade: "Há 45 min",
    consumoHoje: 2.9,
    consumoNormal: 3.0,
    temperatura: 22,
    dispositivos: [
      { nome: "Aquecedor",  ligado: true,  consumo: 1.2 },
      { nome: "Frigorífico", ligado: true, consumo: 0.3 },
      { nome: "TV",          ligado: true, consumo: 0.8 },
      { nome: "Fogão",       ligado: false, consumo: 0 },
    ],
    alertas: [],
    historico: [2.9, 3.1, 2.8, 3.0, 2.7, 3.2, 2.9],
    dias: ["Seg","Ter","Qua","Qui","Sex","Sáb","Hoj"],
  },
  {
    id: 3,
    nome: "Tia Rosa",
    idade: 71,
    relacao: "Tia",
    avatar: "👩‍🦳",
    morada: "Travessa do Sol, Coimbra",
    status: "aviso",
    ultimaAtividade: "Há 2 horas",
    consumoHoje: 1.1,
    consumoNormal: 2.8,
    temperatura: 18,
    dispositivos: [
      { nome: "Aquecedor",   ligado: false, consumo: 0 },
      { nome: "Frigorífico", ligado: true,  consumo: 0.3 },
      { nome: "TV",          ligado: true,  consumo: 0.8 },
      { nome: "Fogão",       ligado: false, consumo: 0 },
    ],
    alertas: [
      { tipo: "aviso", icon: "🟡", msg: "Aquecedor desligado com temperatura baixa", hora: "10:15" },
    ],
    historico: [2.6, 2.9, 2.7, 2.8, 2.5, 2.9, 1.1],
    dias: ["Seg","Ter","Qua","Qui","Sex","Sáb","Hoj"],
  },
];

// ── ESTADO ────────────────────────────────────────────────────────────────────

let pessoaSelecionada = PESSOAS[0]; // abre no alerta por defeito

// ── HELPERS ───────────────────────────────────────────────────────────────────

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function statusCor(status) {
  return { ok: "#2DDBA4", aviso: "#F5C842", critico: "#f87171" }[status] || "#7a8fa6";
}

function statusLabel(status) {
  return { ok: "Normal", aviso: "Atenção", critico: "Alerta" }[status] || "—";
}

function consumoPct(pessoa) {
  return Math.min(Math.round((pessoa.consumoHoje / pessoa.consumoNormal) * 100), 150);
}

// ── RENDER LISTA DE PESSOAS ───────────────────────────────────────────────────

function renderLista() {
  const container = document.getElementById("pessoas-lista");
  if (!container) return;

  container.innerHTML = PESSOAS.map(p => {
    const pct     = consumoPct(p);
    const cor     = statusCor(p.status);
    const ativo   = p.id === pessoaSelecionada.id ? "ativo" : "";
    const numAlertas = p.alertas.length;

    return `
      <div class="pessoa-card ${ativo}" onclick="selecionarPessoa(${p.id})">
        <div class="pc-avatar" style="background:${cor}20; border: 2px solid ${cor}40;">
          <span>${p.avatar}</span>
          <div class="pc-status-dot" style="background:${cor};"></div>
        </div>
        <div class="pc-body">
          <div class="pc-nome">${p.nome} <span class="pc-idade">${p.idade}a</span></div>
          <div class="pc-atividade">${p.ultimaAtividade}</div>
          <div class="pc-consumo-bar">
            <div class="pc-consumo-fill" style="width:${Math.min(pct,100)}%; background:${cor};"></div>
          </div>
        </div>
        <div class="pc-right">
          <div class="pc-badge" style="background:${cor}20; color:${cor};">${statusLabel(p.status)}</div>
          ${numAlertas > 0 ? `<div class="pc-alerta-count">${numAlertas}</div>` : ""}
        </div>
      </div>
    `;
  }).join("");
}

// ── RENDER DETALHE ────────────────────────────────────────────────────────────

function renderDetalhe(p) {
  const cor   = statusCor(p.status);
  const pct   = consumoPct(p);
  const diff  = Math.round(((p.consumoHoje - p.consumoNormal) / p.consumoNormal) * 100);
  const diffStr = diff >= 0 ? `+${diff}%` : `${diff}%`;
  const diffCor = diff < -20 ? "#f87171" : diff < 0 ? "#F5C842" : "#2DDBA4";

  // Header
  const header = document.getElementById("detalhe-header");
  if (header) {
    header.innerHTML = `
      <div class="dh-avatar" style="background:${cor}20; border: 2px solid ${cor}60;">${p.avatar}</div>
      <div class="dh-info">
        <div class="dh-nome">${p.nome}</div>
        <div class="dh-sub">${p.relacao} · ${p.morada}</div>
        <div class="dh-ultima">⏱ Última atividade: ${p.ultimaAtividade}</div>
      </div>
      <div class="dh-status" style="background:${cor}20; color:${cor}; border:1px solid ${cor}40;">
        ${statusLabel(p.status)}
      </div>
    `;
  }

  // Stats rápidos
  setText("d-consumo-hoje",  `${p.consumoHoje} kWh`);
  setText("d-consumo-normal", `${p.consumoNormal} kWh`);
  setText("d-consumo-diff",  diffStr);
  setText("d-temperatura",   `${p.temperatura}°C`);

  const diffEl = document.getElementById("d-consumo-diff");
  if (diffEl) diffEl.style.color = diffCor;

  // Barra de consumo
  const barra = document.getElementById("d-consumo-barra");
  if (barra) {
    barra.style.width = `${Math.min(pct, 100)}%`;
    barra.style.background = cor;
  }
  setText("d-consumo-pct", `${pct}% do normal`);

  // Dispositivos
  renderDispositivos(p);

  // Alertas
  renderAlertas(p);

  // Gráfico histórico
  renderGraficoHistorico(p);

  // Botão de contacto
  const btnContacto = document.getElementById("btn-contacto");
  if (btnContacto) {
    btnContacto.textContent = `📞 Contactar ${p.nome.split(" ")[1] || p.nome}`;
  }
}

// ── DISPOSITIVOS ──────────────────────────────────────────────────────────────

function renderDispositivos(p) {
  const container = document.getElementById("dispositivos-grid");
  if (!container) return;

  const icones = { "Aquecedor": "🔥", "Frigorífico": "❄️", "TV": "📺", "Fogão": "🍳" };

  container.innerHTML = p.dispositivos.map(d => `
    <div class="disp-card ${d.ligado ? "on" : "off"}">
      <div class="disp-icon">${icones[d.nome] || "🔌"}</div>
      <div class="disp-nome">${d.nome}</div>
      <div class="disp-status">${d.ligado ? `${d.consumo} kW` : "Desligado"}</div>
      <div class="disp-dot" style="background:${d.ligado ? "#2DDBA4" : "rgba(26,46,74,0.15)"};"></div>
    </div>
  `).join("");
}

// ── ALERTAS ───────────────────────────────────────────────────────────────────

function renderAlertas(p) {
  const container = document.getElementById("alertas-lista");
  const section   = document.getElementById("alertas-section");
  if (!container || !section) return;

  if (p.alertas.length === 0) {
    section.style.display = "none";
    return;
  }

  section.style.display = "block";
  container.innerHTML = p.alertas.map(a => `
    <div class="alerta-item alerta-${a.tipo}">
      <div class="ai-icon">${a.icon}</div>
      <div class="ai-body">
        <div class="ai-msg">${a.msg}</div>
        <div class="ai-hora">${a.hora}</div>
      </div>
      <button class="ai-btn" onclick="resolverAlerta(this)">Resolver</button>
    </div>
  `).join("");
}

// ── GRÁFICO HISTÓRICO (SVG) ───────────────────────────────────────────────────

function renderGraficoHistorico(p) {
  const svg = document.getElementById("historico-svg");
  if (!svg) return;

  const W = 260, H = 90;
  const PAD = { top: 10, right: 10, bottom: 22, left: 28 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const maxVal = Math.max(...p.historico) * 1.2;
  const n      = p.historico.length;
  const xS     = i  => PAD.left + (i / (n - 1)) * innerW;
  const yS     = v  => PAD.top + innerH - (v / maxVal) * innerH;

  const linePath  = p.historico.map((v, i) => `${i === 0 ? "M" : "L"}${xS(i).toFixed(1)},${yS(v).toFixed(1)}`).join(" ");
  const areaPath  = linePath + ` L${xS(n-1).toFixed(1)},${(PAD.top+innerH).toFixed(1)} L${xS(0).toFixed(1)},${(PAD.top+innerH).toFixed(1)} Z`;

  // cor da linha baseada no último valor vs normal
  const ultimoOk = p.historico[n-1] >= p.consumoNormal * 0.6;
  const cor = ultimoOk ? "#2DDBA4" : "#f87171";

  // Pontos + labels
  const pontos = p.historico.map((v, i) => {
    const isUltimo = i === n - 1;
    return `
      <circle cx="${xS(i).toFixed(1)}" cy="${yS(v).toFixed(1)}" r="${isUltimo ? 5 : 3}"
        fill="${isUltimo ? cor : "white"}" stroke="${cor}" stroke-width="2"/>
      <text x="${xS(i).toFixed(1)}" y="${(H - 5).toFixed(1)}"
        font-size="7.5" fill="#7a8fa6" text-anchor="middle" font-family="DM Sans">${p.dias[i]}</text>
    `;
  }).join("");

  // Linha de referência (consumo normal)
  const yNormal = yS(p.consumoNormal);

  svg.innerHTML = `
    <defs>
      <linearGradient id="hGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${cor}" stop-opacity="0.25"/>
        <stop offset="100%" stop-color="${cor}" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <line x1="${PAD.left}" y1="${yNormal.toFixed(1)}" x2="${W-PAD.right}" y2="${yNormal.toFixed(1)}"
      stroke="rgba(26,46,74,0.12)" stroke-width="1" stroke-dasharray="3,2"/>
    <text x="${PAD.left - 3}" y="${(yNormal + 3).toFixed(1)}" font-size="7" fill="#7a8fa6" text-anchor="end" font-family="DM Sans">Normal</text>
    <path d="${areaPath}" fill="url(#hGrad)"/>
    <path d="${linePath}" fill="none" stroke="${cor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    ${pontos}
  `;
}

// ── INTERAÇÕES ────────────────────────────────────────────────────────────────

function selecionarPessoa(id) {
  pessoaSelecionada = PESSOAS.find(p => p.id === id);
  renderLista();
  renderDetalhe(pessoaSelecionada);

  // Scroll para o detalhe em mobile
  const detalhe = document.getElementById("detalhe-section");
  if (detalhe) detalhe.scrollIntoView({ behavior: "smooth", block: "start" });
}

function resolverAlerta(btn) {
  const item = btn.closest(".alerta-item");
  if (item) {
    item.style.opacity = "0";
    item.style.transition = "opacity 0.3s";
    setTimeout(() => item.remove(), 300);
  }
}

// ── RESUMO GLOBAL ─────────────────────────────────────────────────────────────

function renderResumo() {
  const totalAlertas = PESSOAS.reduce((acc, p) => acc + p.alertas.length, 0);
  const emRisco      = PESSOAS.filter(p => p.status !== "ok").length;

  setText("resumo-total",   PESSOAS.length);
  setText("resumo-alertas", totalAlertas);
  setText("resumo-risco",   emRisco);
  setText("resumo-ok",      PESSOAS.filter(p => p.status === "ok").length);
}

// ── INIT ──────────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", function () {
  renderResumo();
  renderLista();
  renderDetalhe(pessoaSelecionada);
});