# ⚡ GoldEnergy — App de Gestão de Energia Verde

> Projeto desenvolvido para hackathon. Aplicação mobile-first de gestão de energia renovável, com foco em sustentabilidade, monitorização social e simulação solar.

---

## 📱 Visão Geral

GoldEnergy é uma aplicação web progressiva desenhada com estética **iPhone 16** (393×852px), simulando uma app nativa de energia verde. O utilizador pode acompanhar o seu impacto ambiental, simular instalações solares, monitorizar familiares vulneráveis e gerir o seu contrato de eletricidade — tudo numa interface fluida e visualmente rica.

---

## 🗂️ Estrutura de Ficheiros

```
goldenergy/
├── index.html             # Ecrã principal — menu de módulos
├── styles.css             # Estilos globais partilhados por todas as páginas
│
├── green-score.html       # Módulo Green Score
├── green-score.js         # Lógica do Green Score (localStorage)
│
├── solar-match.html       # Módulo SolarMatch
├── solar-match.js         # Calculadora solar (compilado de solar-match.ts)
├── solar-match.ts         # Fonte TypeScript do SolarMatch
│
├── goldcare.html          # Módulo GoldCare
├── goldcare.js            # Lógica de monitorização de familiares
│
├── notifications.js       # Sistema de notificações global (injetado no index)
│
├── power-predict.html     # Módulo PowerPredict — previsão de consumo
├── faturas.html           # Módulo de faturas
├── contrato.html          # Detalhes do contrato
└── leituras.html          # Registo de leituras do contador
```

---

## 🧩 Módulos

### 🌍 My Green Score
Painel de impacto ambiental em tempo real, com dados dinâmicos lidos do `localStorage`.

- Gauge SVG animado com `stroke-dashoffset` e transição CSS de 1s
- Número animado com ease-out cúbico via `requestAnimationFrame`
- Histórico de 6 meses em barras, com o último mês atualizado dinamicamente
- Cards de impacto: CO₂ poupado, árvores equivalentes, % vs mês anterior
- **Solar Banner dinâmico** — se o utilizador já usou o SolarMatch, mostra os dados reais; caso contrário, sugere a simulação
- Integração com `localStorage` (`goldenergy_green_score`, `goldenergy_solar_result`)

---

### ☀️ SolarMatch
Simulador de painéis solares com algoritmo físico real.

**Inputs:**
- Área do telhado (m²)
- Consumo mensal médio (kWh)
- Tipo de telhado (inclinado sul/norte, plano, misto)
- Localização (Norte, Centro, Lisboa, Alentejo/Algarve)
- Orientação via bússola interativa (canvas)

**Features:**
- **Mapa SVG de Portugal** com 5 regiões clicáveis que atualizam a localização automaticamente
- **Bússola canvas** com gradiente de calor solar (verde=Sul, vermelho=Norte) e seta arrastável
- **3 cenários comparáveis** — Económico / Recomendado / Máximo — clicáveis, cada um atualiza todos os resultados
- **Gráfico SVG de payback** (15 anos) com área gradiente, linha de investimento e marcador de break-even
- Cálculo de CO₂ evitado, árvores equivalentes e delta do Green Score
- Persistência via `localStorage`

**Algoritmo:**
```
Produção/painel = kWp × HSP × 30 dias × 0.80 (PR) × eficiência_telhado × eficiência_orientação
```
Valores HSP por região: Norte 3.8 · Centro 4.2 · Lisboa 4.7 · Alentejo/Algarve 5.2 h/dia

---

### 💜 GoldCare
Módulo social de monitorização de consumo de idosos e famílias vulneráveis.

- **3 perfis de familiares** com estados distintos: crítico / aviso / normal
- Lista interativa com indicador de status, barra de consumo e contagem de alertas
- **Detalhe por familiar:**
  - Stats rápidos: consumo hoje, consumo normal, diferença %, temperatura da casa
  - Barra de consumo hoje vs normal com cor dinâmica
  - Estado dos 4 dispositivos (aquecedor, frigorífico, TV, fogão)
  - Alertas ativos com botão "Resolver" (remove com animação)
  - Gráfico SVG dos últimos 7 dias com linha de referência do consumo normal
  - Botão de contacto direto
- Seleção de familiar atualiza todo o detalhe sem recarregar

---

### 🔔 Notificações
Sistema global de notificações injetado no `index.html`.

- Painel deslizante a partir do topo com animação `cubic-bezier`, **confinado ao espaço do telemóvel** (posicionado dentro de `.phone`)
- Overlay escuro com fecho ao clicar fora
- 6 notificações agrupadas em "Novas" e "Anteriores"
- Cada notificação tem link direto para o módulo correspondente
- Badge com contagem de não lidas; desaparece ao abrir o painel
- Botão "Marcar lidas" limpa o badge

---

## 🛠️ Tecnologias

| Tecnologia | Uso |
|---|---|
| HTML5 + CSS3 | Estrutura e estilos de todas as páginas |
| Vanilla JavaScript | Lógica de todos os módulos (sem frameworks) |
| TypeScript | Fonte do SolarMatch (compilado para JS) |
| SVG | Gauge, gráfico de payback, gráfico histórico, mapa de Portugal |
| Canvas API | Bússola de orientação do SolarMatch |
| localStorage | Persistência de dados entre páginas |
| Google Fonts | Syne (títulos) + DM Sans (corpo) |
| CSS Animations | `fadeUp`, transições de opacidade, `stroke-dashoffset` |

---

## 🎨 Design System

```css
--navy-dark:   #0f1e32   /* fundo sidebar e headers */
--navy-mid:    #1e3a5f   /* gradientes */
--green:       #2DDBA4   /* cor primária de ação */
--green-dark:  #1aad7e   /* hover e destaques */
--gold:        #F5C842   /* acentos e SolarMatch */
--bg:          #f4f7fb   /* fundo geral */
--text-muted:  #7a8fa6   /* textos secundários */
```

**Tipografia:** `Syne` (800) para títulos e valores numéricos · `DM Sans` para corpo de texto

**Shell:** iPhone 16 — 393×852px, border-radius 54px, scroll interno por módulo

---

## 🚀 Como Correr

Não requer instalação nem servidor. Basta abrir o `index.html` diretamente no browser:

```bash
# Opção 1 — abrir diretamente
open index.html

# Opção 2 — servidor local simples (evita restrições CORS)
python3 -m http.server 8000
# → abrir http://localhost:8000
```

> **Nota:** O `solar-match.js` já está compilado e pronto a usar. Se editares o `solar-match.ts`, recompila com:
> ```bash
> tsc solar-match.ts --target ES2017 --module ES2015 --strict false
> ```

---

## 📊 Dados

Todos os dados são **sintéticos e estáticos**, gerados para demonstração. A persistência entre páginas é feita via `localStorage` com as seguintes chaves:

| Chave | Conteúdo |
|---|---|
| `goldenergy_solar_result` | Resultado do último cálculo SolarMatch |
| `goldenergy_green_score` | Score atual do utilizador (base 73) |

---

## 👥 Equipa

Projeto desenvolvido no âmbito de hackathon de energia verde.
