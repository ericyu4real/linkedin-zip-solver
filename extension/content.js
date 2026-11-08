import { failedView, filledView, fillingView, statusView } from './status.js';
import { mountOverlay, updateOverlay } from './overlay.js';

const COMMAND = 'zip-solver-command';
const RESULT = 'zip-solver-result';
const DISMISS_KEY = 'zip-auto-solver-dismissed';

function sendToPage(type, timeoutMs) {
  return new Promise((resolve) => {
    const id = `${type}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const timer = setTimeout(() => {
      window.removeEventListener(RESULT, onResult);
      resolve({ ok: false, error: 'timeout' });
    }, timeoutMs);

    function onResult(event) {
      const detail = event.detail || {};
      if (detail.id !== id) return;
      clearTimeout(timer);
      window.removeEventListener(RESULT, onResult);
      resolve(detail);
    }

    window.addEventListener(RESULT, onResult);
    window.dispatchEvent(new CustomEvent(COMMAND, { detail: { type, id } }));
  });
}

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

async function refresh() {
  if (filling || isDismissed() || document.hidden) return;
  const info = await sendToPage('GET_STATUS', 1500);
  updateOverlay(statusView(info));
}

async function fill() {
  if (filling || isDismissed()) return;
  filling = true;
  try {
    const current = await sendToPage('GET_STATUS', 1500);
    updateOverlay(fillingView(current && current.n));
    const result = await sendToPage('SOLVE', 45000);
    if (result?.solved || result?.ok) {
      updateOverlay(filledView(result.n));
      return;
    }
    if (result?.error === 'need-start') {
      updateOverlay(statusView({ identified: true, hasBoard: false }));
      return;
    }
    if (result?.error === 'not-zip') {
      updateOverlay(statusView({ identified: false, hasBoard: false }));
      return;
    }
    updateOverlay(failedView(result?.error));
  } catch (err) {
    updateOverlay(failedView(err && err.message ? err.message : err));
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
  const timeoutMs = msg.type === 'SOLVE' ? 45000 : 2000;
  sendToPage(msg.type, timeoutMs).then(sendResponse);
  return true;
});
