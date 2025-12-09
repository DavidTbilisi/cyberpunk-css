/**
 * @jest-environment jsdom
 */

// Mock sfx and toasts modules
jest.mock('../scripts/sfx.js', () => ({
  play: jest.fn()
}));

jest.mock('../scripts/toasts.js', () => ({
  showToast: jest.fn(),
  createToastElement: jest.fn(),
  removeToastFromButton: jest.fn(),
  initToasts: jest.fn()
}));

describe('modals module', () => {
  let modalsModule;
  let sfxMock;
  let toastsMock;

  beforeEach(() => {
    jest.resetModules();
    
    document.body.innerHTML = `
      <div id="demo-modal" class="cp-modal-backdrop">
        <div class="cp-modal">
          <button id="close-demo" data-modal-close="demo-modal">Close</button>
        </div>
      </div>
      <div id="confirm-modal" class="cp-modal-backdrop">
        <div class="cp-modal">
          <button id="close-confirm" data-modal-close="confirm-modal">Cancel</button>
        </div>
      </div>
      <button id="open-demo" data-modal-open="demo-modal">Open Demo</button>
      <button id="open-confirm" data-modal-open="confirm-modal">Open Confirm</button>
    `;
    
    sfxMock = require('../scripts/sfx.js');
    toastsMock = require('../scripts/toasts.js');
    modalsModule = require('../scripts/modals.js');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('openModal()', () => {
    test('adds is-open class to modal backdrop', () => {
      modalsModule.openModal('demo-modal');
      const backdrop = document.getElementById('demo-modal');
      expect(backdrop.classList.contains('is-open')).toBe(true);
    });

    test('plays open sound', () => {
      modalsModule.openModal('demo-modal');
      expect(sfxMock.play).toHaveBeenCalledWith('open');
    });

    test('does nothing if modal not found', () => {
      // Should not throw
      modalsModule.openModal('nonexistent');
      expect(sfxMock.play).not.toHaveBeenCalled();
    });

    test('defaults to demo-modal if no id provided', () => {
      modalsModule.openModal();
      const backdrop = document.getElementById('demo-modal');
      expect(backdrop.classList.contains('is-open')).toBe(true);
    });
  });

  describe('closeModal()', () => {
    test('removes is-open class from modal backdrop', () => {
      const backdrop = document.getElementById('demo-modal');
      backdrop.classList.add('is-open');
      
      modalsModule.closeModal('demo-modal');
      expect(backdrop.classList.contains('is-open')).toBe(false);
    });

    test('plays close sound', () => {
      document.getElementById('demo-modal').classList.add('is-open');
      modalsModule.closeModal('demo-modal');
      expect(sfxMock.play).toHaveBeenCalledWith('close');
    });

    test('does nothing if modal not found', () => {
      // Should not throw
      modalsModule.closeModal('nonexistent');
      expect(sfxMock.play).not.toHaveBeenCalled();
    });

    test('defaults to demo-modal if no id provided', () => {
      const backdrop = document.getElementById('demo-modal');
      backdrop.classList.add('is-open');
      
      modalsModule.closeModal();
      expect(backdrop.classList.contains('is-open')).toBe(false);
    });
  });

  describe('openConfirmModal()', () => {
    test('opens confirm-modal', () => {
      modalsModule.openConfirmModal();
      const backdrop = document.getElementById('confirm-modal');
      expect(backdrop.classList.contains('is-open')).toBe(true);
    });
  });

  describe('closeConfirmModal()', () => {
    test('closes confirm-modal', () => {
      const backdrop = document.getElementById('confirm-modal');
      backdrop.classList.add('is-open');
      
      modalsModule.closeConfirmModal();
      expect(backdrop.classList.contains('is-open')).toBe(false);
    });
  });

  describe('confirmAction()', () => {
    test('shows error toast and closes modal', () => {
      const backdrop = document.getElementById('confirm-modal');
      backdrop.classList.add('is-open');
      
      modalsModule.confirmAction();
      
      expect(toastsMock.showToast).toHaveBeenCalledWith('System shutdown initiated...', 'error');
      expect(backdrop.classList.contains('is-open')).toBe(false);
    });
  });

  describe('initModals()', () => {
    test('wires data-modal-open buttons', () => {
      const btn = document.getElementById('open-demo');
      btn.click();
      
      const backdrop = document.getElementById('demo-modal');
      expect(backdrop.classList.contains('is-open')).toBe(true);
    });

    test('wires data-modal-close buttons', () => {
      const backdrop = document.getElementById('demo-modal');
      backdrop.classList.add('is-open');
      
      const btn = document.getElementById('close-demo');
      btn.click();
      
      expect(backdrop.classList.contains('is-open')).toBe(false);
    });

    test('clicking on open backdrop closes modal', () => {
      const backdrop = document.getElementById('demo-modal');
      backdrop.classList.add('is-open');
      
      // Simulate click on backdrop itself
      backdrop.click();
      
      expect(backdrop.classList.contains('is-open')).toBe(false);
    });

    test('ESC key closes all open modals', () => {
      const demo = document.getElementById('demo-modal');
      const confirm = document.getElementById('confirm-modal');
      demo.classList.add('is-open');
      confirm.classList.add('is-open');
      
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      
      expect(demo.classList.contains('is-open')).toBe(false);
      expect(confirm.classList.contains('is-open')).toBe(false);
    });

    test('non-Escape key does not close modals', () => {
      const demo = document.getElementById('demo-modal');
      demo.classList.add('is-open');
      
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
      
      expect(demo.classList.contains('is-open')).toBe(true);
    });
  });
});
