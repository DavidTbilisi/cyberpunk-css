// scripts/hexviewer.js
// Small Hex Viewer module (<=4 functions)
import { play } from './sfx.js';

export function _toUint8Array(data) {
  if (!data) return new Uint8Array();
  if (data instanceof Uint8Array) return data;
  if (data instanceof ArrayBuffer) return new Uint8Array(data);
  if (Array.isArray(data)) return new Uint8Array(data);
  if (typeof data === 'string') {
    // interpret as hex string (e.g. "DE AD BE EF") or simple text
    const hex = data.replace(/[^0-9a-fA-F]/g, '');
    if (hex.length && hex.length % 2 === 0) {
      const out = new Uint8Array(hex.length / 2);
      for (let i = 0; i < hex.length; i += 2) out[i/2] = parseInt(hex.substr(i,2), 16);
      return out;
    }
    // else treat as UTF-8 bytes
    return new TextEncoder().encode(data);
  }
  return new Uint8Array();
}

export function _padHex(n, width = 8) {
  return n.toString(16).toUpperCase().padStart(width, '0');
}

export function renderHex(container, data) {
  const el = (typeof container === 'string') ? document.querySelector(container) : container;
  if (!el) return null;
  const bytes = _toUint8Array(data);
  el.classList.add('cp-hex');
  el.innerHTML = '';

  const toolbar = document.createElement('div');
  toolbar.className = 'cp-hex__toolbar';
  const title = document.createElement('div');
  title.className = 'cp-hex__title';
  title.textContent = 'Hex Viewer';
  const toolbarRight = document.createElement('div');
  const copyBtn = document.createElement('button');
  copyBtn.className = 'cp-hex__copy';
  copyBtn.textContent = 'Copy';
  toolbarRight.appendChild(copyBtn);
  toolbar.appendChild(title);
  toolbar.appendChild(toolbarRight);
  el.appendChild(toolbar);

  const table = document.createElement('div');
  table.className = 'cp-hex__table';

  const bytesPerLine = 16;
  for (let offset = 0; offset < bytes.length; offset += bytesPerLine) {
    const lineBytes = bytes.slice(offset, offset + bytesPerLine);
    const row = document.createElement('div');
    row.className = 'cp-hex__row';

    const addr = document.createElement('div');
    addr.className = 'cp-hex__addr';
    addr.textContent = _padHex(offset, 8);
    row.appendChild(addr);

    const hexCol = document.createElement('div');
    hexCol.className = 'cp-hex__hex';
    lineBytes.forEach((b) => {
      const span = document.createElement('span');
      span.className = 'cp-hex__byte';
      span.textContent = b.toString(16).toUpperCase().padStart(2, '0');
      hexCol.appendChild(span);
    });
    row.appendChild(hexCol);

    const asciiCol = document.createElement('div');
    asciiCol.className = 'cp-hex__ascii';
    lineBytes.forEach((b) => {
      const ch = (b >= 32 && b <= 126) ? String.fromCharCode(b) : '.';
      const span = document.createElement('span');
      span.className = 'cp-hex__ascii-char';
      span.textContent = ch;
      asciiCol.appendChild(span);
    });
    row.appendChild(asciiCol);

    table.appendChild(row);
  }

  el.appendChild(table);

  // copy handler
  copyBtn.addEventListener('click', async () => {
    const hexLines = [];
    for (let offset = 0; offset < bytes.length; offset += bytesPerLine) {
      const slice = bytes.slice(offset, offset + bytesPerLine);
      const hexs = Array.from(slice).map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' ');
      hexLines.push(_padHex(offset, 8) + ': ' + hexs);
    }
    const payload = hexLines.join('\n');
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(payload);
      } else {
        const ta = document.createElement('textarea');
        ta.value = payload;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
      }
      play('success');
    } catch (e) {
      play('error');
    }
  });

  return el;
}

// Auto-wire elements with `data-hex-load` and optional `data-hex-target`
export function initHexViewer() {
  document.querySelectorAll('[data-hex-load]').forEach((btn) => {
    const target = btn.getAttribute('data-hex-target') || btn.getAttribute('data-target') || '#demo-hex';
    btn.addEventListener('click', () => {
      const source = btn.getAttribute('data-hex-source');
      let payload = null;
      if (source) {
        // attempt to read element content as hex or text
        const el = document.querySelector(source);
        if (el) payload = el.textContent;
      }
      if (!payload) payload = btn.getAttribute('data-hex-payload') || new Uint8Array([0,1,2,3,4,10,13,32,65,66,67,68,69,70,255,128,0,99,100,101]);
      renderHex(target, payload);
    });
  });
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initHexViewer);
  else initHexViewer();
}
