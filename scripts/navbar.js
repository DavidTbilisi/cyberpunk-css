// scripts/navbar.js
// Navbar scroll-glow module (auto-init)

export function initNavbar() {
  const navbar = document.getElementById('main-navbar');
  if (!navbar) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) navbar.classList.add('is-scrolled');
    else navbar.classList.remove('is-scrolled');
  });
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initNavbar);
  else initNavbar();
}
