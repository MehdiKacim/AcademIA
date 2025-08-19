import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface CustomNodeData {
  id: string; // Course ID
  moduleIndex: number;
  title: string;
  content: string;
  isCompleted: boolean;
  level?: number;
}

interface CustomModuleNodeProps {
  data: CustomNodeData;
}

const CustomModuleNode = ({ data }: CustomModuleNodeProps) => {
  const { id: courseId, moduleIndex, title, content, isCompleted, level } = data;
  const isAccessible = moduleIndex === 0 || (data as any).prevModuleCompleted; // prevModuleCompleted est passé via le layout

  return (
    <Card className={cn(
      "w-64 shadow-lg transition-all duration-300 ease-in-out",
      !isAccessible && "opacity-50 cursor-not-allowed",
      isAccessible && "hover:shadow-xl hover:scale-[1.01]",
      level === 1 ? "border-l-4 border-primary/50" : "" // Indication visuelle pour les sous-modules
    )}>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">
          {title}
        </CardTitle>
        {isCompleted ? (
          <CheckCircle className="h-5 w-5 text-green-500" />
        ) : (
          <Lock className="h-5 w-5 text-muted-foreground" />
        )}
      </CardHeader>
      <CardContent className="flex flex-col justify-between">
        <CardDescription className="mb-4 text-sm">
          {content.substring(0, 70)}...
        </CardDescription>
        <Link to={`/courses/${courseId}/modules/${moduleIndex}`}>
          <Button className="w-full text-xs" disabled={!isAccessible}>
            {isCompleted ? "Revoir le module" : "Commencer le module"}
          </Button>
        </Link>
      </CardContent>
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-primary/70" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-primary/70" />
    </Card>
  );
};

export default memo(CustomModuleNode);