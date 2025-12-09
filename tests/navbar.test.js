/**
 * @jest-environment jsdom
 */

describe('navbar module', () => {
  beforeEach(() => {
    jest.resetModules();
    document.body.innerHTML = `
      <nav class="cp-navbar" id="main-navbar"></nav>
    `;
    
    // Reset scroll position
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true });
  });

  test('initNavbar() adds is-scrolled class when scrolled past 50px', () => {
    require('../scripts/navbar.js');
    
    const navbar = document.getElementById('main-navbar');
    
    // Simulate scroll
    Object.defineProperty(window, 'scrollY', { value: 100, writable: true });
    window.dispatchEvent(new Event('scroll'));
    
    expect(navbar.classList.contains('is-scrolled')).toBe(true);
  });

  test('initNavbar() removes is-scrolled class when scrolled back up', () => {
    require('../scripts/navbar.js');
    
    const navbar = document.getElementById('main-navbar');
    
    // Scroll down
    Object.defineProperty(window, 'scrollY', { value: 100, writable: true });
    window.dispatchEvent(new Event('scroll'));
    expect(navbar.classList.contains('is-scrolled')).toBe(true);
    
    // Scroll back up
    Object.defineProperty(window, 'scrollY', { value: 20, writable: true });
    window.dispatchEvent(new Event('scroll'));
    expect(navbar.classList.contains('is-scrolled')).toBe(false);
  });

  test('initNavbar() does nothing if navbar not found', () => {
    document.body.innerHTML = '';
    
    // Should not throw
    require('../scripts/navbar.js');
    expect(true).toBe(true);
  });
});
