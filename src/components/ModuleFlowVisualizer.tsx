import React, { useCallback, useEffect } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
  ReactFlowProvider,
} from 'reactflow';
import dagre from 'dagre';
import CustomModuleNode from './CustomModuleNode';

import 'reactflow/dist/style.css';

interface Module {
  title: string;
  content: string;
  isCompleted: boolean;
  level?: number;
}

interface Course {
  id: string;
  title: string;
  description: string;
  modules: Module[];
  skillsToAcquire: string[];
}

interface ModuleFlowVisualizerProps {
  course: Course;
}

const nodeWidth = 200;
const nodeHeight = 100;

const getLayoutedElements = (nodes: any[], edges: any[], direction = 'TB') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({ rankdir: direction, nodesep: 50, ranksep: 50 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.targetPosition = isHorizontal ? Position.Left : Position.Top;
    node.sourcePosition = isHorizontal ? Position.Right : Position.Bottom;

    // We are shifting the dagre node position (anchor=center) to the top-left
    // so it matches the React Flow node anchor point (top-left).
    node.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    };

    return node;
  });

  return { nodes, edges };
};

const nodeTypes = {
  customModuleNode: CustomModuleNode,
};

const ModuleFlowVisualizer = ({ course }: ModuleFlowVisualizerProps) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    const initialNodes: any[] = [];
    const initialEdges: any[] = [];
    let lastLevel0ModuleId: string | null = null;

    course.modules.forEach((module, index) => {
      const moduleId = `module-${course.id}-${index}`;
      const prevModuleCompleted = index === 0 || course.modules[index - 1]?.isCompleted;

      initialNodes.push({
        id: moduleId,
        type: 'customModuleNode',
        data: {
          id: course.id,
          moduleIndex: index,
          title: module.title,
          content: module.content,
          isCompleted: module.isCompleted,
          level: module.level,
          prevModuleCompleted: prevModuleCompleted, // Pass completion status for accessibility
        },
        position: { x: 0, y: 0 }, // Position will be set by dagre
      });

      if (module.level === 0) {
        if (lastLevel0ModuleId !== null) {
          // Link previous level 0 module to current level 0 module
          initialEdges.push({
            id: `e-${lastLevel0ModuleId}-${moduleId}`,
            source: lastLevel0ModuleId,
            target: moduleId,
            type: 'smoothstep',
            markerEnd: { type: MarkerType.ArrowClosed },
            animated: true,
            style: { stroke: 'hsl(var(--primary))' },
          });
        }
        lastLevel0ModuleId = moduleId;
      } else if (module.level === 1 && lastLevel0ModuleId !== null) {
        // Link current level 1 module to the last level 0 module
        initialEdges.push({
          id: `e-${lastLevel0ModuleId}-${moduleId}`,
          source: lastLevel0ModuleId,
          target: moduleId,
          type: 'smoothstep',
          markerEnd: { type: MarkerType.ArrowClosed },
          animated: true,
          style: { stroke: 'hsl(var(--accent))' }, // Different color for sub-module links
        });
      }
    });

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      initialNodes,
      initialEdges
    );

    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [course, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: any) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  return (
    <div style={{ width: '100%', height: '600px', border: '1px solid hsl(var(--border))', borderRadius: '0.5rem' }}>
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-left"
        >
          <MiniMap nodeStrokeWidth={3} nodeColor={(n) => {
            if (n.data.isCompleted) return 'hsl(var(--green-500))';
            if (n.data.level === 1) return 'hsl(var(--accent))';
            return 'hsl(var(--primary))';
          }} />
          <Controls />
          <Background variant="dots" gap={12} size={1} />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
};

export default ModuleFlowVisualizer;