import React, { useMemo, useState } from 'react';
import Collapsible from './Collapsible.jsx';
import { computeBenchmark } from '../services/benchmark.js';
import { useLocalStorage } from '../hooks/useLocalStorage.js';

const AREAS = [
  { key: 'endpoint', label: 'Endpoint' },
  { key: 'server', label: 'Server' },
  { key: 'cec', label: 'CEC' },
  { key: 'cgep', label: 'CGEP' },
  { key: 'ddi', label: 'DDI' },
];

function SeverityChip({ sev }) {
  const color = sev === 'high' ? 'error' : sev === 'medium' ? 'warn' : 'success';
  const label = sev === 'high' ? 'Alta' : sev === 'medium' ? 'Média' : 'Baixa';
  const icon = sev === 'high' ? '⛔' : sev === 'medium' ? '⚠' : '✔';
  const aria = `Severidade ${label}`;
  return <span className={`chip ${color}`} role="status" aria-label={aria} title={aria}><span className="icon">{icon}</span><span className="label">{label}</span></span>;
}

export default function AnalysisSection({ summary, enabledAreas }) {
  const [severity, setSeverity] = useState('all');
  const [weights, setWeights] = useLocalStorage('severityWeights', { high: 3, medium: 2, low: 1 });
  const [catalogOverride, setCatalogOverride] = useLocalStorage('bestPracticesOverride', null);
  const diag = useMemo(() => (summary ? computeBenchmark(summary, enabledAreas, weights, catalogOverride) : null), [summary, enabledAreas, weights, catalogOverride]);
  if (!summary) {
    return (
      <div aria-live="polite">
        <div className="skeleton text" />
        <div className="skeleton block" />
      </div>
    );
  }
  const activeAreas = AREAS.filter(a => enabledAreas?.[a.key]);
  const counts = useMemo(() => {
    const acc = { high: 0, medium: 0, low: 0, total: 0 };
    for (const a of activeAreas) {
      const items = diag?.failures?.[a.key] || [];
      for (const it of items) {
        acc.total += 1;
        if (it.severity === 'high') acc.high += 1;
        else if (it.severity === 'medium') acc.medium += 1;
        else acc.low += 1;
      }
    }
    return acc;
  }, [diag, enabledAreas]);

  const filterBySev = item => severity === 'all' ? true : item.severity === severity;

  return (
    <div className="analysis-section">
      <div className="grid" role="region" aria-label="Controle de Filtro e Contadores">
        <div className="row" style={{gap:12, alignItems:'center'}}>
          <strong aria-live="polite">Total: {counts.total}</strong>
          <span className="badge warn" title={`Alta: ${counts.high}`}>Alta: {counts.high}</span>
          <span className="badge warn" title={`Média: ${counts.medium}`}>Média: {counts.medium}</span>
          <span className="badge success" title={`Baixa: ${counts.low}`}>Baixa: {counts.low}</span>
          {diag && (
            <span className="badge" title={`Compliance geral: ${diag.overall.weightedScore}%`} style={{marginLeft:8}}>Compliance: {diag.overall.weightedScore}% ({diag.overall.level})</span>
          )}
        </div>
        <label>Severidade
          <div className="segmented" role="tablist" aria-label="Filtro de severidade">
            <button role="tab" aria-selected={severity==='all'} className={`btn ${severity==='all'?'active':''}`} onClick={() => setSeverity('all')}>Todas</button>
            <button role="tab" aria-selected={severity==='high'} className={`btn ${severity==='high'?'active':''}`} onClick={() => setSeverity('high')}>⛔ Alta</button>
            <button role="tab" aria-selected={severity==='medium'} className={`btn ${severity==='medium'?'active':''}`} onClick={() => setSeverity('medium')}>⚠ Média</button>
            <button role="tab" aria-selected={severity==='low'} className={`btn ${severity==='low'?'active':''}`} onClick={() => setSeverity('low')}>✔ Baixa</button>
          </div>
        </label>
        <div className="row" style={{gap:12, alignItems:'center'}} aria-label="Configuração de pesos de severidade">
          <strong>Pesos</strong>
          <label>Alta <input type="number" min="1" max="10" value={weights.high} onChange={e => setWeights({ ...weights, high: Number(e.target.value)||0 })} style={{width:56}} /></label>
          <label>Média <input type="number" min="1" max="10" value={weights.medium} onChange={e => setWeights({ ...weights, medium: Number(e.target.value)||0 })} style={{width:56}} /></label>
          <label>Baixa <input type="number" min="1" max="10" value={weights.low} onChange={e => setWeights({ ...weights, low: Number(e.target.value)||0 })} style={{width:56}} /></label>
        </div>
        <div className="row" style={{gap:12, alignItems:'center'}} aria-label="Catálogo de boas práticas dinâmico">
          <strong>Catálogo</strong>
          <input type="file" accept="application/json" onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            try {
              const text = await f.text();
              const obj = JSON.parse(text);
              setCatalogOverride(obj);
            } catch (err) {
              console.error(err);
              alert('Arquivo inválido.');
            }
          }} />
          {catalogOverride && <button className="btn" onClick={() => setCatalogOverride(null)}>Limpar catálogo</button>}
        </div>
        <div className="row" style={{gap:12, alignItems:'center'}} aria-label="Carregamento por URL">
          <strong>Carregar por URL</strong>
          <input type="url" placeholder="https://.../bestPractices.json" onKeyDown={async (e) => {
            if (e.key === 'Enter') {
              const url = e.currentTarget.value;
              if (!url) return;
              try {
                const res = await fetch(url);
                const obj = await res.json();
                setCatalogOverride(obj);
              } catch (err) {
                console.error(err);
                alert('Não foi possível carregar o catálogo.');
              }
            }
          }} style={{width:320}} />
          <button className="btn" onClick={async (e) => {
            const input = e.currentTarget.previousSibling;
            const url = input && input.value;
            if (!url) return;
            try {
              const res = await fetch(url);
              const obj = await res.json();
              setCatalogOverride(obj);
            } catch (err) {
              console.error(err);
              alert('Não foi possível carregar o catálogo.');
            }
          }}>Carregar</button>
        </div>
      </div>
      {activeAreas.map(a => (
        <Collapsible key={a.key} title={`Análise ${a.label}`} defaultOpen={false}>
          <ul className="analysis-list">
            {(diag?.failures?.[a.key] || []).filter(filterBySev).map(item => (
              <li key={item.key} className="analysis-item">
                <div className="row">
                  <strong>{item.name}</strong>
                  <SeverityChip sev={item.severity} />
                </div>
                <div className="desc">{item.recommendation}</div>
              </li>
            ))}
            {(diag?.failures?.[a.key] || []).filter(filterBySev).length === 0 && (
              <li className="analysis-empty">Nenhuma recomendação para o filtro selecionado.</li>
            )}
          </ul>
        </Collapsible>
      ))}
    </div>
  );
}