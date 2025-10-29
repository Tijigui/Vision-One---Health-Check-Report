import React, { useState } from 'react';
import { downloadJSON } from '../services/export.js';

const AREA_OPTIONS = [
  { key: 'endpoint', label: 'Endpoint' },
  { key: 'server', label: 'Server' },
  { key: 'cec', label: 'CEC' },
  { key: 'cgep', label: 'CGEP' },
  { key: 'ddi', label: 'DDI' },
];

function buildTemplateForArea(key) {
  const tpl = {
    meta: { orgName: '', ownerName: '', environment: 'Produção', reportDate: '' },
    enabledAreas: {
      endpoint: key === 'endpoint',
      server: key === 'server',
      cec: key === 'cec',
      cgep: key === 'cgep',
      ddi: key === 'ddi',
    },
    [key]: key === 'endpoint' ? {
      realTime: true, behavior: true, webRep: true, scheduledScan: true,
      intelliScan: true, networkScan: true, usbBoot: true, shutdownScan: true,
      vulnerabilityShield: true, updateAge: 0, policy: true, notes: ''
    } : key === 'server' ? {
      ips: true, malware: true, appCtrl: true, agentVer: '', patching: 'Atualizado', notes: ''
    } : key === 'cec' ? {
      spam: true, incoming: true, outgoing: true, phishing: true, dmarc: true, notes: ''
    } : key === 'cgep' ? {
      spf: true, dkim: true, tls: true, sandbox: true, notes: ''
    } : {
      sandbox: true, traffic: true, ioc: true, updateAge: 0, notes: ''
    }
  };
  return tpl;
}

export default function TemplateExport() {
  const [area, setArea] = useState('endpoint');
  const handleDownload = () => {
    const tpl = buildTemplateForArea(area);
    downloadJSON(tpl, `${area}-policy-template.json`);
  };
  return (
    <div className="template-export">
      <div className="grid">
        <div>
          <label>Área
            <select value={area} onChange={e => setArea(e.target.value)}>
              {AREA_OPTIONS.map(o => (
                <option key={o.key} value={o.key}>{o.label}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="actions">
          <button className="btn" onClick={handleDownload}>Baixar modelo</button>
        </div>
      </div>
    </div>
  );
}