/**
 * @jest-environment jsdom
 */

describe('netgraph module', () => {
  let netgraphModule;

  beforeEach(() => {
    jest.resetModules();
    
    document.body.innerHTML = `
      <div id="netgraph-container"></div>
      <button id="netgraph-load" data-netgraph-load data-netgraph-target="#netgraph-container">Load Graph</button>
    `;
    
    netgraphModule = require('../scripts/netgraph.js');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('renderNetGraph()', () => {
    const sampleTopology = {
      nodes: [
        { id: 'router1', label: 'Router', type: 'router' },
        { id: 'server1', label: 'Server', type: 'server' },
        { id: 'client1', label: 'Client', type: 'client' }
      ],
      edges: [
        { source: 'router1', target: 'server1' },
        { source: 'router1', target: 'client1' }
      ]
    };

    test('returns null for invalid container', () => {
      const result = netgraphModule.renderNetGraph('#nonexistent', sampleTopology);
      expect(result).toBeNull();
    });

    test('renders netgraph with header', () => {
      netgraphModule.renderNetGraph('#netgraph-container', sampleTopology);
      
      const container = document.getElementById('netgraph-container');
      expect(container.classList.contains('cp-netgraph')).toBe(true);
      expect(container.querySelector('.cp-netgraph__header')).toBeTruthy();
      expect(container.querySelector('.cp-netgraph__title').textContent).toBe('Network Topology');
    });

    test('renders SVG canvas', () => {
      netgraphModule.renderNetGraph('#netgraph-container', sampleTopology);
      
      const container = document.getElementById('netgraph-container');
      expect(container.querySelector('.cp-netgraph__canvas')).toBeTruthy();
      expect(container.querySelector('.cp-netgraph__svg')).toBeTruthy();
    });

    test('renders nodes as circles', () => {
      netgraphModule.renderNetGraph('#netgraph-container', sampleTopology);
      
      const nodes = document.querySelectorAll('.cp-netgraph__node');
      expect(nodes.length).toBe(3);
    });

    test('renders node labels', () => {
      netgraphModule.renderNetGraph('#netgraph-container', sampleTopology);
      
      const container = document.getElementById('netgraph-container');
      expect(container.textContent).toContain('Router');
      expect(container.textContent).toContain('Server');
      expect(container.textContent).toContain('Client');
    });

    test('renders edges as lines', () => {
      netgraphModule.renderNetGraph('#netgraph-container', sampleTopology);
      
      const edges = document.querySelectorAll('.cp-netgraph__edge');
      expect(edges.length).toBe(2);
    });

    test('accepts element directly instead of selector', () => {
      const container = document.getElementById('netgraph-container');
      netgraphModule.renderNetGraph(container, sampleTopology);
      
      expect(container.classList.contains('cp-netgraph')).toBe(true);
    });

    test('handles empty topology', () => {
      netgraphModule.renderNetGraph('#netgraph-container', {});
      
      const container = document.getElementById('netgraph-container');
      expect(container.classList.contains('cp-netgraph')).toBe(true);
      expect(container.querySelectorAll('.cp-netgraph__node').length).toBe(0);
    });

    test('handles missing nodes array', () => {
      netgraphModule.renderNetGraph('#netgraph-container', { edges: [] });
      
      const container = document.getElementById('netgraph-container');
      expect(container.classList.contains('cp-netgraph')).toBe(true);
    });

    test('handles missing edges array', () => {
      netgraphModule.renderNetGraph('#netgraph-container', { nodes: [{ id: 'a', type: 'router' }] });
      
      const container = document.getElementById('netgraph-container');
      const nodes = container.querySelectorAll('.cp-netgraph__node');
      expect(nodes.length).toBe(1);
    });

    test('skips edges with invalid source/target', () => {
      const topology = {
        nodes: [{ id: 'a', type: 'router' }],
        edges: [{ source: 'a', target: 'nonexistent' }]
      };
      
      netgraphModule.renderNetGraph('#netgraph-container', topology);
      
      const edges = document.querySelectorAll('.cp-netgraph__edge');
      expect(edges.length).toBe(0);
    });

    test('router nodes get larger radius', () => {
      const topology = {
        nodes: [{ id: 'r1', type: 'router' }],
        edges: []
      };
      
      netgraphModule.renderNetGraph('#netgraph-container', topology);
      
      const node = document.querySelector('.cp-netgraph__node');
      expect(node.getAttribute('r')).toBe('18');
    });

    test('server nodes get medium radius', () => {
      const topology = {
        nodes: [{ id: 's1', type: 'server' }],
        edges: []
      };
      
      netgraphModule.renderNetGraph('#netgraph-container', topology);
      
      const node = document.querySelector('.cp-netgraph__node');
      expect(node.getAttribute('r')).toBe('14');
    });

    test('client nodes get smallest radius', () => {
      const topology = {
        nodes: [{ id: 'c1', type: 'client' }],
        edges: []
      };
      
      netgraphModule.renderNetGraph('#netgraph-container', topology);
      
      const node = document.querySelector('.cp-netgraph__node');
      expect(node.getAttribute('r')).toBe('12');
    });

    test('uses node id as label if no label provided', () => {
      const topology = {
        nodes: [{ id: 'node-id-123', type: 'router' }],
        edges: []
      };
      
      netgraphModule.renderNetGraph('#netgraph-container', topology);
      
      const container = document.getElementById('netgraph-container');
      expect(container.textContent).toContain('node-id-123');
    });
  });

  describe('initNetGraph()', () => {
    test('wires data-netgraph-load buttons', () => {
      const btn = document.getElementById('netgraph-load');
      btn.click();
      
      const container = document.getElementById('netgraph-container');
      expect(container.classList.contains('cp-netgraph')).toBe(true);
    });
  });
});
