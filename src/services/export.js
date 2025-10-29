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