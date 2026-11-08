/**
 * LinkedIn Zip DOM integration. Selectors inspected on the live board
 * (Zip #601 HARD, 2026-11-08):
 *
 *   URL: /games/zip
 *   [data-testid="zip-game-container"]
 *   [data-testid="interactive-grid"][data-trail-grid]
 *   [data-cell-idx] / [data-testid="cell-N"]
 *   numbers: [data-cell-content="true"]
 *   walls: React fiber `walls: [{ cellIdx, direction: WallDirection_RIGHT|DOWN|LEFT|UP }]`
 *   input: pointerdown + mousedown + pointerup + mouseup + click on each cell
 *          in path order (verified: filled 64/64 and LinkedIn showed
 *          "You're crushing it!")
 */

import { isValidPath, solve } from './solver.js';

const CLICK_GAP_MS = 35;

export function isZipUrl(href = location.href) {
  return /\/games\/zip(\/|$|\?)/i.test(href);
}

export function getGrid(root = document) {
  return (
    root.querySelector('[data-testid="interactive-grid"][data-trail-grid]') ||
    root.querySelector('[data-trail-grid]') ||
    root.querySelector('[data-testid="zip-game-container"] [data-testid="interactive-grid"]')
  );
}

function reactFiber(el) {
  const key = Object.keys(el).find((k) => k.startsWith('__reactFiber$'));
  return key ? el[key] : null;
}

export function readReactBoardProps(root = document) {
  const cell = root.querySelector('[data-cell-idx]');
  if (!cell) return null;
  let fiber = reactFiber(cell);
  for (let i = 0; i < 14 && fiber; i++) {
    const props = fiber.memoizedProps || {};
    if (Array.isArray(props.walls) && Number.isInteger(props.gridSize)) {
      return props;
    }
    fiber = fiber.return;
  }
  return null;
}

export function wallsFromReact(props, cols) {
  const rightWalls = [];
  const downWalls = [];
  if (!props || !Array.isArray(props.walls)) return { rightWalls, downWalls };
  for (const wall of props.walls) {
    const idx = wall.cellIdx;
    const dir = String(wall.direction || '');
    if (!Number.isInteger(idx)) continue;
    if (/RIGHT/i.test(dir)) rightWalls.push(idx);
    else if (/DOWN/i.test(dir)) downWalls.push(idx);
    else if (/LEFT/i.test(dir) && idx % cols !== 0) rightWalls.push(idx - 1);
    else if (/UP/i.test(dir) && idx >= cols) downWalls.push(idx - cols);
  }
  return { rightWalls, downWalls };
}

function readNumber(cell) {
  const el = cell.querySelector('[data-cell-content="true"]');
  if (!el) return null;
  const value = parseInt((el.getAttribute('aria-label') || el.textContent || '').trim(), 10);
  return Number.isInteger(value) && value > 0 ? value : null;
}

function isDisplayed(el) {
  if (!el || el.hidden) return false;
  if (el.closest('[hidden]')) return false;
  return true;
}

export function looksLikeCompletion(root = document) {
  const href = (root.defaultView && root.defaultView.location && root.defaultView.location.href) || '';
  if (/\/games\/zip\/results/i.test(href)) return true;
  if (/END_SOLVED/.test(href)) return true;
  const visibleText = [...root.querySelectorAll('h1, h2, button, a, [role="button"]')]
    .filter(isDisplayed)
    .map((el) => `${el.textContent || ''} ${el.getAttribute('aria-label') || ''}`)
    .join('\n');
  return /see results|copy score|you.?re crushing it/i.test(visibleText);
}

