// scripts/buttons.js
// Button effects module (auto-init)
import { play } from './sfx.js';

export function initButtons() {
  document.querySelectorAll('.cp-btn').forEach(btn => {
    // Ripple effect
    btn.addEventListener('click', (e) => {
      play('click');
      const rect = btn.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'cp-ripple';
      ripple.style.left = `${e.clientX - rect.left}px`;
      ripple.style.top = `${e.clientY - rect.top}px`;
      btn.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove());
    });

    // data-click-text: change text on click
    if (btn.hasAttribute('data-click-text')) {
      btn.addEventListener('click', () => {
        btn.textContent = btn.getAttribute('data-click-text');
      });
    }

    // data-hover-text / data-default-text
    if (btn.hasAttribute('data-hover-text')) {
      const defaultText = btn.getAttribute('data-default-text') || btn.textContent;
      btn.addEventListener('mouseenter', () => { btn.textContent = btn.getAttribute('data-hover-text'); });
      btn.addEventListener('mouseleave', () => { btn.textContent = defaultText; });
    }

    // data-press-scale
    if (btn.hasAttribute('data-press-scale')) {
      const scale = btn.getAttribute('data-press-scale');
      btn.addEventListener('mousedown', () => { btn.style.transform = `scale(${scale})`; });
      btn.addEventListener('mouseup', () => { btn.style.transform = 'scale(1)'; });
      btn.addEventListener('mouseleave', () => { btn.style.transform = 'scale(1)'; });
    }

    // data-scroll-to: smooth scroll to Y position
    if (btn.hasAttribute('data-scroll-to')) {
      btn.addEventListener('click', () => {
        const y = parseInt(btn.getAttribute('data-scroll-to'), 10) || 0;
        window.scrollTo({ top: y, behavior: 'smooth' });
      });
    }
  });
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initButtons);
  else initButtons();
}
