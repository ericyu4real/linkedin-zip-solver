import { boardStatus, runSolve } from './board.js';

const RUN_ATTR = 'data-zip-auto-solver';
const COMMAND = 'zip-solver-command';
const RESULT = 'zip-solver-result';

function mark(status) {
  const grid = document.querySelector('[data-testid="interactive-grid"]');
  if (grid) grid.setAttribute(RUN_ATTR, status);
}

function reply(id, payload) {
  window.dispatchEvent(new CustomEvent(RESULT, { detail: { id, ...payload } }));
}

window.addEventListener(COMMAND, async (event) => {
  const detail = event.detail || {};
  const id = detail.id;
  if (detail.type === 'GET_STATUS') {
    reply(id, boardStatus());
    return;
  }
  if (detail.type === 'SOLVE') {
    mark('running');
    const result = await runSolve();
    mark(result.solved ? 'solved' : result.error || 'unsolved');
    reply(id, result);
  }
});
