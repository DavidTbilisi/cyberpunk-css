// scripts/toasts.js
// Small utilities to create and manage toasts (max ~3 small functions)
import { play } from './sfx.js';

export function createToastElement(message, variant = 'default') {
  const toast = document.createElement('div');
  toast.className = `cp-toast ${variant !== 'default' ? 'cp-toast--' + variant : ''}`;

  const inner = document.createElement('div');
  inner.style.display = 'flex';
  inner.style.justifyContent = 'space-between';
  inner.style.alignItems = 'center';

  const span = document.createElement('span');
  span.textContent = message;

  const closeBtn = document.createElement('button');
  closeBtn.className = 'cp-toast__close';
  closeBtn.setAttribute('aria-label', 'Close');
  closeBtn.textContent = '×';

  inner.appendChild(span);
  inner.appendChild(closeBtn);
  toast.appendChild(inner);

  return { toast, closeBtn };
}

export function showToast(message, variant = 'default', timeout = 4000) {
  const stack = document.getElementById('toast-stack');
  if (!stack) return null;

  const { toast, closeBtn } = createToastElement(message, variant);
  stack.appendChild(toast);

  function remove() {
    if (toast.parentNode) toast.remove();
  }

  closeBtn.addEventListener('click', () => remove());

  // Play SFX
  if (variant === 'success') play('success');
  else if (variant === 'error') play('error');
  else play('click');

  // Auto remove with a safe fallback if animations removed
  const t = setTimeout(() => remove(), timeout);
  toast.addEventListener('animationend', () => {
    clearTimeout(t);
    remove();
  });

  return toast;
}

export function removeToastFromButton(closeBtn) {
  const node = closeBtn.closest('.cp-toast');
  if (node) node.remove();
}

// Initialize toasts by wiring buttons with `data-toast` attributes
export function initToasts() {
  // delegate close buttons inside the toast stack
  const stack = document.getElementById('toast-stack');
  if (stack) {
    stack.addEventListener('click', (e) => {
      const btn = e.target.closest('.cp-toast__close');
      if (btn) removeToastFromButton(btn);
    });
  }

  // wire any elements with `data-toast` to show messages
  document.querySelectorAll('[data-toast]').forEach((el) => {
    el.addEventListener('click', () => {
      const msg = el.getAttribute('data-toast-message') || el.textContent || 'Notification';
      const variant = el.getAttribute('data-toast-variant') || 'default';
      showToast(msg, variant);
    });
  });
}

// Auto-init on DOM ready so HTML can be minimal
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initToasts);
  else initToasts();
}
