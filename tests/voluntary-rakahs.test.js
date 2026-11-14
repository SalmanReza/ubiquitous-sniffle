import test from 'node:test';
import assert from 'node:assert/strict';
import { RAKAH_PLANS, sanitizeRakahCount, rakahCountFromSets } from '../src/voluntary-rakahs.js';

test('Duha and Awwabin expose selectable sets of two', () => {
  assert.equal(RAKAH_PLANS.duha.sets, 6);
  assert.equal(rakahCountFromSets('duha', [true, false, true, true, false, true]), 8);
  assert.equal(rakahCountFromSets('awwabin', [true, true, false]), 4);
});

test('night prayers accept even user-entered counts and Witr accepts odd counts', () => {
  assert.equal(sanitizeRakahCount('tahajjud', 12), 12);
  assert.equal(sanitizeRakahCount('qiyam', 7), 0);
  assert.equal(sanitizeRakahCount('witr', 3), 3);
  assert.equal(sanitizeRakahCount('witr', 4), 0);
});

test('fixed situational and Eid prayers only accept their prescribed two-rakah count', () => {
  for (const key of ['tahiyyatul_masjid', 'istikhara', 'tawbah', 'eid_prayer']) {
    assert.equal(sanitizeRakahCount(key, 2), 2, key);
    assert.equal(sanitizeRakahCount(key, 4), 0, key);
  }
});
