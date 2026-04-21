/**
 * @jest-environment jsdom
 */

const { topologyToVisElements } = require('../scripts/netgraph-vis-topology.js');

describe('netgraph-vis topology mapping', () => {
  const topology = {
    nodes: [
      { id: 'gw', label: 'Gateway', type: 'router' },
      { id: 'app', label: 'App', type: 'server' },
      { id: 'c1', label: 'Client', type: 'client' }
    ],
    edges: [
      { source: 'gw', target: 'app' },
      { source: 'c1', target: 'gw' },
      { source: 'gw', target: 'missing' }
    ]
  };

  test('maps nodes with ids and labels', () => {
    const { nodes } = topologyToVisElements(topology);
    expect(nodes).toHaveLength(3);
    expect(nodes.map((n) => n.id)).toEqual(['gw', 'app', 'c1']);
    expect(nodes.find((n) => n.id === 'gw').label).toBe('Gateway');
  });

  test('uses diamond for router and box for server', () => {
    const { nodes } = topologyToVisElements(topology);
    expect(nodes.find((n) => n.id === 'gw').shape).toBe('diamond');
    expect(nodes.find((n) => n.id === 'app').shape).toBe('box');
    expect(nodes.find((n) => n.id === 'c1').shape).toBe('dot');
  });

  test('drops edges with unknown endpoints', () => {
    const { edges } = topologyToVisElements(topology);
    expect(edges).toHaveLength(2);
    expect(edges.every((e) => e.from && e.to)).toBe(true);
  });

  test('opts.arrows false removes arrow hint', () => {
    const { edges } = topologyToVisElements(topology, { arrows: false });
    expect(edges[0].arrows).toBeUndefined();
  });

  test('opts.arrows true keeps arrows toward target', () => {
    const { edges } = topologyToVisElements(topology, { arrows: true });
    expect(edges[0].arrows).toBe('to');
  });

  test('router node fill reads --cp-magenta from document theme', () => {
    document.documentElement.style.setProperty('--cp-magenta', 'rgb(100, 50, 200)');
    document.documentElement.style.setProperty('--cp-blue', '#2a2a2a');
    document.documentElement.style.setProperty('--cp-cyan', '#3a3a3a');
    document.documentElement.style.setProperty('--cp-amber', '#4a4a4a');
    document.documentElement.style.setProperty('--cp-foreground', 'rgb(200, 200, 220)');
    const { nodes } = topologyToVisElements({
      nodes: [{ id: 'r', type: 'router' }],
      edges: []
    });
    expect(nodes[0].color.background).toBe('rgb(100, 50, 200)');
  });

  test('themeRoot uses local overrides when mount sits inside a wrapper', () => {
    const wrap = document.createElement('div');
    wrap.style.setProperty('--cp-magenta', 'rgb(12, 34, 56)');
    wrap.style.setProperty('--cp-blue', '#111111');
    wrap.style.setProperty('--cp-cyan', '#222222');
    wrap.style.setProperty('--cp-amber', '#333333');
    wrap.style.setProperty('--cp-foreground', 'rgb(240, 240, 250)');
    document.body.appendChild(wrap);
    const { nodes } = topologyToVisElements(
      { nodes: [{ id: 'r', type: 'router' }], edges: [] },
      { themeRoot: wrap }
    );
    expect(nodes[0].color.background).toBe('rgb(12, 34, 56)');
    wrap.remove();
  });
});
