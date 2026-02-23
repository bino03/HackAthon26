// ── TYPES ──────────────────────────────────────────────────────────────────

interface SolarInput {
  areaM2: number;
  consumoMensalKwh: number;
  tipoTelhado: TipoTelhado;
  localizacao: Localizacao;
  orientacaoGraus: number; // 0=Norte, 90=Este, 180=Sul, 270=Oeste
}

interface SolarResult {
  numPaineis: number;
  potenciaKwp: number;
  producaoMensalKwh: number;
  coberturaPct: number;
  custoInstalacao: number;
  poupancaMensal: number;
  poupancaAnual: number;
  paybackAnos: number;
  co2EvidadoTonAno: number;
  arvoresEquivalentes: number;
  greenScoreDelta: number;
  paybackData: PaybackPoint[];
}

interface PaybackPoint {
  ano: number;
  investimento: number;
  poupanca: number;
  saldo: number;
}

interface Cenario {
  label: string;
  result: SolarResult;
}

type TipoTelhado = "inclinado-sul" | "inclinado-norte" | "plano" | "misto";
type Localizacao = "norte" | "centro" | "lisboa" | "alentejo-algarve";

// ── CONSTANTES ──────────────────────────────────────────────────────────────

const HSP_POR_REGIAO: Record<Localizacao, number> = {
  "norte":            3.8,
  "centro":           4.2,
  "lisboa":           4.7,
  "alentejo-algarve": 5.2,
};

const EFICIENCIA_TELHADO: Record<TipoTelhado, number> = {
  "inclinado-sul":   1.00,
  "misto":           0.88,
  "plano":           0.82,
  "inclinado-norte": 0.65,
};

const POTENCIA_PAINEL_KWP  = 0.40;
const AREA_PAINEL_M2       = 1.75;
const PRECO_KWH            = 0.187;
const CUSTO_KWP_INSTALACAO = 1800;
const CO2_KG_POR_KWH       = 0.233;
const KWH_POR_ARVORE_ANO   = 22;
const PERFORMANCE_RATIO    = 0.80;
const ANOS_ANALISE         = 15;

// ── ORIENTAÇÃO ───────────────────────────────────────────────────────────────

function calcularOrientacao(graus: number): number {
  const diff = Math.abs(((graus - 180) + 180) % 360 - 180);
  return 1.0 - (diff / 180) * 0.45;
}

// ── ALGORITMO PRINCIPAL ─────────────────────────────────────────────────────

export function calcularSolar(input: SolarInput): SolarResult {
  const { areaM2, consumoMensalKwh, tipoTelhado, localizacao, orientacaoGraus } = input;

  const maxPaineisArea    = Math.floor(areaM2 / AREA_PAINEL_M2);
  const hsp               = HSP_POR_REGIAO[localizacao];
  const efTelhado         = EFICIENCIA_TELHADO[tipoTelhado];
  const efOrientacao      = calcularOrientacao(orientacaoGraus);
  const efTotal           = efTelhado * efOrientacao;
  const producaoPorPainel = POTENCIA_PAINEL_KWP * hsp * 30 * PERFORMANCE_RATIO * efTotal;
  const paineisNecessarios = Math.ceil(consumoMensalKwh / producaoPorPainel);
  const numPaineis        = Math.min(maxPaineisArea, paineisNecessarios, 20);

  const potenciaKwp       = parseFloat((numPaineis * POTENCIA_PAINEL_KWP).toFixed(2));
  const producaoMensalKwh = Math.round(numPaineis * producaoPorPainel);
  const coberturaPct      = Math.min(Math.round((producaoMensalKwh / consumoMensalKwh) * 100), 150);
  const custoInstalacao   = Math.round(potenciaKwp * CUSTO_KWP_INSTALACAO);
  const poupancaMensal    = Math.round(Math.min(producaoMensalKwh, consumoMensalKwh) * PRECO_KWH);
  const poupancaAnual     = poupancaMensal * 12;
  const paybackAnos       = parseFloat((custoInstalacao / poupancaAnual).toFixed(1));
  const kwhAnual          = producaoMensalKwh * 12;
  const co2EvidadoTonAno  = parseFloat(((kwhAnual * CO2_KG_POR_KWH) / 1000).toFixed(2));
  const arvoresEquivalentes = Math.round(kwhAnual / KWH_POR_ARVORE_ANO);
  const greenScoreDelta   = Math.min(Math.round(coberturaPct / 5), 20);

  const paybackData: PaybackPoint[] = [];
  for (let ano = 0; ano <= ANOS_ANALISE; ano++) {
    const poupancaAcum = poupancaAnual * ano;
    paybackData.push({ ano, investimento: custoInstalacao, poupanca: poupancaAcum, saldo: poupancaAcum - custoInstalacao });
  }

  return { numPaineis, potenciaKwp, producaoMensalKwh, coberturaPct, custoInstalacao, poupancaMensal, poupancaAnual, paybackAnos, co2EvidadoTonAno, arvoresEquivalentes, greenScoreDelta, paybackData };
}

