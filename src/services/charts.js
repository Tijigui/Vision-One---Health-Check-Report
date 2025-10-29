import { Chart } from 'chart.js/auto';

function ensureCanvas(width = 800, height = 420) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.style.position = 'absolute';
  canvas.style.left = '-9999px';
  canvas.style.top = '-9999px';
  document.body.appendChild(canvas);
  return canvas;
}

function cleanup(canvas, chart) {
  try { chart && chart.destroy(); } catch {}
  try { canvas && canvas.remove(); } catch {}
}

export async function renderComplianceBarImage(diagnosis, width = 900, height = 500) {
  if (!diagnosis || !diagnosis.areas) throw new Error('diagnosis.areas ausente');
  const labels = Object.keys(diagnosis.areas);
  const data = labels.map(k => Math.max(0, Math.min(100, diagnosis.areas[k]?.weightedScore || 0)));
  const canvas = ensureCanvas(width, height);
  let chart;
  try {
    chart = new Chart(canvas.getContext('2d'), {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Compliance (%)',
          data,
          backgroundColor: data.map(v => v >= 85 ? 'rgba(0,180,0,0.7)' : v >= 60 ? 'rgba(230,180,0,0.7)' : 'rgba(220,0,0,0.7)'),
        }]
      },
      options: {
        responsive: false,
        animation: false,
        scales: {
          y: { beginAtZero: true, max: 100 }
        },
        plugins: { legend: { display: false }, title: { display: true, text: 'Compliance por Área' } }
      }
    });
    // aguardar uma batida de frame para render
    await new Promise(r => requestAnimationFrame(r));
    const url = chart.toBase64Image();
    return url;
  } finally {
    cleanup(canvas, chart);
  }
}

export async function renderSeverityPieImage(diagnosis, width = 700, height = 450) {
  if (!diagnosis || !diagnosis.failures) throw new Error('diagnosis.failures ausente');
  const acc = { high: 0, medium: 0, low: 0 };
  Object.keys(diagnosis.failures).forEach(area => {
    const arr = diagnosis.failures[area] || [];
    for (const it of arr) {
      if (it.severity === 'high') acc.high += 1;
      else if (it.severity === 'medium') acc.medium += 1;
      else acc.low += 1;
    }
  });
  const labels = ['Alta', 'Média', 'Baixa'];
  const data = [acc.high, acc.medium, acc.low];
  const colors = ['rgba(220,0,0,0.7)', 'rgba(230,180,0,0.7)', 'rgba(0,180,0,0.7)'];
  const canvas = ensureCanvas(width, height);
  let chart;
  try {
    chart = new Chart(canvas.getContext('2d'), {
      type: 'pie',
      data: { labels, datasets: [{ data, backgroundColor: colors }] },
      options: { responsive: false, animation: false, plugins: { title: { display: true, text: 'Falhas por Severidade' } } }
    });
    await new Promise(r => requestAnimationFrame(r));
    const url = chart.toBase64Image();
    return url;
  } finally {
    cleanup(canvas, chart);
  }
}

export function pickTopFailures(diagnosis, max = 10) {
  if (!diagnosis || !diagnosis.failures) return [];
  const all = [];
  for (const area of Object.keys(diagnosis.failures)) {
    for (const it of diagnosis.failures[area] || []) {
      all.push({ area, ...it });
    }
  }
  const rank = { high: 3, medium: 2, low: 1 };
  all.sort((a, b) => (rank[b.severity] - rank[a.severity]));
  return all.slice(0, max);
}