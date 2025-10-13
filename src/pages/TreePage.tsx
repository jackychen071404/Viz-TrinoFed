import { useMemo, useState, useCallback, useEffect } from 'react';
import {
  ReactFlow, applyNodeChanges, applyEdgeChanges,
  type NodeChange, type EdgeChange,
  type Node, type Edge, type ReactFlowInstance, type ProOptions,
  MarkerType, Background, Controls, MiniMap
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from '@dagrejs/dagre';
import ELK from 'elkjs/lib/elk.bundled.js';
import { Position } from '@xyflow/react';
import DirectedEdge from '../components/DirectedEdge';
import QueryNode from '../components/QueryNode';
import QueryPlanPanel from '../components/QueryPlanPanel';
import QueryMetricsPanel from '../components/QueryMetricsPanel';
import { apiService } from '../services/api.service';
import { QueryTree } from '../types/api.types';
import { transformQueryTreeToReactFlow } from '../utils/treeTransform';

const elk = new ELK();
const NODE_W = 280;
const NODE_H = 140;
const directedEdgeTypes = { directed: DirectedEdge };
const nodeTypes = { queryNode: QueryNode };
const proOptions: ProOptions = { hideAttribution: true };

async function layoutWithElk(nodes: Node[], edges: Edge[]) {
  const graph = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'DOWN',
      'elk.edgeRouting': 'ORTHOGONAL',
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
    const le = res.edges!.find((x: any) => x.id === e.id);
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

const TreePage: React.FC = () => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQuery, setCurrentQuery] = useState<QueryTree | null>(null);

  useEffect(() => {
    const loadLatestQuery = async () => {
      try {
        const queries = await apiService.getAllQueries();
        if (queries.length > 0) {
          const latest = queries[queries.length - 1];
          setCurrentQuery(latest);

          if (latest.root) {
            const { nodes: newNodes, edges: newEdges } = transformQueryTreeToReactFlow(latest.root, latest.events);
            const { nodes: laidOut, edges: laidEdges } = await layoutWithElk(newNodes, newEdges);
            setNodes(laidOut);
            setEdges(laidEdges);
          } else {
            setError('Query has no tree structure');
          }
        } else {
          setError('No queries found. Run a query in Trino to see visualization.');
        }
      } catch (err) {
        console.error('Failed to load queries:', err);
        setError('Failed to connect to backend. Make sure backend is running on http://localhost:8080');
      } finally {
        setLoading(false);
      }
    };

    loadLatestQuery();
    const interval = setInterval(loadLatestQuery, 2000);
    return () => clearInterval(interval);
  }, []);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes(ns => applyNodeChanges(changes, ns)),
    []
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges(es => applyEdgeChanges(changes, es)),
    []
  );

  const onInit = useCallback(
    (rfi: ReactFlowInstance) => {
      rfi.fitView({ padding: 0.2 });
    },
    []
  );

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '18px' }}>Loading queries...</div>;
  }

  if (error) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'red', fontSize: '16px', padding: '20px', textAlign: 'center' }}>{error}</div>;
  }

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      {currentQuery && (
        <>
          <QueryMetricsPanel query={currentQuery} />
          <QueryPlanPanel 
            events={currentQuery.events || []}
            plan={currentQuery.events?.find(e => e.plan)?.plan}
          />
        </>
      )}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={directedEdgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onInit={onInit}
        fitView
        fitViewOptions={{ padding: 0.2, maxZoom: 1.5, minZoom: 0.5 }}
        proOptions={proOptions}
        nodeExtent={[[ -200, -200 ], [ 20000, 12000 ]]}
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
};

export default TreePage;