// ── CENÁRIOS ─────────────────────────────────────────────────────────────────

export function calcularCenarios(input: SolarInput): Cenario[] {
  const base    = calcularSolar(input);
  const menos   = calcularSolar({ ...input, areaM2: input.areaM2 * 0.55 });
  const mais    = calcularSolar({ ...input, areaM2: Math.min(input.areaM2 * 1.5, input.areaM2 + 30) });
  return [
    { label: "Económico",   result: menos },
    { label: "Recomendado", result: base  },
    { label: "Máximo",      result: mais  },
  ];
}

// ── LOCALSTORAGE ─────────────────────────────────────────────────────────────

const STORAGE_KEY = "goldenergy_solar_result";
const SCORE_KEY   = "goldenergy_green_score";
const SCORE_BASE  = 73;

export function guardarResultado(result: SolarResult): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
}

export function carregarResultado(): SolarResult | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as SolarResult; } catch { return null; }
}

export function obterGreenScore(): number {
  const raw = localStorage.getItem(SCORE_KEY);
  return raw ? parseInt(raw) : SCORE_BASE;
}

export function atualizarGreenScore(delta: number): number {
  const atual = obterGreenScore();
  const novo  = Math.min(atual + delta, 100);
  localStorage.setItem(SCORE_KEY, String(novo));
  return novo;
}

// ── FORMATAÇÃO ───────────────────────────────────────────────────────────────

