import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, CheckCircle, ArrowDown, BookOpen } from "lucide-react"; // Ajout de BookOpen
import { cn } from "@/lib/utils";
import { Course, Module, loadCourses } from "@/lib/courseData"; // Import loadCourses and Module

interface CourseModuleListProps {
  course: Course;
}

const CourseModuleList = ({ course }: CourseModuleListProps) => {
  // Charger la dernière version des cours pour s'assurer que l'état de complétion est à jour
  const updatedCourses = loadCourses();
  const currentCourse = updatedCourses.find(c => c.id === course.id) || course;

  // Fonction pour vérifier si un module est accessible
  const isModuleAccessible = (moduleIndex: number, modules: Module[]) => {
    if (moduleIndex === 0) {
      return true; // Le premier module est toujours accessible
    }
    // Un module est accessible si le module précédent est complété
    return modules[moduleIndex - 1]?.isCompleted;
  };

  return (
    <div className="flex flex-col items-center space-y-8 py-8">
      {currentCourse.modules.map((module, index) => {
        const isCompleted = module.isCompleted;
        const accessible = isModuleAccessible(index, currentCourse.modules);
        const progress = module.sections.length > 0
          ? Math.round((module.sections.filter(s => s.isCompleted).length / module.sections.length) * 100)
          : 0;

        return (
          <React.Fragment key={module.title}>
            <Card
              className={cn(
                "relative w-full max-w-md p-6 text-center shadow-xl transition-all duration-300 ease-in-out",
                accessible ? "border-primary/50 bg-background hover:shadow-2xl" : "border-dashed border-muted-foreground/30 bg-muted/10 opacity-70 cursor-not-allowed",
                isCompleted && "border-green-500 ring-2 ring-green-500/50"
              )}
            >
              <CardHeader className="p-0 mb-4">
                <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
                  {accessible ? (
                    isCompleted ? <CheckCircle className="h-6 w-6 text-green-500" /> : <BookOpen className="h-6 w-6 text-primary" />
                  ) : (
                    <Lock className="h-6 w-6 text-muted-foreground" />
                  )}
                  {module.title}
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  {module.sections[0]?.content.substring(0, 100)}...
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <p className="text-sm text-muted-foreground mb-4">Progression: {progress}%</p>
                <Link to={`/courses/${currentCourse.id}/modules/${index}`}>
                  <Button className="w-full" disabled={!accessible}>
                    {accessible ? (isCompleted ? "Revoir le module" : "Commencer le module") : "Verrouillé"}
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {index < currentCourse.modules.length - 1 && (
              <div className="relative w-1 h-16 bg-border flex items-center justify-center">
                <ArrowDown className={cn(
                  "h-6 w-6 absolute text-border",
                  accessible && isCompleted ? "text-primary animate-bounce" : "text-muted-foreground"
                )} />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default CourseModuleList;