import defaultBestPractices from '../data/bestPractices.json';

function get(summary, path) {
  if (!summary || !path) return undefined;
  // supports OR with '|'
  const paths = path.split('|');
  for (const p of paths) {
    const parts = p.split('.');
    let cur = summary;
    for (const part of parts) {
      if (cur == null) { cur = undefined; break; }
      cur = cur[part];
    }
    if (cur !== undefined) return cur;
  }
  return undefined;
}

function toBool(v) {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  if (typeof v === 'string') return v === '1' || v.toLowerCase() === 'true';
  return !!v;
}

function evalCriterion(summary, crit) {
  const value = get(summary, crit.source);
  if (value === undefined) return { applicable: false, pass: false };
  if (typeof crit.equals !== 'undefined') return { applicable: true, pass: value === crit.equals };
  if (typeof crit.gt !== 'undefined') return { applicable: true, pass: Number(value) > Number(crit.gt) };
  return { applicable: true, pass: toBool(value) };
}

const defaultSevWeight = { high: 3, medium: 2, low: 1 };

export function computeBenchmark(summary, enabledAreas = null, severityWeights = null, catalogOverride = null) {
  const sevWeight = { ...defaultSevWeight, ...(severityWeights || {}) };
  const bestPractices = catalogOverride && typeof catalogOverride === 'object' ? catalogOverride : defaultBestPractices;
  const areas = {};
  const failures = {};
  let totalWeight = 0, passedWeight = 0;
  for (const areaKey of Object.keys(bestPractices)) {
    if (enabledAreas && enabledAreas[areaKey] === false) continue;
    const areaCatalog = bestPractices[areaKey];
    const keys = Object.keys(areaCatalog);
    let total = 0, passed = 0;
    let areaWeightSum = 0, areaPassedWeight = 0;
    const areaFailures = [];
    let applicableCount = 0;
    for (const key of keys) {
      const crit = areaCatalog[key];
      const { applicable, pass } = evalCriterion(summary, crit);
      if (!applicable) continue;
      applicableCount += 1;
      if (crit.required) total += 1;
      const w = sevWeight[crit.severity] || 1;
      areaWeightSum += w;
      if (pass) {
        if (crit.required) passed += 1;
        areaPassedWeight += w;
      } else {
        areaFailures.push({ key, name: crit.name, severity: crit.severity, recommendation: crit.recommendation });
      }
    }
    if (applicableCount === 0) {
      areas[areaKey] = { total: 0, passed: 0, failed: 0, score: 0, weightedScore: 0, applicable: 0, status: 'n/a' };
      failures[areaKey] = [];
      continue;
    }
    const failed = Math.max(0, total - passed);
    const score = total > 0 ? Math.round((passed / total) * 100) : Math.round((areaPassedWeight / (areaWeightSum || 1)) * 100);
    const weightedScore = Math.round((areaPassedWeight / (areaWeightSum || 1)) * 100);
    areas[areaKey] = { total, passed, failed, score, weightedScore, applicable: applicableCount, status: 'ok' };
    failures[areaKey] = areaFailures;
    totalWeight += areaWeightSum;
    passedWeight += areaPassedWeight;
  }
  const overallWeighted = Math.round((passedWeight / (totalWeight || 1)) * 100);
  const level = overallWeighted >= 85 ? 'Green' : overallWeighted >= 60 ? 'Yellow' : 'Red';
  return { overall: { weightedScore: overallWeighted, level }, areas, failures };
}