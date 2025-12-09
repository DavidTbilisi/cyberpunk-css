/**
 * @jest-environment jsdom
 */

// Polyfill TextEncoder for jsdom
global.TextEncoder = require('util').TextEncoder;

// Mock sfx module
jest.mock('../scripts/sfx.js', () => ({
  play: jest.fn()
}));

describe('hexviewer module', () => {
  let hexModule;

  beforeEach(() => {
    jest.resetModules();
    
    document.body.innerHTML = `
      <div id="hex-container"></div>
      <button id="hex-load" data-hex-load data-hex-target="#hex-container">Load Hex</button>
    `;
    
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue(undefined)
      }
    });
    
    hexModule = require('../scripts/hexviewer.js');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('_toUint8Array()', () => {
    test('returns empty array for null/undefined', () => {
      expect(hexModule._toUint8Array(null)).toEqual(new Uint8Array());
      expect(hexModule._toUint8Array(undefined)).toEqual(new Uint8Array());
    });

    test('returns same Uint8Array if already Uint8Array', () => {
      const arr = new Uint8Array([1, 2, 3]);
      expect(hexModule._toUint8Array(arr)).toBe(arr);
    });

    test('converts ArrayBuffer to Uint8Array', () => {
      const buffer = new ArrayBuffer(3);
      const view = new Uint8Array(buffer);
      view[0] = 1; view[1] = 2; view[2] = 3;
      
      const result = hexModule._toUint8Array(buffer);
      expect(result).toEqual(new Uint8Array([1, 2, 3]));
    });

    test('converts regular array to Uint8Array', () => {
      const result = hexModule._toUint8Array([65, 66, 67]);
      expect(result).toEqual(new Uint8Array([65, 66, 67]));
    });

    test('converts hex string to Uint8Array', () => {
      const result = hexModule._toUint8Array('DEADBEEF');
      expect(result).toEqual(new Uint8Array([0xDE, 0xAD, 0xBE, 0xEF]));
    });

    test('converts hex string with spaces', () => {
      const result = hexModule._toUint8Array('DE AD BE EF');
      expect(result).toEqual(new Uint8Array([0xDE, 0xAD, 0xBE, 0xEF]));
    });

    test('converts regular text to UTF-8 bytes', () => {
      const result = hexModule._toUint8Array('ABC');
      expect(result).toEqual(new Uint8Array([65, 66, 67]));
    });
  });

  describe('_padHex()', () => {
    test('pads number to specified width', () => {
      expect(hexModule._padHex(0, 8)).toBe('00000000');
      expect(hexModule._padHex(255, 4)).toBe('00FF');
      expect(hexModule._padHex(4096, 4)).toBe('1000');
    });

    test('defaults to width 8', () => {
      expect(hexModule._padHex(16)).toBe('00000010');
    });
  });

  describe('renderHex()', () => {
    test('returns null for invalid container', () => {
      const result = hexModule.renderHex('#nonexistent', [1, 2, 3]);
      expect(result).toBeNull();
    });

    test('renders hex viewer with toolbar', () => {
      hexModule.renderHex('#hex-container', [0xDE, 0xAD, 0xBE, 0xEF]);
      
      const container = document.getElementById('hex-container');
      expect(container.classList.contains('cp-hex')).toBe(true);
      expect(container.querySelector('.cp-hex__toolbar')).toBeTruthy();
      expect(container.querySelector('.cp-hex__title').textContent).toBe('Hex Viewer');
      expect(container.querySelector('.cp-hex__copy')).toBeTruthy();
    });

    test('renders hex table with rows', () => {
      hexModule.renderHex('#hex-container', [0xDE, 0xAD, 0xBE, 0xEF]);
      
      const container = document.getElementById('hex-container');
      const rows = container.querySelectorAll('.cp-hex__row');
      expect(rows.length).toBeGreaterThan(0);
    });

    test('renders address column', () => {
      hexModule.renderHex('#hex-container', [0xDE, 0xAD, 0xBE, 0xEF]);
      
      const addr = document.querySelector('.cp-hex__addr');
      expect(addr.textContent).toBe('00000000');
    });

    test('renders hex bytes', () => {
      hexModule.renderHex('#hex-container', [0xDE, 0xAD]);
      
      const bytes = document.querySelectorAll('.cp-hex__byte');
      expect(bytes[0].textContent).toBe('DE');
      expect(bytes[1].textContent).toBe('AD');
    });

    test('renders ASCII column', () => {
      hexModule.renderHex('#hex-container', [65, 66, 67]); // ABC
      
      const ascii = document.querySelectorAll('.cp-hex__ascii-char');
      expect(ascii[0].textContent).toBe('A');
      expect(ascii[1].textContent).toBe('B');
      expect(ascii[2].textContent).toBe('C');
    });

    test('renders dot for non-printable ASCII', () => {
      hexModule.renderHex('#hex-container', [0, 1, 2]);
      
      const ascii = document.querySelectorAll('.cp-hex__ascii-char');
      expect(ascii[0].textContent).toBe('.');
      expect(ascii[1].textContent).toBe('.');
      expect(ascii[2].textContent).toBe('.');
    });

    test('accepts element directly instead of selector', () => {
      const container = document.getElementById('hex-container');
      hexModule.renderHex(container, [1, 2, 3]);
      
      expect(container.classList.contains('cp-hex')).toBe(true);
    });

    test('copy button copies hex to clipboard', async () => {
      hexModule.renderHex('#hex-container', [0xDE, 0xAD]);
      
      const copyBtn = document.querySelector('.cp-hex__copy');
      await copyBtn.click();
      
      expect(navigator.clipboard.writeText).toHaveBeenCalled();
    });
  });

  describe('initHexViewer()', () => {
    test('wires data-hex-load buttons', () => {
      const btn = document.getElementById('hex-load');
      btn.click();
      
      const container = document.getElementById('hex-container');
      expect(container.classList.contains('cp-hex')).toBe(true);
    });
  });
});
