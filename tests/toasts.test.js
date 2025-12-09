/**
 * @jest-environment jsdom
 */

// Mock sfx module
jest.mock('../scripts/sfx.js', () => ({
  play: jest.fn()
}));

describe('toasts module', () => {
  let toastsModule;
  let sfxMock;

  beforeEach(() => {
    jest.resetModules();
    
    document.body.innerHTML = `
      <div id="toast-stack"></div>
      <button id="toast-btn" data-toast data-toast-message="Test message" data-toast-variant="success">Show Toast</button>
      <button id="toast-default" data-toast data-toast-message="Default msg">Default</button>
      <button id="toast-error" data-toast data-toast-message="Error msg" data-toast-variant="error">Error</button>
    `;
    
    sfxMock = require('../scripts/sfx.js');
    toastsModule = require('../scripts/toasts.js');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createToastElement()', () => {
    test('creates toast with default class', () => {
      const { toast } = toastsModule.createToastElement('Hello');
      expect(toast.className).toBe('cp-toast ');
    });

    test('creates toast with variant class', () => {
      const { toast } = toastsModule.createToastElement('Hello', 'success');
      expect(toast.className).toBe('cp-toast cp-toast--success');
    });

    test('creates toast with message text', () => {
      const { toast } = toastsModule.createToastElement('My message');
      expect(toast.textContent).toContain('My message');
    });

    test('creates toast with close button', () => {
      const { closeBtn } = toastsModule.createToastElement('Test');
      expect(closeBtn.className).toBe('cp-toast__close');
      expect(closeBtn.getAttribute('aria-label')).toBe('Close');
      expect(closeBtn.textContent).toBe('×');
    });
  });

  describe('showToast()', () => {
    test('appends toast to stack', () => {
      const toast = toastsModule.showToast('Test message');
      const stack = document.getElementById('toast-stack');
      expect(stack.contains(toast)).toBe(true);
    });

    test('returns null if no stack found', () => {
      document.body.innerHTML = '';
      const result = toastsModule.showToast('Test');
      expect(result).toBeNull();
    });

    test('plays success sound for success variant', () => {
      toastsModule.showToast('Test', 'success');
      expect(sfxMock.play).toHaveBeenCalledWith('success');
    });

    test('plays error sound for error variant', () => {
      toastsModule.showToast('Test', 'error');
      expect(sfxMock.play).toHaveBeenCalledWith('error');
    });

    test('plays click sound for default variant', () => {
      toastsModule.showToast('Test', 'default');
      expect(sfxMock.play).toHaveBeenCalledWith('click');
    });

    test('close button removes toast', () => {
      const toast = toastsModule.showToast('Test');
      const closeBtn = toast.querySelector('.cp-toast__close');
      closeBtn.click();
      expect(document.getElementById('toast-stack').contains(toast)).toBe(false);
    });

    test('animationend removes toast', () => {
      jest.useFakeTimers();
      const toast = toastsModule.showToast('Test', 'default', 10000);
      toast.dispatchEvent(new Event('animationend'));
      expect(document.getElementById('toast-stack').contains(toast)).toBe(false);
      jest.useRealTimers();
    });

    test('timeout removes toast', () => {
      jest.useFakeTimers();
      const toast = toastsModule.showToast('Test', 'default', 1000);
      jest.advanceTimersByTime(1100);
      expect(document.getElementById('toast-stack').contains(toast)).toBe(false);
      jest.useRealTimers();
    });
  });

  describe('removeToastFromButton()', () => {
    test('removes toast containing close button', () => {
      const toast = toastsModule.showToast('Test');
      const closeBtn = toast.querySelector('.cp-toast__close');
      toastsModule.removeToastFromButton(closeBtn);
      expect(document.getElementById('toast-stack').children.length).toBe(0);
    });

    test('does nothing if no toast parent found', () => {
      const orphanBtn = document.createElement('button');
      document.body.appendChild(orphanBtn);
      // Should not throw
      toastsModule.removeToastFromButton(orphanBtn);
      expect(true).toBe(true);
    });
  });

  describe('initToasts()', () => {
    test('wires data-toast buttons to show toast on click', () => {
      const btn = document.getElementById('toast-btn');
      btn.click();
      
      const stack = document.getElementById('toast-stack');
      expect(stack.children.length).toBeGreaterThan(0);
      expect(stack.textContent).toContain('Test message');
    });

    test('uses element text if no data-toast-message', () => {
      jest.resetModules();
      document.body.innerHTML = `
        <div id="toast-stack"></div>
        <button id="no-msg" data-toast>Button Text</button>
      `;
      require('../scripts/toasts.js');
      
      document.getElementById('no-msg').click();
      const stack = document.getElementById('toast-stack');
      expect(stack.textContent).toContain('Button Text');
    });
  });
});
