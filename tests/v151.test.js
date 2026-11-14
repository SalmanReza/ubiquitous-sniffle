import test from 'node:test';
import assert from 'node:assert/strict';
import { readText } from './helpers/read-text.js';

const app = readText('../src/app.js', import.meta.url);
const css = readText('../src/styles.css', import.meta.url);
const html = readText('../index.html', import.meta.url);
const sky = readText('../src/sky.js', import.meta.url);

test('v1.5.1 voluntary cards and v1.7.1 situational records show inline evidence without disclosure UI', () => {
  const voluntary = app.slice(app.indexOf('function renderVoluntary'), app.indexOf('function renderSituational'));
  const situational = app.slice(app.indexOf('function renderSituational'), app.indexOf('function rakahControlsHtml'));
  assert.match(voluntary, /referenceCardHtml\(event\.key, prayerName\(event\.key\)\)\}\$\{rakahControlsHtml\(event\.key, date\)\}/);
  assert.match(voluntary, /data-voluntary-record=/);
  assert.doesNotMatch(voluntary, /<details|<summary|Details & actions/);
  assert.match(situational, /referenceCardHtml\(key, title\)/);
  assert.match(situational, /data-situational-pair=/);
  assert.match(situational, /data-situational-custom=/);
  assert.doesNotMatch(situational, /<details|<summary|Details & actions/);
  assert.match(css, /\.voluntary-item \.ref-card \{/);
  assert.match(css, /\.voluntary-item \.rakah-control \{/);
});

test('v1.5.1 voluntary countdowns share the Fard hours/minutes formatter and preserve click-through', () => {
  assert.match(app, /data-event-countdown="true" data-compact-eta="true" data-kind="voluntary"/);
  assert.match(app, /document\.querySelectorAll\('\.prayer-eta\[data-compact-eta\]'\)/);
  assert.match(app, /cardCountdown\(\{ now, start, end, lang: lang\(\) \}\)/);
  assert.match(app, /list\.querySelectorAll\('\[data-event-countdown\]'\)/);
  assert.match(app, /renderSituational\(\);\s*updateCardCountdowns\(\);/);
});

test('v1.5.1 observatory uses hand-drawn manuscript artwork while retaining the live astronomy engine and information', () => {
  for (const cls of ['sky-sun-rays','sky-sun-disc','sky-sun-engraving','sky-moon-lit','sky-moon-engraving','sky-moon-crater']) assert.ok(html.includes(`class="${cls}"`), `missing ${cls}`);
  assert.doesNotMatch(html, /celestial\/(?:sun|moon)\.png/);
  assert.match(app, /function drawObservatoryFrame\(width, height\)/);
  assert.match(app, /sky-rosette/);
  assert.match(app, /sky-diamond/);
  assert.match(app, /timeArcPoint\(/);
  assert.match(app, /moonLitPath\(/);
  assert.match(app, /zoneSpans\(intervals, times\.sunrise, times\.sunset\)/);
  assert.match(html, /id="skyPosition"/);
  assert.match(html, /id="skyObservatoryFooter"/);
  assert.match(css, /Abbasid-era manuscript and astrolabe illustration treatment/);
  assert.match(sky, /export function sunPosition/);
  assert.match(sky, /export function moonPosition/);
});
