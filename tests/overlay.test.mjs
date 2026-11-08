import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { mountOverlay, overlayHost, updateOverlay } from '../extension/overlay.js';
import { statusView } from '../extension/status.js';

test('overlay appears with Solve when a Zip board is found', () => {
  const dom = new JSDOM('<!doctype html><html><body></body></html>');
  const doc = dom.window.document;
  let clicked = 0;
  mountOverlay({ onSolve: () => { clicked += 1; } }, doc);
  updateOverlay(statusView({ hasBoard: true, n: 8, solved: false }), doc);
  const host = overlayHost(doc);
  assert.equal(host.style.display, 'block');
  assert.equal(host.shadowRoot.querySelector('.title').textContent, 'Found 8×8 Zip');
  host.shadowRoot.querySelector('.fill').click();
  assert.equal(clicked, 1);
  dom.window.close();
});

test('overlay stays hidden until Zip is identified', () => {
  const dom = new JSDOM('<!doctype html><html><body></body></html>');
  const doc = dom.window.document;
  mountOverlay({}, doc);
  updateOverlay(statusView(null), doc);
  assert.equal(overlayHost(doc).style.display, 'none');
  dom.window.close();
});
