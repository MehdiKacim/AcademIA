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
  level?: number;
}

interface Course {
  id: string;
  title: string;
  description: string;
  modules: Module[];
  skillsToAcquire: string[];
}

interface CourseModuleListProps {
  course: Course;
}

const CourseModuleList = ({ course }: CourseModuleListProps) => {
  return (
    <div className="relative pl-4">
      {/* Ligne verticale principale du flux */}
      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border z-0"></div>

      <div className="space-y-6">
        {course.modules.map((module, index) => {
          const isAccessible = index === 0 || course.modules[index - 1]?.isCompleted;
          const isSubModule = module.level === 1;

          return (
            <div
              key={index}
              className={cn(
                "relative flex items-start gap-4",
                isSubModule ? "ml-8" : "" // Indentation pour les sous-modules
              )}
            >
              {/* Point de connexion sur la ligne principale */}
              <div className={cn(
                "absolute left-0 top-4 h-3 w-3 rounded-full z-10",
                isAccessible ? "bg-primary" : "bg-muted-foreground",
                isSubModule ? "-left-2" : "-left-2" // Ajustement de position pour les points
              )}></div>
              
              {/* Ligne de connexion pour les sous-modules */}
              {isSubModule && (
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-border z-0 -translate-x-2"></div>
              )}

              <Card
                className={cn(
                  "flex-1 shadow-lg transition-all duration-300 ease-in-out z-10",
                  !isAccessible && "opacity-50 cursor-not-allowed",
                  isAccessible && "hover:shadow-xl hover:scale-[1.01]",
                  isSubModule ? "border-l-4 border-accent" : "border-l-4 border-primary"
                )}
              >
                <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-base font-medium">
                    {module.title}
                  </CardTitle>
                  {module.isCompleted ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <Lock className="h-5 w-5 text-muted-foreground" />
                  )}
                </CardHeader>
                <CardContent className="flex flex-col justify-between">
                  <CardDescription className="mb-4 text-sm">
                    {module.content.substring(0, 100)}...
                  </CardDescription>
                  <Link to={`/courses/${course.id}/modules/${index}`}>
                    <Button className="w-full text-xs" disabled={!isAccessible}>
                      {module.isCompleted ? "Revoir le module" : "Commencer le module"}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CourseModuleList;