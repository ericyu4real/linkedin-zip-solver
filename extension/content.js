import { boardStatus, runSolve } from './board.js';
import { failedView, filledView, fillingView, statusView } from './status.js';
import { mountOverlay, updateOverlay } from './overlay.js';

const DISMISS_KEY = 'zip-auto-solver-dismissed';

function isDismissed() {
  try {
    return sessionStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    return false;
  }
}

function dismiss() {
  try {
    sessionStorage.setItem(DISMISS_KEY, '1');
  } catch {
    // Ignore storage failures; the chip still hides for this page lifetime.
  }
  updateOverlay({ visible: false });
}

let filling = false;

function refresh() {
  if (filling || isDismissed() || document.hidden) return;
  updateOverlay(statusView(boardStatus()));
}

async function fill() {
  if (filling || isDismissed()) return { ok: false, error: 'already-running' };
  filling = true;
  try {
    const current = boardStatus();
    updateOverlay(fillingView(current && current.n));
    const result = await runSolve();
    if (result?.solved || result?.ok) {
      updateOverlay(filledView(result.n));
      return result;
    }
    if (result?.error === 'need-start') {
      updateOverlay(statusView({ identified: true, hasBoard: false }));
      return result;
    }
    if (result?.error === 'not-zip') {
      updateOverlay(statusView({ identified: false, hasBoard: false }));
      return result;
    }
    updateOverlay(failedView(result?.error));
    return result;
  } catch (err) {
    const error = err && err.message ? err.message : err;
    updateOverlay(failedView(error));
    return { ok: false, error: String(error) };
  } finally {
    filling = false;
  }
}

mountOverlay({
  iconUrl: chrome.runtime.getURL('icons/icon48.png'),
  onSolve: fill,
  onDismiss: dismiss,
});

refresh();

let debounce = null;
function scheduleRefresh() {
  if (debounce || filling || isDismissed() || document.hidden) return;
  debounce = setTimeout(() => {
    debounce = null;
    refresh();
  }, 400);
}

new MutationObserver(scheduleRefresh).observe(document.documentElement, {
  childList: true,
  subtree: true,
});

setInterval(() => {
  if (!document.hidden) refresh();
}, 1500);

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) refresh();
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (!msg || (msg.type !== 'GET_STATUS' && msg.type !== 'SOLVE')) return undefined;
  if (msg.type === 'GET_STATUS') {
    sendResponse(boardStatus());
    return undefined;
  }
  fill().then(sendResponse);
  return true;
});
