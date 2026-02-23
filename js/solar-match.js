// ── CONSTANTES ───────────────────────────────────────────────────────────────

const HSP_POR_REGIAO = {
  "norte": 3.8, "centro": 4.2, "lisboa": 4.7, "alentejo-algarve": 5.2
};
const EFICIENCIA_TELHADO = {
  "inclinado-sul": 1.00, "misto": 0.88, "plano": 0.82, "inclinado-norte": 0.65
};
const POTENCIA_PAINEL_KWP  = 0.40;
const AREA_PAINEL_M2       = 1.75;
const PRECO_KWH            = 0.187;
const CUSTO_KWP_INSTALACAO = 1800;
const CO2_KG_POR_KWH       = 0.233;
const KWH_POR_ARVORE_ANO   = 22;
const PERFORMANCE_RATIO    = 0.80;
const ANOS_ANALISE         = 15;
const STORAGE_KEY          = "goldenergy_solar_result";
const SCORE_KEY            = "goldenergy_green_score";
const SCORE_BASE           = 73;

// ── ESTADO ────────────────────────────────────────────────────────────────────

let orientacaoAtual = 180;
let cenariosAtuais  = [];

// ── ALGORITMO ────────────────────────────────────────────────────────────────

function calcularOrientacao(graus) {
  const diff = Math.abs(((graus - 180) + 180) % 360 - 180);
  return 1.0 - (diff / 180) * 0.45;
}

function calcularSolar(input) {
  const { areaM2, consumoMensalKwh, tipoTelhado, localizacao, orientacaoGraus } = input;
  const maxPaineisArea     = Math.floor(areaM2 / AREA_PAINEL_M2);
  const hsp                = HSP_POR_REGIAO[localizacao];
  const efTotal            = EFICIENCIA_TELHADO[tipoTelhado] * calcularOrientacao(orientacaoGraus);
  const producaoPorPainel  = POTENCIA_PAINEL_KWP * hsp * 30 * PERFORMANCE_RATIO * efTotal;
  const numPaineis         = Math.min(maxPaineisArea, Math.ceil(consumoMensalKwh / producaoPorPainel), 20);
  const potenciaKwp        = parseFloat((numPaineis * POTENCIA_PAINEL_KWP).toFixed(2));
  const producaoMensalKwh  = Math.round(numPaineis * producaoPorPainel);
  const coberturaPct       = Math.min(Math.round((producaoMensalKwh / consumoMensalKwh) * 100), 150);
  const custoInstalacao    = Math.round(potenciaKwp * CUSTO_KWP_INSTALACAO);
  const poupancaMensal     = Math.round(Math.min(producaoMensalKwh, consumoMensalKwh) * PRECO_KWH);
  const poupancaAnual      = poupancaMensal * 12;
  const paybackAnos        = parseFloat((custoInstalacao / poupancaAnual).toFixed(1));
  const kwhAnual           = producaoMensalKwh * 12;
  const co2EvidadoTonAno   = parseFloat(((kwhAnual * CO2_KG_POR_KWH) / 1000).toFixed(2));
  const arvoresEquivalentes = Math.round(kwhAnual / KWH_POR_ARVORE_ANO);
  const greenScoreDelta    = Math.min(Math.round(coberturaPct / 5), 20);

  const paybackData = [];
  for (let ano = 0; ano <= ANOS_ANALISE; ano++) {
    const p = poupancaAnual * ano;
    paybackData.push({ ano, investimento: custoInstalacao, poupanca: p, saldo: p - custoInstalacao });
  }

  return { numPaineis, potenciaKwp, producaoMensalKwh, coberturaPct, custoInstalacao,
           poupancaMensal, poupancaAnual, paybackAnos, co2EvidadoTonAno,
           arvoresEquivalentes, greenScoreDelta, paybackData };
}

function calcularCenarios(input) {
  return [
    { label: "Económico",   result: calcularSolar({ ...input, areaM2: input.areaM2 * 0.55 }) },
    { label: "Recomendado", result: calcularSolar(input) },
    { label: "Máximo",      result: calcularSolar({ ...input, areaM2: input.areaM2 * 1.5 }) },
  ];
}

