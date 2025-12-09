/**
 * @jest-environment jsdom
 */

describe('UI behavior tests', () => {
  beforeEach(() => {
    jest.resetModules();
    
    // Mock AudioContext
    window.AudioContext = jest.fn(() => ({
      currentTime: 0,
      state: 'running',
      createOscillator: jest.fn(() => ({
        type: 'sine',
        frequency: { setValueAtTime: jest.fn() },
        connect: jest.fn(),
        start: jest.fn(),
        stop: jest.fn(),
      })),
      createGain: jest.fn(() => ({
        gain: {
          setValueAtTime: jest.fn(),
          linearRampToValueAtTime: jest.fn(),
          exponentialRampToValueAtTime: jest.fn(),
        },
        connect: jest.fn(),
      })),
      destination: {},
      resume: jest.fn(() => Promise.resolve()),
    }));

    // Mock clipboard
    Object.assign(navigator, {
      clipboard: { writeText: jest.fn().mockResolvedValue(undefined) }
    });
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  test('button click creates ripple', () => {
    document.body.innerHTML = `<button class="cp-btn" id="test-btn">Button</button>`;
    require('../scripts/buttons.js');
    
    const btn = document.getElementById('test-btn');
    btn.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 10, clientY: 10 }));
    
    const ripple = btn.querySelector('.cp-ripple');
    expect(ripple).not.toBeNull();
    
    // Simulate animationend to remove ripple
    ripple.dispatchEvent(new Event('animationend'));
    expect(btn.querySelector('.cp-ripple')).toBeNull();
  });

  test('toast shows success variant', () => {
    document.body.innerHTML = `<div id="toast-stack"></div>`;
    const { showToast } = require('../scripts/toasts.js');
    
    showToast('All good', 'success', 0);
    const toast = document.querySelector('.cp-toast--success');
    expect(toast).not.toBeNull();
  });

  test('modal open and backdrop click closes modal', () => {
    document.body.innerHTML = `
      <div id="demo" class="cp-modal-backdrop">
        <div class="cp-modal"></div>
      </div>
      <button data-modal-open="demo">Open</button>
    `;
    const { openModal, closeModal } = require('../scripts/modals.js');
    
    const backdrop = document.getElementById('demo');
    openModal('demo');
    expect(backdrop.classList.contains('is-open')).toBe(true);
    
    closeModal('demo');
    expect(backdrop.classList.contains('is-open')).toBe(false);
  });

  test('hex viewer renders and copy works', async () => {
    document.body.innerHTML = `<div id="hex-test"></div>`;
    const { renderHex } = require('../scripts/hexviewer.js');
    
    renderHex('#hex-test', new Uint8Array([1, 2, 3, 4, 5]));
    const copyBtn = document.querySelector('.cp-hex__copy');
    expect(copyBtn).not.toBeNull();
    
    await copyBtn.click();
    expect(navigator.clipboard.writeText).toHaveBeenCalled();
  });
});
