# Vision One — Health Check Report (React App)

Aplicação React + Vite para Health Check e diagnóstico de compliance, com importação de `.cmpolicy`, benchmark de boas práticas e geração de relatórios.

## Visão Geral
- Importa políticas Apex One/Endpoint (`.cmpolicy` JSON) e extrai módulos relevantes.
- Compara o estado atual com um catálogo de boas práticas por área (Endpoint, Server, CEC, CGEP, DDI).
- Exibe recomendações filtráveis por severidade e calcula o compliance por área e geral.
- Exporta JSON e PDF (estruturado e por captura), com metadados da organização.
- Persistência em `localStorage` e reset por querystring (`?reset=1`).

## Objetivo
Padronizar a coleta, validação e diagnóstico do ambiente, gerando relatório claro de conformidade e recomendações priorizadas, alinhado ao “estado ideal” desejado.

## Fluxo de ponta a ponta
1. Importação: selecione/arraste um `.cmpolicy`. A aplicação usa `parseCmpolicyText` para montar `summary.modules`, realça o que é relevante e gera uma interpretação textual.
2. Meta: preencha `orgName`, `ownerName`, `environment`, `reportDate`, `businessId` (persistem localmente).
3. Áreas: visualize chips por área (ex.: Real-time, WebRep, IPS) e um badge “Compliance: XX%”. Se não houver dados aplicáveis, exibe “Sem dados”.
4. Análise: o motor de benchmark calcula falhas por severidade e o compliance geral. Use o filtro de severidade para priorizar.
5. Modelos: baixe modelos JSON por área para coleta manual quando não há `.cmpolicy` (CEC/CGEP/DDI).
6. Preview/Export: gere PDF estruturado a partir do summary ou PDF por captura da grade de preview.

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

## Motor de Benchmark
Arquivo: `src/services/benchmark.js`
- Lê `bestPractices.json` e avalia cada critério contra `summary`.
- Pesa severidades (`high=3`, `medium=2`, `low=1`) para calcular `weightedScore` por área e geral.
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
- `src/services/export.js`:
  - `downloadJSON`, `downloadText`, `downloadBlob`.

## Componentes e UI
- `src/App.jsx`:
  - Layout com tabs: `Importação`, `Meta`, `Áreas`, `Análise`, `Modelos`, `Preview`.
  - Persistência via `useLocalStorage` (chaves: `policyText`, `policy`, `templateArea`, `areas`, `reportMeta`, `activeTab`).
  - `enabledAreas`: habilita áreas por seleção do usuário; usado no diagnóstico.
  - `diagnosis`: calculado com `computeBenchmark(effectiveSummary, enabledAreas)`.
  - Toolbar com i18n e export (JSON/PDF). Reset via `?reset=1` em `main.jsx`.
- `components/MetaSection.jsx`: formulário de meta (`orgName`, `ownerName`, `environment`, `reportDate`, `businessId`).
- `components/AreaSection.jsx`: chips por área e badge de “Compliance: XX%”, com interpretação resumida.
- `components/AnalysisSection.jsx`: contadores por severidade, Compliance geral e lista de falhas filtrável.
- `components/TemplateExport.jsx`: baixa templates JSON por área.
- `components/I18nProvider.jsx`: textos i18n (`pt`, `en`) e seletor de idioma.
- `components/Collapsible.jsx`: agrupamento dobrável para listas na análise.

## Como rodar
- Requisitos: Node 18+.
- Instalar dependências (se necessário): `npm install`.
- Dev server: `npm run dev` → `http://localhost:5173/`.
- Limpar estado local: abrir com `http://localhost:5173/?reset=1`.
- Build: `npm run build`.
- Preview: `npm run preview`.
- Lint: `npm run lint`.

## Estrutura de pastas (React App)
- `src/App.jsx`: shell principal e orquestração de fluxos.
- `src/components/*`: UI por seção.
- `src/services/*`: parsing, benchmark, export e PDF.
- `src/data/bestPractices.json`: catálogo de boas práticas.
- `src/hooks/useLocalStorage.js`: persistência simples.
- `src/main.jsx`: bootstrap e reset via querystring.

## Limitações e Assunções
- CEC/CGEP/DDI não são extraídos do `.cmpolicy`; exigem entrada manual (via templates) ou futura integração.
- `Application Control` (Server) é inferido via `comOSCEBMS.srpEnable` como proxy; ajuste conforme dados reais.
- O compliance geral pondera severidades; não reflete cobertura completa de todos recursos do produto.

## Próximos Passos
- Formulários para CEC/CGEP/DDI e persistência, alimentando o diagnóstico.
- Incluir o compliance detalhado no PDF estruturado.
- Catálogo com variações por versão/ambiente e pesos configuráveis.
- Comparação multi-política e histórico.

## Suporte a Idiomas
- `pt-BR` e `en-US` via `I18nProvider`.
- Textos ajustáveis em `components/I18nProvider.jsx`.

## Reset e Persistência
- Reset com `?reset=1` limpa `localStorage`/`sessionStorage`.
- Persistência automática das chaves usadas pelo app.

## Licença
Sem licença definida. Ajuste conforme necessidade do projeto.
