'use client';

import '@xyflow/react/dist/style.css';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
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

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import MqIcon from '@/components/MqIcon';

import { ScreenNode, type ScreenNodeData } from './ScreenNode';
import { CommentNode } from './CommentNode';
import { LabeledEdge } from './LabeledEdge';
import { FlowContext } from './FlowContext';
import { ScreenshotCapturer } from './ScreenshotCapturer';

const nodeTypes: NodeTypes = {
  screenNode: ScreenNode,
  commentNode: CommentNode,
};

const edgeTypes: EdgeTypes = {
  labeled: LabeledEdge,
};

const DEFAULT_EDGE_OPTIONS = {
  type: 'labeled',
  markerEnd: { type: MarkerType.ArrowClosed, color: '#64b5f6', width: 16, height: 16 },
  data: { label: '', triggerType: 'click', isPrimary: false },
};

function autoLayout(
  screens: { id: string; name: string }[],
  prototypeId: string,
): Node[] {
  return screens.map((s, i) => ({
    id: `screen-${s.id}`,
    type: 'screenNode',
    position: { x: i * 340, y: 0 },
    data: { screenId: s.id, screenName: s.name, prototypeId } satisfies ScreenNodeData,
  }));
}

function mergeNodes(
  saved: Node[],
  screens: { id: string; name: string }[],
  prototypeId: string,
): Node[] {
  const savedMap = new Map(saved.map((n) => [n.id, n]));
  const maxX = saved
    .filter((n) => n.type === 'screenNode')
    .reduce((m, n) => Math.max(m, n.position.x), -340);

  const result: Node[] = [...saved.filter((n) => n.type === 'commentNode')];

  let newX = maxX + 260;
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
      newX += 340;
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
  const { fitView, screenToFlowPosition, getNodes, getEdges } = useReactFlow();
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialised = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const [thumbnailVersions, setThumbnailVersions] = useState<Record<string, number>>({});

  // Load on mount
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

      const finalNodes =
        savedNodes.filter((n: Node) => n.type === 'screenNode').length === 0
          ? autoLayout(screens, prototypeId)
          : mergeNodes(savedNodes, screens, prototypeId);

      setNodes(finalNodes);
      setEdges(savedEdges);
      initialised.current = true;
      requestAnimationFrame(() => fitView({ padding: 0.2, duration: 400 }));
    }
    load();
  }, [prototypeId, setNodes, setEdges, fitView]);

  // Subscribe to SSE for thumbnail updates — when a .png changes, bump its version
  useEffect(() => {
    const eventSource = new EventSource('/api/watch');
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data as string) as { file: string };
        if (data.file.includes(`/${prototypeId}/thumbnails/`) && data.file.endsWith('.png')) {
          const match = data.file.match(/thumbnails\/([^/]+)\.png$/);
          if (match) {
            const screenId = match[1];
            setThumbnailVersions((prev) => ({ ...prev, [screenId]: Date.now() }));
          }
        }
      } catch {
        // Ignore malformed SSE messages
      }
    };
    return () => eventSource.close();
  }, [prototypeId]);

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

  // Save that reads current state from internal store (used by AnnotationPanel)
  const triggerSave = useCallback(() => {
    save(getNodes() as Node[], getEdges() as Edge[]);
  }, [getNodes, getEdges, save]);

  const handleNodesChange = useCallback(
    (changes: Parameters<typeof onNodesChange>[0]) => {
      onNodesChange(changes);
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

  const handleAddComment = useCallback(() => {
    const bounds = containerRef.current?.getBoundingClientRect();
    const cx = bounds ? bounds.left + bounds.width / 2 : 400;
    const cy = bounds ? bounds.top + bounds.height / 2 : 300;
    const pos = screenToFlowPosition({ x: cx, y: cy });

    const newNode: Node = {
      id: `comment-${Date.now()}`,
      type: 'commentNode',
      position: pos,
      data: { text: '' },
    };
    setNodes((ns) => {
      const next = [...ns, newNode];
      save(next, edges);
      return next;
    });
  }, [screenToFlowPosition, setNodes, save, edges]);

  return (
    <FlowContext.Provider value={{ triggerSave, thumbnailVersions }}>
      <style>{`
        .react-flow__node-screenNode .react-flow__handle {
          opacity: 0;
          transition: opacity 0.15s;
        }
        .react-flow__node-screenNode.selected .react-flow__handle,
        .react-flow__node-screenNode .react-flow__handle:hover {
          opacity: 1;
        }
        /* Miro-style controls */
        .react-flow__controls {
          border-radius: 12px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.08);
          border: 1px solid rgba(0,0,0,0.06);
          overflow: hidden;
        }
        .react-flow__controls button {
          border: none;
          border-bottom: 1px solid rgba(0,0,0,0.06);
        }
        .react-flow__controls button:last-child {
          border-bottom: none;
        }
        .react-flow__minimap {
          border-radius: 12px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.08);
          border: 1px solid rgba(0,0,0,0.06);
        }
      `}</style>
      <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={DEFAULT_EDGE_OPTIONS}
          fitView
          deleteKeyCode="Delete"
          multiSelectionKeyCode="Shift"
          minZoom={0.15}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={24} size={1.5} color="#d0d4d8" />
          <Controls
            showInteractive={false}
            style={{ borderRadius: 12, boxShadow: 'none', border: 'none' }}
          />
          <MiniMap
            nodeColor={(n) => {
              if (n.type === 'commentNode') return '#ffe082';
              return '#c5cae9';
            }}
            maskColor="rgba(0,0,0,0.06)"
            style={{ borderRadius: 12, boxShadow: 'none', border: 'none' }}
          />
        </ReactFlow>

        {/* ── Floating bottom toolbar (Miro-style) ── */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: 0.25,
            px: 0.75,
            py: 0.5,
            borderRadius: 3.5,
            bgcolor: 'common.white',
            boxShadow: 3,
            border: '1px solid',
            borderColor: 'divider',
            zIndex: 10,
          }}
        >
          <Button
            onClick={handleAddComment}
            variant="text"
            color="secondary"
            size="small"
            startIcon={<MqIcon name="document_general" size={16} />}
            sx={{ textTransform: 'none', fontSize: 13 }}
          >
            Add note
          </Button>
        </Box>

      </div>

      {/* Hidden off-screen iframes for screenshot capture */}
      <ScreenshotCapturer prototypeId={prototypeId} />
    </FlowContext.Provider>
  );
}

export function FlowCanvas({ prototypeId }: FlowCanvasProps) {
  return (
    <ReactFlowProvider>
      <FlowCanvasInner prototypeId={prototypeId} />
    </ReactFlowProvider>
  );
}
