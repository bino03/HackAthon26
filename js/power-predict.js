/**
 * PowerPredict - Gráfico animado de consumo energético
 * Gera dados sintéticos dos últimos 30 dias com tendência + ruído aleatório
 * 
 * @typedef {Object} ConsumptionData
 * @property {number} day
 * @property {string} date
 * @property {number} consumption
 * @property {boolean} isForecast
 */

class PowerPredictor {
  constructor() {
    this.baseConsumption = 8;
    this.trendFactor = 0.15;
    this.noiseLevel = 2.5;
    this.seasonalVariation = 1.2;
  }

  /**
   * Gera dados sintéticos realistas de consumo
   * @param {number} days - Número de dias (padrão: 30)
   * @param {number} historicalDays - Dias de histórico (resto é previsão)
   * @returns {Array} Array de dados de consumo
   */
  generateConsumptionData(days = 30, historicalDays = 20) {
    const today = new Date();
    const data = [];

    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - (days - i - 1));

      // Tendência crescente
      const trend = (i / days) * this.trendFactor;

      // Padrão semanal (fins de semana consomem mais)
      const dayOfWeek = date.getDay();
      const weekendBonus = [0, 5, 6].includes(dayOfWeek) ? 1.3 : 1;

      // Variação sazonal (inverno mais consumo)
      const month = date.getMonth();
      const seasonalFactor = Math.sin((month * Math.PI) / 6 + Math.PI / 3) * 0.5 + 1;

      // Ruído aleatório realista
      const noise = (Math.random() - 0.5) * this.noiseLevel;

      // Consumo final
      const consumption = Math.max(
        4,
        this.baseConsumption * (1 + trend) * weekendBonus * seasonalFactor + noise
      );

