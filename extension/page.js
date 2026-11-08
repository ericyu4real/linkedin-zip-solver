import {
  applyPath,
  ensureBoardInteractive,
  isBoardSolved,
  isZipUrl,
  looksLikeCompletion,
  readBoard,
  solveBoard,
} from './board.js';

const RUN_ATTR = 'data-zip-auto-solver';
const COMMAND = 'zip-solver-command';
const RESULT = 'zip-solver-result';

let running = false;

function mark(status) {
  const grid = document.querySelector('[data-testid="interactive-grid"]');
  if (grid) grid.setAttribute(RUN_ATTR, status);
}

function reply(id, payload) {
  window.dispatchEvent(new CustomEvent(RESULT, { detail: { id, ...payload } }));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getStatus() {
  if (looksLikeCompletion()) {
    const board = readBoard();
    return {
      ok: true,
      identified: true,
      hasBoard: true,
      n: board ? board.n : null,
      solved: true,
      completed: true,
    };
  }

  const board = readBoard();
  if (!board) {
    return {
      ok: true,
      identified: isZipUrl(),
      hasBoard: false,
      n: null,
      solved: false,
      completed: false,
    };
  }

  const solved = isBoardSolved(board);
  return {
    ok: true,
    identified: true,
    hasBoard: true,
    n: board.n,
    solved,
    completed: solved,
  };
}

async function runSolver() {
  if (running) return { ok: false, error: 'already-running' };

  const status = getStatus();
  if (status.completed || status.solved) {
    mark('solved');
    return { ok: true, solved: true, n: status.n };
  }
  if (!status.hasBoard) {
    return { ok: false, error: status.identified ? 'need-start' : 'not-zip' };
  }

  running = true;
  mark('running');

  try {
    ensureBoardInteractive();
    await sleep(250);
    const board = readBoard();
    if (!board) {
      mark('unsolved');
      return { ok: false, error: 'need-start' };
    }
    const path = solveBoard(board);
    if (!path) {
      mark('unsolved');
      return { ok: false, error: 'no-solution', n: board.n };
    }
    const result = await applyPath(readBoard() || board, path);
    const latest = readBoard();
    const solved = !!(latest && isBoardSolved(latest)) || result.solved || looksLikeCompletion();
    mark(solved ? 'solved' : 'incomplete');
    return { ok: solved, solved, n: board.n };
  } catch (err) {
    mark('error');
    return { ok: false, error: String(err && err.message ? err.message : err) };
  } finally {
    running = false;
  }
}

window.addEventListener(COMMAND, async (event) => {
  const detail = event.detail || {};
  const id = detail.id;
  if (detail.type === 'GET_STATUS') {
    reply(id, getStatus());
    return;
  }
  if (detail.type === 'SOLVE') {
    reply(id, await runSolver());
  }
});
