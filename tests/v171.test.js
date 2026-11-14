import test from 'node:test';
import assert from 'node:assert/strict';
import { readText } from './helpers/read-text.js';
import { migrateRecord } from '../src/history-migrate.js';
import { mergeHistory } from '../src/backup.js';

const app = readText('../src/app.js', import.meta.url);
const css = readText('../src/styles.css', import.meta.url);
const html = readText('../index.html', import.meta.url);
const tauri = JSON.parse(readText('../src-tauri/tauri.conf.json', import.meta.url));

test('v1.7.1 removes the homepage transparent circle and compacts the top window chrome', () => {
  assert.match(css, /\.next-card::after \{ content:none; display:none; \}/);
  assert.match(html, /class="window-titlebar" data-tauri-drag-region/);
  assert.match(html, /id="windowMinimize"/);
  assert.match(html, /id="windowMaximize"/);
  assert.match(html, /id="windowClose"/);
  assert.equal(tauri.app.windows[0].decorations, false);
  assert.match(css, /\.app-shell \{ padding-top:\.55rem; \}/);
});

test('situational prayer cards include additional occasions and inline repeatable controls', () => {
  for (const key of ['wudu_prayer','kusuf','khusuf','istisqa','janazah','nafl_mutlaq']) assert.ok(app.includes(key));
  assert.match(app, /data-situational-pair=/);
  assert.match(app, /data-situational-add-set=/);
  assert.match(app, /data-situational-custom=/);
  assert.match(app, /data-situational-occasion=/);
});

test('each two-rakah action increments per-day sets and total rakahs, with half-second feedback and gold border', () => {
  assert.match(app, /record\.situationalSets\[key\] = previousSets \+ setsToAdd/);
  assert.match(app, /record\.situationalOccurrences\[key\] = previousOccurrences \+ 1/);
  assert.match(app, /record\.rakahs\[key\] = Number\(record\.rakahs\[key\] \|\| 0\) \+ rakahs/);
  assert.match(app, /has been performed/);
  assert.match(app, /setTimeout\(\(\) => \{ feedback\.textContent = ''; card\.classList\.add\('situational-glow'\); setTimeout\(\(\) => card\.classList\.remove\('situational-glow'\), 500\); \}, 500\)/);
  assert.match(css, /\.situational-glow \{[^}]*#d8b45e/s);
});

test('custom-count prayer allows even counts beyond twelve and janazah is not counted as rakahs', () => {
  assert.match(app, /nafl_mutlaq: \{ mode: 'custom', step: 2 \}/);
  assert.match(app, /min="2" step="2" value="2" data-situational-custom-count/);
  assert.match(app, /janazah: \{ mode: 'occasion', rakahs: 0 \}/);
});

test('situational set counts survive migration and backup merge; legacy single checks remain one prior set', () => {
  const old = migrateRecord({ situational: { istikhara: true }, rakahs: { istikhara: 2 } });
  assert.equal(old.situational.istikhara, true);
  const merged = mergeHistory({ '2026-11-14': { situational: { istikhara: true }, situationalSets: { istikhara: 2 }, situationalOccurrences: { istikhara: 2 }, rakahs: { istikhara: 4 } } }, { '2026-11-14': { situational: { istikhara: true }, situationalSets: { istikhara: 3 }, situationalOccurrences: { istikhara: 3 }, rakahs: { istikhara: 6 } } });
  assert.equal(merged.history['2026-11-14'].situationalSets.istikhara, 3);
  assert.equal(merged.history['2026-11-14'].situationalOccurrences.istikhara, 3);
});
