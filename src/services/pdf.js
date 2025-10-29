// Geração simples de PDF com jsPDF
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { renderComplianceBarImage, renderSeverityPieImage, pickTopFailures } from './charts.js';

function addTitle(doc, text) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(text, 14, 20);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
}

function addExecutiveSummary(doc, diagnosis, yStart = 40) {
  if (!diagnosis || !diagnosis.areas) return yStart;
  let y = yStart;
  doc.setFont('helvetica', 'bold');
  doc.text('Sumário Executivo', 14, y);
  y += 10;
  const pw = doc.internal.pageSize.getWidth();
  const barX = 14;
  const barW = pw - 28;
  doc.setFont('helvetica', 'normal');
  const areaKeys = Object.keys(diagnosis.areas);
  areaKeys.forEach((key) => {
    const a = diagnosis.areas[key];
    const label = key.toUpperCase();
    const pct = Math.max(0, Math.min(100, a.weightedScore || 0));
    // Label
    doc.text(`${label}: ${pct}%`, 14, y);
    y += 6;
    // Bar background
    doc.setDrawColor(200);
    doc.setFillColor(240);
    doc.rect(barX, y, barW, 6, 'FD');
    // Bar value
    const w = (barW * pct) / 100;
    const color = pct >= 85 ? [0, 180, 0] : pct >= 60 ? [230, 180, 0] : [220, 0, 0];
    doc.setFillColor(...color);
    doc.rect(barX, y, w, 6, 'F');
    y += 12;
    if (y > 800) { doc.addPage(); y = 40; }
  });
  return y;
}

function addSection(doc, title, lines, yStart) {
  let y = yStart;
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  lines.forEach(line => {
    const splitted = doc.splitTextToSize(line, 180);
    doc.text(splitted, 14, y);
    y += 6 + (splitted.length - 1) * 6;
    if (y > 280) {
      doc.addPage();
      y = 20;
    }
  });
  return y;
}

function sectionLinesFromSummary(summary, interpretation, enabledAreas) {
  const linesBy = {};
  const modules = summary?.modules || {};
  if (enabledAreas.endpoint) {
    const rt = modules.comOSCERTSS || {};
    const wrs = modules.comOSCEWRS || {};
    const ips = modules.comOSCE_IVPAgent || {};
    const sch = modules.comOSCESSS || {};
    linesBy.Endpoint = [
      `Real-time: ${rt.enable ? 'ativado' : 'desativado'}`,
      `IntelliScan: ${rt.intelliScan ? 'on' : 'off'}`,
      `Varredura rede: ${rt.scanNetwork ? 'on' : 'off'}`,
      `USB Boot: ${rt.usbBootScan ? 'on' : 'off'}`,
      `Desligamento: ${rt.scanShutdown ? 'on' : 'off'}`,
      `WebRep: ${(wrs.urlFilterInOffice || wrs.urlFilterOutOffice || wrs.httpsPluginInOffice) ? 'on' : 'off'}`,
      `Agendada: ${sch.enable ? 'on' : 'off'}`,
      `IPS: ${ips.vulnerabilityShieldState === 1 ? 'on' : 'off'}`,
    ];
    if (summary?.interpretation) {
      linesBy.Endpoint.push('');
      linesBy.Endpoint.push('Interpretação resumida:');
      linesBy.Endpoint.push(...summary.interpretation.split('\n'));
    }
  }
  if (enabledAreas.server) {
    const ips = modules.comOSCE_IVPAgent || {};
    const sm = modules.comOSCESM || {};
    linesBy.Server = [
      `IPS: ${ips.vulnerabilityShieldState === 1 ? 'on' : 'off'}`,
      `SmartScan: ${sm.cloudScanType ? 'ativado' : 'desativado'}`,
    ];
  }
  if (enabledAreas.cec) {
    linesBy.CEC = [
      'Antispam, Entrada/Saída, Phishing e DMARC conforme configuração atual.',
    ];
  }
  if (enabledAreas.cgep) {
    linesBy.CGEP = [
      'SPF, DKIM, TLS e Sandbox conforme configuração atual.',
    ];
  }
  if (enabledAreas.ddi) {
    linesBy.DDI = [
      'Sandbox, Tráfego, IoC e Atualizações conforme configuração atual.',
    ];
  }
  return linesBy;
}

