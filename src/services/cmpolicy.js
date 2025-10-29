// Parser .cmpolicy no cliente (baseado em tools/interpret_cmpolicy.mjs)

function toBool(v) {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  if (typeof v === 'string') return v === '1' || v.toLowerCase() === 'true';
  return !!v;
}

function safeParseJSON(str, fallback = {}) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

function extractComponents(root) {
  if (root && Array.isArray(root.policy) && root.policy.length > 0) {
    const first = root.policy[0];
    const settings = first?.settings;
    if (typeof settings === 'string') {
      const inner = safeParseJSON(settings, {});
      if (Array.isArray(inner.data)) return inner.data;
    } else if (Array.isArray(settings?.data)) {
      return settings.data;
    }
  }
  if (Array.isArray(root?.data)) return root.data;
  return [];
}

function indexByName(components) {
  const map = {};
  for (const c of components) {
    if (c?.wcomponent_name) map[c.wcomponent_name] = c;
  }
  return map;
}

function summarizeComponent(name, c) {
  if (!c) return { present: false };
  const s = c.settings || {};
  switch (name) {
    case 'comOSCERTSS':
      return {
        present: true,
        enable: toBool(s.Enable),
        intelliScan: toBool(s.IntelliScan),
        scanAllFiles: toBool(s.ScanAllFiles),
        scanCompressed: toBool(s.ScanCompressed),
        compressedLayer: Number(s.CompressedLayer ?? 0),
        oleExploitDetection: toBool(s.OleExploitDetection),
        scanBoot: toBool(s.ScanBoot),
        scanIncoming: toBool(s.ScanIncoming),
        scanOutgoing: toBool(s.ScanOutgoing),
        intelliTrap: toBool(s.IntelliTrap),
        spywareScan: toBool(s.ScanSpyware),
        scanNetwork: toBool(s.ScanNetwork),
        usbBootScan: toBool(s.USBBootScan),
        scanShutdown: toBool(s.ScanShutDown),
      };
    case 'comOSCEMSS':
      return {
        present: true,
        enable: toBool(s.Enable),
        scanNetwork: toBool(s.ScanNetwork),
        scanMemory: toBool(s.ScanMemory),
        scanCompressed: toBool(s.ScanCompressed),
        compressedLayer: Number(s.CompressedLayer ?? 0),
        oleExploitDetection: toBool(s.OleExploitDetection),
        scanBoot: toBool(s.ScanBoot),
      };
    case 'comOSCESSS':
      return {
        present: true,
        enable: toBool(s.Enable),
        frequency: s.Frequency ?? null,
        hour: s.Hour ?? null,
        minute: s.Minute ?? null,
        dayOfWeek: s.DayOfWeek ?? null,
        dayOfMonth: s.DayOfMonth ?? null,
      };
    case 'comOSCEBMS':
      return {
        present: true,
        bmEnable: toBool(s.bm_enable_setting),
        blockingMode: String(s.td_blocking_mode ?? ''),
        umhEnable: toBool(s.umh_enable_setting),
        dreEnable: toBool(s.dre_enable_setting),
        srpEnable: toBool(s.srp_enable_setting),
        detectionLevel: Number(s.DetectionLevel ?? 0),
        preventionLevel: Number(s.PreventionLevel ?? 0),
      };
    case 'comOSCEWRS':
      return {
        present: true,
        urlFilterInOffice: toBool(s.URLFilterEnable_InOffice),
        urlFilterOutOffice: toBool(s.URLFilterEnable_OutOffice),
        httpsPluginInOffice: toBool(s.URLFilterEnableHttpsPlugin_InOffice),
        httpsPluginOutOffice: toBool(s.URLFilterEnableHttpsPlugin_OutOffice),
        ratingLevelInOffice: Number(s.URLFilterRatingLevel_InOffice ?? 0),
        ratingLevelOutOffice: Number(s.URLFilterRatingLevel_OutOffice ?? 0),
        approvedListInOfficeCount: (s.URLFilterApprovedList_InOffice || '').split('|').filter(Boolean).length,
        blockedListInOfficeCount: (s.URLFilterBlockedList_InOffice || '').split('|').filter(Boolean).length,
      };
    case 'comOSCE_IVPAgent':
      return {
        present: true,
        vulnerabilityShieldState: Number(s.vulnerabilityShieldState ?? 0),
        ipsEnabledCount: Array.isArray(s.ipsRules?.enabledList) ? s.ipsRules.enabledList.length : 0,
        ipsPreventCount: Array.isArray(s.ipsRules?.preventList) ? s.ipsRules.preventList.length : 0,
        ipsLogOnlyCount: Array.isArray(s.ipsRules?.logOnlyList) ? s.ipsRules.logOnlyList.length : 0,
      };
    case 'comOSCESM':
      return {
        present: true,
        cloudScanType: Number(s.CloudScanType ?? 0),
        detectionLevel: Number(s.DetectionLevel ?? 0),
        preventionLevel: Number(s.PreventionLevel ?? 0),
      };
    default:
      return { present: true, raw: s };
  }
}

