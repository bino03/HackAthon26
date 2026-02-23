// ── CONSTANTES ────────────────────────────────────────────────────────────────

const SCORE_KEY   = "goldenergy_green_score";
const SOLAR_KEY   = "goldenergy_solar_result";
const SCORE_BASE  = 73;

// ── DADOS DE HISTÓRICO (base + ajuste dinâmico) ───────────────────────────────

const HISTORICO_BASE = [
  { mes: "Set", score: 52 },
  { mes: "Out", score: 58 },
  { mes: "Nov", score: 61 },
  { mes: "Dez", score: 65 },
  { mes: "Jan", score: 69 },
  { mes: "Fev", score: SCORE_BASE },
];

// ── HELPERS ───────────────────────────────────────────────────────────────────

function obterScore() {
  const raw = localStorage.getItem(SCORE_KEY);
  return raw ? parseInt(raw) : SCORE_BASE;
}

function obterSolarResult() {
  const raw = localStorage.getItem(SOLAR_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

// ── GAUGE SVG ─────────────────────────────────────────────────────────────────

function renderGauge(score) {
  // circunferência do círculo r=60: 2*PI*60 = 376.99
  const circunferencia = 376.99;
  const offset = circunferencia - (score / 100) * circunferencia;

  const circle = document.querySelector(".gauge-circle-fill");
  if (circle) {
    circle.setAttribute("stroke-dashoffset", offset.toFixed(2));
  }

  const numEl = document.querySelector(".gnum");
  if (numEl) {
    // animar o número a subir
    animarNumero(numEl, SCORE_BASE, score, 800);
  }

  // label de comparação
  const subEl = document.querySelector(".gauge-sub");
  if (subEl) {
    const pct = Math.min(Math.round(score * 0.93), 99);
    subEl.textContent = `Acima de ${pct}% dos utilizadores da tua zona!`;
  }
}

function animarNumero(el, de, ate, duracao) {
  const inicio = performance.now();
  function step(agora) {
    const progresso = Math.min((agora - inicio) / duracao, 1);
    const eased = 1 - Math.pow(1 - progresso, 3); // ease-out cubic
    el.textContent = Math.round(de + (ate - de) * eased);
    if (progresso < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// ── IMPACT CARDS ──────────────────────────────────────────────────────────────

function renderImpact(score, solarResult) {
  // CO₂ poupado: base + bónus solar
  const co2Base   = parseFloat((score * 0.17).toFixed(1));
  const co2Solar  = solarResult ? solarResult.co2EvidadoTonAno * 1000 / 12 : 0;
  const co2Total  = (co2Base + co2Solar).toFixed(1);

  // Árvores equivalentes
  const arvores = (co2Total / 3.8).toFixed(1);

  // % vs mês anterior
  const deltaPct = score > SCORE_BASE ? `+${score - SCORE_BASE}` : `-${SCORE_BASE - score}`;

  setText("ic-co2",    co2Total);
  setText("ic-arvores", arvores);
  setText("ic-delta",  `${deltaPct}`);

  // chips no topo
  const chips = document.getElementById("gauge-chips");
  if (chips) {
    const solarChip = solarResult
      ? `<span class="chip">☀️ ${solarResult.numPaineis} painéis</span>`
      : "";
    chips.innerHTML = `
      <span class="chip">🌱 -${co2Total}kg CO₂</span>
      <span class="chip">⚡ 100% Verde</span>
      <span class="chip">🌳 ${arvores} árvores</span>
      ${solarChip}
    `;
  }
}

// ── HISTÓRICO ─────────────────────────────────────────────────────────────────

function renderHistorico(scoreAtual) {
  const container = document.getElementById("historico-bars");
  if (!container) return;

  // Ajustar o último mês ao score atual
  const historico = HISTORICO_BASE.map((h, i) => ({
    ...h,
    score: i === HISTORICO_BASE.length - 1 ? scoreAtual : h.score
  }));

  const max = Math.max(...historico.map(h => h.score));

  container.innerHTML = historico.map(h => `
    <div class="bar-row">
      <div class="bar-label">${h.mes}</div>
      <div class="bar-track">
        <div class="bar-fill" style="width:${Math.round((h.score/max)*100)}%; transition: width 0.6s ease;"></div>
      </div>
      <div class="bar-val">${h.score}</div>
    </div>
  `).join("");
}

// ── BANNER SOLAR ──────────────────────────────────────────────────────────────

function renderBannerSolar(solarResult, scoreAtual) {
  const banner = document.getElementById("solar-banner");
  if (!banner) return;

  if (solarResult) {
    // Utilizador já calculou no SolarMatch — mostrar resumo
    banner.style.display = "flex";
    banner.innerHTML = `
      <div class="sb-icon">☀️</div>
      <div class="sb-body">
        <div class="sb-title">SolarMatch ativo</div>
        <div class="sb-desc">${solarResult.numPaineis} painéis · ${solarResult.coberturaPct}% cobertura · +${solarResult.greenScoreDelta} pts no score</div>
      </div>
      <a href="solar-match.html" class="sb-link">Ver →</a>
    `;
  } else {
    // Sugerir o SolarMatch
    banner.style.display = "flex";
    banner.innerHTML = `
      <div class="sb-icon">☀️</div>
      <div class="sb-body">
        <div class="sb-title">Aumenta o teu score!</div>
        <div class="sb-desc">Simula painéis solares e ganha até +20 pontos</div>
      </div>
      <a href="solar-match.html" class="sb-link">Simular →</a>
    `;
  }
}

// ── UTIL ──────────────────────────────────────────────────────────────────────

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

// ── INIT ──────────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", function () {
  const score       = obterScore();
  const solarResult = obterSolarResult();

  renderGauge(score);
  renderImpact(score, solarResult);
  renderHistorico(score);
  renderBannerSolar(solarResult, score);
});