// scripts/netgraph-vis.js
// Optional vis-network renderer (lazy-loaded, ~large bundle).

import { topologyToVisElements } from './netgraph-vis-topology.js';

export { topologyToVisElements };

const DESTROY_KEY = '__cpNetGraphDestroy';
const VIS_CSS_MARKER = 'data-cp-vis-network-css';

function _ensureVisStylesheet() {
  if (typeof document === 'undefined') return;
  if (document.querySelector(`link[${VIS_CSS_MARKER}]`)) return;
  let href;
  try {
    href = new URL('../node_modules/vis-network/styles/vis-network.min.css', import.meta.url).href;
  } catch {
    return;
  }
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  link.setAttribute(VIS_CSS_MARKER, '1');
  document.head.appendChild(link);
}

function _defaultVisOptions(opts = {}) {
  const base = {
    layout: { improvedLayout: true, randomSeed: opts.randomSeed ?? 2 },
    physics: {
      enabled: opts.physics !== false,
      stabilization: { iterations: 180, updateInterval: 25 },
      barnesHut: {
        gravitationalConstant: opts.gravitationalConstant ?? -22000,
        centralGravity: 0.25,
        springLength: opts.springLength ?? 220,
        springConstant: 0.05
      }
    },
    edges: {
      width: 2,
      selectionWidth: 3,
      font: { color: '#9fb4c9', size: 11, strokeWidth: 0 }
    },
    nodes: { shadow: { enabled: true, size: 12, x: 2, y: 2 } },
    interaction: { hover: true, navigationButtons: true, keyboard: true, tooltipDelay: 120 },
    configure: { enabled: false }
  };
  if (opts.visOptions && typeof opts.visOptions === 'object') {
    return { ...base, ...opts.visOptions };
  }
  return base;
}

/**
 * Render topology with vis-network (lazy import). Loads standalone ESM from node_modules.
 * @returns {Promise<{ destroy: Function, network?: import('vis-network').Network } | null>}
 */
export async function renderNetGraphVis(container, topology = {}, opts = {}) {
  const el = typeof container === 'string' ? document.querySelector(container) : container;
  if (!el) return null;

  const prevDestroy = el[DESTROY_KEY];
  if (typeof prevDestroy === 'function') {
    try { prevDestroy(); } catch (e) { /* ignore */ }
  }

  _ensureVisStylesheet();

  let visMod;
  try {
    const href = new URL('../node_modules/vis-network/standalone/esm/vis-network.js', import.meta.url).href;
    visMod = await import(/* webpackIgnore: true */ href);
  } catch (err) {
    console.warn('[cp-netgraph-vis] Failed to load vis-network. Run npm install and serve from project root.', err);
    return null;
  }

  const { Network, DataSet } = visMod;
  const titleText = opts.title != null ? String(opts.title) : 'Network (vis-network)';

  el.classList.add('cp-netgraph', 'cp-netgraph--vis');
  el.innerHTML = '';

  const header = document.createElement('div');
  header.className = 'cp-netgraph__header';
  const titleEl = document.createElement('div');
  titleEl.className = 'cp-netgraph__title';
  titleEl.textContent = titleText;
  header.appendChild(titleEl);
  el.appendChild(header);

  const canvas = document.createElement('div');
  canvas.className = 'cp-netgraph-vis__canvas';
  const netHost = document.createElement('div');
  netHost.className = 'cp-netgraph-vis__network';
  netHost.setAttribute('role', 'presentation');
  canvas.appendChild(netHost);
  el.appendChild(canvas);

  const { nodes: nArr, edges: eArr } = topologyToVisElements(topology, { ...opts, themeRoot: el });
  const data = {
    nodes: new DataSet(nArr),
    edges: new DataSet(eArr)
  };

  const options = _defaultVisOptions(opts);
  const network = new Network(netHost, data, options);

  if (opts.freezeAfterStabilize !== false) {
    network.once('stabilizationIterationsDone', () => {
      try { network.setOptions({ physics: false }); } catch (e) { /* ignore */ }
    });
  }

  function destroy() {
    try { network.destroy(); } catch (e) { /* ignore */ }
    el.innerHTML = '';
    el.classList.remove('cp-netgraph', 'cp-netgraph--vis');
    if (el[DESTROY_KEY] === destroy) delete el[DESTROY_KEY];
  }

  el[DESTROY_KEY] = destroy;
  return { destroy, network };
}
