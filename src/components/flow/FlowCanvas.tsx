'use client';

import '@xyflow/react/dist/style.css';

import { useCallback, useEffect, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  MarkerType,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Connection,
  type NodeTypes,
  type EdgeTypes,
  type Node,
  type Edge,
} from '@xyflow/react';

import { ScreenNode, type ScreenNodeData } from './ScreenNode';
import { CommentNode } from './CommentNode';
import { LabeledEdge } from './LabeledEdge';

const nodeTypes: NodeTypes = {
  screenNode: ScreenNode,
  commentNode: CommentNode,
};

const edgeTypes: EdgeTypes = {
  labeled: LabeledEdge,
};

const DEFAULT_EDGE_OPTIONS = {
  type: 'labeled',
  markerEnd: { type: MarkerType.ArrowClosed, color: '#90caf9', width: 16, height: 16 },
  data: { label: '' },
};

// Auto-arrange screens in a horizontal row, 260px apart
function autoLayout(screens: { id: string; name: string }[], prototypeId: string): Node[] {
  return screens.map((s, i) => ({
    id: `screen-${s.id}`,
    type: 'screenNode',
    position: { x: i * 280, y: 0 },
    data: { screenId: s.id, screenName: s.name, prototypeId } satisfies ScreenNodeData,
  }));
}

// Merge saved node positions with current screen list:
// - Screens that have saved positions keep them
// - New screens (not in saved state) get auto-placed to the right of existing nodes
function mergeNodes(
  saved: Node[],
  screens: { id: string; name: string }[],
  prototypeId: string,
): Node[] {
  const savedMap = new Map(saved.map((n) => [n.id, n]));

  const maxX = saved.filter((n) => n.type === 'screenNode').reduce((m, n) => Math.max(m, n.position.x), -280);

  const result: Node[] = [...saved.filter((n) => n.type === 'commentNode')];

  let newX = maxX + 280;
  for (const screen of screens) {
    const nodeId = `screen-${screen.id}`;
    const existing = savedMap.get(nodeId);
    if (existing) {
      result.push({
        ...existing,
        data: { ...existing.data, screenName: screen.name, prototypeId },
      });
    } else {
      result.push({
        id: nodeId,
        type: 'screenNode',
        position: { x: newX, y: 0 },
        data: { screenId: screen.id, screenName: screen.name, prototypeId } satisfies ScreenNodeData,
      });
      newX += 280;
    }
  }

  return result;
}

interface FlowCanvasProps {
  prototypeId: string;
}

function FlowCanvasInner({ prototypeId }: FlowCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const { fitView } = useReactFlow();
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialised = useRef(false);

  // Load saved flow + screen list on mount
  useEffect(() => {
    async function load() {
      const [flowRes, screensRes] = await Promise.all([
        fetch(`/api/flow/${prototypeId}`),
        fetch(`/api/preview/${prototypeId}/screens`),
      ]);

      const flow = flowRes.ok ? await flowRes.json() : { nodes: [], edges: [] };
      const screens: { id: string; name: string }[] = screensRes.ok ? await screensRes.json() : [];

      const savedNodes: Node[] = flow.nodes ?? [];
      const savedEdges: Edge[] = flow.edges ?? [];

      let finalNodes: Node[];
      if (savedNodes.filter((n: Node) => n.type === 'screenNode').length === 0) {
        // No saved layout — auto-place all screens
        finalNodes = autoLayout(screens, prototypeId);
      } else {
        finalNodes = mergeNodes(savedNodes, screens, prototypeId);
      }

      setNodes(finalNodes);
      setEdges(savedEdges);
      initialised.current = true;

      // Fit view after first render
      requestAnimationFrame(() => fitView({ padding: 0.15, duration: 400 }));
    }

    load();
  }, [prototypeId, setNodes, setEdges, fitView]);

  // Debounced auto-save
  const save = useCallback(
    (ns: Node[], es: Edge[]) => {
      if (!initialised.current) return;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        fetch(`/api/flow/${prototypeId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nodes: ns, edges: es }),
        }).catch(() => {});
      }, 800);
    },
    [prototypeId],
  );

  const handleNodesChange = useCallback(
    (changes: Parameters<typeof onNodesChange>[0]) => {
      onNodesChange(changes);
      // save is triggered by the state update — use a small defer
      setNodes((ns) => { save(ns, edges); return ns; });
    },
    [onNodesChange, setNodes, save, edges],
  );

  const handleEdgesChange = useCallback(
    (changes: Parameters<typeof onEdgesChange>[0]) => {
      onEdgesChange(changes);
      setEdges((es) => { save(nodes, es); return es; });
    },
    [onEdgesChange, setEdges, save, nodes],
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((es) => {
        const next = addEdge({ ...connection, ...DEFAULT_EDGE_OPTIONS }, es);
        save(nodes, next);
        return next;
      });
    },
    [setEdges, save, nodes],
  );

  // Double-click on canvas background → add comment
  const onPaneDoubleClick = useCallback(
    (event: React.MouseEvent) => {
      const bounds = (event.currentTarget as HTMLElement).getBoundingClientRect();
      // Convert screen coords to flow coords
      const x = event.clientX - bounds.left - 80;
      const y = event.clientY - bounds.top - 40;

      const newNode: Node = {
        id: `comment-${Date.now()}`,
        type: 'commentNode',
        position: { x, y },
        data: { text: '' },
      };

      setNodes((ns) => {
        const next = [...ns, newNode];
        save(next, edges);
        return next;
      });
    },
    [setNodes, save, edges],
  );

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onPaneClick={undefined}
        onDoubleClick={onPaneDoubleClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={DEFAULT_EDGE_OPTIONS}
        fitView
        deleteKeyCode="Delete"
        multiSelectionKeyCode="Shift"
        selectionKeyCode="Shift"
        minZoom={0.2}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={20} size={1} color="#e8eaed" />
        <Controls
          style={{
            borderRadius: 8,
            boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
            border: '1px solid #e0e0e0',
          }}
        />
        <MiniMap
          nodeColor={(node) => node.type === 'commentNode' ? '#ffe082' : '#c5cae9'}
          style={{
            borderRadius: 8,
            boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
            border: '1px solid #e0e0e0',
          }}
        />
      </ReactFlow>

      {/* Hint overlay */}
      <div style={{
        position: 'absolute',
        bottom: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'rgba(0,0,0,0.45)',
        color: '#fff',
        fontSize: 11,
        padding: '4px 12px',
        borderRadius: 20,
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
      }}>
        Double-click canvas to add comment · Drag handle to connect screens · Delete key removes selected
      </div>
    </div>
  );
}

// ReactFlow requires a ReactFlowProvider — wrap here
import { ReactFlowProvider } from '@xyflow/react';

export function FlowCanvas({ prototypeId }: FlowCanvasProps) {
  return (
    <ReactFlowProvider>
      <FlowCanvasInner prototypeId={prototypeId} />
    </ReactFlowProvider>
  );
}
