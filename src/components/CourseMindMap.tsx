import React, { useCallback } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Node,
  Edge,
  Connection,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from 'react-router-dom';
import * as dagre from 'dagre'; // Correction ici: import * as dagre

// Définition des types pour les données des modules
interface Module {
  title: string;
  content: string;
  isCompleted: boolean;
}

interface Course {
  id: string;
  title: string;
  description: string;
  modules: Module[];
  skillsToAcquire: string[];
}

// Custom Node Component
const CustomModuleNode = ({ data }: { data: any }) => {
  const { module, courseId, moduleIndex, isAccessible } = data;

  return (
    <Card className={cn(
      "w-64 shadow-lg transition-all duration-300 ease-in-out",
      !isAccessible && "opacity-50 cursor-not-allowed",
      isAccessible && "hover:shadow-xl hover:scale-[1.02]"
    )}>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-medium">
          {module.title}
        </CardTitle>
        {module.isCompleted ? (
          <CheckCircle className="h-6 w-6 text-green-500" />
        ) : (
          <Lock className="h-6 w-6 text-muted-foreground" />
        )}
      </CardHeader>
      <CardContent className="flex flex-col justify-between">
        <p className="text-sm text-muted-foreground mb-4">
          {module.content.substring(0, 70)}...
        </p>
        <Link to={`/courses/${courseId}/modules/${moduleIndex}`}>
          <Button className="w-full" disabled={!isAccessible}>
            Accéder au module
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
};

const nodeTypes = {
  customModule: CustomModuleNode,
};

// Dagre layout function
const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({ rankdir: direction, nodesep: 100, ranksep: 100 }); // Increased spacing

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 256, height: 150 }); // Fixed size for cards
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.targetPosition = isHorizontal ? 'left' : 'top';
    node.sourcePosition = isHorizontal ? 'right' : 'bottom';

    // We are shifting the dagre node position (anchor point is top left) to the center of the node
    node.position = {
      x: nodeWithPosition.x - nodeWithPosition.width / 2,
      y: nodeWithPosition.y - nodeWithPosition.height / 2,
    };

    return node;
  });

  return { nodes, edges };
};

interface CourseMindMapProps {
  course: Course;
}

const CourseMindMap = ({ course }: CourseMindMapProps) => {
  const initialNodes: Node[] = course.modules.map((module, index) => {
    const isAccessible = index === 0 || course.modules[index - 1]?.isCompleted;
    return {
      id: `module-${index}`,
      type: 'customModule',
      position: { x: 0, y: 0 }, // Position will be set by dagre
      data: { module, courseId: course.id, moduleIndex: index, isAccessible },
    };
  });

  const initialEdges: Edge[] = course.modules.slice(0, -1).map((_, index) => ({
    id: `e${index}-${index + 1}`,
    source: `module-${index}`,
    target: `module-${index + 1}`,
    animated: true,
    style: { stroke: 'hsl(var(--primary))', strokeWidth: 2 },
  }));

  const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
    initialNodes,
    initialEdges
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  return (
    <div className="h-[600px] w-full border rounded-lg shadow-md">
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
          if (n.data.module.isCompleted) return 'hsl(142.1 76.2% 36.3%)'; // Green for completed
          if (n.data.isAccessible) return 'hsl(var(--primary))'; // Primary color for accessible
          return 'hsl(var(--muted-foreground))'; // Muted for locked
        }} />
        <Controls />
        <Background variant="dots" gap={12} size={1} />
      </ReactFlow>
    </div>
  );
};

export default CourseMindMap;