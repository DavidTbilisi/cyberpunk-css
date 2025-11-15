const fs = require('fs');
const path = require('path');

beforeAll(() => {
  // ensure module is required so jest coverage instruments it
  require(path.resolve(__dirname, '..', 'cyberpunk.js'));
  // also expose it as global.CyberUI for convenience in tests
  const jsPath = path.resolve(__dirname, '..', 'cyberpunk.js');
  const code = fs.readFileSync(jsPath, 'utf8');
  const adapted = code.replace(/^\s*const\s+CyberUI\s*=\s*/m, 'global.CyberUI = ');
  eval(adapted);
});

test('CyberUI global is available', () => {
  expect(global.CyberUI).toBeDefined();
});

test('init() runs without throwing', () => {
  expect(() => global.CyberUI.init()).not.toThrow();
});
