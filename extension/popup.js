import { failedView, filledView, fillingView, statusView } from './status.js';

const statusEl = document.getElementById('status');
const button = document.getElementById('solve');
const hint = document.getElementById('hint');

const TAB_QUERY = {
  url: [
    'https://www.linkedin.com/games/*',
    'https://linkedin.com/games/*',
    'https://*.linkedin.com/games/*',
    'http://127.0.0.1/*',
    'http://localhost/*',
  ],
};

function setView(view) {
  statusEl.textContent = view.title;
  button.disabled = !view.actionEnabled;
  button.textContent = view.actionLabel || 'Solve';
  if (view.detail) hint.textContent = view.detail;
}

function looksLikeZipTab(tab) {
  return !!(tab?.url && /\/games\/zip(\/|$|\?)/i.test(tab.url));
}

async function askTab(tabId, type) {
  return chrome.tabs.sendMessage(tabId, { type });
}

async function findZipTab() {
  const [active] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (active?.id) {
    try {
      const info = await askTab(active.id, 'GET_STATUS');
      if (info?.identified || info?.hasBoard || info?.error) return { tab: active, info };
    } catch {
      if (looksLikeZipTab(active)) {
        return { tab: active, info: { error: 'no-content-script' } };
      }
    }
  }

  const tabs = await chrome.tabs.query(TAB_QUERY);
  for (const tab of tabs) {
    if (!tab.id || tab.id === active?.id) continue;
    try {
      const info = await askTab(tab.id, 'GET_STATUS');
      if (info?.identified || info?.hasBoard) return { tab, info };
    } catch {
      if (looksLikeZipTab(tab)) {
        return { tab, info: { error: 'no-content-script' } };
      }
    }
  }

  return { tab: active, info: null };
}

let targetTabId = null;

async function refresh() {
  setView({
    title: 'Looking for a Zip board…',
    detail: hint.textContent,
    actionEnabled: false,
    actionLabel: 'Solve',
  });
  try {
    const { tab, info } = await findZipTab();
    targetTabId = tab?.id ?? null;
    setView(statusView(info));
  } catch (err) {
    targetTabId = null;
    setView({
      title: 'Could not reach the page.',
      detail: String(err && err.message ? err.message : err),
      actionEnabled: false,
      actionLabel: 'Solve',
    });
  }
}

button.addEventListener('click', async () => {
  if (!targetTabId) {
    await refresh();
    if (!targetTabId || button.disabled) return;
  }
  setView(fillingView());
  try {
    const result = await askTab(targetTabId, 'SOLVE');
    if (result?.solved || result?.ok) {
      setView(filledView(result.n));
      return;
    }
    if (result?.error === 'need-start') {
      setView(statusView({ identified: true, hasBoard: false }));
      return;
    }
    if (result?.error === 'not-zip') {
      setView(statusView({ identified: false, hasBoard: false }));
      return;
    }
    if (result?.error === 'already-running') {
      setView({
        title: 'Already solving this board.',
        detail: 'Wait for the current Solve to finish.',
        actionEnabled: false,
        actionLabel: 'Solving…',
      });
      return;
    }
    setView(failedView(result?.error));
  } catch (err) {
    setView(failedView(err && err.message ? err.message : err));
  }
});

refresh();
