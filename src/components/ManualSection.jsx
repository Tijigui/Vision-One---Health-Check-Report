import React from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage.js';
import cecSchema from '../data/schemas/cec.json';
import cgepSchema from '../data/schemas/cgep.json';
import ddiSchema from '../data/schemas/ddi.json';

function BoolField({ label, value, onChange }) {
  return (
    <label style={{display:'inline-flex', alignItems:'center', gap:8}}>
      {label}
      <input type="checkbox" checked={!!value} onChange={e => onChange(e.target.checked)} />
    </label>
  );
}

function Section({ title, schema, value, onChange }) {
  const keys = Object.keys(schema.properties || {});
  return (
    <div className="preview-block" style={{padding:12}}>
      <div className="preview-header"><strong>{title}</strong></div>
      <div className="grid" style={{gap:8}}>
        {keys.filter(k => schema.properties[k].type === 'boolean').map((k) => (
          <BoolField key={k} label={k} value={value?.[k]} onChange={(v) => onChange({ ...value, [k]: v })} />
        ))}
        <label style={{display:'block'}}>
          Observações
          <textarea value={value?.notes || ''} onChange={(e) => onChange({ ...value, notes: e.target.value })} rows={3} style={{width:'100%'}} />
        </label>
      </div>
    </div>
  );
}

export default function ManualSection() {
  const [cec, setCec] = useLocalStorage('manualCEC', { enabled: false });
  const [cgep, setCgep] = useLocalStorage('manualCGEP', { enabled: false });
  const [ddi, setDdi] = useLocalStorage('manualDDI', { enabled: false });

  return (
    <div className="manual-section">
      <p>Entrada manual mínima para CEC, CGEP e DDI (sem integração automática).</p>
      <div className="preview-grid">
        <Section title="CEC" schema={cecSchema} value={cec} onChange={setCec} />
        <Section title="CGEP" schema={cgepSchema} value={cgep} onChange={setCgep} />
        <Section title="DDI" schema={ddiSchema} value={ddi} onChange={setDdi} />
      </div>
    </div>
  );
}