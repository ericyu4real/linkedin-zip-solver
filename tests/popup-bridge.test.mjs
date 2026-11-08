import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { isBoardSolved, readBoard } from '../extension/board.js';
import { board2, board2Solution } from './boards.mjs';
import { renderZipFixture } from './fixture-html.mjs';

const COMMAND = 'zip-solver-command';
const RESULT = 'zip-solver-result';

function send(type) {
  return new Promise((resolve) => {
    const id = `test-${type}-${Math.random().toString(16).slice(2)}`;
    window.addEventListener(RESULT, function onResult(event) {
      if (event.detail?.id !== id) return;
      window.removeEventListener(RESULT, onResult);
      resolve(event.detail);
    });
    window.dispatchEvent(new CustomEvent(COMMAND, { detail: { type, id } }));
  });
}

test('identifies a Zip board and only fills after Solve', async () => {
  const html = renderZipFixture(board2);
  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    url: 'http://127.0.0.1/games/zip/',
  });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.CustomEvent = dom.window.CustomEvent;
  globalThis.PointerEvent = dom.window.PointerEvent || class PointerEvent extends dom.window.MouseEvent {};
  await import(`../extension/page.js?bridge=${Date.now()}`);

  try {
    const status = await send('GET_STATUS');
    assert.equal(status.identified, true);
    assert.equal(status.hasBoard, true);
    assert.equal(status.n, 2);
    assert.equal(status.solved, false);
    assert.equal(isBoardSolved(readBoard()), false);

    const result = await send('SOLVE');
    assert.equal(result.ok, true);
    assert.equal(result.solved, true);
    const board = readBoard();
    assert.equal(isBoardSolved(board), true);
    assert.deepEqual([...board.path], board2Solution);
  } finally {
    dom.window.close();
    delete globalThis.window;
    delete globalThis.document;
    delete globalThis.CustomEvent;
    delete globalThis.PointerEvent;
  }
});
