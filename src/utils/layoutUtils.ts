import dagre from '@dagrejs/dagre';
import { Node, Edge } from 'reactflow';

const dagreGraph = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));

// Adjust these dimensions based on your MessageNode component size
const nodeWidth = 350;  // Based on your min-w-[300px] max-w-[350px]
const nodeHeight = 200; // Estimate based on your node content

export const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({ 
    rankdir: direction,
    nodesep: 50,  // Horizontal separation between nodes
    ranksep: 100, // Vertical separation between ranks
    marginx: 20,
    marginy: 20
  });

  // Clear previous graph data
  nodes.forEach((node) => {
    if (dagreGraph.hasNode(node.id)) {
      dagreGraph.removeNode(node.id);
    }
  });

  edges.forEach((edge) => {
    if (dagreGraph.hasEdge(edge.source, edge.target)) {
      dagreGraph.removeEdge(edge.source, edge.target);
    }
  });

  // Add nodes to dagre graph
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  // Add edges to dagre graph
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  // Calculate layout
  dagre.layout(dagreGraph);

  // Apply calculated positions to nodes
  const newNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    
    if (!nodeWithPosition) {
      // If node not found in dagre graph, return original node
      return node;
    }

    const newNode = {
      ...node,
      targetPosition: isHorizontal ? 'left' : 'top',
      sourcePosition: isHorizontal ? 'right' : 'bottom',
      // Shift dagre position (center-center) to top-left for React Flow
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };

    return newNode;
  });

  return { nodes: newNodes, edges };
};

export type LayoutDirection = 'TB' | 'LR';

export const layoutDirections = {
  TB: 'Vertical',
  LR: 'Horizontal'
} as const;