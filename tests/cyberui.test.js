/**
 * @jest-environment jsdom
 */

describe('CyberUI modules', () => {
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

    document.body.innerHTML = `
      <nav class="cp-navbar" id="main-navbar"></nav>
      <div id="toast-stack"></div>
      <button class="cp-btn">Test</button>
    `;
  });

  test('all modules export their functions', () => {
    const sfx = require('../scripts/sfx.js');
    const buttons = require('../scripts/buttons.js');
    const navbar = require('../scripts/navbar.js');
    const toasts = require('../scripts/toasts.js');
    const modals = require('../scripts/modals.js');
    
    expect(sfx.play).toBeDefined();
    expect(sfx.unlock).toBeDefined();
    expect(buttons.initButtons).toBeDefined();
    expect(navbar.initNavbar).toBeDefined();
    expect(toasts.showToast).toBeDefined();
    expect(modals.openModal).toBeDefined();
  });

  test('modules auto-initialize without throwing', () => {
    expect(() => {
      require('../scripts/sfx.js');
      require('../scripts/buttons.js');
      require('../scripts/navbar.js');
      require('../scripts/toasts.js');
      require('../scripts/modals.js');
    }).not.toThrow();
  });
});
