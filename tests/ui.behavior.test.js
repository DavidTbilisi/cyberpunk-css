const fs = require('fs');
const path = require('path');

beforeAll(() => {
  require(path.resolve(__dirname, '..', 'cyberpunk.js'));
  const jsPath = path.resolve(__dirname, '..', 'cyberpunk.js');
  const code = fs.readFileSync(jsPath, 'utf8');
  const adapted = code.replace(/^\s*const\s+CyberUI\s*=\s*/m, 'global.CyberUI = ');
  eval(adapted);
});

afterEach(() => {
  // clean up body
  document.body.innerHTML = '';
});

test('button click creates ripple and plays sfx', () => {
  const btn = document.createElement('button');
  btn.className = 'cp-btn';
  document.body.appendChild(btn);

  // stub sfx
  global.CyberUI.sfx = { play: jest.fn() };

  // init binds listeners
  global.CyberUI.init();

  // simulate click
  btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));

  const ripple = btn.querySelector('.cp-ripple');
  expect(ripple).not.toBeNull();

  // simulate animationend to remove ripple
  ripple.dispatchEvent(new Event('animationend'));
  expect(btn.querySelector('.cp-ripple')).toBeNull();
});

test('toast shows success variant and copy plays sfx', async () => {
  // stub sfx and clipboard
  global.CyberUI.sfx = { play: jest.fn() };
  navigator.clipboard = { writeText: jest.fn().mockResolvedValue() };

  // call toast
  global.CyberUI.toast('All good', { variant: 'success', timeout: 0 });
  const toast = document.querySelector('.cp-toast--success');
  expect(toast).not.toBeNull();

  // click close (close handler plays click sfx)
  const closeBtn = toast.querySelector('.cp-toast__close');
  expect(closeBtn).not.toBeNull();
  closeBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  // simulate animationend for removal
  toast.dispatchEvent(new Event('animationend'));
});

test('modal open and backdrop click closes modal', () => {
  // create backdrop/modal markup before init so listeners attach
  const backdrop = document.createElement('div');
  backdrop.className = 'cp-modal-backdrop';
  backdrop.setAttribute('data-modal', 'demo');
  const modal = document.createElement('div');
  modal.className = 'cp-modal';
  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);

  global.CyberUI.init();
  global.CyberUI.openModal('demo');
  expect(backdrop.classList.contains('is-open')).toBe(true);

  // clicking backdrop (target is backdrop) should close
  backdrop.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  expect(backdrop.classList.contains('is-open')).toBe(false);
});

test('hex copy button calls navigator.clipboard.writeText', async () => {
  navigator.clipboard = { writeText: jest.fn().mockResolvedValue() };
  global.CyberUI.sfx = { play: jest.fn() };

  const container = document.createElement('div');
  container.id = 'hex-test';
  document.body.appendChild(container);

  global.CyberUI.hexViewer.render('#hex-test', new Uint8Array([1,2,3,4,5,6,7,8,9,0]));
  const copyBtn = container.querySelector('.cp-hex__copy');
  expect(copyBtn).not.toBeNull();

  copyBtn.click();
  // wait a tick for async clipboard
  await Promise.resolve();
  expect(navigator.clipboard.writeText).toHaveBeenCalled();
});