// ── FORMATAÇÃO ────────────────────────────────────────────────────────────────

function formatarEuros(v) {
  return v.toLocaleString("pt-PT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
}
function formatarKwh(v) {
  return `${v.toLocaleString("pt-PT")} kWh`;
}

// ── RENDER ────────────────────────────────────────────────────────────────────

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function renderResultado(r) {
  setText("r-paineis",      `${r.numPaineis}`);
  setText("r-potencia",     `${r.potenciaKwp} kWp`);
  setText("r-producao",     formatarKwh(r.producaoMensalKwh));
  setText("r-cobertura",    `${r.coberturaPct}%`);
  setText("r-custo",        `~${formatarEuros(r.custoInstalacao)}`);
  setText("r-poupanca-mes", `~${formatarEuros(r.poupancaMensal)}/mês`);
  setText("r-poupanca-ano", `~${formatarEuros(r.poupancaAnual)}/ano`);
  setText("r-payback",      `~${r.paybackAnos} anos`);
  setText("r-co2",          `~${r.co2EvidadoTonAno} ton`);
  setText("r-arvores",      `${r.arvoresEquivalentes} árvores/ano`);
  setText("r-score-delta",  `+${r.greenScoreDelta} pontos no Green Score 🌿`);
  renderPaybackChart(r.paybackData, r.custoInstalacao);
}

function renderCenarios(cenarios, ativo) {
  const container = document.getElementById("cenarios-container");
  if (!container) return;
  container.innerHTML = cenarios.map((c, i) => `
    <div class="cenario-card ${i === ativo ? "ativo" : ""}" onclick="selecionarCenario(${i})">
      <div class="cenario-label">${c.label}</div>
      <div class="cenario-val">${c.result.numPaineis} <small>painéis</small></div>
      <div class="cenario-poupanca">${formatarEuros(c.result.poupancaAnual)}/ano</div>
      <div class="cenario-bar-track"><div class="cenario-bar-fill" style="width:${Math.min(c.result.coberturaPct,100)}%"></div></div>
      <div class="cenario-sub">${c.result.coberturaPct}% cobertura · ${c.result.paybackAnos}a payback</div>
    </div>
  `).join("");
}

// ── GRÁFICO PAYBACK ───────────────────────────────────────────────────────────

function renderPaybackChart(data, custo) {
  const svg = document.getElementById("payback-svg");
  if (!svg) return;

  const W = 270, H = 140;
  const PAD = { top: 10, right: 10, bottom: 24, left: 46 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const maxVal = custo * 1.1, minVal = -custo * 0.12;
  const range  = maxVal - minVal;

  const xS = a => PAD.left + (a / ANOS_ANALISE) * innerW;
  const yS = v => PAD.top + innerH - ((v - minVal) / range) * innerH;
  const y0 = yS(0);

  const poupPath   = data.map((d,i) => `${i===0?"M":"L"}${xS(d.ano).toFixed(1)},${yS(d.poupanca).toFixed(1)}`).join(" ");
  const investPath = `M${xS(0).toFixed(1)},${yS(custo).toFixed(1)} L${xS(ANOS_ANALISE).toFixed(1)},${yS(custo).toFixed(1)}`;
  const areaPath   = poupPath + ` L${xS(ANOS_ANALISE).toFixed(1)},${y0.toFixed(1)} L${xS(0).toFixed(1)},${y0.toFixed(1)} Z`;
  const breakEven  = (data.find(d => d.saldo >= 0) || {}).ano ?? null;

  const gridLines = [0,0.25,0.5,0.75,1].map(t => {
    const y = PAD.top + t * innerH;
    const v = maxVal - t * range;
    const lbl = Math.abs(v) >= 1000 ? `${(v/1000).toFixed(1)}k` : `${Math.round(v)}`;
    return `<line x1="${PAD.left}" y1="${y.toFixed(1)}" x2="${W-PAD.right}" y2="${y.toFixed(1)}" stroke="rgba(26,46,74,0.06)" stroke-width="1"/>
            <text x="${PAD.left-3}" y="${(y+3).toFixed(1)}" font-size="7.5" fill="#7a8fa6" text-anchor="end" font-family="DM Sans">${lbl}€</text>`;
  }).join("");

  const xLabels = [0,5,10,15].map(a =>
    `<text x="${xS(a).toFixed(1)}" y="${(H-5).toFixed(1)}" font-size="7.5" fill="#7a8fa6" text-anchor="middle" font-family="DM Sans">${a}a</text>`
  ).join("");

  svg.innerHTML = `
    <defs>
      <linearGradient id="aG" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#2DDBA4" stop-opacity="0.3"/>
        <stop offset="100%" stop-color="#2DDBA4" stop-opacity="0"/>
      </linearGradient>
    </defs>
    ${gridLines}${xLabels}
    <line x1="${PAD.left}" y1="${y0.toFixed(1)}" x2="${W-PAD.right}" y2="${y0.toFixed(1)}" stroke="rgba(26,46,74,0.18)" stroke-width="1" stroke-dasharray="3,2"/>
    <path d="${areaPath}" fill="url(#aG)"/>
    <path d="${investPath}" fill="none" stroke="#f87171" stroke-width="1.5" stroke-dasharray="5,3"/>
    <path d="${poupPath}" fill="none" stroke="#2DDBA4" stroke-width="2" stroke-linecap="round"/>
    ${breakEven !== null ? `
      <line x1="${xS(breakEven).toFixed(1)}" y1="${PAD.top}" x2="${xS(breakEven).toFixed(1)}" y2="${(H-PAD.bottom).toFixed(1)}" stroke="#F5C842" stroke-width="1.5" stroke-dasharray="3,2"/>
      <circle cx="${xS(breakEven).toFixed(1)}" cy="${y0.toFixed(1)}" r="4" fill="#F5C842" stroke="white" stroke-width="1.5"/>
      <text x="${(xS(breakEven)+5).toFixed(1)}" y="${(y0-5).toFixed(1)}" font-size="8" fill="#F5C842" font-family="DM Sans" font-weight="700">Break-even</text>
    ` : ""}`;
}

// ── BÚSSOLA ───────────────────────────────────────────────────────────────────

function initBussola() {
  const canvas = document.getElementById("bussola-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  desenharBussola(ctx, orientacaoAtual);
  canvas.addEventListener("click", e => {
    const rect = canvas.getBoundingClientRect();
    const dx = e.clientX - rect.left - canvas.width / 2;
    const dy = e.clientY - rect.top  - canvas.height / 2;
    orientacaoAtual = Math.round((Math.atan2(dy, dx) * 180 / Math.PI + 90 + 360) % 360);
    desenharBussola(ctx, orientacaoAtual);
    atualizarLabelOrientacao();
  });
}

function atualizarLabelOrientacao() {
  const label = document.getElementById("orientacao-label");
  if (!label) return;
  const dirs = ["N","NE","E","SE","S","SO","O","NO"];
  const dir  = dirs[Math.round(orientacaoAtual / 45) % 8];
  const ef   = Math.round(calcularOrientacao(orientacaoAtual) * 100);
  label.textContent = `${dir} (${orientacaoAtual}°) — Eficiência: ${ef}%`;
}

function desenharBussola(ctx, angulo) {
  const W = ctx.canvas.width, H = ctx.canvas.height;
  const cx = W/2, cy = H/2, r = Math.min(cx, cy) - 6;
  ctx.clearRect(0, 0, W, H);
  for (let i = 0; i < 360; i++) {
    const rad = (i - 90) * Math.PI / 180;
    const ef  = calcularOrientacao(i);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r-2, rad, rad + (Math.PI*2/360) + 0.02);
    ctx.closePath();
    ctx.fillStyle = `rgba(${Math.round((1-ef)*200)},${Math.round(ef*210)},80,0.20)`;
    ctx.fill();
  }
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2);
  ctx.strokeStyle = "rgba(26,46,74,0.12)"; ctx.lineWidth = 2; ctx.stroke();
  [["N",0],["E",90],["S",180],["O",270]].forEach(([d,a]) => {
    const rad = (a - 90) * Math.PI / 180;
    ctx.font = "bold 9px DM Sans";
    ctx.fillStyle = d === "S" ? "#1aad7e" : "rgba(26,46,74,0.45)";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(d, cx + (r-13)*Math.cos(rad), cy + (r-13)*Math.sin(rad));
  });
  const rad = (angulo - 90) * Math.PI / 180;
  ctx.beginPath();
  ctx.moveTo(cx + (r-20)*Math.cos(rad), cy + (r-20)*Math.sin(rad));
  ctx.lineTo(cx + 9*Math.cos(rad + Math.PI/2), cy + 9*Math.sin(rad + Math.PI/2));
  ctx.lineTo(cx + 9*Math.cos(rad - Math.PI/2), cy + 9*Math.sin(rad - Math.PI/2));
  ctx.closePath(); ctx.fillStyle = "#2DDBA4"; ctx.fill();
  ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI*2);
  ctx.fillStyle = "#0f1e32"; ctx.fill();
}

