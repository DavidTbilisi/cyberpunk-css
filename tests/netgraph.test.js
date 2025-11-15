const fs = require('fs');
const path = require('path');

beforeAll(() => {
  require(path.resolve(__dirname, '..', 'cyberpunk.js'));
  const jsPath = path.resolve(__dirname, '..', 'cyberpunk.js');
  const code = fs.readFileSync(jsPath, 'utf8');
  const adapted = code.replace(/^\s*const\s+CyberUI\s*=\s*/m, 'global.CyberUI = ');
  eval(adapted);
});

test('net graph renders svg and nodes', () => {
  const container = document.createElement('div');
  container.id = 'test-net';
  document.body.appendChild(container);

  const topology = {
    nodes: [ { id: 'a', label: 'A' }, { id: 'b', label: 'B' }, { id: 'c', label: 'C' } ],
    edges: [ { source: 'a', target: 'b' }, { source: 'a', target: 'c' } ]
  };

  const handle = global.CyberUI.netGraph.render('#test-net', topology, { emitInterval: 500 });
  const svg = container.querySelector('svg');
  expect(svg).not.toBeNull();
  const nodes = svg.querySelectorAll('g.cp-netgraph__node');
  expect(nodes.length).toBe(topology.nodes.length);

  // clean up
  if (handle && typeof handle.destroy === 'function') handle.destroy();
});
