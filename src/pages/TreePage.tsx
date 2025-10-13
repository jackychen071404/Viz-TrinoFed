// TreePage.tsx
import { useMemo, useState, useCallback, useEffect } from 'react'
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
import { Position } from '@xyflow/react';
import dagre from '@dagrejs/dagre';
import ELK from 'elkjs/lib/elk.bundled.js';
const elk = new ELK();

const directedEdgeTypes = {directed: DirectedEdge};
// map your component
const nodeTypes = { queryNode: QueryRFNode };
const NODE_W = 280;
const NODE_H = 140;

export const laidOutNodes = toReactFlow(demoNodes);

// turn the rooted QueryNodeData tree into RF nodes + edges
// turn your domain nodes into RF graph data
async function layoutWithElk(
  nodes: Node<{ node: QueryNodeData }>[],
  edges: Edge[]
) {
  const graph = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'DOWN',           // global L→R bias (neighbors)
      'elk.edgeRouting': 'ORTHOGONAL',    // route around boxes
      'elk.portConstraints': 'FIXED_SIDE',
      'elk.spacing.nodeNode': '40',
      'elk.spacing.edgeNode': '20',
      'elk.spacing.edgeEdge': '20',
      'elk.layered.spacing.nodeNodeBetweenLayers': '80',
      'elk.layered.crossingMinimization.strategy': 'INTERACTIVE',
      'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
    },
    children: nodes.map(n => ({
      id: n.id,
      width: NODE_W,
      height: NODE_H,
      ports: [
        { id: 'in',        properties: { 'org.eclipse.elk.port.side': 'WEST'  } },
        { id: 'out',       properties: { 'org.eclipse.elk.port.side': 'EAST'  } },
        { id: 'inTop',     properties: { 'org.eclipse.elk.port.side': 'NORTH' } },
        { id: 'outBottom', properties: { 'org.eclipse.elk.port.side': 'SOUTH' } },
      ],
    })),
    edges: edges.map(e => ({
      id: e.id,
      sources: [`${e.source}#${e.sourceHandle ?? 'out'}`],
      targets: [`${e.target}#${e.targetHandle ?? 'in'}`],
    })),
  };

  const res = await elk.layout(graph);

  const posNodes = nodes.map(n => {
    const ln = res.children!.find((c: any) => c.id === n.id)!;
    return {
      ...n,
      position: { x: ln.x, y: ln.y },
      targetPosition: Position.Left,
      sourcePosition: Position.Right,
    };
  });

  const posEdges = edges.map(e => {
    const le = res.edges!.find((x: any) => x.id === e.id) as any;
    if (!le?.sections?.[0]) return e;
    const sec = le.sections[0];
    const points = [
      ...(sec.startPoint ? [sec.startPoint] : []),
      ...(sec.bendPoints ?? []),
      ...(sec.endPoint ? [sec.endPoint] : []),
    ].map((p: any) => ({ x: p.x, y: p.y }));
    return { ...e, data: { ...(e.data || {}), points } };
  });

  return { nodes: posNodes, edges: posEdges };
}


function toReactFlow(nodes: QueryNodeData[]) {
  const rfNodes: Node<{ node: QueryNodeData }>[] = [];
  const rfEdges: Edge[] = [];
  const seen = new Set<string>();

  // gather all nodes (top-level + children + next) exactly once
  const addNode = (n: QueryNodeData) => {
    if (seen.has(n.id)) return;
    seen.add(n.id);
    rfNodes.push({
      id: n.id,
      type: 'queryNode',
      position: { x: 0, y: 0 }, // will be set by dagre
      data: { node: n },
      // help dagre/bezier choose LR anchors on default handles
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    });
    n.children?.forEach(addNode);
    if (n.next) addNode(n.next);
  };

  nodes.forEach(addNode);

  // child edges: parent -> child (top→bottom handles)
  const addChildEdges = (n: QueryNodeData) => {
    n.children?.forEach((c) => {
      if (n.id !== c.id) {
        rfEdges.push({
          id: `${n.id}__child__${c.id}`,
          source: n.id,
          sourceHandle: 'outBottom',
          target: c.id,
          targetHandle: 'inTop',
          type: 'directed',
          style: { stroke: '#000', strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#000', width: 16, height: 16 },
        });
        addChildEdges(c);
      }
    });
    if (n.next && n.id !== n.next.id) {
      // next edges: current -> next (left→right handles)
      rfEdges.push({
        id: `${n.id}__next__${n.next.id}`,
        source: n.id,
        sourceHandle: 'out',
        target: n.next.id,
        targetHandle: 'in',
        type: 'directed',
        style: { stroke: '#000', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#000', width: 16, height: 16 },
      });
      addChildEdges(n.next);
    }
  };
  nodes.forEach(addChildEdges);

  // sanity check (optional)
  const ids = new Set(rfNodes.map(n => n.id));
  rfEdges.forEach(e => { if (!ids.has(e.source) || !ids.has(e.target)) console.warn('Dangling edge', e); });

  // 3) Layout with dagre (LR) to avoid overlap
  dagreLayoutLR(rfNodes, rfEdges);

  return { nodes: rfNodes, edges: rfEdges };
}

// dagre layout helper

function dagreLayoutLR(nodes: Node[], edges: Edge[]) {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: 'TB', nodesep: 80, ranksep: 160 });
  g.setDefaultEdgeLabel(() => ({}));
  nodes.forEach(n => g.setNode(n.id, { width: NODE_W, height: NODE_H }));
  edges.forEach(e => g.setEdge(e.source, e.target));
  dagre.layout(g);
  nodes.forEach(n => {
    const p = g.node(n.id);
    n.position = { x: p.x - NODE_W / 2, y: p.y - NODE_H / 2 };
    // reinforce LR anchors even if a node has only TB edges
    (n as any).sourcePosition = Position.Right;
    (n as any).targetPosition = Position.Left;
  });
}

import '@xyflow/react/dist/style.css'

const proOptions: ProOptions = { hideAttribution: true }

export default function TreePage() {
  // Build once so positions/edges don’t churn
  const { nodes: laidOutNodes, edges: seedEdges } = useMemo(
    () => toReactFlow(demoNodes),
    []
  )

  // State typed to your custom node data shape
  const [nodes, setNodes] = useState<Node<{ node: QueryNodeData }>[]>(laidOutNodes);
  const [edges, setEdges] = useState<Edge[]>(seedEdges);

  useEffect(() => {
    const base = toReactFlow(demoNodes);
    layoutWithElk(base.nodes, base.edges).then(({ nodes, edges }) => {
      setNodes(nodes as Node<{ node: QueryNodeData }>[]);
      setEdges(edges);
    });
    
  },[])
  
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
        fitViewOptions={{
          padding: 0.2,
          maxZoom: 1.5,
          minZoom: 0.5,
        }}
        proOptions={proOptions}
        edgeTypes={directedEdgeTypes}
        nodeExtent={[[ -200, -200 ], [ 20000, 12000 ]]}
      />
    </div>
  )
}

