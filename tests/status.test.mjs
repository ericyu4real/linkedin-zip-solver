import { test } from 'node:test';
import assert from 'node:assert/strict';
import { failedView, filledView, fillingView, statusView } from '../extension/status.js';

test('statusView stays hidden off Zip pages', () => {
  assert.equal(statusView(null).visible, false);
  assert.equal(statusView({ identified: false, hasBoard: false }).visible, false);
});

test('statusView tells you to reload when the content script is missing', () => {
  const view = statusView({ error: 'no-content-script' });
  assert.equal(view.visible, false);
  assert.match(view.title, /reload/i);
});

test('statusView enables Solve when a board is found', () => {
  const view = statusView({ identified: true, hasBoard: true, n: 8, solved: false });
  assert.equal(view.visible, true);
  assert.equal(view.actionEnabled, true);
  assert.equal(view.actionLabel, 'Solve');
  assert.equal(view.title, 'Found 8×8 Zip');
});

test('filling and filled views keep the detector visible', () => {
  assert.equal(fillingView(8).actionEnabled, false);
  assert.equal(filledView(8).tone, 'solved');
  assert.equal(failedView('no-solution').actionEnabled, true);
});
