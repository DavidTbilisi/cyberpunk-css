// scripts/modals.js
// Small modal helpers (≤5 functions)
import { showToast } from './toasts.js';
import { play } from './sfx.js';

export function openModal(id = 'demo-modal') {
  const backdrop = document.getElementById(id);
  if (!backdrop) return;
  backdrop.classList.add('is-open');
  play('open');
}

export function closeModal(id = 'demo-modal') {
  const backdrop = document.getElementById(id);
  if (!backdrop) return;
  backdrop.classList.remove('is-open');
  play('close');
}

export function openConfirmModal() {
  openModal('confirm-modal');
}

export function closeConfirmModal() {
  closeModal('confirm-modal');
}

export function confirmAction() {
  showToast('System shutdown initiated...', 'error');
  closeConfirmModal();
}

// Initialize modals by wiring elements with `data-modal-open` / `data-modal-close`
export function initModals() {
  document.querySelectorAll('[data-modal-open]').forEach((btn) => {
    const target = btn.getAttribute('data-modal-open') || 'demo-modal';
    btn.addEventListener('click', () => openModal(target));
  });

  document.querySelectorAll('[data-modal-close]').forEach((btn) => {
    const target = btn.getAttribute('data-modal-close') || 'demo-modal';
    btn.addEventListener('click', () => closeModal(target));
  });

  // click on backdrop to close (delegated)
  document.addEventListener('click', (e) => {
    if (e.target.classList && e.target.classList.contains('cp-modal-backdrop') && e.target.classList.contains('is-open')) {
      closeModal(e.target.id);
    }
  });

  // ESC key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.cp-modal-backdrop.is-open').forEach(bd => closeModal(bd.id));
    }
  });
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initModals);
  else initModals();
}
