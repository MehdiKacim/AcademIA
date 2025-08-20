import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, CheckCircle, ArrowDown, BookOpen, FileText, Video, HelpCircle, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Course, Module, loadCourses } from "@/lib/courseData";

interface CourseModuleListProps {
  course: Course;
}

const CourseModuleList = ({ course }: CourseModuleListProps) => {
  const updatedCourses = loadCourses();
  const currentCourse = updatedCourses.find(c => c.id === course.id) || course;

  const isModuleAccessible = (moduleIndex: number, modules: Module[]) => {
    if (moduleIndex === 0) {
      return true;
    }
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
              {currentCourse.imageUrl && (
                <img
                  src={currentCourse.imageUrl}
                  alt={`Image pour le cours ${currentCourse.title}`}
                  className="w-full h-32 object-cover rounded-md mb-4"
                />
              )}
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

                {/* Section pour l'affichage vertical des sections */}
                <div className="mt-6">
                  <h4 className="text-lg font-semibold mb-3 text-left">Sections du module:</h4>
                  <div className="flex flex-col space-y-4"> {/* Changé pour affichage vertical */}
                    {module.sections.map((section, sectionIndex) => (
                      <div key={sectionIndex} className="relative">
                        <Link
                          to={`/courses/${currentCourse.id}/modules/${index}#section-${sectionIndex}`}
                          className={cn(
                            "block p-4 border rounded-lg text-center flex flex-col items-center justify-center transition-all duration-200", // Supprimé w-40 h-32
                            section.isCompleted ? "border-green-500 bg-green-50/20" : "border-muted-foreground/30 bg-muted/10",
                            !accessible && "opacity-50 cursor-not-allowed pointer-events-none"
                          )}
                        >
                          {section.type === 'text' && <FileText className="h-6 w-6 mb-2 text-primary" />}
                          {section.type === 'video' && <Video className="h-6 w-6 mb-2 text-primary" />}
                          {section.type === 'image' && <ImageIcon className="h-6 w-6 mb-2 text-primary" />}
                          {section.type === 'quiz' && <HelpCircle className="h-6 w-6 mb-2 text-primary" />}
                          <p className="text-sm font-medium line-clamp-2">{section.title}</p>
                          {section.isCompleted && <CheckCircle className="h-4 w-4 text-green-500 mt-1" />}
                        </Link>
                        {/* Suppression de la ligne de connexion horizontale */}
                      </div>
                    ))}
                  </div>
                </div>
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