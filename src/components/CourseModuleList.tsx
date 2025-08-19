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
  // Regrouper les modules principaux avec leurs sous-modules
  const groupedModules: { mainModule: Module; subModules: Module[]; }[] = [];
  let currentMainModuleIndex = -1;

  course.modules.forEach((module) => {
    if (module.level === 0) {
      groupedModules.push({ mainModule: module, subModules: [] });
      currentMainModuleIndex++;
    } else if (module.level === 1 && currentMainModuleIndex !== -1) {
      groupedModules[currentMainModuleIndex].subModules.push(module);
    }
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {groupedModules.map((group, groupIndex) => {
        const mainModuleOverallIndex = course.modules.indexOf(group.mainModule);
        const isMainModuleAccessible = mainModuleOverallIndex === 0 || course.modules[mainModuleOverallIndex - 1]?.isCompleted;

        return (
          <Card
            key={group.mainModule.title}
            className={cn(
              "flex flex-col shadow-lg transition-all duration-300 ease-in-out",
              !isMainModuleAccessible && "opacity-50 cursor-not-allowed"
            )}
          >
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{group.mainModule.title}</span>
                {group.mainModule.isCompleted ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <Lock className="h-5 w-5 text-muted-foreground" />
                )}
              </CardTitle>
              <CardDescription className="mb-4 text-sm">
                {group.mainModule.content.substring(0, 100)}... {/* Tronquer le contenu */}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col justify-between">
              <Link to={`/courses/${course.id}/modules/${mainModuleOverallIndex}`}>
                <Button className="w-full text-xs" disabled={!isMainModuleAccessible}>
                  {group.mainModule.isCompleted ? "Revoir le module" : "Commencer le module"}
                </Button>
              </Link>

              {group.subModules.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <h4 className="text-sm font-semibold mb-2 text-foreground">Sous-modules:</h4>
                  <div className="space-y-2">
                    {group.subModules.map((subModule) => {
                      const subModuleOverallIndex = course.modules.indexOf(subModule);
                      const isSubModuleAccessible = course.modules[subModuleOverallIndex - 1]?.isCompleted;

                      return (
                        <Card
                          key={subModule.title}
                          className={cn(
                            "p-3 border-l-4",
                            isSubModuleAccessible ? "border-accent" : "border-muted-foreground/50 opacity-70"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-foreground">{subModule.title}</span>
                            {subModule.isCompleted && <CheckCircle className="h-4 w-4 text-green-500" />}
                          </div>
                          <Link to={`/courses/${course.id}/modules/${subModuleOverallIndex}`}>
                            <Button variant="link" className="p-0 h-auto text-xs mt-1 text-primary hover:underline" disabled={!isSubModuleAccessible}>
                              {subModule.isCompleted ? "Revoir" : "Accéder"}
                            </Button>
                          </Link>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default CourseModuleList;