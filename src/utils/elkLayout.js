import ELK from 'elkjs/lib/elk.bundled.js';

const elk = new ELK();

export async function berechneElkLayout(nodes, edges, nodeWidth, nodeHeight) {
  const elkGraph = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'RIGHT',
      'elk.layered.spacing.nodeNodeBetweenLayers': '48',
      'elk.spacing.nodeNode': '10',
      'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
      'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
      'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
      'elk.layered.compactness': 'NONE',
      'elk.padding': '[top=0, left=0, bottom=0, right=0]',
    },
    children: nodes.map(node => ({
      id: node.id,
      width: nodeWidth,
      height: nodeHeight,
    })),
    edges: edges.map(edge => ({
      id: edge.id,
      sources: [edge.source],
      targets: [edge.target],
    })),
  };

  const layouted = await elk.layout(elkGraph);

  const minX = Math.min(...layouted.children.map(n => n.x));
  const minY = Math.min(...layouted.children.map(n => n.y));

  return nodes.map(node => {
    const elkNode = layouted.children.find(n => n.id === node.id);
    return {
      ...node,
      position: {
        x: elkNode.x - minX,
        y: elkNode.y - minY,
      },
    };
  });
}
