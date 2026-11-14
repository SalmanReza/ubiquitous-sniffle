import test from 'node:test';
import assert from 'node:assert/strict';
import { readText } from './helpers/read-text.js';
import { SUNNI_EVIDENCE, JAFARI_EVIDENCE, evidenceFor } from '../src/prayer-evidence.js';

const app = readText('../src/app.js', import.meta.url);
const html = readText('../index.html', import.meta.url);
const css = readText('../src/styles.css', import.meta.url);
const brand = readText('../src/branding.js', import.meta.url);
const pkg = JSON.parse(readText('../package.json', import.meta.url));
const tauri = JSON.parse(readText('../src-tauri/tauri.conf.json', import.meta.url));

test('countdown page has three horizontal layers with equal second-row cards', () => {
  const page = /<main id="countdownView"[\s\S]*?<div class="page-cards">([\s\S]*?)<\/div>\s*<\/main>/.exec(html)?.[1] || '';
  const hero = page.indexOf('id="eventHero"');
  const preferred = page.indexOf('id="bestBlock"');
  const prayer = page.indexOf('id="eventPrayerCard"');
  const timing = page.indexOf('id="eventTimingCard"');
  assert.ok(hero >= 0 && preferred > hero && prayer > preferred && timing > prayer);
  assert.match(page, /id="eventPrayerCard"[\s\S]*id="eventRakahCard"[\s\S]*id="eventCompletionCard"/);
  assert.match(css, /#countdownView \.page-cards \{ grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(css, /#countdownView \.countdown-focus,[\s\S]*#countdownView #eventTimingCard \{ grid-column:1 \/ -1; \}/);
  assert.match(css, /#countdownView #bestBlock,[\s\S]*#countdownView #eventPrayerCard \{ grid-column:auto/);
});

test('preferred countdown updates live independently without re-rendering prayer controls each second', () => {
  assert.match(app, /function updateCountdownViewLive\(now = new Date\(\)\)/);
  assert.match(app, /const phase = preferredState\(pref, timestamp\)/);
  assert.match(app, /\$\('bestCountdown'\)\.textContent = countdown\(target - timestamp\)/);
  const tick = /function updateCountdownWidgets\(\) \{([\s\S]*?)\n\}/.exec(app)?.[1] || '';
  assert.match(tick, /updateCountdownViewLive\(now\)/);
  assert.doesNotMatch(tick, /renderCountdownView\(\)/);
  assert.match(app, /function renderCountdownView\(\)[\s\S]*?renderCountdownDetails\(\)/);
});

test('prayer event card contains school/date-specific Qur’an-first evidence, rakah guidance and completion controls', () => {
  assert.match(app, /referenceCardHtml\(key, countdownState\.title, 'countdown', \{ date \}\)/);
  assert.match(app, /referenceCardHtml outputs Qur'an first, then the school-specific hadith, then rak'ah guidance/);
  assert.match(app, /rakahControlsHtml\(key, date\)/);
  assert.match(app, /data-record-kind="\$\{countdownState\.kind\}"/);
  assert.match(app, /partsHtml\(key, date, open, \{ includeFard: true \}\)/);
  for (const [school, set] of [['hanafi', SUNNI_EVIDENCE], ['jafari', JAFARI_EVIDENCE]]) {
    for (const [key, entries] of Object.entries(set)) {
      if (entries.length > 1) {
        assert.equal(entries[0].kind, 'quran', `${key}: Qur'an should lead when both sources exist`);
        assert.equal(entries[1].kind, 'hadith', `${key}: hadith should follow Qur'an`);
      }
      const rendered = evidenceFor(key, school, 'en')?.items || [];
      if (rendered.length > 1) {
        assert.equal(rendered[0].kind, 'quran');
        assert.equal(rendered[1].kind, 'hadith');
      }
    }
  }
});

test('astrolabe markers are more legible, moon is smaller, and transparent homepage circle is removed', () => {
  assert.match(html, /sky-sun-instrument-ring/);
  assert.match(html, /sky-moon-instrument-ring/);
  assert.doesNotMatch(html, /skyObservatoryGlow/);
  assert.doesNotMatch(app, /skyObservatoryGlow/);
  assert.equal((app.match(/scale\(\$\{\(sunScale \* 0\.58\)\.toFixed\(3\)\}\)/g) || []).length, 2);
  assert.match(css, /\.sky-sun-instrument-ticks/);
  assert.match(css, /\.sky-moon-instrument-ticks/);
});

test('version metadata is consistently 1.7.1', () => {
  assert.match(brand, /APP_VERSION = '1\.7\.1'/);
  assert.equal(pkg.version, '1.7.1');
  assert.equal(tauri.version, '1.7.1');
});
