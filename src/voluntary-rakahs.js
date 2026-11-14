/* User-recorded rak'ah plans for standalone and situational voluntary prayers.
   A "set" is one selectable pair of rak'ahs. Flexible night prayers accept a
   user-entered even count; Witr accepts an odd count so school differences are
   not silently flattened into one ruling. */
export const RAKAH_PLANS = Object.freeze({
  duha: Object.freeze({ mode: 'sets', sets: 6, perSet: 2, note: 'Up to 12 rak\'ahs in sets of two; choose the sets you performed.' }),
  awwabin: Object.freeze({ mode: 'sets', sets: 3, perSet: 2, note: 'Commonly recorded as six rak\'ahs in sets of two; scholarly descriptions differ.' }),
  qiyam: Object.freeze({ mode: 'custom-even', min: 2, step: 2 }),
  tahajjud: Object.freeze({ mode: 'custom-even', min: 2, step: 2 }),
  tarawih: Object.freeze({ mode: 'sets', sets: 10, perSet: 2, note: 'Twenty is a common Hanafi arrangement; communities differ.' }),
  eid_prayer: Object.freeze({ mode: 'fixed', count: 2 }),
  witr: Object.freeze({ mode: 'custom-odd', min: 1, step: 2, max: 11 }),
  tahiyyatul_masjid: Object.freeze({ mode: 'fixed', count: 2 }),
  istikhara: Object.freeze({ mode: 'fixed', count: 2 }),
  tawbah: Object.freeze({ mode: 'fixed', count: 2 })
});

export function sanitizeRakahCount(key, value) {
  const plan = RAKAH_PLANS[key];
  const n = Number(value);
  if (!plan || !Number.isInteger(n) || n < 0) return 0;
  if (plan.mode === 'fixed') return n === plan.count ? n : 0;
  if (plan.mode === 'custom-even') return n >= plan.min && n % 2 === 0 ? n : 0;
  if (plan.mode === 'custom-odd') return n >= plan.min && n <= plan.max && n % 2 === 1 ? n : 0;
  return Math.min(plan.sets * plan.perSet, Math.floor(n / plan.perSet) * plan.perSet);
}

export function rakahCountFromSets(key, selected = []) {
  const plan = RAKAH_PLANS[key];
  if (!plan || plan.mode !== 'sets') return 0;
  return selected.slice(0, plan.sets).filter(Boolean).length * plan.perSet;
}
