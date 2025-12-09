const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

test('compile SCSS to CSS and check for component selectors', () => {
  const cwd = path.resolve(__dirname, '..');
  // run sass compile from scss folder
  execSync('npx sass scss/cyberpunk.scss cyberpunk.css --style=compressed', { cwd, stdio: 'inherit' });
  const cssPath = path.join(cwd, 'cyberpunk.css');
  const css = fs.readFileSync(cssPath, 'utf8');
  expect(css.includes('.cp-hex')).toBeTruthy();
  expect(css.includes('.cp-netgraph')).toBeTruthy();
});
