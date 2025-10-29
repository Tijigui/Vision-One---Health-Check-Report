import React from 'react';

export default function MetaSection({ meta, setMeta }) {
  const update = (key, value) => setMeta(prev => ({ ...prev, [key]: value }));
  return (
    <div className="meta-section">
      <div className="grid">
        <label>Organização
          <input type="text" value={meta.orgName || ''} onChange={e => update('orgName', e.target.value)} />
        </label>
        <label>Responsável
          <input type="text" value={meta.ownerName || ''} onChange={e => update('ownerName', e.target.value)} />
        </label>
        <label>Ambiente
          <select value={meta.environment || 'Produção'} onChange={e => update('environment', e.target.value)}>
            <option value="Produção">Produção</option>
            <option value="Homologação">Homologação</option>
            <option value="Dev">Dev</option>
          </select>
        </label>
        <label>Data do relatório
          <input type="date" value={meta.reportDate || ''} onChange={e => update('reportDate', e.target.value)} />
        </label>
        <label>ID de negócio
          <input type="text" value={meta.businessId || ''} onChange={e => update('businessId', e.target.value)} />
        </label>
      </div>
    </div>
  );
}