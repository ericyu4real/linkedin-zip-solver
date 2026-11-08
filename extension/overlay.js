const HOST_ID = 'zip-auto-solver-host';
const states = new WeakMap();

const STYLES = `
:host {
  all: initial;
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 2147483646;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}
.card {
  width: 248px;
  padding: 12px;
  border-radius: 16px;
  color: #f4f1ea;
  background: rgba(22, 22, 24, 0.94);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.38);
  backdrop-filter: blur(16px);
}
.top { display: flex; gap: 10px; align-items: flex-start; }
img.logo { width: 36px; height: 36px; border-radius: 9px; flex: none; }
.copy { min-width: 0; flex: 1; }
.title { font-size: 13px; font-weight: 650; line-height: 1.3; letter-spacing: -0.01em; }
.detail { margin-top: 3px; font-size: 11px; line-height: 1.4; color: rgba(244, 241, 234, 0.68); }
.close {
  margin: -4px -4px 0 0; width: 22px; height: 22px; border: 0; border-radius: 999px;
  background: transparent; color: rgba(244, 241, 234, 0.55); font-size: 16px; line-height: 1; cursor: pointer;
}
.close:hover { background: rgba(255, 255, 255, 0.08); color: #fff; }
.fill {
  display: block; width: 100%; margin-top: 10px; border: 0; border-radius: 10px;
  padding: 8px 12px; font: inherit; font-size: 12px; font-weight: 650; cursor: pointer;
  background: linear-gradient(180deg, #ff7a3d, #ee5b14); color: #1a1408;
}
.fill:hover:not(:disabled) { filter: brightness(1.06); }
.fill:disabled {
  background: rgba(255, 255, 255, 0.12); color: rgba(244, 241, 234, 0.4);
  cursor: default; filter: none;
}
.card[data-tone="solved"] .fill { display: none; }
`;

function docOf(root) {
  return root.nodeType === 9 ? root : root.ownerDocument || document;
}

function stateFor(doc) {
  let state = states.get(doc);
  if (!state) {
    state = { host: null, shadow: null, onSolve: null, onDismiss: null };
    states.set(doc, state);
  }
  return state;
}

function ensureHost(doc) {
  const state = stateFor(doc);
  if (state.host && state.host.isConnected) return state.host;

  let host = doc.getElementById(HOST_ID);
  if (host && host.shadowRoot) {
    state.host = host;
    state.shadow = host.shadowRoot;
    return host;
  }

  host = doc.createElement('div');
  host.id = HOST_ID;
  const shadow = host.attachShadow({ mode: 'open' });
  shadow.innerHTML = `
    <style>${STYLES}</style>
    <div class="card" hidden>
      <div class="top">
        <img class="logo" alt="" width="36" height="36">
        <div class="copy">
          <div class="title"></div>
          <div class="detail"></div>
        </div>
        <button class="close" type="button" aria-label="Hide detector">×</button>
      </div>
      <button class="fill" type="button">Solve</button>
    </div>
  `;
  shadow.querySelector('.close').addEventListener('click', () => {
    if (state.onDismiss) state.onDismiss();
  });
  shadow.querySelector('.fill').addEventListener('click', () => {
    if (shadow.querySelector('.fill').disabled) return;
    if (state.onSolve) state.onSolve();
  });
  host.style.display = 'none';
  doc.documentElement.appendChild(host);
  state.host = host;
  state.shadow = shadow;
  return host;
}

export function mountOverlay(options = {}, root = document) {
  const doc = docOf(root);
  const state = stateFor(doc);
  state.onSolve = options.onSolve || null;
  state.onDismiss = options.onDismiss || null;
  ensureHost(doc);
  const logo = state.shadow.querySelector('img.logo');
  if (options.iconUrl) logo.src = options.iconUrl;
  else logo.remove();
  return state.host;
}

export function updateOverlay(view, root = document) {
  const doc = docOf(root);
  const state = stateFor(doc);
  if (!state.shadow || !state.host) return;
  const card = state.shadow.querySelector('.card');
  const visible = !!(view && view.visible);
  card.hidden = !visible;
  state.host.style.display = visible ? 'block' : 'none';
  if (!visible) return;
  card.dataset.tone = view.tone || 'idle';
  state.shadow.querySelector('.title').textContent = view.title || '';
  state.shadow.querySelector('.detail').textContent = view.detail || '';
  const button = state.shadow.querySelector('.fill');
  button.textContent = view.actionLabel || 'Solve';
  button.disabled = !view.actionEnabled;
}

export function overlayHost(root = document) {
  return stateFor(docOf(root)).host;
}