function decorateAllPages(doc, opts = {}) {
  const pages = doc.getNumberOfPages();
  const title = opts.title || 'Relatório de Segurança';
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    // Header
    try {
      if (opts.logoDataUrl) {
        doc.addImage(opts.logoDataUrl, 'PNG', 14, 10, 20, 20);
      }
    } catch {}
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(title, 40, 24);
    // Footer
    const pageInfo = `Página ${i}/${pages}`;
    const footerLeft = opts.footerText || (opts.meta?.orgName ? `Org: ${opts.meta.orgName}` : '');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const ph = doc.internal.pageSize.getHeight();
    const pw = doc.internal.pageSize.getWidth();
    doc.text(footerLeft, 14, ph - 20);
    const textWidth = doc.getTextWidth(pageInfo);
    doc.text(pageInfo, pw - 14 - textWidth, ph - 20);
  }
}

export async function generatePdfFromSummary(summary, interpretation, enabledAreas, filename = 'report.pdf', options = {}) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  addTitle(doc, options.title || 'PoC Report - Resultado de Análise');
  let y = 40;
  if (options.diagnosis) {
    y = addExecutiveSummary(doc, options.diagnosis, y);
    y += 8;
  }
  const linesBy = sectionLinesFromSummary(summary, interpretation, enabledAreas);
  const keys = Object.keys(linesBy);
  for (const key of keys) {
    y = addSection(doc, key, linesBy[key], y);
    y += 8;
    if (y > 800) {
      doc.addPage();
      y = 40;
    }
  }
  decorateAllPages(doc, options);
  doc.save(filename);
  return true;
}

export async function generatePdfByCapture(elementId = 'section-preview', filename = 'report_capture.pdf', options = {}) {
  const el = document.getElementById(elementId);
  if (!el) throw new Error('Elemento não encontrado: ' + elementId);
  const canvas = await html2canvas(el, { scale: 2 });
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = canvas.width;
  const imgHeight = canvas.height;
  const ratio = Math.min(pageWidth / imgWidth, pageHeight / imgHeight);
  const w = imgWidth * ratio;
  const h = imgHeight * ratio;
  const x = (pageWidth - w) / 2;
  const y = 10;
  pdf.addImage(imgData, 'PNG', x, y, w, h);
  decorateAllPages(pdf, options);
  pdf.save(filename);
  return true;
}

