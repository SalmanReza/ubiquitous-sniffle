/* Reads saved history safely (v1.3.2). Standalone voluntary prayers have a single
   tick: older or hand-edited data that stored sub-parts for a voluntary prayer
   (an object such as { before: true, after: false } instead of true) is folded into
   that one tick (done when any part was done). Records that are not objects are
   replaced by an empty day. Everything else (fard, sunnah, nafl, at, locked, unknown
   keys) is kept as it is, so nothing from an older version is lost. */
export function migrateRecord(record) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) return { fard: {}, voluntary: {} };
  const out = { ...record };
  out.fard = out.fard && typeof out.fard === 'object' && !Array.isArray(out.fard) ? out.fard : {};
  const voluntary = out.voluntary && typeof out.voluntary === 'object' && !Array.isArray(out.voluntary) ? out.voluntary : {};
  const folded = {};
  for (const [key, value] of Object.entries(voluntary)) {
    const done = value && typeof value === 'object' ? Object.values(value).some(Boolean) : !!value;
    if (done) folded[key] = true;
  }
  out.voluntary = folded;
  for (const field of ['situational', 'situationalSets', 'situationalOccurrences', 'rakahs', 'rakahSets', 'revise', 'at', 'locked']) {
    if (!(field in out)) continue;
    const value = out[field];
    out[field] = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  }
  if ('situational' in out) out.situational = Object.fromEntries(Object.entries(out.situational).filter(([, value]) => value === true));
  for (const field of ['situationalSets', 'situationalOccurrences']) if (field in out) out[field] = Object.fromEntries(Object.entries(out[field]).filter(([, value]) => Number.isInteger(Number(value)) && Number(value) >= 0).map(([key, value]) => [key, Number(value)]));
  if ('rakahs' in out) out.rakahs = Object.fromEntries(Object.entries(out.rakahs).filter(([, value]) => Number.isInteger(Number(value)) && Number(value) > 0).map(([key, value]) => [key, Number(value)]));
  if ('rakahSets' in out) out.rakahSets = Object.fromEntries(Object.entries(out.rakahSets).filter(([, value]) => Array.isArray(value)).map(([key, value]) => [key, value.map(item => item === true)]));
  if ('revise' in out) out.revise = Object.fromEntries(Object.entries(out.revise).filter(([, value]) => value && typeof value === 'object' && !Array.isArray(value)));
  return out;
}

export function migrateHistory(history) {
  const out = {};
  if (!history || typeof history !== 'object' || Array.isArray(history)) return out;
  for (const [key, record] of Object.entries(history)) if (/^\d{4}-\d{2}-\d{2}$/.test(key)) out[key] = migrateRecord(record);
  return out;
}
