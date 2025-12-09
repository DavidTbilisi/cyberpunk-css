// scripts/sfx.js
// Retro SFX module using Web Audio API (<=5 exported functions)

let ctx = null;
let _lastKeyTime = 0;

function getContext() {
  if (ctx) return ctx;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  ctx = new AudioCtx();
  return ctx;
}

function playTone({ frequency = 440, type = 'sine', duration = 0.12, gain = 0.15, attack = 0.005, decay = 0.08 } = {}) {
  const c = getContext();
  if (!c) return;
  const now = c.currentTime;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, now);
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(gain, now + attack);
  g.gain.exponentialRampToValueAtTime(0.001, now + duration + decay);
  osc.connect(g);
  g.connect(c.destination);
  osc.start(now);
  osc.stop(now + duration + decay + 0.02);
}

export function play(name) {
  const c = getContext();
  if (!c) return;
  if (c.state === 'suspended') c.resume().catch(() => {});

  switch (name) {
    case 'click':
      playTone({ frequency: 1200, type: 'square', duration: 0.04, gain: 0.06, attack: 0.002, decay: 0.02 });
      break;
    case 'hover':
      playTone({ frequency: 640, type: 'sine', duration: 0.045, gain: 0.045, attack: 0.002, decay: 0.02 });
      break;
    case 'success':
      playTone({ frequency: 660, type: 'sine', duration: 0.09, gain: 0.07 });
      setTimeout(() => playTone({ frequency: 880, type: 'sine', duration: 0.09, gain: 0.06 }), 80);
      setTimeout(() => playTone({ frequency: 990, type: 'sine', duration: 0.12, gain: 0.05 }), 160);
      break;
    case 'error':
      playTone({ frequency: 140, type: 'sawtooth', duration: 0.22, gain: 0.18, attack: 0.01, decay: 0.08 });
      setTimeout(() => playTone({ frequency: 110, type: 'sawtooth', duration: 0.18, gain: 0.12 }), 80);
      break;
    case 'open':
      playTone({ frequency: 420, type: 'triangle', duration: 0.14, gain: 0.08 });
      setTimeout(() => playTone({ frequency: 520, type: 'triangle', duration: 0.12, gain: 0.06 }), 70);
      break;
    case 'close':
      playTone({ frequency: 280, type: 'triangle', duration: 0.12, gain: 0.07 });
      break;
    case 'keypress': {
      const now = c.currentTime;
      if (now - _lastKeyTime < 0.03) return;
      _lastKeyTime = now;
      playTone({ frequency: 1200 + (Math.random() * 200 - 100), type: 'square', duration: 0.03, gain: 0.06, attack: 0.001, decay: 0.02 });
      break;
    }
  }
}

export function unlock() {
  const c = getContext();
  if (c && c.state === 'suspended') c.resume().catch(() => {});
}

export function initSfxListeners() {
  // unlock on first gesture
  const doUnlock = () => { unlock(); window.removeEventListener('pointerdown', doUnlock); window.removeEventListener('keydown', doUnlock); };
  window.addEventListener('pointerdown', doUnlock, { once: true });
  window.addEventListener('keydown', doUnlock, { once: true });

  // hover SFX
  document.querySelectorAll('a, .cp-btn, .cp-navbar__link, [data-theme-toggle]').forEach(el => {
    el.addEventListener('mouseenter', () => play('hover'));
  });

  // keypress SFX for inputs
  document.querySelectorAll('input, textarea').forEach(el => {
    el.addEventListener('keydown', (e) => { if (e.key && e.key.length === 1) play('keypress'); });
  });
}

// Auto-init
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initSfxListeners);
  else initSfxListeners();
}