function interpretSummary(sum) {
  const lines = [];
  const rt = sum.modules.comOSCERTSS;
  if (rt?.present) {
    lines.push(`Real-time Scan: ${rt.enable ? 'ativado' : 'desativado'} | IntelliScan: ${rt.intelliScan ? 'on' : 'off'} | Comprimidos: ${rt.scanCompressed ? 'sim' : 'não'} (camadas=${rt.compressedLayer}) | Boot: ${rt.scanBoot ? 'sim' : 'não'} | Rede: ${rt.scanNetwork ? 'sim' : 'não'} | USB Boot: ${rt.usbBootScan ? 'sim' : 'não'} | Desligamento: ${rt.scanShutdown ? 'sim' : 'não'}`);
  }
  const man = sum.modules.comOSCEMSS;
  if (man?.present) {
    lines.push(`Manual Scan: ${man.enable ? 'ativado' : 'desativado'} | Rede: ${man.scanNetwork ? 'sim' : 'não'} | Memória: ${man.scanMemory ? 'sim' : 'não'} | Comprimidos: ${man.scanCompressed ? 'sim' : 'não'} (camadas=${man.compressedLayer}) | Boot: ${man.scanBoot ? 'sim' : 'não'}`);
  }
  const sch = sum.modules.comOSCESSS;
  if (sch?.present) {
    lines.push(`Scheduled Scan: ${sch.enable ? 'ativado' : 'desativado'} | Freq=${sch.frequency ?? '-'} Hora=${sch.hour ?? '-'}:${sch.minute ?? '-'}`);
  }
  const bms = sum.modules.comOSCEBMS;
  if (bms?.present) {
    lines.push(`Behavior Monitoring: ${bms.bmEnable ? 'ativado' : 'desativado'} | Modo bloqueio=${bms.blockingMode} | UMH=${bms.umhEnable ? 'on' : 'off'} | DRE=${bms.dreEnable ? 'on' : 'off'} | SRP=${bms.srpEnable ? 'on' : 'off'} | Detecção=${bms.detectionLevel} Prevenção=${bms.preventionLevel}`);
  }
  const wrs = sum.modules.comOSCEWRS;
  if (wrs?.present) {
    lines.push(`Web Reputation/URL Filter: InOffice=${wrs.urlFilterInOffice ? 'on' : 'off'} OutOffice=${wrs.urlFilterOutOffice ? 'on' : 'off'} | HTTPS plugin In/Out=${wrs.httpsPluginInOffice ? 'on' : 'off'}/${wrs.httpsPluginOutOffice ? 'on' : 'off'} | Rating In=${wrs.ratingLevelInOffice} Out=${wrs.ratingLevelOutOffice}`);
  }
  const ips = sum.modules.comOSCE_IVPAgent;
  if (ips?.present) {
    lines.push(`Vulnerability Shield/IPS: estado=${ips.vulnerabilityShieldState} | IPS enabled=${ips.ipsEnabledCount} prevent=${ips.ipsPreventCount} logOnly=${ips.ipsLogOnlyCount}`);
  }
  const sm = sum.modules.comOSCESM;
  if (sm?.present) {
    lines.push(`Smart Scan baseline: CloudScanType=${sm.cloudScanType} | Detecção=${sm.detectionLevel} Prevenção=${sm.preventionLevel}`);
  }
  return lines.join('\n');
}

export function buildSummaryFromCmpolicyRoot(root) {
  const components = extractComponents(root);
  const by = indexByName(components);
  const modules = {};
  for (const name of Object.keys(by)) {
    modules[name] = summarizeComponent(name, by[name]);
  }
  const rt = modules.comOSCERTSS;
  const bms = modules.comOSCEBMS;
  const ips = modules.comOSCE_IVPAgent;
  const sch = modules.comOSCESSS;
  const highlights = {
    realTimeEnabled: rt?.present ? rt.enable : null,
    behaviorMonitoringBlocking: bms?.present ? (bms.blockingMode === '1') : null,
    scheduledScanEnabled: sch?.present ? sch.enable : null,
    vulnerabilityShieldEnabled: ips?.present ? (ips.vulnerabilityShieldState === 1) : null,
  };
  return { modules, highlights, interpretation: interpretSummary({ modules }) };
}

export async function parseCmpolicyText(text) {
  let root;
  try {
    root = JSON.parse(text);
  } catch (e) {
    throw new Error('Arquivo .cmpolicy inválido (JSON malformado).');
  }
  const summary = buildSummaryFromCmpolicyRoot(root);
  return summary;
}