// ── MAPA ──────────────────────────────────────────────────────────────────────

const REGIOES = {
  "norte":    { loc: "norte",            label: "Norte",    hsp: 3.8 },
  "centro":   { loc: "centro",           label: "Centro",   hsp: 4.2 },
  "lisboa":   { loc: "lisboa",           label: "Lisboa",   hsp: 4.7 },
  "alentejo": { loc: "alentejo-algarve", label: "Alentejo", hsp: 5.0 },
  "algarve":  { loc: "alentejo-algarve", label: "Algarve",  hsp: 5.2 },
};

function initMapa() {
  document.querySelectorAll(".regiao-path").forEach(el => {
    el.addEventListener("click", () => {
      const info = REGIOES[el.dataset.regiao];
      if (!info) return;
      document.querySelectorAll(".regiao-path").forEach(r => r.classList.remove("selected"));
      el.classList.add("selected");
      const sel = document.getElementById("input-localizacao");
      if (sel) sel.value = info.loc;
      const lbl = document.getElementById("map-selected-label");
      if (lbl) lbl.textContent = `${info.label} — ${info.hsp}h sol pico/dia`;
    });
  });
}

// ── SELEÇÃO DE CENÁRIO (global) ───────────────────────────────────────────────

function selecionarCenario(idx) {
  if (!cenariosAtuais[idx]) return;
  renderCenarios(cenariosAtuais, idx);
  renderResultado(cenariosAtuais[idx].result);
}

