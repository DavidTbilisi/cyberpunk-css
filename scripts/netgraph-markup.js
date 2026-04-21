// scripts/netgraph-markup.js
// Build netgraph topology from HTML only (lists / data attrs) or Mermaid-like text in <script type="text/cp-netgraph">.

import { renderNetGraph } from './netgraph.js';

/**
 * Parse Mermaid-inspired lines (no external parser).
 * Nodes: id(Label):::type  |  id(Label)  |  id[Label]:::type
 * Edges: id --> id  |  id -> id
 * Lines starting with # are comments. Blank lines ignored.
 * @param {string} text
 * @returns {{ nodes: Array<{id:string,label?:string,type?:string}>, edges: Array<{source:string,target:string}> }}
 */
export function parseTopologyFromText(text) {
  const nodes = [];
  const edges = [];
  const seen = new Map();

  const lines = String(text || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  function normType(t) {
    const x = String(t || 'node').toLowerCase();
    if (x === 'router' || x === 'r') return 'router';
    if (x === 'server' || x === 's' || x === 'srv' || x === 'db') return 'server';
    return 'node';
  }

  for (const line of lines) {
    if (line.startsWith('#')) continue;

    // Use [-\\w.]+ so '-' is not parsed as a range inside [...]
    const edge = line.match(/^([-\w.]+)\s*(?:-->|->)\s*([-\w.]+)\s*$/);
    if (edge) {
      edges.push({ source: edge[1], target: edge[2] });
      continue;
    }

    const paren = line.match(/^([-\w.]+)\(([^)]+)\)(?:\s*:::\s*([-\w.]+))?\s*$/);
    if (paren) {
      const id = paren[1];
      const label = paren[2].trim();
      const type = normType(paren[3]);
      seen.set(id, { id, label: label || id, type });
      continue;
    }

    const brack = line.match(/^([-\w.]+)\[([^\]]+)\](?:\s*:::\s*([-\w.]+))?\s*$/);
    if (brack) {
      const id = brack[1];
      const label = brack[2].trim();
      const type = normType(brack[3]);
      seen.set(id, { id, label: label || id, type });
      continue;
    }
  }

  seen.forEach((n) => nodes.push(n));

  return { nodes, edges };
}

/**
 * @param {Element} el definition root (script block and/or node/edge lists)
 */
export function parseTopologyFromElement(el) {
  if (!el || el.nodeType !== 1) return { nodes: [], edges: [] };

  const script = el.querySelector('script[type="text/cp-netgraph"], script[type="application/x-cp-netgraph"]');
  if (script && script.textContent && script.textContent.trim()) {
    return parseTopologyFromText(script.textContent);
  }

  const nodes = [];
  const nodeWrap = el.querySelector('[data-netgraph-nodes]');
  if (nodeWrap) {
    nodeWrap.querySelectorAll('[data-id]').forEach((item) => {
      const id = item.getAttribute('data-id');
      if (!id) return;
      const label = (item.textContent || '').trim() || id;
      const type = item.getAttribute('data-type') || 'node';
      nodes.push({ id, label, type });
    });
  }

  const edges = [];
  const edgeWrap = el.querySelector('[data-netgraph-edges]');
  if (edgeWrap) {
    edgeWrap.querySelectorAll('[data-from][data-to]').forEach((item) => {
      const source = item.getAttribute('data-from');
      const target = item.getAttribute('data-to');
      if (source && target) edges.push({ source, target });
    });
  }

  return { nodes, edges };
}

function _readOptsFromDataset(ds) {
  const opts = {};
  if (ds.netgraphTitle) opts.title = ds.netgraphTitle;
  if (ds.netgraphEmitInterval) {
    const n = Number(ds.netgraphEmitInterval);
    if (!Number.isNaN(n) && n > 0) opts.emitInterval = n;
  }
  if (ds.netgraphPackets === 'false') opts.packets = false;
  if (ds.netgraphArrows === 'false') opts.arrows = false;
  if (ds.netgraphWidth) {
    const w = Number(ds.netgraphWidth);
    if (!Number.isNaN(w) && w > 0) opts.width = w;
  }
  if (ds.netgraphHeight) {
    const h = Number(ds.netgraphHeight);
    if (!Number.isNaN(h) && h > 0) opts.height = h;
  }
  return opts;
}

/**
 * Parse definition element and render into target from data-netgraph-target.
 * @param {Element} defRoot
 */
export function buildNetGraphFromMarkup(defRoot) {
  const sel = defRoot.getAttribute('data-netgraph-target');
  const target = sel ? document.querySelector(sel) : null;
  if (!target) return null;
  const topology = parseTopologyFromElement(defRoot);
  if (!topology.nodes.length) return null;
  const opts = _readOptsFromDataset(defRoot.dataset);
  return renderNetGraph(target, topology, opts);
}

export function initNetGraphMarkup(root = document) {
  root.querySelectorAll('[data-netgraph-def][data-netgraph-auto]').forEach((def) => {
    try {
      buildNetGraphFromMarkup(def);
    } catch (e) {
      console.warn('[netgraph-markup] auto build failed', e);
    }
  });

  root.querySelectorAll('[data-netgraph-build]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const fromSel = btn.getAttribute('data-netgraph-from');
      const def = fromSel ? document.querySelector(fromSel) : btn.closest('[data-netgraph-def]');
      if (!def || !def.hasAttribute('data-netgraph-def')) return;
      try {
        buildNetGraphFromMarkup(def);
      } catch (e) {
        console.warn('[netgraph-markup] build failed', e);
      }
    });
  });
}

if (typeof document !== 'undefined') {
  const run = () => initNetGraphMarkup(document);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
}
