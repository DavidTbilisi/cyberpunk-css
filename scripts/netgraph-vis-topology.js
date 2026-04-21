// scripts/netgraph-vis-topology.js
// Pure topology → vis-network element shapes (no vis import, safe for Jest).
// Node / edge colors read from :root theme CSS variables when available (same tokens as SVG netgraph).

/**
 * Read a custom property as set for this element (inherits from ancestors, e.g. `.theme-matrix`).
 * @param {Element | null | undefined} themeRoot mount node or themed wrapper; falls back to `:root`
 * @param {string} name
 * @param {string} fallback
 */
function readCssVar(themeRoot, name, fallback) {
  if (typeof document === 'undefined' || !document.documentElement) return fallback;
  const el = themeRoot && themeRoot.nodeType === 1 ? themeRoot : document.documentElement;
  const v = getComputedStyle(el).getPropertyValue(name).trim();
  return v.length ? v : fallback;
}

/**
 * @param {string} color rgb(...) or #hex from getComputedStyle
 * @param {number} alpha 0–1
 */
function rgbaFromColor(color, alpha) {
  const m = color.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (m) return `rgba(${m[1]},${m[2]},${m[3]},${alpha})`;
  if (color.startsWith('#') && color.length >= 7) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
  return color;
}

function themeNodeColors(themeRoot, isRouter, isServer) {
  const magenta = readCssVar(themeRoot, '--cp-magenta', '#ff2ad4');
  const blue = readCssVar(themeRoot, '--cp-blue', '#2a9df4');
  const cyan = readCssVar(themeRoot, '--cp-cyan', '#28f7ff');
  const amber = readCssVar(themeRoot, '--cp-amber', '#ffbf3a');
  const fg = readCssVar(themeRoot, '--cp-foreground', '#e6e6ff');
  const bg = isRouter ? magenta : isServer ? blue : cyan;
  const border = rgbaFromColor(fg, 0.35);
  return {
    background: bg,
    border,
    highlight: { background: bg, border: amber },
    hover: { background: bg, border: amber }
  };
}

/**
 * Map framework topology to vis-network node/edge payloads (plain objects).
 * @param {object} topology
 * @param {object} [opts]
 * @param {boolean} [opts.arrows]
 * @param {Element} [opts.themeRoot] element used for `getComputedStyle` (inherit theme from ancestors); default `:root`
 */
export function topologyToVisElements(topology = {}, opts = {}) {
  const themeRoot = opts.themeRoot;
  const rawNodes = topology.nodes || [];
  const rawEdges = topology.edges || [];
  const idSet = new Set(rawNodes.map((n) => n.id).filter(Boolean));
  const arrows = opts.arrows !== false;
  const cyan = readCssVar(themeRoot, '--cp-cyan', '#28f7ff');
  const amber = readCssVar(themeRoot, '--cp-amber', '#ffbf3a');
  const fg = readCssVar(themeRoot, '--cp-foreground', '#e6e6ee');
  const edgeLine = rgbaFromColor(cyan, 0.38);

  const visNodes = rawNodes
    .filter((n) => n && n.id)
    .map((n) => {
      const isRouter = n.type === 'router';
      const isServer = n.type === 'server';
      const color = themeNodeColors(themeRoot, isRouter, isServer);
      return {
        id: n.id,
        label: n.label || n.id,
        title: typeof n.title === 'string' ? n.title : `${isRouter ? 'router' : isServer ? 'server' : 'node'}`,
        shape: isRouter ? 'diamond' : isServer ? 'box' : 'dot',
        color,
        font: { color: fg, size: 15, face: 'system-ui,Segoe UI,sans-serif' },
        margin: 12,
        borderWidth: 2
      };
    });

  const visEdges = rawEdges
    .map((e, i) => {
      if (!e || !e.source || !e.target) return null;
      if (!idSet.has(e.source) || !idSet.has(e.target)) return null;
      return {
        id: e.id || `e-${e.source}-${e.target}-${i}`,
        from: e.source,
        to: e.target,
        arrows: arrows ? 'to' : undefined,
        color: { color: edgeLine, highlight: amber },
        smooth: { type: 'dynamic' }
      };
    })
    .filter(Boolean);

  return { nodes: visNodes, edges: visEdges };
}
