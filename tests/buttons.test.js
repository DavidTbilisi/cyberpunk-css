/**
 * @jest-environment jsdom
 */

describe('buttons module', () => {
  beforeEach(() => {
    jest.resetModules();
    document.body.innerHTML = `
      <button class="cp-btn" id="btn1">Normal</button>
      <button class="cp-btn" id="btn2" data-click-text="Clicked!">Click Me</button>
      <button class="cp-btn" id="btn3" data-hover-text="Hovering" data-default-text="Default">Hover Me</button>
      <button class="cp-btn" id="btn4" data-press-scale="0.95">Press Me</button>
      <button class="cp-btn" id="btn5" data-scroll-to="500">Scroll</button>
    `;
    
    // Mock scrollTo
    window.scrollTo = jest.fn();
    
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
  });

  test('initButtons() adds ripple effect on click', () => {
    require('../scripts/buttons.js');
    
    const btn = document.getElementById('btn1');
    btn.dispatchEvent(new MouseEvent('click', { clientX: 10, clientY: 10, bubbles: true }));
    
    const ripple = btn.querySelector('.cp-ripple');
    expect(ripple).toBeTruthy();
  });

  test('data-click-text changes text on click', () => {
    require('../scripts/buttons.js');
    
    const btn = document.getElementById('btn2');
    btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    
    expect(btn.textContent).toBe('Clicked!');
  });

  test('data-hover-text changes text on hover', () => {
    require('../scripts/buttons.js');
    
    const btn = document.getElementById('btn3');
    
    btn.dispatchEvent(new MouseEvent('mouseenter'));
    expect(btn.textContent).toBe('Hovering');
    
    btn.dispatchEvent(new MouseEvent('mouseleave'));
    expect(btn.textContent).toBe('Default');
  });

  test('data-press-scale scales on press', () => {
    require('../scripts/buttons.js');
    
    const btn = document.getElementById('btn4');
    
    btn.dispatchEvent(new MouseEvent('mousedown'));
    expect(btn.style.transform).toBe('scale(0.95)');
    
    btn.dispatchEvent(new MouseEvent('mouseup'));
    expect(btn.style.transform).toBe('scale(1)');
  });

  test('data-press-scale resets on mouseleave', () => {
    require('../scripts/buttons.js');
    
    const btn = document.getElementById('btn4');
    
    btn.dispatchEvent(new MouseEvent('mousedown'));
    btn.dispatchEvent(new MouseEvent('mouseleave'));
    expect(btn.style.transform).toBe('scale(1)');
  });

  test('data-scroll-to scrolls to position', () => {
    require('../scripts/buttons.js');
    
    const btn = document.getElementById('btn5');
    btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 500, behavior: 'smooth' });
  });

  test('ripple is removed after animation ends', () => {
    require('../scripts/buttons.js');
    
    const btn = document.getElementById('btn1');
    btn.dispatchEvent(new MouseEvent('click', { clientX: 10, clientY: 10, bubbles: true }));
    
    const ripple = btn.querySelector('.cp-ripple');
    ripple.dispatchEvent(new Event('animationend'));
    
    expect(btn.querySelector('.cp-ripple')).toBeNull();
  });
});
