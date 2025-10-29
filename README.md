# Vision One - Health Check Report (React App)

> Automated Trend Micro policy health check and compliance report generator built with React + Vite.

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Build: Vite](https://img.shields.io/badge/Build-Vite-brightgreen)
![React: 19.1](https://img.shields.io/badge/React-19.1-blue)

Aplicação React + Vite para Health Check e diagnóstico de compliance, com importação de `.cmpolicy`, benchmark de boas práticas e geração de relatórios.

## Visão Geral
- Importa políticas Apex One/Endpoint (`.cmpolicy` JSON) e extrai módulos relevantes.
- Compara o estado atual com um catálogo de boas práticas por área (Endpoint, Server, CEC, CGEP, DDI).
- Exibe recomendações filtráveis por severidade e calcula o compliance por área e geral.
- Exporta JSON e PDF (estruturado, por captura e executivo), com metadados da organização.
- Catálogo de boas práticas dinâmico (upload de arquivo ou carregamento por URL).
- Pesos de severidade configuráveis (alta/média/baixa) para cálculo de compliance.
- Entradas manuais para CEC/CGEP/DDI integradas ao diagnóstico.
- Persistência em `localStorage` e reset por querystring (`?reset=1`).

Imagem ilustrativa (exemplo):

![Dashboard/PDF Preview](./public/vite.svg)

## Objetivo
Padronizar a coleta, validação e diagnóstico do ambiente, gerando relatório claro de conformidade e recomendações priorizadas, alinhado ao “estado ideal” desejado.

## Fluxo de ponta a ponta
1. Importação: selecione/arraste um `.cmpolicy`. A aplicação usa `parseCmpolicyText` para montar `summary.modules`, realça o que é relevante e gera uma interpretação textual.
2. Meta: preencha `orgName`, `ownerName`, `environment`, `reportDate`, `businessId` (persistem localmente).
3. Áreas: visualize chips por área (ex.: Real-time, WebRep, IPS) e um badge “Compliance: XX%”. Se não houver dados aplicáveis, exibe “Sem dados”.
4. Análise: o motor de benchmark calcula falhas por severidade e o compliance geral. Use o filtro de severidade para priorizar.
5. Manual: preencha dados de CEC/CGEP/DDI quando não houver `.cmpolicy` (os valores persistem e entram no diagnóstico).
6. Modelos: baixe modelos JSON por área para coleta manual quando não há `.cmpolicy` (CEC/CGEP/DDI).
7. Análise: ajuste pesos de severidade e carregue um catálogo por arquivo ou URL para avaliar diferentes políticas.
8. Preview/Export: gere PDF estruturado, PDF por captura da grade de preview ou o novo PDF executivo com gráficos.

## Modelo de dados
- `summary.modules`: mapa por nome de componente (`comOSCERTSS`, `comOSCEWRS`, `comOSCE_IVPAgent`, etc.) com campos normalizados (booleanos/números).
- `summary.highlights`: flags rápidas (ex.: `realTimeEnabled`, `vulnerabilityShieldEnabled`).
- `summary.interpretation`: linhas de interpretação formatadas (Endpoint, Manual/Scheduled, WebRep, IPS, SmartScan).
- `meta`: `{ orgName, ownerName, environment, reportDate, businessId }`.
- `areas`: seleção de áreas habilitadas pelo usuário.
- `diagnosis`: resultado do benchmark (compliance geral/por área e lista de falhas por área).

## Catálogo de Boas Práticas
Arquivo: `src/data/bestPractices.json`
- Por área, define critérios com:
  - `required`: se é obrigatório.
  - `severity`: `high` | `medium` | `low`.
  - `name` e `recommendation`: rótulo e ação sugerida.
  - `source`: caminho de leitura em `summary` (suporta OR com `|`).
  - `equals`/`gt`: operadores para casos específicos (ex.: `vulnerabilityShieldState === 1`).

Override dinâmico:
- Aba "Análise" → seção "Catálogo":
  - Upload: selecione um arquivo `.json` com o catálogo.
  - URL: informe uma URL (`https://.../bestPractices.json`) e clique em "Carregar".
  - "Limpar catálogo" remove o override e volta ao catálogo padrão.

## Motor de Benchmark
Arquivo: `src/services/benchmark.js`
- Lê `bestPractices.json` e avalia cada critério contra `summary`.
- Pesa severidades (`high=3`, `medium=2`, `low=1`) para calcular `weightedScore` por área e geral.
- Permite configurar pesos de severidade via UI (persistidos em `localStorage`).
- Nível geral: `Green` (≥85), `Yellow` (≥60), `Red` (<60).
- Saída:
  - `overall`: `{ weightedScore, level }`.
  - `areas`: `{ total, passed, failed, score, weightedScore, applicable, status }` por área.
  - `failures`: lista de itens fora do padrão por área (com `severity` e `recommendation`).

## Serviços
- `src/services/cmpolicy.js`:
  - `parseCmpolicyText(text)`: parseia JSON `.cmpolicy` e retorna `summary`.
  - Normaliza componentes (`comOSCERTSS`, `comOSCEMSS`, `comOSCESSS`, `comOSCEBMS`, `comOSCEWRS`, `comOSCE_IVPAgent`, `comOSCESM`).
  - `interpretSummary`: gera linhas legíveis para preview/PDF.
- `src/services/pdf.js`:
  - `generatePdfFromSummary`: PDF estruturado por áreas, com título, cabeçalho/rodapé e meta.
  - `generatePdfByCapture`: captura um elemento (`#section-preview`) via `html2canvas` e salva como PDF.
  - `generateExecutivePdf(summary, diagnosis, meta)`: relatório executivo completo com capa, resumo, gráficos (barras por área e pizza por severidade), top falhas e recomendações por severidade.
- `src/services/charts.js`:
  - `renderComplianceBarImage(diagnosis)`: gera imagem base64 de gráfico de barras (Chart.js) para compliance por área.
  - `renderSeverityPieImage(diagnosis)`: gera imagem base64 de gráfico de pizza (Chart.js) com distribuição de falhas por severidade.
  - `pickTopFailures(diagnosis, max)`: utilitário para ordenar e selecionar as principais falhas.
- `src/services/export.js`:
  - `downloadJSON`, `downloadText`, `downloadBlob`.
  - `buildFullExport(summary, diagnosis, meta, settings, manualInputs)`: export completo com auditoria (hash, timestamps), diagnóstico, meta, configurações e entradas manuais.

## Componentes e UI
- `src/App.jsx`:
  - Layout com tabs: `Importação`, `Meta`, `Áreas`, `Análise`, `Modelos`, `Preview`.
  - Inclui a aba `Manual` para entradas CEC/CGEP/DDI.
  - Persistência via `useLocalStorage` (chaves: `policyText`, `policy`, `templateArea`, `areas`, `reportMeta`, `activeTab`).
  - `enabledAreas`: habilita áreas por seleção do usuário; usado no diagnóstico.
  - `diagnosis`: calculado com `computeBenchmark(effectiveSummary, enabledAreas)`.
  - Toolbar com i18n e export (JSON/PDF). Reset via `?reset=1` em `main.jsx`.
  - Na aba `Preview`, há um botão central "Gerar PDF Executivo" que utiliza `generateExecutivePdf` com dados reais (`summary`, `diagnosis`, `meta`).
- `components/MetaSection.jsx`: formulário de meta (`orgName`, `ownerName`, `environment`, `reportDate`, `businessId`).
- `components/AreaSection.jsx`: chips por área e badge de “Compliance: XX%”, com interpretação resumida.
- `components/AnalysisSection.jsx`: contadores por severidade, Compliance geral e lista de falhas filtrável.
  - Controles para pesos de severidade e carregamento dinâmico do catálogo (arquivo/URL).
- `components/TemplateExport.jsx`: baixa templates JSON por área.
- `components/ManualSection.jsx`: formulário mínimo para CEC/CGEP/DDI (persistência em `localStorage`).
- `components/I18nProvider.jsx`: textos i18n (`pt`, `en`) e seletor de idioma.
- `components/Collapsible.jsx`: agrupamento dobrável para listas na análise.

## Como rodar
- Requisitos: Node 18+.
- Por padrão, o servidor de desenvolvimento é iniciado em `http://localhost:5173` via Vite.
- Instalar dependências:

```
npm install
```

- Dev server:

```
npm run dev
```

- Build:

```
npm run build
```

- Limpar estado local: abrir com `http://localhost:5173/?reset=1`.
- Preview: `npm run preview`.
- Lint: `npm run lint`.

Dependências relevantes:
- `jspdf`, `html2canvas` para PDFs.
- `chart.js` para geração dos gráficos (renderizados em canvas invisível e inseridos como imagem no PDF executivo).

## Estrutura de pastas (React App)
- `src/App.jsx`: shell principal e orquestração de fluxos.
- `src/components/*`: UI por seção.
- `src/services/*`: parsing, benchmark, export e PDF.
- `src/services/charts.js`: helpers de gráficos (Chart.js) para uso no PDF executivo.
- `src/data/bestPractices.json`: catálogo de boas práticas.
- `src/hooks/useLocalStorage.js`: persistência simples.
- `src/main.jsx`: bootstrap e reset via querystring.

## Limitações e Assunções
- CEC/CGEP/DDI não são extraídos do `.cmpolicy`; exigem entrada manual (via templates) ou futura integração.
- `Application Control` (Server) é inferido via `comOSCEBMS.srpEnable` como proxy; ajuste conforme dados reais.
- O compliance geral pondera severidades; não reflete cobertura completa de todos recursos do produto.
 - Geração de gráficos depende do ambiente de navegador; se um gráfico falhar, o PDF executivo ainda é gerado com uma mensagem textual.

## Próximos Passos
- Gráfico de tendência de compliance (histórico via `localStorage`).
- Índice de seções (sumário) no PDF executivo.
- Alternar idioma (`pt`/`en`) no PDF.
- Comparação multi-política e histórico.

## Suporte a Idiomas
- `pt-BR` e `en-US` via `I18nProvider`.
- Textos ajustáveis em `components/I18nProvider.jsx`.

## Reset e Persistência
- Reset com `?reset=1` limpa `localStorage`/`sessionStorage`.
- Persistência automática das chaves usadas pelo app.

## Licença
[MIT License](./LICENSE)

---

## Como usar o PDF Executivo
1. Preencha `Meta` e gere/importe um `summary` (`.cmpolicy` ou entradas em `Manual`).
2. Vá em `Preview` e clique em `Gerar PDF Executivo`.
3. O PDF é gerado com:
   - Capa (org, responsável, ambiente, data, score e nível).
   - Resumo executivo (texto com status geral).
   - Gráfico de barras (compliance por área) e gráfico de pizza (falhas por severidade).
   - Top falhas (10) e recomendações por severidade.
   - Cabeçalho "Vision One — Health Check Report" e rodapé com data e paginação.
4. Nome do arquivo: `VisionOne_HealthCheck_Executive_Report_{orgName}.pdf`.
5. Se algum gráfico falhar, o app exibe um toast e o PDF inclui uma nota textual; a exportação não é interrompida.

---

## Exemplos e Fórmulas

### Exemplo de saída JSON (mini trecho)

```
{
  "overall": { "weightedScore": 82, "level": "Yellow" },
  "areas": {
    "Endpoint": { "score": 90 },
    "Server": { "score": 75 }
  }
}
```

### Cálculo de weightedScore

Fórmula:

```
WeightedScore = Σ(passed_weight) / Σ(total_weight)
```

Onde `weight` por severidade é configurável (padrão: `high=3`, `medium=2`, `low=1`). Exemplo simples:
- Em uma área com 2 itens `high` (1 passou, 1 falhou) e 1 item `medium` (passou):
  - `passed_weight = 1*3 + 1*2 = 5`
  - `total_weight = 2*3 + 1*2 = 8`
  - `weightedScore = 5/8 ≈ 62%`
