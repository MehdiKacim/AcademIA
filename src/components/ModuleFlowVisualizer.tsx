import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

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

interface ModuleFlowVisualizerProps {
  course: Course;
}

const ModuleFlowVisualizer = ({ course }: ModuleFlowVisualizerProps) => {
  return (
    <div className="flex flex-col items-center space-y-6 py-8">
      {course.modules.map((module, index) => {
        const isAccessible = index === 0 || course.modules[index - 1]?.isCompleted;
        const isLastModule = index === course.modules.length - 1;

        return (
          <React.Fragment key={index}>
            <Card className={cn(
              "w-full max-w-md shadow-lg transition-all duration-300 ease-in-out",
              !isAccessible && "opacity-50 cursor-not-allowed",
              isAccessible && "hover:shadow-xl hover:scale-[1.01]"
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
                <CardDescription className="mb-4">
                  {module.content.substring(0, 100)}...
                </CardDescription>
                <Link to={`/courses/${course.id}/modules/${index}`}>
                  <Button className="w-full" disabled={!isAccessible}>
                    {module.isCompleted ? "Revoir le module" : "Commencer le module"}
                  </Button>
                </Link>
              </CardContent>
            </Card>
            {!isLastModule && (
              <div className="relative flex flex-col items-center">
                <div className="w-1 h-12 bg-primary/50 rounded-full"></div>
                <div className="w-3 h-3 bg-primary rounded-full -mt-1"></div>
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default ModuleFlowVisualizer;