export function readBoard(root = document) {
  const grid = getGrid(root);
  if (!grid) return null;
  const cells = [...grid.querySelectorAll(':scope > [data-cell-idx], [data-cell-idx]')].filter(
    (el, i, all) => all.findIndex((other) => other.getAttribute('data-cell-idx') === el.getAttribute('data-cell-idx')) === i,
  );
  if (cells.length < 4) return null;
  cells.sort((a, b) => Number(a.getAttribute('data-cell-idx')) - Number(b.getAttribute('data-cell-idx')));

  const react = readReactBoardProps(root);
  const size = react?.gridSize;
  const n = Number.isInteger(size) ? size : Math.sqrt(cells.length);
  if (!Number.isInteger(n) || n * n !== cells.length) return null;

  const numberAt = Array(cells.length).fill(null);
  const elements = Array(cells.length).fill(null);
  for (const el of cells) {
    const idx = Number(el.getAttribute('data-cell-idx'));
    if (!Number.isInteger(idx) || idx < 0 || idx >= cells.length) return null;
    numberAt[idx] = readNumber(el);
    elements[idx] = el;
  }
  if (elements.some((el) => !el)) return null;
  if (!numberAt.includes(1)) return null;

  const { rightWalls, downWalls } = wallsFromReact(react, n);
  return {
    rows: n,
    cols: n,
    n,
    numberAt,
    rightWalls,
    downWalls,
    elements,
    path: Array.isArray(react?.path) ? react.path.slice() : [],
  };
}

export function isBoardSolved(board) {
  if (!board) return false;
  return isValidPath(board, board.path);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function clickCell(el) {
  if (!el) return;
  const view = el.ownerDocument.defaultView || globalThis;
  const rect = el.getBoundingClientRect();
  const coords = {
    clientX: rect.left + rect.width / 2,
    clientY: rect.top + rect.height / 2,
    bubbles: true,
    cancelable: true,
    view,
    button: 0,
  };
  const MouseEventCtor = view.MouseEvent || globalThis.MouseEvent;
  const PointerEventCtor = view.PointerEvent || globalThis.PointerEvent;
  try {
    if (PointerEventCtor) {
      el.dispatchEvent(
        new PointerEventCtor('pointerdown', {
          ...coords,
          buttons: 1,
          pointerId: 1,
          pointerType: 'mouse',
          isPrimary: true,
        }),
      );
    }
  } catch {
    // jsdom fixtures may not implement PointerEvent.
  }
  el.dispatchEvent(new MouseEventCtor('mousedown', { ...coords, buttons: 1 }));
  try {
    if (PointerEventCtor) {
      el.dispatchEvent(
        new PointerEventCtor('pointerup', {
          ...coords,
          buttons: 0,
          pointerId: 1,
          pointerType: 'mouse',
          isPrimary: true,
        }),
      );
    }
  } catch {
    // Same as pointerdown.
  }
  el.dispatchEvent(new MouseEventCtor('mouseup', { ...coords, buttons: 0 }));
  el.dispatchEvent(new MouseEventCtor('click', { ...coords, buttons: 0 }));
}

function visibleButton(root, pattern) {
  return [...root.querySelectorAll('button, a')].find((el) => {
    if (!isDisplayed(el)) return false;
    return pattern.test((el.textContent || '').replace(/\s+/g, ' ').trim());
  });
}

export function ensureBoardInteractive(root = document) {
  const start = visibleButton(root, /^start game$/i);
  if (start) start.click();
}

export function resetBoard(root = document) {
  const reset = visibleButton(root, /^reset$/i);
  if (reset) reset.click();
}

export function solveBoard(board) {
  if (!board) return null;
  return solve(board);
}

export async function applyPath(board, path, { isCancelled } = {}) {
  if (!board || !path) return { ok: false, reason: 'missing' };
  const cancelled = () => isCancelled && isCancelled();

  const current = Array.isArray(board.path) ? board.path : [];
  const prefix = current.every((idx, i) => path[i] === idx);
  if (current.length && !prefix) {
    resetBoard();
    await sleep(200);
  }

  const startFrom = prefix ? Math.max(current.length - 1, 0) : 0;
  for (let i = startFrom; i < path.length; i++) {
    if (cancelled()) return { ok: false, reason: 'cancelled' };
    const el = board.elements[path[i]];
    clickCell(el);
    await sleep(CLICK_GAP_MS);
    const latest = readBoard();
    if (latest && isBoardSolved(latest)) {
      return { ok: true, solved: true };
    }
    if (looksLikeCompletion()) {
      return { ok: true, solved: true };
    }
  }

  const latest = readBoard();
  return {
    ok: true,
    solved: !!(latest && isBoardSolved(latest)) || looksLikeCompletion(),
  };
}