// Novo: PDF Executivo com capa, resumo, gráficos e recomendações
export async function generateExecutivePdf(summary, diagnosis, meta = {}) {
  if (!diagnosis || !summary) throw new Error('Dados insuficientes para gerar PDF executivo');
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const title = 'Vision One — Health Check Report';
  const warnings = [];

  // Capa
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text(title, 40, 60);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  const org = meta?.orgName || '-';
  const owner = meta?.ownerName || '-';
  const env = meta?.environment || '-';
  const date = meta?.reportDate || new Date().toISOString().slice(0,10);
  const score = diagnosis?.overall?.weightedScore ?? 0;
  const level = diagnosis?.overall?.level || 'N/A';
  const lines = [
    `Organização: ${org}`,
    `Responsável: ${owner}`,
    `Ambiente: ${env}`,
    `Data: ${date}`,
    `Score Geral: ${score}%`,
    `Conformidade: ${level}`,
  ];
  let y = 100;
  for (const l of lines) { doc.text(l, 40, y); y += 18; }

  // Resumo Executivo
  doc.addPage();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Resumo Executivo', 40, 60);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  const statusTxt = score >= 85
    ? `Ambiente com alta conformidade (${score}%). Manter boas práticas e revisar itens de severidade média/baixa.`
    : score >= 60
      ? `Conformidade moderada (${score}%). Priorizar correções de severidade alta e média para elevar o score.`
      : `Baixa conformidade (${score}%). Endereçar imediatamente falhas críticas e implementar recomendações prioritárias.`;
  const wrap = doc.splitTextToSize(statusTxt, 480);
  doc.text(wrap, 40, 90);

  // Top 3 achados e próximos passos
  const top3 = pickTopFailures(diagnosis, 3);
  doc.setFont('helvetica', 'bold'); doc.text('Top 3 Achados e Próximos Passos', 40, 130);
  doc.setFont('helvetica', 'normal');
  let yTop = 150;
  top3.forEach((it, idx) => {
    const line1 = `${idx+1}. [${it.area.toUpperCase()}] ${it.name} — Severidade: ${it.severity}`;
    const recLines = doc.splitTextToSize(`Próximo passo: ${it.recommendation}`, 480);
    doc.text(line1, 40, yTop); yTop += 16;
    doc.text(recLines, 40, yTop); yTop += (recLines.length * 14) + 8;
    if (yTop > 760) { doc.addPage(); yTop = 60; }
  });

  // Gráfico de barras — Compliance por área
  doc.addPage();
  doc.setFont('helvetica', 'bold'); doc.setFontSize(16);
  doc.text('Compliance por Área', 40, 60);
  try {
    const url = await renderComplianceBarImage(diagnosis);
    doc.addImage(url, 'PNG', 40, 80, 520, 280);
  } catch (e) {
    warnings.push('Falha ao gerar gráfico de barras');
    doc.setFont('helvetica', 'normal');
    doc.text('Não foi possível gerar o gráfico de barras.', 40, 90);
  }

  // Gráfico de pizza — Severidade
  doc.addPage();
  doc.setFont('helvetica', 'bold'); doc.setFontSize(16);
  doc.text('Distribuição de Falhas por Severidade', 40, 60);
  try {
    const url2 = await renderSeverityPieImage(diagnosis);
    doc.addImage(url2, 'PNG', 140, 100, 360, 300);
  } catch (e) {
    warnings.push('Falha ao gerar gráfico de pizza');
    doc.setFont('helvetica', 'normal');
    doc.text('Não foi possível gerar o gráfico de pizza.', 40, 90);
  }

  // Tabela com Top Falhas (10)
  doc.addPage();
  doc.setFont('helvetica', 'bold'); doc.setFontSize(16);
  doc.text('Top Falhas', 40, 60);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(11);
  const top10 = pickTopFailures(diagnosis, 10);
  let yTbl = 90;
  for (const it of top10) {
    const head = `[${it.area.toUpperCase()}] ${it.name} (${it.severity})`;
    const rec = doc.splitTextToSize(it.recommendation || '-', 480);
    doc.text(head, 40, yTbl); yTbl += 14;
    doc.text(rec, 40, yTbl); yTbl += (rec.length * 12) + 8;
    if (yTbl > 760) { doc.addPage(); yTbl = 60; }
  }

  // Recomendações Prioritárias por Severidade
  doc.addPage();
  doc.setFont('helvetica', 'bold'); doc.setFontSize(16);
  doc.text('Recomendações Prioritárias', 40, 60);
  doc.setFont('helvetica', 'normal');
  const bySev = { high: [], medium: [], low: [] };
  Object.keys(diagnosis.failures).forEach(area => {
    (diagnosis.failures[area]||[]).forEach(it => {
      bySev[it.severity]?.push({ area, ...it });
    });
  });
  let yRec = 90;
  for (const sev of ['high','medium','low']) {
    const title = sev === 'high' ? 'Alta' : sev === 'medium' ? 'Média' : 'Baixa';
    doc.setFont('helvetica', 'bold'); doc.text(`Severidade ${title}`, 40, yRec); yRec += 16;
    doc.setFont('helvetica', 'normal');
    const items = bySev[sev];
    if (!items || items.length === 0) {
      doc.text('Sem recomendações.', 40, yRec); yRec += 14; continue;
    }
    for (const it of items) {
      const line = `• [${it.area.toUpperCase()}] ${it.name}: ${it.recommendation}`;
      const wrapped = doc.splitTextToSize(line, 480);
      doc.text(wrapped, 40, yRec);
      yRec += (wrapped.length * 12) + 8;
      if (yRec > 760) { doc.addPage(); yRec = 60; }
    }
    yRec += 6;
    if (yRec > 760) { doc.addPage(); yRec = 60; }
  }

  // Decoração (cabeçalho/rodapé com título e data)
  decorateAllPages(doc, { title, footerText: `Data: ${date}`, meta });
  const fn = `VisionOne_HealthCheck_Executive_Report_${org}.pdf`;
  doc.save(fn);
  return { ok: true, warnings };
}