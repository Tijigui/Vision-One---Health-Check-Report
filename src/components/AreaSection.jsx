import React from 'react';

function mkChip(label, status = 'warn') {
  const icon = status === 'success' ? '✔' : status === 'error' ? '⛔' : '⚠';
  const aria = `${label} ${status === 'success' ? 'ativo' : status === 'error' ? 'crítico' : 'atenção'}`;
  return <span className={`chip ${status}`} role="status" aria-label={aria} title={aria}><span className="icon">{icon}</span><span className="label">{label}</span></span>;
}

function endpointChips(modules) {
  const rt = modules?.comOSCERTSS || {};
  const wrs = modules?.comOSCEWRS || {};
  const ips = modules?.comOSCE_IVPAgent || {};
  const sch = modules?.comOSCESSS || {};
  return [
    mkChip('Real-time', rt.enable ? 'success' : 'warn'),
    mkChip('IntelliScan', rt.intelliScan ? 'success' : 'warn'),
    mkChip('Rede', rt.scanNetwork ? 'success' : 'warn'),
    mkChip('USB Boot', rt.usbBootScan ? 'success' : 'warn'),
    mkChip('Desligamento', rt.scanShutdown ? 'success' : 'warn'),
    mkChip('WebRep', (wrs.urlFilterInOffice || wrs.urlFilterOutOffice || wrs.httpsPluginInOffice) ? 'success' : 'warn'),
    mkChip('Agendada', sch.enable ? 'success' : 'warn'),
    mkChip('IPS', ips.vulnerabilityShieldState === 1 ? 'success' : 'warn'),
  ];
}

function serverChips(modules) {
  const ips = modules?.comOSCE_IVPAgent || {};
  const sm = modules?.comOSCESM || {};
  return [
    mkChip('IPS', ips.vulnerabilityShieldState === 1 ? 'success' : 'warn'),
    mkChip('SmartScan', sm.cloudScanType ? 'success' : 'warn'),
  ];
}

function cecChips(summary) {
  const s = summary?.cec || {};
  return [
    mkChip('Antispam', s.antispam ? 'success' : 'warn'),
    mkChip('Entrada', s.inbound ? 'success' : 'warn'),
    mkChip('Saída', s.outbound ? 'success' : 'warn'),
    mkChip('Phishing', s.phishing ? 'success' : 'warn'),
    mkChip('DMARC', s.dmarc ? 'success' : 'warn'),
  ];
}

function cgepChips(summary) {
  const s = summary?.cgep || {};
  return [
    mkChip('SPF', s.spf ? 'success' : 'warn'),
    mkChip('DKIM', s.dkim ? 'success' : 'warn'),
    mkChip('TLS', s.tls ? 'success' : 'warn'),
    mkChip('Sandbox', s.sandbox ? 'success' : 'warn'),
  ];
}

function ddiChips(summary) {
  const s = summary?.ddi || {};
  return [
    mkChip('Sandbox', s.sandbox ? 'success' : 'warn'),
    mkChip('Tráfego', s.traffic ? 'success' : 'warn'),
    mkChip('IoC', s.ioc ? 'success' : 'warn'),
    mkChip('Atualizações', s.updates ? 'success' : 'warn'),
  ];
}

export default function AreaSection({ areaKey, label, summary, interpretation, diagnosis }) {
  const modules = summary?.modules || {};
  const chips = areaKey === 'endpoint' ? endpointChips(modules)
    : areaKey === 'server' ? serverChips(modules)
    : areaKey === 'cec' ? cecChips(summary)
    : areaKey === 'cgep' ? cgepChips(summary)
    : ddiChips(summary);

  const interp = interpretation?.[areaKey] || (areaKey === 'endpoint' ? summary?.interpretation : '') || `Resumo de ${label}...`;
  const score = diagnosis?.areas?.[areaKey]?.weightedScore;
  const status = diagnosis?.areas?.[areaKey]?.status;

  return (
    <div className="preview-block">
      <div className="preview-header">
        <h3>{label}</h3>
        <div className="chips">{chips}</div>
        {typeof score === 'number' && status !== 'n/a' && (
          <span className="badge" title={`Compliance ${label}: ${score}%`}>Compliance: {score}%</span>
        )}
        {status === 'n/a' && (
          <span className="badge" title={`Sem dados para ${label}`}>Sem dados</span>
        )}
      </div>
      <p>{interp}</p>
    </div>
  );
}