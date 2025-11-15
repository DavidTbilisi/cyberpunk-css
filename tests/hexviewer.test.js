const fs = require('fs');
const path = require('path');

beforeAll(() => {
  require(path.resolve(__dirname, '..', 'cyberpunk.js'));
  const jsPath = path.resolve(__dirname, '..', 'cyberpunk.js');
  const code = fs.readFileSync(jsPath, 'utf8');
  const adapted = code.replace(/^\s*const\s+CyberUI\s*=\s*/m, 'global.CyberUI = ');
  eval(adapted);
});

test('hex viewer renders lines and copy button', () => {
  const container = document.createElement('div');
  container.id = 'test-hex';
  document.body.appendChild(container);

  const bytes = new Uint8Array([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]);
  global.CyberUI.hexViewer.render('#test-hex', bytes);

  const lines = container.querySelectorAll('.cp-hex__line');
  expect(lines.length).toBeGreaterThan(0);
  const copyBtn = container.querySelector('.cp-hex__copy');
  expect(copyBtn).not.toBeNull();
});
