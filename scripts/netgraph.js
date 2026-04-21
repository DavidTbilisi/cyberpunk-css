// scripts/netgraph.js
// Lightweight Network Topology Graph (SVG nodes/edges, optional flow cues)

function _createSvg(ns = 'http://www.w3.org/2000/svg') {
  return document.createElementNS(ns, 'svg');
}

function _nodeBodyRadius(node) {
  if (node.type === 'router') return 26;
  if (node.type === 'server') return 20;
  return 16;
}

/** Shorten segment so lines and markers stop before node discs (source → target). */
function _trimEdge(x1, y1, x2, y2, padStart, padEnd) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  if (len < 0.001) return { x1, y1, x2, y2 };
  const ux = dx / len;
  const uy = dy / len;
  const t1 = Math.min(padStart, len * 0.38);
  const t2 = Math.min(padEnd, len * 0.38);
  if (t1 + t2 >= len - 0.5) {
    const h = len * 0.28;
    return {
      x1: x1 + ux * h,
      y1: y1 + uy * h,
      x2: x2 - ux * h,
      y2: y2 - uy * h
    };
  }
  return {
    x1: x1 + ux * t1,
    y1: y1 + uy * t1,
    x2: x2 - ux * t2,
    y2: y2 - uy * t2
  };
}

function _appendArrowMarker(svg, markerId) {
  const ns = svg.namespaceURI;
  const defs = document.createElementNS(ns, 'defs');
  const marker = document.createElementNS(ns, 'marker');
  marker.setAttribute('id', markerId);
  marker.setAttribute('markerWidth', '14');
  marker.setAttribute('markerHeight', '14');
  marker.setAttribute('refX', '12');
  marker.setAttribute('refY', '7');
  marker.setAttribute('orient', 'auto');
  marker.setAttribute('markerUnits', 'userSpaceOnUse');
  const path = document.createElementNS(ns, 'path');
  path.setAttribute('d', 'M0,0 L12,7 L0,14 Z');
  path.setAttribute('class', 'cp-netgraph__arrow-head');
  marker.appendChild(path);
  defs.appendChild(marker);
  svg.appendChild(defs);
}

function _makeNodeGroup(svg, x, y, node) {
  const g = document.createElementNS(svg.namespaceURI, 'g');
  g.setAttribute('transform', `translate(${x} ${y})`);
  g.classList.add('cp-netgraph__node-group');

  const r = _nodeBodyRadius(node);
  const circle = document.createElementNS(svg.namespaceURI, 'circle');
  circle.setAttribute('r', String(r));
  circle.setAttribute('fill', node.type === 'router' ? 'var(--cp-magenta)' : (node.type === 'server' ? 'var(--cp-blue)' : 'var(--cp-cyan)'));
  circle.setAttribute('stroke', 'rgba(255,255,255,0.12)');
  circle.setAttribute('stroke-width', '1');
  circle.classList.add('cp-netgraph__node', 'cp-netgraph__node-circle');
  g.appendChild(circle);

  const label = document.createElementNS(svg.namespaceURI, 'text');
  label.setAttribute('x', 0);
  label.setAttribute('y', String(r + 18));
  label.setAttribute('text-anchor', 'middle');
  label.setAttribute('font-size', '14');
  label.setAttribute('fill', 'var(--cp-foreground)');
  label.classList.add('cp-netgraph__node-label');
  label.textContent = node.label || node.id;
  g.appendChild(label);

  g._meta = { id: node.id };
  return g;
}

const DESTROY_KEY = '__cpNetGraphDestroy';

export function renderNetGraph(container, topology = {}, opts = {}) {
  const el = (typeof container === 'string') ? document.querySelector(container) : container;
  if (!el) return null;

  const prevDestroy = el[DESTROY_KEY];
  if (typeof prevDestroy === 'function') {
    try { prevDestroy(); } catch (e) { /* ignore */ }
  }

  el.classList.add('cp-netgraph');
  el.innerHTML = '';

  const titleText = opts.title != null ? String(opts.title) : 'Network Topology';

  const header = document.createElement('div');
  header.className = 'cp-netgraph__header';
  const titleEl = document.createElement('div');
  titleEl.className = 'cp-netgraph__title';
  titleEl.textContent = titleText;
  header.appendChild(titleEl);
  el.appendChild(header);

  const canvas = document.createElement('div');
  canvas.className = 'cp-netgraph__canvas';
  el.appendChild(canvas);

  const W = Number(opts.width) > 0 ? Number(opts.width) : 1200;
  const H = Number(opts.height) > 0 ? Number(opts.height) : 560;
  const showArrows = opts.arrows !== false;

  const svg = _createSvg();
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', titleText);
  svg.classList.add('cp-netgraph__svg');
  canvas.appendChild(svg);

  const markerId = `cp-ng-arr-${Math.random().toString(36).slice(2, 11)}`;
  if (showArrows) _appendArrowMarker(svg, markerId);

  const nodes = (topology.nodes || []).map((n, i) => ({...n, _i: i}));
  const edges = (topology.edges || []).map(e => ({...e}));

  const centerX = W / 2, centerY = H / 2;
  const radius = Math.min(centerX, centerY) - Math.min(140, Math.min(centerX, centerY) * 0.22);

  // position nodes in a circle by default
  const nCount = nodes.length;
  nodes.forEach((n, i) => {
    const angle = nCount ? (i / nCount) * Math.PI * 2 - Math.PI / 2 : 0;
    n._x = centerX + Math.cos(angle) * radius;
    n._y = centerY + Math.sin(angle) * radius;
  });

  // draw edges
  const edgeEls = [];
  edges.forEach((e) => {
    const source = nodes.find(n => n.id === e.source);
    const target = nodes.find(n => n.id === e.target);
    if (!source || !target) return;
    const padStart = _nodeBodyRadius(source) + 6;
    const padEnd = _nodeBodyRadius(target) + (showArrows ? 18 : 8);
    const { x1, y1, x2, y2 } = _trimEdge(source._x, source._y, target._x, target._y, padStart, padEnd);
    const line = document.createElementNS(svg.namespaceURI, 'line');
    line.setAttribute('x1', x1);
    line.setAttribute('y1', y1);
    line.setAttribute('x2', x2);
    line.setAttribute('y2', y2);
    line.setAttribute('stroke', 'rgba(255,255,255,0.14)');
    line.setAttribute('stroke-width', '2.5');
    line.setAttribute('stroke-linecap', 'round');
    line.classList.add('cp-netgraph__edge');
    if (showArrows) line.setAttribute('marker-end', `url(#${markerId})`);
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

  // packet emitter (optional)
  const packetsEnabled = opts.packets !== false;
  const emitInterval = opts.emitInterval || 1400;
  let emitTimer = null;

  function spawnPacket(edge) {
    const circle = document.createElementNS(svg.namespaceURI, 'circle');
    circle.setAttribute('r', '7');
    circle.setAttribute('fill', 'var(--cp-amber)');
    circle.setAttribute('opacity', '0.95');
    circle.classList.add('cp-netgraph__packet');
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

  if (packetsEnabled) {
    emitTimer = setInterval(() => {
      if (!edgeEls.length) return;
      const e = edgeEls[Math.floor(Math.random() * edgeEls.length)];
      spawnPacket(e);
    }, emitInterval);
  }

  function destroy() {
    if (emitTimer) {
      clearInterval(emitTimer);
      emitTimer = null;
    }
    el.innerHTML = '';
    el.classList.remove('cp-netgraph');
    if (el[DESTROY_KEY] === destroy) delete el[DESTROY_KEY];
  }

  el[DESTROY_KEY] = destroy;

  return { destroy };
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
