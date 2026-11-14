import test from 'node:test';
import assert from 'node:assert/strict';
import { readText } from './helpers/read-text.js';
import { RAKAH_PLANS, sanitizeRakahCount, rakahCountFromSets } from '../src/voluntary-rakahs.js';

const app = readText('../src/app.js', import.meta.url);
const html = readText('../index.html', import.meta.url);
const css = readText('../src/styles.css', import.meta.url);
const sound = readText('../src/sound.js', import.meta.url);

test('Next Event and Today\'s Progress occupy one paired layer of rounded cards', () => {
  assert.match(html, /<div class="hero-row">[\s\S]*?class="board-panel next-card"[\s\S]*?class="board-panel progress-panel"/);
  assert.match(css, /\.hero-row \{ display:grid; grid-template-columns:minmax\(0,1fr\) minmax\(0,1fr\)/);
  assert.match(css, /\.next-card \{ border-radius:1\.25rem/);
  assert.match(html, /id="progressFigure"[\s\S]*id="progressCaption"/);
});

test('Fard undo snapshots all associated ticks into a persistent revision card and confirms or expires it at the existing lock', () => {
  assert.match(html, /id="reviseSection"[\s\S]*Revise event record[\s\S]*id="reviseRecords"/);
  assert.match(app, /function startRevision\(kind, key, date\)/);
  assert.match(app, /prayerParts\(key\)\.filter/);
  assert.match(app, /record\.revise\[id\] = \{/);
  assert.match(app, /lockAt: lock\.at/);
  assert.match(app, /function confirmRevision\(dateText, id\)/);
  assert.match(app, /data-confirm-revision/);
  assert.match(app, /now >= revision\.lockAt/);
  assert.match(app, /if \(target\[key\]\) \{\s*startRevision\(kind, key, eventDate\)/);
  assert.match(app, /delete record\.at\[`\$\{part\.layer\}:\$\{part\.key\}`\]/);
  assert.match(app, /revision\.parts\[layer\]\[key\] = !!input\.checked/);
  assert.match(app, /Confirm the open revision before recording this event again/);
  assert.match(app, /revise\?\.\[revisionId\('fard', prayerKey\)\]/);
});

test('daily voluntary cards use the evidence card and their own undo record action', () => {
  assert.match(app, /referenceCardHtml\(event\.key, prayerName\(event\.key\)\)/);
  assert.match(app, /data-voluntary-record="\$\{event\.key\}"/);
  assert.match(app, /togglePrayer\('voluntary', button\.dataset\.voluntaryRecord/);
});

test('situational cards record repeatable two-rakah sets and update the daily summary', () => {
  assert.match(app, /class="voluntary-item card-situational/);
  assert.match(app, /data-situational-pair=/);
  assert.match(app, /record\.situationalSets\[key\] = previousSets \+ setsToAdd/);
  assert.match(app, /record\.situational\[key\] = true/);
  assert.match(app, /situationalRecord\.situationalOccurrences/);
  assert.match(app, /'fard', 'voluntary', 'sunnah', 'nafl', 'situational'/);
});

test('weekly day cells open a detailed page and Back/Escape return to Home', () => {
  assert.match(html, /id="weeklyDayView"/);
  assert.match(app, /data-week-date="\$\{dateKey\(date\)\}"/);
  assert.match(app, /function openWeeklyDay\(dateText\)/);
  assert.match(app, /function renderWeeklyDayView\(\)/);
  assert.match(app, /weeklyDayBack.*openHome/);
  assert.match(app, /currentPage === 'weekly-day'\) openHome\(\)/);
});

test('rakah plans expose six Duha sets, custom even night counts, flexible odd Witr and fixed situational counts', () => {
  assert.equal(RAKAH_PLANS.duha.sets, 6);
  assert.equal(rakahCountFromSets('duha', [true, false, true, true, false, true]), 8);
  assert.equal(sanitizeRakahCount('tahajjud', 14), 14);
  assert.equal(sanitizeRakahCount('tahajjud', 13), 0);
  assert.equal(sanitizeRakahCount('witr', 3), 3);
  assert.equal(sanitizeRakahCount('witr', 4), 0);
  for (const key of ['tahiyyatul_masjid', 'istikhara', 'tawbah']) assert.equal(sanitizeRakahCount(key, 2), 2);
  assert.match(app, /data-confirm-rakah/);
  assert.match(app, /Confirm rakah/);
});

test('completion ticks and notifications have doubled master gain with a compressor limiter', () => {
  assert.match(sound, /volume: 1\.1/);
  assert.match(sound, /NOTIFICATION_VOLUME = 1\.9/);
  assert.match(sound, /createDynamicsCompressor/);
});

test('new situational, rakah and revision records survive migration and backup merge', async () => {
  const { migrateRecord } = await import('../src/history-migrate.js');
  const { mergeHistory } = await import('../src/backup.js');
  const revision = { id: 'fard:fajr', kind: 'fard', key: 'fajr', parts: { fard: { fajr: true }, sunnah: { fajr_before: true } }, lockAt: 123456 };
  const migrated = migrateRecord({ fard: {}, voluntary: {}, situational: { istikhara: true }, rakahs: { tahajjud: 8 }, rakahSets: { duha: [true, false] }, revise: { 'fard:fajr': revision } });
  assert.equal(migrated.situational.istikhara, true);
  assert.equal(migrated.rakahs.tahajjud, 8);
  assert.deepEqual(migrated.rakahSets.duha, [true, false]);
  assert.deepEqual(migrated.revise['fard:fajr'], revision);
  const merged = mergeHistory({ '2026-11-13': { fard: {}, voluntary: {}, situational: { istikhara: true }, rakahs: { tahajjud: 8 }, revise: {} } }, { '2026-11-13': { fard: {}, voluntary: {}, situational: { tawbah: true }, rakahs: { duha: 6 }, revise: { 'fard:fajr': revision } } });
  assert.equal(merged.history['2026-11-13'].situational.tawbah, true);
  assert.equal(merged.history['2026-11-13'].rakahs.tahajjud, 8);
  assert.equal(merged.history['2026-11-13'].rakahs.duha, 6);
  assert.deepEqual(merged.history['2026-11-13'].revise['fard:fajr'], revision);
});
