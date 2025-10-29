// Utilidades para exportar arquivos (JSON e texto)

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function downloadJSON(data, filename = 'report_summary.json') {
  const text = JSON.stringify(data, null, 2);
  const blob = new Blob([text], { type: 'application/json' });
  downloadBlob(blob, filename);
}

export function downloadText(text, filename = 'interpretation.txt') {
  const blob = new Blob([text], { type: 'text/plain' });
  downloadBlob(blob, filename);
}

// Simple non-crypto hash for audit trails
export function hashString(str) {
  let h = 0;
  for (let i = 0; i < (str || '').length; i++) {
    h = ((h << 5) - h) + str.charCodeAt(i);
    h |= 0;
  }
  return (h >>> 0).toString(16);
}

export function buildFullExport({ summary, diagnosis, meta, policyText, manualInputs = null, weights = null }) {
  const now = new Date();
  const audit = {
    analysisDate: now.toISOString(),
    policyHash: hashString(policyText || ''),
    policySize: (policyText || '').length,
    appVersion: 'v0.2',
  };
  return {
    meta,
    areas: summary?.areas || [],
    summary,
    diagnosis,
    manualInputs,
    settings: { severityWeights: weights },
    audit,
  };
}