      data.push({
        day: i + 1,
        date: this.formatDate(date),
        consumption: parseFloat(consumption.toFixed(2)),
        isForecast: i >= historicalDays,
      });
    }

    return data;
  }

  /**
   * Renderiza o gráfico SVG dinamicamente
   * @param {Array} data - Dados de consumo
   * @param {string} containerId - ID do container
   */
  renderChart(data, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const svgWidth = 300;
    const svgHeight = 120;
    const padding = 5;

    // Calcular escala
    const maxConsumption = Math.max(...data.map((d) => d.consumption), 15);
    const minConsumption = Math.min(...data.map((d) => d.consumption), 4);
    const range = maxConsumption - minConsumption;

    const graphHeight = svgHeight - padding * 2;
    const graphWidth = svgWidth - padding * 2;
    const pointSpacing = graphWidth / (data.length - 1);

    // Separar histórico e previsão
    const historicalData = data.filter((d) => !d.isForecast);
    const forecastData = data.filter((d) => d.isForecast);

    // Criar SVG
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", `0 0 ${svgWidth} ${svgHeight}`);
    svg.setAttribute("preserveAspectRatio", "none");

    // Grid lines
    for (let i = 0; i <= 3; i++) {
      const y = (svgHeight / 3) * i;
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", "0");
      line.setAttribute("y1", String(y));
      line.setAttribute("x2", String(svgWidth));
      line.setAttribute("y2", String(y));
      line.setAttribute("stroke", "rgba(26,46,74,0.05)");
      line.setAttribute("stroke-width", "1");
      svg.appendChild(line);
    }

    // Gradient definitions
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");

    const blueGrad = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "linearGradient"
    );
    blueGrad.setAttribute("id", "blueGrad");
    blueGrad.setAttribute("x1", "0");
    blueGrad.setAttribute("y1", "0");
    blueGrad.setAttribute("x2", "0");
    blueGrad.setAttribute("y2", "1");

    const stop1 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    stop1.setAttribute("offset", "0%");
    stop1.setAttribute("stop-color", "#2563eb");
    stop1.setAttribute("stop-opacity", "0.3");
    blueGrad.appendChild(stop1);

    const stop2 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    stop2.setAttribute("offset", "100%");
    stop2.setAttribute("stop-color", "#2563eb");
    stop2.setAttribute("stop-opacity", "0");
    blueGrad.appendChild(stop2);
    defs.appendChild(blueGrad);

    const greenGrad = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "linearGradient"
    );
    greenGrad.setAttribute("id", "greenGrad");
    greenGrad.setAttribute("x1", "0");
    greenGrad.setAttribute("y1", "0");
    greenGrad.setAttribute("x2", "0");
    greenGrad.setAttribute("y2", "1");

    const stop3 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    stop3.setAttribute("offset", "0%");
    stop3.setAttribute("stop-color", "#2DDBA4");
    stop3.setAttribute("stop-opacity", "0.3");
    greenGrad.appendChild(stop3);

    const stop4 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    stop4.setAttribute("offset", "100%");
    stop4.setAttribute("stop-color", "#2DDBA4");
    stop4.setAttribute("stop-opacity", "0");
    greenGrad.appendChild(stop4);
    defs.appendChild(greenGrad);

    svg.appendChild(defs);

    // Função para converter valor para Y
    const valueToY = (value) => {
      return (
        svgHeight - padding - ((value - minConsumption) / range) * graphHeight
      );
    };

    // Desenhar área preenchida do histórico
    if (historicalData.length > 0) {
      let pathData = `M${padding},${valueToY(historicalData[0].consumption)}`;

      for (let i = 1; i < historicalData.length; i++) {
        const x = padding + i * pointSpacing;
        const y = valueToY(historicalData[i].consumption);
        pathData += ` L${x.toFixed(2)},${y.toFixed(2)}`;
      }

      // Fechar a área
      const lastX = padding + (historicalData.length - 1) * pointSpacing;
      pathData += ` L${lastX},${svgHeight - padding} L${padding},${svgHeight - padding} Z`;

      const areaPath = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
      );
      areaPath.setAttribute("d", pathData);
      areaPath.setAttribute("fill", "url(#blueGrad)");
      svg.appendChild(areaPath);

      // Linha do histórico
      let lineData = `M${padding},${valueToY(historicalData[0].consumption)}`;
      for (let i = 1; i < historicalData.length; i++) {
        const x = padding + i * pointSpacing;
        const y = valueToY(historicalData[i].consumption);
        lineData += ` L${x.toFixed(2)},${y.toFixed(2)}`;
      }

      const line = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
      );
      line.setAttribute("d", lineData);
      line.setAttribute("fill", "none");
      line.setAttribute("stroke", "#2563eb");
      line.setAttribute("stroke-width", "2");
      line.setAttribute("stroke-linecap", "round");
      line.setAttribute("stroke-linejoin", "round");
      svg.appendChild(line);
    }

    // Desenhar linha de previsão (tracejada)
    if (forecastData.length > 0) {
      const startIdx = historicalData.length - 1;
      const startX = padding + startIdx * pointSpacing;
      const startY = valueToY(historicalData[historicalData.length - 1].consumption);

      let forecastPathData = `M${startX},${startY}`;

      for (let i = 0; i < forecastData.length; i++) {
        const x =
          padding + (startIdx + i + 1) * pointSpacing;
        const y = valueToY(forecastData[i].consumption);
        forecastPathData += ` L${x.toFixed(2)},${y.toFixed(2)}`;
      }

      const forecastLine = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
      );
      forecastLine.setAttribute("d", forecastPathData);
      forecastLine.setAttribute("fill", "none");
      forecastLine.setAttribute("stroke", "#2DDBA4");
      forecastLine.setAttribute("stroke-width", "2");
      forecastLine.setAttribute("stroke-dasharray", "5,3");
      forecastLine.setAttribute("stroke-linecap", "round");
      forecastLine.setAttribute("stroke-linejoin", "round");
      svg.appendChild(forecastLine);

      // Área preenchida da previsão
      let forecastAreaData = forecastPathData + ` L${padding + (startIdx + forecastData.length) * pointSpacing},${svgHeight - padding} L${startX},${svgHeight - padding} Z`;
      const forecastArea = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
      );
      forecastArea.setAttribute("d", forecastAreaData);
      forecastArea.setAttribute("fill", "url(#greenGrad)");
      svg.appendChild(forecastArea);
    }

    // Linha divisória (hoje)
    if (historicalData.length > 0 && historicalData.length < data.length) {
      const dividerX = padding + historicalData.length * pointSpacing;
      const divider = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line"
      );
      divider.setAttribute("x1", String(dividerX));
      divider.setAttribute("y1", "10");
      divider.setAttribute("x2", String(dividerX));
      divider.setAttribute("y2", String(svgHeight - 10));
      divider.setAttribute("stroke", "rgba(26,46,74,0.15)");
      divider.setAttribute("stroke-width", "1");
      divider.setAttribute("stroke-dasharray", "4,3");
      svg.appendChild(divider);

      const label = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text"
      );
      label.setAttribute("x", String(dividerX + 2));
      label.setAttribute("y", "22");
      label.setAttribute("font-size", "8");
      label.setAttribute("fill", "rgba(26,46,74,0.4)");
      label.setAttribute("font-family", "DM Sans");
      label.textContent = "Hoje";
      svg.appendChild(label);
    }

    // Calcular média de consumo para detectar picos
    const avgConsumption = data.reduce((sum, d) => sum + d.consumption, 0) / data.length;
    const peakThreshold = avgConsumption * 1.3; // 30% acima da média
    
    // Identificar picos
    const peakDays = data.filter(d => d.consumption > peakThreshold);

    // Adicionar pontos interativos no gráfico
    data.forEach((d, index) => {
      const x = padding + index * pointSpacing;
      const y = valueToY(d.consumption);
      
      // Verificar se é um pico
      const isPeak = d.consumption > peakThreshold;

      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("cx", String(x));
      circle.setAttribute("cy", String(y));
      circle.setAttribute("r", "3.5");
      
      // Cor diferente para picos
      if (isPeak) {
        circle.setAttribute("fill", "#ff6b6b"); // Vermelho para picos
      } else {
        circle.setAttribute("fill", d.isForecast ? "#2DDBA4" : "#2563eb");
      }
      
      circle.setAttribute("stroke", "white");
      circle.setAttribute("stroke-width", "1.5");
      circle.setAttribute("cursor", "pointer");
      circle.setAttribute("class", "chart-point");
      
      // Marcar como pico
      circle.dataset.isPeak = isPeak;
      circle.dataset.date = d.date;
      circle.dataset.consumption = d.consumption;
      circle.dataset.x = x;

      // Event listeners para tooltip e animação
      circle.addEventListener("mouseover", (e) => {
        const container = document.getElementById("chart-svg-container");
        let tooltip = container.querySelector(".chart-tooltip");
        
        if (!tooltip) {
          tooltip = document.createElement("div");
          tooltip.className = "chart-tooltip";
          container.appendChild(tooltip);
        }
        
        // Calcular posição relativa ao SVG
        const svg = circle.ownerSVGElement;
        const svgRect = svg.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const cx = parseFloat(circle.getAttribute("cx"));
        const cy = parseFloat(circle.getAttribute("cy"));
        
        // Mostrar tooltip com conteúdo
        const isPeak = circle.dataset.isPeak === "true";
        const warningIcon = isPeak ? "⚠️ " : "";
        tooltip.innerHTML = `${warningIcon}<strong>${d.date}</strong><br/>${d.consumption} kWh`;
        
        // Posicionar relativo ao container
        tooltip.style.left = (cx - 65) + "px";
        tooltip.style.top = (cy - 50) + "px";
        tooltip.classList.add("visible");

        // Destacar ponto - crescer a bolinha
        circle.setAttribute("r", "6");
        circle.setAttribute("stroke-width", "2.5");
        circle.style.filter = "drop-shadow(0 0 6px rgba(37, 99, 235, 0.6))";
      });

      circle.addEventListener("mousemove", (e) => {
        const container = document.getElementById("chart-svg-container");
        const tooltip = container.querySelector(".chart-tooltip");
        if (!tooltip || !tooltip.classList.contains("visible")) return;
        
        // Seguir movimento do rato
        const svg = circle.ownerSVGElement;
        const cx = parseFloat(circle.getAttribute("cx"));
        const cy = parseFloat(circle.getAttribute("cy"));
        
        tooltip.style.left = (cx - 65) + "px";
        tooltip.style.top = (cy - 50) + "px";
      });

      circle.addEventListener("mouseout", () => {
        const container = document.getElementById("chart-svg-container");
        const tooltip = container.querySelector(".chart-tooltip");
        if (tooltip) {
          tooltip.classList.remove("visible");
        }
        circle.setAttribute("r", "3.5");
        circle.setAttribute("stroke-width", "1.5");
        circle.style.filter = "none";
      });

      svg.appendChild(circle);
    });

    // Adicionar animação ao SVG
    svg.setAttribute("class", "animated-chart");
    svg.style.animation = "drawChart 1.5s ease-out forwards";

    // Limpar e inserir
    container.innerHTML = "";
    container.appendChild(svg);

    // Criar tooltip dentro do container do gráfico
    let tooltip = container.querySelector(".chart-tooltip");
    if (!tooltip) {
      tooltip = document.createElement("div");
      tooltip.id = "chart-tooltip";
      tooltip.className = "chart-tooltip";
      container.appendChild(tooltip);
    }

    // Adicionar animação CSS se não existir
    this.injectAnimationStyles();
    
    // Mostrar alertas de picos
    this.displayPeakAlerts(peakDays, avgConsumption);

    // Renderizar heatmap por hora
    this.renderHourlyHeatmap(data, "heatmap-grid");
  }

  /**
   * Calcula estatísticas dos dados
   * @param {Array} data - Dados de consumo
   * @returns {Object} Objeto com estatísticas
   */
  calculateStats(data) {
    const consumptions = data.map((d) => d.consumption);
    const forecast = data.filter((d) => d.isForecast).map((d) => d.consumption);
    const historical = data.filter((d) => !d.isForecast).map((d) => d.consumption);

    const totalConsumption = consumptions.reduce((a, b) => a + b, 0);
    const avgConsumption = totalConsumption / consumptions.length;
    const avgForecast = forecast.reduce((a, b) => a + b, 0) / forecast.length;
    const trend = forecast.length > 0 ? avgForecast - (historical[historical.length - 1] || avgConsumption) : 0;

    const costPerKwh = 0.145; // Tarifa em €/kWh
    const totalCost = totalConsumption * costPerKwh;
    const monthlyForecast = consumptions.slice(-10).reduce((a, b) => a + b, 0) / 10 * 30; // Estimativa para 30 dias

    return {
      totalConsumption: parseFloat(totalConsumption.toFixed(2)),
      avgConsumption: parseFloat(avgConsumption.toFixed(2)),
      avgForecast: parseFloat(avgForecast.toFixed(2)),
      trend: parseFloat(trend.toFixed(2)),
      totalCost: parseFloat(totalCost.toFixed(2)),
      monthlyForecast: parseFloat(monthlyForecast.toFixed(2)),
      monthlyCostEstimate: parseFloat((monthlyForecast * costPerKwh).toFixed(2)),
    };
  }

  /**
   * Mostra alertas de consumo elevado (picos)
   */
  displayPeakAlerts(peakDays, avgConsumption) {
    const alertContainer = document.getElementById("peak-alerts-container");
    if (!alertContainer) return;

    if (peakDays.length === 0) {
      alertContainer.innerHTML = '<p style="text-align: center; color: #86efac; padding: 16px; font-size: 12px;">✓ Sem picos de consumo detectados</p>';
      return;
    }

    let alertsHTML = '<div style="padding: 12px;">';
    
    peakDays.forEach(day => {
      const excess = (day.consumption - avgConsumption).toFixed(1);
      const excessPercent = ((excess / avgConsumption) * 100).toFixed(0);
      
      alertsHTML += `
        <div style="background: rgba(255, 107, 107, 0.1); border-left: 3px solid #ff6b6b; padding: 10px 12px; margin-bottom: 8px; border-radius: 4px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <strong style="color: #ff6b6b;">⚠️ ${day.date}</strong>
              <div style="font-size: 11px; color: #666; margin-top: 2px;">${day.consumption} kWh (+${excessPercent}%)</div>
            </div>
            <div style="font-size: 11px; color: #ff6b6b; font-weight: 600;">+${excess} kWh</div>
          </div>
        </div>
      `;
    });

    alertsHTML += '</div>';
    alertContainer.innerHTML = alertsHTML;
  }

  /**
   * Gera um perfil horario sintetico com picos de consumo
   */
  generateHourlyProfile(data) {
    const avgDaily = data.reduce((sum, d) => sum + d.consumption, 0) / data.length;
    const profile = [];

    for (let hour = 0; hour < 24; hour++) {
      let base = 0.6;

      // Manha (7-10)
      if (hour >= 7 && hour <= 10) base = 1.1;

      // Tarde (12-15)
      if (hour >= 12 && hour <= 15) base = 1.0;

      // Noite (18-22) - pico principal
      if (hour >= 18 && hour <= 22) base = 1.35;

      // Madrugada (0-5)
      if (hour >= 0 && hour <= 5) base = 0.45;

      const noise = (Math.random() - 0.5) * 0.15;
      const value = Math.max(0.3, avgDaily * base * (1 + noise));
      profile.push(parseFloat(value.toFixed(2)));
    }

    return profile;
  }

  /**
   * Renderiza heatmap de consumo por hora
   */
  renderHourlyHeatmap(data, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const profile = this.generateHourlyProfile(data);
    const minVal = Math.min(...profile);
    const maxVal = Math.max(...profile);
    const range = Math.max(1, maxVal - minVal);

    container.innerHTML = "";

    profile.forEach((value, hour) => {
      const intensity = (value - minVal) / range; // 0..1
      const hue = 120 - Math.round(120 * intensity); // verde -> vermelho
      const color = `hsl(${hue}, 85%, 55%)`;

      const cell = document.createElement("div");
      cell.className = "heatmap-cell";
      cell.style.background = color;
      cell.title = `${hour}h - ${value} kWh`;
      container.appendChild(cell);
    });
  }

  /**
   * Atualiza os valores nas cards de previsão
   * @param {Array} data - Dados de consumo
   */
  updateForecastCards(data) {
    const stats = this.calculateStats(data);
    const forecast = data.filter((d) => d.isForecast);
    
    // Consumo previsto
    const consumoPrevistoEl = document.querySelector('.forecast-grid .forecast-item:nth-child(1) .f-val');
    if (consumoPrevistoEl) {
      consumoPrevistoEl.innerHTML = `${stats.monthlyForecast.toFixed(0)}<small> kWh</small>`;
    }

    // Custo estimado
    const custoEstimadoEl = document.querySelector('.forecast-grid .forecast-item:nth-child(2) .f-val');
    if (custoEstimadoEl) {
      custoEstimadoEl.innerHTML = `${stats.monthlyCostEstimate.toFixed(0)}<small> €</small>`;
    }

    // Média diária
    const mediariaEl = document.querySelector('.forecast-grid .forecast-item:nth-child(3) .f-val');
    if (mediariaEl) {
      mediariaEl.innerHTML = `${stats.avgForecast.toFixed(1)}<small> kWh</small>`;
    }

    // Custo médio/dia
    const custoMedioDiaEl = document.querySelector('.forecast-grid .forecast-item:nth-child(4) .f-val');
    if (custoMedioDiaEl) {
      custoMedioDiaEl.innerHTML = `${(stats.avgForecast * 0.145).toFixed(2)}<small> €</small>`;
    }

    // Atualizar tendência
    const trendIndicator = stats.trend > 0 ? '▲' : '▼';
    const trendClass = stats.trend > 0 ? 'trend-up' : 'trend-down';
    const trendPercentage = ((Math.abs(stats.trend) / stats.avgConsumption) * 100).toFixed(0);
    
    const consumoTrendEl = document.querySelector('.forecast-grid .forecast-item:nth-child(1) .f-trend');
    if (consumoTrendEl) {
      consumoTrendEl.className = trendClass;
      consumoTrendEl.textContent = `${trendIndicator} ${Math.abs(stats.trend).toFixed(1)} kWh`;
    }

    const custoTrendEl = document.querySelector('.forecast-grid .forecast-item:nth-child(2) .f-trend');
    if (custoTrendEl) {
      custoTrendEl.className = trendClass;
      custoTrendEl.textContent = `${trendIndicator} ${(Math.abs(stats.trend) * 0.145).toFixed(2)} €`;
    }

    // Atualizar meta mensal
    this.updateMonthlyGoal(stats);
  }

  /**
   * Atualiza o card de meta mensal
   */
  updateMonthlyGoal(stats) {
    const storedGoal = parseInt(localStorage.getItem("powerPredictGoal"), 10);
    const goalTarget = Number.isFinite(storedGoal) && storedGoal > 0 ? storedGoal : 280; // kWh
    const current = stats.monthlyForecast;
    const percent = Math.min(100, Math.round((current / goalTarget) * 100));
    const remaining = Math.max(0, Math.round(goalTarget - current));

    const currentEl = document.getElementById('goal-current');
    const targetEl = document.getElementById('goal-target');
    const percentEl = document.getElementById('goal-percent');
    const remainingEl = document.getElementById('goal-remaining');
    const fillEl = document.getElementById('goal-fill');

    if (currentEl) currentEl.textContent = `${Math.round(current)} kWh`;
    if (targetEl) targetEl.textContent = `Meta: ${goalTarget} kWh`;
    if (percentEl) percentEl.textContent = `${percent}% da meta`;
    if (remainingEl) remainingEl.textContent = remaining === 0 ? 'Meta atingida' : `Faltam ${remaining} kWh`;
    if (fillEl) fillEl.style.width = `${percent}%`;

    const inputEl = document.getElementById('goal-input');
    if (inputEl && !inputEl.value) inputEl.value = String(goalTarget);
  }

  /**
   * Injeta CSS de animação (privado)
   */
  injectAnimationStyles() {
    if (document.getElementById("power-predict-styles")) return;

    const style = document.createElement("style");
    style.id = "power-predict-styles";
    style.textContent = `
      @keyframes drawChart {
        from {
          opacity: 0;
          filter: blur(2px);
        }
        to {
          opacity: 1;
          filter: blur(0);
        }
      }
      
      .animated-chart {
        animation: drawChart 1.5s ease-out forwards;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Formata data (privado)
   * @param {Date} date - Data a formatar
   * @returns {string} Data formatada
   */
  formatDate(date) {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    return `${day}/${month}`;
  }
}

// Inicializar quando o DOM estiver pronto
document.addEventListener("DOMContentLoaded", () => {
  const predictor = new PowerPredictor();

  // Gerar dados: 30 dias totais, 20 dias de histórico
  const data = predictor.generateConsumptionData(30, 20);

  // Renderizar gráfico
  predictor.renderChart(data, "chart-svg-container");

  // Atualizar cards de previsão
  predictor.updateForecastCards(data);

  // Configurar meta mensal editavel
  const goalInput = document.getElementById("goal-input");
  const goalSave = document.getElementById("goal-save");
  const storedGoal = parseInt(localStorage.getItem("powerPredictGoal"), 10);
  if (goalInput && Number.isFinite(storedGoal) && storedGoal > 0) {
    goalInput.value = String(storedGoal);
  }
  if (goalSave && goalInput) {
    goalSave.addEventListener("click", () => {
      const value = parseInt(goalInput.value, 10);
      if (!Number.isFinite(value) || value <= 0) return;
      localStorage.setItem("powerPredictGoal", String(value));
      predictor.updateMonthlyGoal(predictor.calculateStats(data));
    });
  }

  // Função para gerar labels do eixo X
  function generateXLabels(days) {
    const today = new Date();
    const labels = [];
    
    if (days === 7) {
      // Para 7 dias: dia 1, dia 4, dia 7
      for (let i = 1; i <= 7; i += 3) {
        const date = new Date(today);
        date.setDate(date.getDate() - (days - i));
        labels.push(`${date.getDate()} ${['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][date.getMonth()]}`);
      }
      labels.push(`${today.getDate()} ${['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][today.getMonth()]}`);
    } else if (days === 30) {
      // Para 30 dias: dia 1, 8, 15, 22, 31
      const dates = [1, 8, 15, 22, 31];
      dates.forEach(day => {
        if (day <= days) {
          const date = new Date(today);
          date.setDate(date.getDate() - (days - day));
          labels.push(`${date.getDate()} Mar`);
        }
      });
    } else if (days === 90) {
      // Para 90 dias: a cada 3 semanas
      const dates = [1, 23, 45, 67, 90];
      dates.forEach(day => {
        if (day <= days) {
          const date = new Date(today);
          date.setDate(date.getDate() - (days - day));
          labels.push(`${date.getDate()} ${['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][date.getMonth()]}`);
        }
      });
    }
    
    return labels;
  }

  // Função para atualizar o gráfico baseado no período selecionado
  function updateChart(days) {
    let historicalDays;
    if (days === 7) {
      historicalDays = 5;
    } else if (days === 30) {
      historicalDays = 20;
    } else {
      historicalDays = 60;
    }

    // Esconder tooltip antes de atualizar
    const tooltip = document.getElementById("chart-tooltip");
    if (tooltip) {
      tooltip.classList.remove("visible");
    }

    const newData = predictor.generateConsumptionData(days, historicalDays);
    predictor.renderChart(newData, "chart-svg-container");
    predictor.updateForecastCards(newData);

    // Atualizar heatmap horario
    predictor.renderHourlyHeatmap(newData, "heatmap-grid");

    // Atualizar labels do eixo X
    const labelsContainer = document.getElementById("chart-x-labels");
    const labels = generateXLabels(days);
    labelsContainer.innerHTML = labels.map(label => `<span>${label}</span>`).join('');
  }

  // Adicionar event listeners aos botões das abas
  const chartTabs = document.querySelectorAll(".chart-tab");
  chartTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      // Remover classe ativa de todos os botões
      chartTabs.forEach(t => t.classList.remove("active"));
      
      // Adicionar classe ativa ao botão clicado
      tab.classList.add("active");

      // Atualizar gráfico
      const days = parseInt(tab.getAttribute("data-days"));
      updateChart(days);
    });
  });
});
