// scripts/netgraph.js
// Lightweight Network Topology Graph module (≤5 functions)

function _createSvg(ns = 'http://www.w3.org/2000/svg') {
  return document.createElementNS(ns, 'svg');
}

function _makeNodeGroup(svg, x, y, node) {
  const g = document.createElementNS(svg.namespaceURI, 'g');
  g.setAttribute('transform', `translate(${x} ${y})`);
  g.classList.add('cp-netgraph__node-group');

  const circle = document.createElementNS(svg.namespaceURI, 'circle');
  circle.setAttribute('r', node.type === 'router' ? 18 : (node.type === 'server' ? 14 : 12));
  circle.setAttribute('fill', node.type === 'router' ? 'var(--cp-magenta)' : (node.type === 'server' ? 'var(--cp-blue)' : 'var(--cp-cyan)'));
  circle.classList.add('cp-netgraph__node');
  g.appendChild(circle);

  const label = document.createElementNS(svg.namespaceURI, 'text');
  label.setAttribute('x', 0);
  label.setAttribute('y', 32);
  label.setAttribute('text-anchor', 'middle');
  label.setAttribute('font-size', '11');
  label.setAttribute('fill', 'var(--cp-foreground)');
  label.textContent = node.label || node.id;
  g.appendChild(label);

  g._meta = { id: node.id };
  return g;
}

export function renderNetGraph(container, topology = {}, opts = {}) {
  const el = (typeof container === 'string') ? document.querySelector(container) : container;
  if (!el) return null;
  el.classList.add('cp-netgraph');
  el.innerHTML = '';

  const header = document.createElement('div');
  header.className = 'cp-netgraph__header';
  header.innerHTML = `<div class="cp-netgraph__title">Network Topology</div>`;
  el.appendChild(header);

  const canvas = document.createElement('div');
  canvas.className = 'cp-netgraph__canvas';
  el.appendChild(canvas);

  const svg = _createSvg();
  svg.setAttribute('viewBox', '0 0 800 360');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svg.classList.add('cp-netgraph__svg');
  canvas.appendChild(svg);

  const nodes = (topology.nodes || []).map((n, i) => ({...n, _i: i}));
  const edges = (topology.edges || []).map(e => ({...e}));

  const W = 800, H = 360;
  const centerX = W / 2, centerY = H / 2;
  const radius = Math.min(centerX, centerY) - 80;

  // position nodes in a circle by default
  nodes.forEach((n, i) => {
    const angle = (i / nodes.length) * Math.PI * 2;
    n._x = centerX + Math.cos(angle) * radius;
    n._y = centerY + Math.sin(angle) * radius;
  });

  // draw edges
  const edgeEls = [];
  edges.forEach((e) => {
    const source = nodes.find(n => n.id === e.source);
    const target = nodes.find(n => n.id === e.target);
    if (!source || !target) return;
    const line = document.createElementNS(svg.namespaceURI, 'line');
    line.setAttribute('x1', source._x);
    line.setAttribute('y1', source._y);
    line.setAttribute('x2', target._x);
    line.setAttribute('y2', target._y);
    line.setAttribute('stroke', 'rgba(255,255,255,0.08)');
    line.setAttribute('stroke-width', '2');
    line.classList.add('cp-netgraph__edge');
    svg.appendChild(line);
    edgeEls.push({ el: line, source, target });
  });

  // draw nodes
  const nodeMap = {};
  nodes.forEach(n => {
    const g = _makeNodeGroup(svg, n._x, n._y, n);
    svg.appendChild(g);
    nodeMap[n.id] = g;
  });

  // packet emitter
  const emitInterval = opts.emitInterval || 1400;
  let emitTimer = null;

  function spawnPacket(edge) {
    const circle = document.createElementNS(svg.namespaceURI, 'circle');
    circle.setAttribute('r', 5);
    circle.setAttribute('fill', 'var(--cp-amber)');
    circle.setAttribute('opacity', '0.95');
    svg.appendChild(circle);

    const sx = parseFloat(edge.el.getAttribute('x1'));
    const sy = parseFloat(edge.el.getAttribute('y1'));
    const tx = parseFloat(edge.el.getAttribute('x2'));
    const ty = parseFloat(edge.el.getAttribute('y2'));

    const duration = 800 + Math.random() * 600;
    const start = performance.now();

    function step(now) {
      const t = Math.min(1, (now - start) / duration);
      const x = sx + (tx - sx) * t;
      const y = sy + (ty - sy) * t;
      circle.setAttribute('cx', x);
      circle.setAttribute('cy', y);
      if (t < 1) requestAnimationFrame(step);
      else setTimeout(() => circle.remove(), 60);
    }
    requestAnimationFrame(step);
  }

  emitTimer = setInterval(() => {
    if (!edgeEls.length) return;
    const e = edgeEls[Math.floor(Math.random() * edgeEls.length)];
    spawnPacket(e);
  }, emitInterval);

  function destroy() {
    if (emitTimer) clearInterval(emitTimer);
    try { canvas.remove(); } catch (e) {}
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    el.classList.remove('cp-netgraph');
  }

  // return handle to caller
  const handle = { destroy };

  return handle;
}

// Auto-wire elements with `data-netgraph-load`
export function initNetGraph() {
  document.querySelectorAll('[data-netgraph-load]').forEach((btn) => {
    const target = btn.getAttribute('data-netgraph-target') || '#demo-netgraph';
    btn.addEventListener('click', () => {
      const topologyJson = btn.getAttribute('data-netgraph-payload');
      let topology = null;
      if (topologyJson) {
        try { topology = JSON.parse(topologyJson); } catch (e) { topology = null; }
      }
      if (!topology) {
        topology = {
          nodes: [
            { id: 'gw', label: 'Gateway', type: 'router' },
            { id: 'n1', label: 'Node 1', type: 'node' },
            { id: 'n2', label: 'Node 2', type: 'node' },
            { id: 'db', label: 'DB Server', type: 'server' }
          ],
          edges: [
            { source: 'gw', target: 'n1' },
            { source: 'gw', target: 'n2' },
            { source: 'gw', target: 'db' },
            { source: 'n1', target: 'db' }
          ]
        };
      }
      renderNetGraph(target, topology, { emitInterval: 1000 });
    });
  });
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initNetGraph);
  else initNetGraph();
}
