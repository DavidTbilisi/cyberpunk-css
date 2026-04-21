/**
 * @jest-environment jsdom
 */

const markup = require('../scripts/netgraph-markup.js');

describe('netgraph-markup', () => {
  describe('parseTopologyFromText', () => {
    test('parses nodes with parentheses and edges with arrows', () => {
      const src = `
# demo
gw(Gateway):::router
n1(Node 1)
db(DB):::server

gw --> n1
gw -> db
n1 --> db
`;
      const { nodes, edges } = markup.parseTopologyFromText(src);
      expect(nodes.map((n) => n.id)).toEqual(['gw', 'n1', 'db']);
      expect(nodes.find((n) => n.id === 'gw').type).toBe('router');
      expect(nodes.find((n) => n.id === 'db').type).toBe('server');
      expect(edges).toHaveLength(3);
      expect(edges[0]).toEqual({ source: 'gw', target: 'n1' });
    });

    test('parses bracket labels like Mermaid', () => {
      const { nodes, edges } = markup.parseTopologyFromText('a[Alpha]:::router\nb[Beta]\na --> b');
      expect(nodes).toHaveLength(2);
      expect(edges).toHaveLength(1);
      expect(nodes.find((n) => n.id === 'a').label).toBe('Alpha');
    });
  });

  describe('parseTopologyFromElement', () => {
    test('prefers script type text/cp-netgraph over HTML lists', () => {
      document.body.innerHTML = `
        <div id="def" data-netgraph-def>
          <script type="text/cp-netgraph">x(X):::server\ny(Y)\nx --> y</script>
          <div data-netgraph-nodes><span data-id="ignore">bad</span></div>
        </div>`;
      const { nodes, edges } = markup.parseTopologyFromElement(document.getElementById('def'));
      expect(nodes.map((n) => n.id).sort()).toEqual(['x', 'y']);
      expect(edges).toEqual([{ source: 'x', target: 'y' }]);
    });

    test('parses data-netgraph-nodes and data-netgraph-edges lists', () => {
      document.body.innerHTML = `
        <div id="def" data-netgraph-def>
          <ul data-netgraph-nodes>
            <li data-id="a" data-type="router">A</li>
            <li data-id="b">B</li>
          </ul>
          <ul data-netgraph-edges>
            <li data-from="a" data-to="b"></li>
          </ul>
        </div>`;
      const { nodes, edges } = markup.parseTopologyFromElement(document.getElementById('def'));
      expect(nodes).toHaveLength(2);
      expect(edges).toEqual([{ source: 'a', target: 'b' }]);
    });
  });

  describe('buildNetGraphFromMarkup', () => {
    test('renders into data-netgraph-target', () => {
      document.body.innerHTML = `
        <div id="def" data-netgraph-def data-netgraph-target="#viz">
          <script type="text/cp-netgraph">a(A):::router\nb(B)\na --> b</script>
        </div>
        <div id="viz"></div>`;
      const handle = markup.buildNetGraphFromMarkup(document.getElementById('def'));
      expect(handle).toBeTruthy();
      expect(document.getElementById('viz').classList.contains('cp-netgraph')).toBe(true);
      handle.destroy();
    });
  });
});
