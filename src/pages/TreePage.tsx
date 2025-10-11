import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  ReactFlow,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  NodeChange,
  EdgeChange,
  Connection,
  Node,
  Edge,
  ProOptions,
  ReactFlowInstance,
  Background,
  Controls,
  MiniMap,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { apiService } from '../services/api.service';
import { transformQueryTreeToReactFlow } from '../utils/treeTransform';
import { QueryTree } from '../types/api.types';
import QueryNode from '../components/QueryNode';
import QueryPlanPanel from '../components/QueryPlanPanel';
import QueryMetricsPanel from '../components/QueryMetricsPanel';

const proOptions: ProOptions = { hideAttribution: true };

const TreePage: React.FC = () => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQuery, setCurrentQuery] = useState<QueryTree | null>(null);

  const nodeTypes = useMemo(() => ({ queryNode: QueryNode }), []);

  useEffect(() => {
    const loadLatestQuery = async () => {
      try {
        const queries = await apiService.getAllQueries();
        if (queries.length > 0) {
          const latest = queries[queries.length - 1];
          setCurrentQuery(latest);
          
          if (latest.root) {
            // Pass events to help build a better visualization
            const { nodes: newNodes, edges: newEdges } = transformQueryTreeToReactFlow(
              latest.root, 
              latest.events
            );
            setNodes(newNodes);
            setEdges(newEdges);
          } else {
            setError('Query has no tree structure');
          }
        }
      } catch (err) {
        console.error('Failed to load queries:', err);
        setError('Failed to connect to backend. Make sure backend is running on http://localhost:8080');
      } finally {
        setLoading(false);
      }
    };
    loadLatestQuery();

    // Poll for updates every 2 seconds
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

  const onConnect = useCallback(
    (params: Connection) => setEdges(es => addEdge(params, es)),
    []
  );

  const onInit = useCallback(
    (reactFlowInstance: ReactFlowInstance) => {
      setTimeout(() => {
        reactFlowInstance.fitView({ padding: 0.2, duration: 800 });
      }, 100);
    },
    []
  );

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '18px' }}>Loading queries...</div>;
  }

  if (error) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'red', fontSize: '16px', padding: '20px', textAlign: 'center' }}>{error}</div>;
  }

  if (nodes.length === 0) {
    return <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '16px', textAlign: 'center', padding: '20px' }}>
      <p>No queries found. Run a query in Trino to see visualization.</p>
      <p style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>Try running: <code>./test-query.sh</code></p>
    </div>;
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
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={onInit}
        fitView
        proOptions={proOptions}
        minZoom={0.1}
        maxZoom={2}
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
};

export default TreePage;