export function formatarEuros(valor: number): string {
  return valor.toLocaleString("pt-PT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
}

export function formatarKwh(valor: number): string {
  return `${valor.toLocaleString("pt-PT")} kWh`;
}

// ── RENDER RESULTADO ─────────────────────────────────────────────────────────

function renderResultado(r: SolarResult): void {
  const set = (id: string, val: string) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set("r-paineis",      `${r.numPaineis}`);
  set("r-potencia",     `${r.potenciaKwp} kWp`);
  set("r-producao",     formatarKwh(r.producaoMensalKwh));
  set("r-cobertura",    `${r.coberturaPct}%`);
  set("r-custo",        `~${formatarEuros(r.custoInstalacao)}`);
  set("r-poupanca-mes", `~${formatarEuros(r.poupancaMensal)}/mês`);
  set("r-poupanca-ano", `~${formatarEuros(r.poupancaAnual)}/ano`);
  set("r-payback",      `~${r.paybackAnos} anos`);
  set("r-co2",          `~${r.co2EvidadoTonAno} ton`);
  set("r-arvores",      `${r.arvoresEquivalentes} árvores/ano`);
  set("r-score-delta",  `+${r.greenScoreDelta} pontos no Green Score 🌿`);
  renderPaybackChart(r.paybackData, r.custoInstalacao);
}

// ── GRÁFICO PAYBACK ───────────────────────────────────────────────────────────

function renderPaybackChart(data: PaybackPoint[], custo: number): void {
  const svg = document.getElementById("payback-svg");
  if (!svg) return;

  const W = 270, H = 140;
  const PAD = { top: 10, right: 10, bottom: 24, left: 46 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const maxVal = custo * 1.1;
  const minVal = -custo * 0.12;
  const range  = maxVal - minVal;

  const xS = (a: number) => PAD.left + (a / ANOS_ANALISE) * innerW;
  const yS = (v: number) => PAD.top + innerH - ((v - minVal) / range) * innerH;
  const y0 = yS(0);

  const poupPath  = data.map((d, i) => `${i === 0 ? "M" : "L"}${xS(d.ano).toFixed(1)},${yS(d.poupanca).toFixed(1)}`).join(" ");
  const investPath = `M${xS(0).toFixed(1)},${yS(custo).toFixed(1)} L${xS(ANOS_ANALISE).toFixed(1)},${yS(custo).toFixed(1)}`;
  const areaPath  = poupPath + ` L${xS(ANOS_ANALISE).toFixed(1)},${y0.toFixed(1)} L${xS(0).toFixed(1)},${y0.toFixed(1)} Z`;
  const breakEven = data.find(d => d.saldo >= 0)?.ano ?? null;

  const gridLabels = [0, 0.25, 0.5, 0.75, 1].map(t => {
    const y   = PAD.top + t * innerH;
    const val = maxVal - t * range;
    const lbl = Math.abs(val) >= 1000 ? `${(val / 1000).toFixed(1)}k` : `${Math.round(val)}`;
    return `
      <line x1="${PAD.left}" y1="${y.toFixed(1)}" x2="${W - PAD.right}" y2="${y.toFixed(1)}" stroke="rgba(26,46,74,0.06)" stroke-width="1"/>
      <text x="${PAD.left - 3}" y="${(y + 3).toFixed(1)}" font-size="7.5" fill="#7a8fa6" text-anchor="end" font-family="DM Sans">${lbl}€</text>`;
  }).join("");

  const xLabels = [0, 5, 10, 15].map(a =>
    `<text x="${xS(a).toFixed(1)}" y="${(H - 5).toFixed(1)}" font-size="7.5" fill="#7a8fa6" text-anchor="middle" font-family="DM Sans">${a}a</text>`
  ).join("");

  svg.innerHTML = `
    <defs>
      <linearGradient id="aG" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#2DDBA4" stop-opacity="0.3"/>
        <stop offset="100%" stop-color="#2DDBA4" stop-opacity="0"/>
      </linearGradient>
    </defs>
    ${gridLabels}
    ${xLabels}
    <line x1="${PAD.left}" y1="${y0.toFixed(1)}" x2="${W - PAD.right}" y2="${y0.toFixed(1)}" stroke="rgba(26,46,74,0.18)" stroke-width="1" stroke-dasharray="3,2"/>
    <path d="${areaPath}" fill="url(#aG)"/>
    <path d="${investPath}" fill="none" stroke="#f87171" stroke-width="1.5" stroke-dasharray="5,3"/>
    <path d="${poupPath}" fill="none" stroke="#2DDBA4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    ${breakEven !== null ? `
      <line x1="${xS(breakEven).toFixed(1)}" y1="${PAD.top}" x2="${xS(breakEven).toFixed(1)}" y2="${(H - PAD.bottom).toFixed(1)}" stroke="#F5C842" stroke-width="1.5" stroke-dasharray="3,2"/>
      <circle cx="${xS(breakEven).toFixed(1)}" cy="${y0.toFixed(1)}" r="4" fill="#F5C842" stroke="white" stroke-width="1.5"/>
      <text x="${(xS(breakEven) + 5).toFixed(1)}" y="${(y0 - 5).toFixed(1)}" font-size="8" fill="#F5C842" font-family="DM Sans" font-weight="700">Break-even</text>
    ` : ""}
    <rect x="${PAD.left - 1}" y="${PAD.top}" width="${innerW + 2}" height="${innerH}" fill="none" stroke="rgba(26,46,74,0.06)" stroke-width="1"/>
  `;
}

// ── RENDER CENÁRIOS ───────────────────────────────────────────────────────────

let cenariosAtuais: Cenario[] = [];

function renderCenarios(cenarios: Cenario[], ativo: number): void {
  const container = document.getElementById("cenarios-container");
  if (!container) return;
  container.innerHTML = cenarios.map((c, i) => `
    <div class="cenario-card ${i === ativo ? "ativo" : ""}" onclick="window._selecionarCenario(${i})">
      <div class="cenario-label">${c.label}</div>
      <div class="cenario-val">${c.result.numPaineis} <small>painéis</small></div>
      <div class="cenario-poupanca">${formatarEuros(c.result.poupancaAnual)}/ano</div>
      <div class="cenario-bar-track"><div class="cenario-bar-fill" style="width:${Math.min(c.result.coberturaPct, 100)}%"></div></div>
      <div class="cenario-sub">${c.result.coberturaPct}% cobertura · ${c.result.paybackAnos}a payback</div>
    </div>
  `).join("");
}

// ── BÚSSOLA ───────────────────────────────────────────────────────────────────

let orientacaoAtual = 180;

function initBussola(): void {
  const canvas = document.getElementById("bussola-canvas") as HTMLCanvasElement | null;
  if (!canvas) return;
  const ctx = canvas.getContext("2d")!;
  desenharBussola(ctx, orientacaoAtual);

  canvas.addEventListener("click", (e) => {
    const rect  = canvas.getBoundingClientRect();
    const cx    = canvas.width / 2, cy = canvas.height / 2;
    const dx    = e.clientX - rect.left - cx;
    const dy    = e.clientY - rect.top  - cy;
    orientacaoAtual = Math.round((Math.atan2(dy, dx) * 180 / Math.PI + 90 + 360) % 360);
    desenharBussola(ctx, orientacaoAtual);
    atualizarLabelOrientacao();
  });
}

function atualizarLabelOrientacao(): void {
  const label = document.getElementById("orientacao-label");
  if (!label) return;
  const dirs = ["N","NE","E","SE","S","SO","O","NO"];
  const dir  = dirs[Math.round(orientacaoAtual / 45) % 8];
  const ef   = Math.round(calcularOrientacao(orientacaoAtual) * 100);
  label.textContent = `${dir} (${orientacaoAtual}°) — Eficiência: ${ef}%`;
}

function desenharBussola(ctx: CanvasRenderingContext2D, angulo: number): void {
  const W = ctx.canvas.width, H = ctx.canvas.height;
  const cx = W / 2, cy = H / 2, r = Math.min(cx, cy) - 6;
  ctx.clearRect(0, 0, W, H);

  // Gradiente solar de fundo
  for (let i = 0; i < 360; i++) {
    const rad = (i - 90) * Math.PI / 180;
    const ef  = calcularOrientacao(i);
    const g   = Math.round(ef * 210);
    const re  = Math.round((1 - ef) * 200);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r - 2, rad, rad + (Math.PI * 2 / 360) + 0.02);
    ctx.closePath();
    ctx.fillStyle = `rgba(${re},${g},80,0.20)`;
    ctx.fill();
  }

  // Anel exterior
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(26,46,74,0.12)";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Marcações
  ([["N", 0], ["E", 90], ["S", 180], ["O", 270]] as [string, number][]).forEach(([d, a]) => {
    const rad = (a - 90) * Math.PI / 180;
    ctx.font = `bold 9px DM Sans`;
    ctx.fillStyle = d === "S" ? "#1aad7e" : "rgba(26,46,74,0.45)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(d, cx + (r - 13) * Math.cos(rad), cy + (r - 13) * Math.sin(rad));
  });

  // Seta
  const rad  = (angulo - 90) * Math.PI / 180;
  const tipX = cx + (r - 20) * Math.cos(rad);
  const tipY = cy + (r - 20) * Math.sin(rad);
  ctx.beginPath();
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(cx + 9 * Math.cos(rad + Math.PI / 2), cy + 9 * Math.sin(rad + Math.PI / 2));
  ctx.lineTo(cx + 9 * Math.cos(rad - Math.PI / 2), cy + 9 * Math.sin(rad - Math.PI / 2));
  ctx.closePath();
  ctx.fillStyle = "#2DDBA4";
  ctx.fill();

  // Centro
  ctx.beginPath();
  ctx.arc(cx, cy, 4, 0, Math.PI * 2);
  ctx.fillStyle = "#0f1e32";
  ctx.fill();
}

// ── MAPA REGIÕES ──────────────────────────────────────────────────────────────

const REGIOES: Record<string, { loc: Localizacao; label: string; hsp: number }> = {
  "norte":    { loc: "norte",            label: "Norte",    hsp: 3.8 },
  "centro":   { loc: "centro",           label: "Centro",   hsp: 4.2 },
  "lisboa":   { loc: "lisboa",           label: "Lisboa",   hsp: 4.7 },
  "alentejo": { loc: "alentejo-algarve", label: "Alentejo", hsp: 5.0 },
  "algarve":  { loc: "alentejo-algarve", label: "Algarve",  hsp: 5.2 },
};

function initMapa(): void {
  document.querySelectorAll<SVGElement>(".regiao-path").forEach(el => {
    el.addEventListener("click", () => {
      const key  = el.dataset.regiao!;
      const info = REGIOES[key];
      if (!info) return;

      document.querySelectorAll<SVGElement>(".regiao-path").forEach(r => r.classList.remove("selected"));
      el.classList.add("selected");

      const select = document.getElementById("input-localizacao") as HTMLSelectElement;
      if (select) select.value = info.loc;

      const label = document.getElementById("map-selected-label");
      if (label) label.textContent = `${info.label} — ${info.hsp}h sol pico/dia`;
    });
  });
}

// ── INIT ──────────────────────────────────────────────────────────────────────

// ✅ referência global ao handler — evita adicionar listeners duplicados
let _btnHandler: (() => void) | null = null;

export function initSolarMatch(): void {
  const btnCalcular   = document.getElementById("btn-calcular") as HTMLButtonElement;
  const resultSection = document.getElementById("solar-result") as HTMLElement;

  initMapa();
  initBussola();
  atualizarLabelOrientacao();

  (window as any)._selecionarCenario = (idx: number) => {
    if (!cenariosAtuais[idx]) return;
    renderCenarios(cenariosAtuais, idx);
    renderResultado(cenariosAtuais[idx].result);
  };

  // Mostrar resultado guardado se existir
  const guardado = carregarResultado();
  if (guardado) {
    renderResultado(guardado);
    resultSection.style.display = "block";
  }

  // ✅ Remove listener antigo antes de adicionar novo
  if (_btnHandler && btnCalcular) {
    btnCalcular.removeEventListener("click", _btnHandler);
  }

  _btnHandler = () => {
    const input = lerFormulario();
    if (!input) return;

    const result = calcularSolar(input);
    guardarResultado(result);

    // ✅ Green score absoluto — não acumula a cada recálculo
    localStorage.setItem(SCORE_KEY, String(Math.min(SCORE_BASE + result.greenScoreDelta, 100)));

    cenariosAtuais = calcularCenarios(input);
    renderCenarios(cenariosAtuais, 1);

    // renderizar imediatamente e fazer scroll
    resultSection.style.display = "block";
    renderResultado(result);

    // flash visual: esconde, força reflow, mostra
    resultSection.style.transition = "none";
    resultSection.style.opacity = "0";
    void (resultSection as HTMLElement).offsetHeight; // força reflow
    resultSection.style.transition = "opacity 0.35s ease";
    resultSection.style.opacity = "1";

    resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  btnCalcular?.addEventListener("click", _btnHandler);
}

function lerFormulario(): SolarInput | null {
  const area      = parseFloat((document.getElementById("input-area")        as HTMLInputElement)?.value);
  const consumo   = parseFloat((document.getElementById("input-consumo")     as HTMLInputElement)?.value);
  const telhado   = (document.getElementById("input-telhado")                as HTMLSelectElement)?.value as TipoTelhado;
  const localizacao = (document.getElementById("input-localizacao")          as HTMLSelectElement)?.value as Localizacao;

  if (!area || !consumo || area <= 0 || consumo <= 0) {
    alert("Por favor preenche todos os campos corretamente.");
    return null;
  }

  return { areaM2: area, consumoMensalKwh: consumo, tipoTelhado: telhado, localizacao, orientacaoGraus: orientacaoAtual };
}