import React from 'react';

function mkChip(label, status = 'warn') {
  const icon = status === 'success' ? '✔' : status === 'error' ? '⛔' : '⚠';
  const aria = `${label} ${status === 'success' ? 'ativo' : status === 'error' ? 'crítico' : 'atenção'}`;
  return <span className={`chip ${status}`} role="status" aria-label={aria} title={aria}><span className="icon">{icon}</span><span className="label">{label}</span></span>;
}

function computeEndpointChipsFromModules(modules) {
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

function computeServerChipsFromModules(modules) {
  const ips = modules?.comOSCE_IVPAgent || {};
  const sm = modules?.comOSCESM || {};
  return [
    mkChip('IPS', ips.vulnerabilityShieldState === 1 ? 'success' : 'warn'),
    mkChip('SmartScan', sm.cloudScanType ? 'success' : 'warn'),
  ];
}

function computeCECChips(summary) {
  const s = summary?.cec || {};
  return [
    mkChip('Antispam', s.antispam ? 'success' : 'warn'),
    mkChip('Entrada', s.inbound ? 'success' : 'warn'),
    mkChip('Saída', s.outbound ? 'success' : 'warn'),
    mkChip('Phishing', s.phishing ? 'success' : 'warn'),
    mkChip('DMARC', s.dmarc ? 'success' : 'warn'),
  ];
}

function computeCGEPChips(summary) {
  const s = summary?.cgep || {};
  return [
    mkChip('SPF', s.spf ? 'success' : 'warn'),
    mkChip('DKIM', s.dkim ? 'success' : 'warn'),
    mkChip('TLS', s.tls ? 'success' : 'warn'),
    mkChip('Sandbox', s.sandbox ? 'success' : 'warn'),
  ];
}

function computeDDIChips(summary) {
  const s = summary?.ddi || {};
  return [
    mkChip('Sandbox', s.sandbox ? 'success' : 'warn'),
    mkChip('Tráfego', s.traffic ? 'success' : 'warn'),
    mkChip('IoC', s.ioc ? 'success' : 'warn'),
    mkChip('Atualizações', s.updates ? 'success' : 'warn'),
  ];
}

export default function Preview({ summary, interpretation, enabledAreas }) {
  const modules = summary?.modules;
  const hasSummary = !!summary;
  return (
    <section id="section-preview" className="card">
      <h2>Preview</h2>
      {!hasSummary ? (
        <p>Importe um arquivo de resumo JSON ou .cmpolicy para visualizar chips e interpretação.</p>
      ) : (
        <div className="preview-grid">
          {enabledAreas.endpoint && (
            <div className="preview-block">
              <div className="preview-header">
                <h3>Endpoint</h3>
                <div className="chips">{computeEndpointChipsFromModules(modules)}</div>
              </div>
              <p>{interpretation?.endpoint || summary?.interpretation || 'Resumo de Endpoint...'}</p>
            </div>
          )}
          {enabledAreas.server && (
            <div className="preview-block">
              <div className="preview-header">
                <h3>Server</h3>
                <div className="chips">{computeServerChipsFromModules(modules)}</div>
              </div>
              <p>{interpretation?.server || 'Resumo de Server...'}</p>
            </div>
          )}
          {enabledAreas.cec && (
            <div className="preview-block">
              <div className="preview-header">
                <h3>CEC</h3>
                <div className="chips">{computeCECChips(summary)}</div>
              </div>
              <p>{interpretation?.cec || 'Resumo de CEC...'}</p>
            </div>
          )}
          {enabledAreas.cgep && (
            <div className="preview-block">
              <div className="preview-header">
                <h3>CGEP</h3>
                <div className="chips">{computeCGEPChips(summary)}</div>
              </div>
              <p>{interpretation?.cgep || 'Resumo de CGEP...'}</p>
            </div>
          )}
          {enabledAreas.ddi && (
            <div className="preview-block">
              <div className="preview-header">
                <h3>DDI</h3>
                <div className="chips">{computeDDIChips(summary)}</div>
              </div>
              <p>{interpretation?.ddi || 'Resumo de DDI...'}</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}