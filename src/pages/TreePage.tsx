// TreePage.tsx
import { useMemo, useState, useCallback } from 'react'
import {
  ReactFlow, applyNodeChanges, applyEdgeChanges,
  type NodeChange, type EdgeChange,
  type Node, type Edge, type ReactFlowInstance, type ProOptions,
  MarkerType
} from '@xyflow/react'
import { QueryNodeData, QueryRFNode } from '../components/Node'
import { demoNodes } from '../mock-data/mock-data'
import '@xyflow/react/dist/style.css';
import DirectedEdge from '../components/DirectedEdge';

const directedEdgeTypes = {directed: DirectedEdge};
// map your component
const nodeTypes = { queryNode: QueryRFNode }

// turn the rooted QueryNodeData tree into RF nodes + edges
function toReactFlow(nodes: QueryNodeData[]) {
  const rfNodes: Node<{ node: QueryNodeData }>[] = [];
  const rfEdges: Edge[] = [];
  let i = 0;

  const walk = (n: QueryNodeData[], depth = 0, parentId?: string) => {
    const x = depth * 320;
    const y = i++ * 180;
    n.forEach(n => {  
    rfNodes.push({
      id: n.id,
      type: 'queryNode',
      position: { x, y },
      data: { node: n },
    });
    if (parentId) {
      rfEdges.push({
        id: `${parentId}-${n.id}`,
        source: parentId,
        sourceHandle: 'out',
        target: n.id,
        targetHandle: 'in',
        markerEnd: {type: MarkerType.ArrowClosed, color: '#000000', width: 10, height: 10},
        type: 'directed',
      });
    }

    n.children?.forEach(child => walk([child], depth + 1, n.id));
  });

    // edge from parent -> current node

  };

  walk(nodes);

  // optional sanity check
  const nodeIds = new Set(rfNodes.map(n => n.id));
  rfEdges.forEach(e => {
    if (!nodeIds.has(e.source) || !nodeIds.has(e.target)) {
      console.warn('Dangling edge:', e);
    }
  });

  return { nodes: rfNodes, edges: rfEdges };
}
import '@xyflow/react/dist/style.css'

const proOptions: ProOptions = { hideAttribution: true }

export default function TreePage() {
  // Build once so positions/edges don’t churn
  const { nodes: seedNodes, edges: seedEdges } = useMemo(
    () => toReactFlow(demoNodes),
    []
  )

  // State typed to your custom node data shape
  const [nodes, setNodes] = useState<Node<{ node: QueryNodeData }>[]>(seedNodes)
  const [edges, setEdges] = useState<Edge[]>(seedEdges)
  
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes(ns => applyNodeChanges(changes, ns) as Node<{ node: QueryNodeData }>[]),
    []
  )
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges(es => applyEdgeChanges(changes, es)),
    []
  )

  const onInit = useCallback(
    (rfi: ReactFlowInstance<Node<{ node: QueryNodeData }>, Edge>) => {
      rfi.fitView({ padding: 0.1 })
    },
    []
  )

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onInit={onInit}
        fitView
        proOptions={proOptions}
        edgeTypes={directedEdgeTypes}
      />
    </div>
  )
}

