// Heurística simples de recomendações baseada nos módulos do resumo (.cmpolicy)
// Mantém-se próxima da lógica do app legado, mas adaptada aos dados disponíveis em summary.modules

function flagsFromModules(summary) {
  const modules = summary?.modules || {};
  const rt = modules.comOSCERTSS || {};
  const wrs = modules.comOSCEWRS || {};
  const ips = modules.comOSCE_IVPAgent || {};
  const sch = modules.comOSCESSS || {};
  const sm = modules.comOSCESM || {};
  const dc = modules.comTMWDNA || {}; // DDI/Deep Discovery (placeholder)
  // Endpoint flags
  const endpoint = {
    realTime: !!rt.enable,
    behavior: !!rt.intelliScan, // proxy para monitoramento/heurística
    webRep: !!(wrs.urlFilterInOffice || wrs.urlFilterOutOffice || wrs.httpsPluginInOffice),
    scheduledScan: !!sch.enable,
    networkScan: !!rt.scanNetwork,
    usbBoot: !!rt.usbBootScan,
    shutdownScan: !!rt.scanShutdown,
    vulnerabilityShield: ips.vulnerabilityShieldState === 1,
  };
  // Server flags
  const server = {
    ips: ips.vulnerabilityShieldState === 1,
    malware: !!sm.cloudScanType, // proxy para antimalware/smart scan
    appCtrl: !!sm.appCtrl, // pode não existir; usa-se como flag genérica
    patching: 'Desconhecido', // sem fonte direta em .cmpolicy
    agentVer: '', // não disponível
  };
  // Email & colaboração
  const cec = {
    spam: !!modules.CECSpamProtection,
    incoming: !!modules.CECIncomingMalwareScan,
    outgoing: !!modules.CECOutgoingMalwareScan,
    phishing: !!modules.CECPhishingProtection,
    dmarc: !!modules.CECDMARC,
  };
  const cgep = {
    spf: !!modules.CGEPSPF,
    dkim: !!modules.CGEPDKIM,
    tls: !!modules.CGEPTLS,
    sandbox: !!modules.CGEPSandbox,
  };
  const ddi = {
    sandbox: !!dc.sandbox,
    traffic: !!dc.trafficMonitor,
    ioc: !!dc.iocFeeds,
    updateAge: 0, // sem fonte direta
  };
  return { endpoint, server, cec, cgep, ddi };
}

export function computeRecommendations(summary) {
  const s = flagsFromModules(summary);
  const rec = { endpoint: [], server: [], cec: [], cgep: [], ddi: [] };
  // Endpoint
  if (!s.endpoint.realTime) rec.endpoint.push({ key: 'realTime', name: 'Varredura em tempo real', severity: 'high', recommendation: 'Habilitar varredura em tempo real em todas as políticas.' });
  if (!s.endpoint.behavior) rec.endpoint.push({ key: 'behavior', name: 'Monitoramento de comportamento', severity: 'high', recommendation: 'Ativar monitoramento/heurística para prevenir ransomware.' });
  if (!s.endpoint.webRep) rec.endpoint.push({ key: 'webRep', name: 'Reputação Web', severity: 'medium', recommendation: 'Habilitar reputação web e bloqueio de URLs maliciosas.' });
  if (!s.endpoint.scheduledScan) rec.endpoint.push({ key: 'scheduledScan', name: 'Varredura agendada', severity: 'medium', recommendation: 'Agendar varreduras periódicas em endpoints.' });
  if (!s.endpoint.networkScan) rec.endpoint.push({ key: 'networkScan', name: 'Varredura de rede', severity: 'low', recommendation: 'Ativar varredura de compartilhamentos e rede.' });
  if (!s.endpoint.usbBoot) rec.endpoint.push({ key: 'usbBoot', name: 'Varredura em USB Boot', severity: 'low', recommendation: 'Habilitar varredura ao inicializar por USB.' });
  if (!s.endpoint.shutdownScan) rec.endpoint.push({ key: 'shutdownScan', name: 'Varredura ao desligar', severity: 'low', recommendation: 'Executar varredura no desligamento dos endpoints.' });
  if (!s.endpoint.vulnerabilityShield) rec.endpoint.push({ key: 'vulnerabilityShield', name: 'IPS/Vulnerability Shield', severity: 'high', recommendation: 'Ativar IPS para bloquear explorações de vulnerabilidades.' });
  // Server
  if (!s.server.ips) rec.server.push({ key: 'ips', name: 'IPS em servidores', severity: 'high', recommendation: 'Ativar IPS nas workloads críticas.' });
  if (!s.server.malware) rec.server.push({ key: 'malware', name: 'Antimalware em workloads', severity: 'high', recommendation: 'Habilitar antimalware em todos os servidores.' });
  if (!s.server.appCtrl) rec.server.push({ key: 'appCtrl', name: 'Application Control', severity: 'high', recommendation: 'Restringir execução de softwares não permitidos.' });
  // CEC
  if (!s.cec.spam) rec.cec.push({ key: 'spam', name: 'Antispam', severity: 'medium', recommendation: 'Habilitar antispam com heurística atual.' });
  if (!s.cec.incoming) rec.cec.push({ key: 'incoming', name: 'Malware (entrada)', severity: 'high', recommendation: 'Ativar verificação de malware em entrada.' });
  if (!s.cec.outgoing) rec.cec.push({ key: 'outgoing', name: 'Malware (saída)', severity: 'high', recommendation: 'Ativar verificação de malware em saída.' });
  if (!s.cec.phishing) rec.cec.push({ key: 'phishing', name: 'Proteção contra phishing', severity: 'medium', recommendation: 'Habilitar proteção de URLs maliciosas.' });
  if (!s.cec.dmarc) rec.cec.push({ key: 'dmarc', name: 'Política DMARC', severity: 'medium', recommendation: 'Aplicar política DMARC para autenticação de domínio.' });
  // CGEP
  if (!s.cgep.spf) rec.cgep.push({ key: 'spf', name: 'SPF', severity: 'medium', recommendation: 'Aplicar SPF para validar domínio remetente.' });
  if (!s.cgep.dkim) rec.cgep.push({ key: 'dkim', name: 'DKIM', severity: 'medium', recommendation: 'Habilitar DKIM para assinatura de mensagens.' });
  if (!s.cgep.tls) rec.cgep.push({ key: 'tls', name: 'TLS', severity: 'high', recommendation: 'Exigir TLS para transporte seguro.' });
  if (!s.cgep.sandbox) rec.cgep.push({ key: 'sandbox', name: 'Sandbox', severity: 'high', recommendation: 'Habilitar sandbox para anexos suspeitos.' });
  // DDI
  if (!s.ddi.sandbox) rec.ddi.push({ key: 'sandbox', name: 'Sandbox', severity: 'high', recommendation: 'Ativar sandbox para análise avançada.' });
  if (!s.ddi.traffic) rec.ddi.push({ key: 'traffic', name: 'Monitoramento de tráfego', severity: 'medium', recommendation: 'Monitorar tráfego leste-oeste e norte-sul.' });
  if (!s.ddi.ioc) rec.ddi.push({ key: 'ioc', name: 'Feeds de IoC', severity: 'medium', recommendation: 'Habilitar feeds de IoC e atualização automática.' });
  return rec;
}