// ── FORMULÁRIO ────────────────────────────────────────────────────────────────

function lerFormulario() {
  const area      = parseFloat(document.getElementById("input-area").value);
  const consumo   = parseFloat(document.getElementById("input-consumo").value);
  const telhado   = document.getElementById("input-telhado").value;
  const localizacao = document.getElementById("input-localizacao").value;
  if (!area || !consumo || area <= 0 || consumo <= 0) {
    alert("Por favor preenche todos os campos corretamente.");
    return null;
  }
  return { areaM2: area, consumoMensalKwh: consumo, tipoTelhado: telhado, localizacao, orientacaoGraus: orientacaoAtual };
}

// ── INIT ──────────────────────────────────────────────────────────────────────

function init() {
  initMapa();
  initBussola();
  atualizarLabelOrientacao();

  // Resultado guardado do localStorage
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const guardado = JSON.parse(raw);
      const resultSection = document.getElementById("solar-result");
      renderResultado(guardado);
      resultSection.style.display = "block";
    } catch(e) {}
  }

  // ── BOTÃO CALCULAR ──
  document.getElementById("btn-calcular").addEventListener("click", function() {
    const input = lerFormulario();
    if (!input) return;

    const result = calcularSolar(input);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
    localStorage.setItem(SCORE_KEY, String(Math.min(SCORE_BASE + result.greenScoreDelta, 100)));

    cenariosAtuais = calcularCenarios(input);
    renderCenarios(cenariosAtuais, 1);
    renderResultado(result);

    const resultSection = document.getElementById("solar-result");
    resultSection.style.display = "block";

    // flash visual
    resultSection.style.transition = "none";
    resultSection.style.opacity = "0";
    void resultSection.offsetHeight;
    resultSection.style.transition = "opacity 0.35s ease";
    resultSection.style.opacity = "1";

    resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

// Correr quando o DOM estiver pronto
document.addEventListener("DOMContentLoaded", init);