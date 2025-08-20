import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, CheckCircle, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Course } from "@/lib/courseData";

interface CourseProgressionViewProps {
  courses: Course[];
}

const CourseProgressionView = ({ courses }: CourseProgressionViewProps) => {
  // Sort courses to ensure correct progression order based on prerequisites
  const sortedCourses = [...courses].sort((a, b) => {
    if (!a.prerequisiteCourseId && b.prerequisiteCourseId) return -1; // a comes first if it has no prerequisite and b does
    if (a.prerequisiteCourseId && !b.prerequisiteCourseId) return 1;  // b comes first if it has no prerequisite and a does
    return 0; // Maintain original order if both have or don't have prerequisites
  });

  const getCourseCompletionStatus = (course: Course) => {
    const totalModules = course.modules.length;
    const completedModules = course.modules.filter(m => m.isCompleted).length;
    return totalModules > 0 && completedModules === totalModules;
  };

  const isCourseAccessible = (course: Course, allCourses: Course[]) => {
    if (!course.prerequisiteCourseId) {
      return true; // No prerequisite, so it's always accessible
    }
    const prerequisiteCourse = allCourses.find(c => c.id === course.prerequisiteCourseId);
    if (!prerequisiteCourse) {
      return true; // Prerequisite not found, assume accessible (or handle as error)
    }
    return getCourseCompletionStatus(prerequisiteCourse);
  };

  return (
    <div className="flex flex-col items-center space-y-8 py-8">
      {sortedCourses.map((course, index) => {
        const isCompleted = getCourseCompletionStatus(course);
        const isAccessible = isCourseAccessible(course, courses);
        const progress = course.modules.length > 0
          ? Math.round((course.modules.filter(m => m.isCompleted).length / course.modules.length) * 100)
          : 0;

        return (
          <React.Fragment key={course.id}>
            <Card
              className={cn(
                "relative w-full max-w-md p-6 text-center shadow-xl transition-all duration-300 ease-in-out",
                isAccessible ? "border-primary/50 bg-background hover:shadow-2xl" : "border-dashed border-muted-foreground/30 bg-muted/10 opacity-70 cursor-not-allowed",
                isCompleted && "border-green-500 ring-2 ring-green-500/50"
              )}
            >
              {course.imageUrl && (
                <img
                  src={course.imageUrl}
                  alt={`Image pour le cours ${course.title}`}
                  className="w-full h-32 object-cover rounded-md mb-4"
                />
              )}
              <CardHeader className="p-0 mb-4">
                <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
                  {isAccessible ? (
                    isCompleted ? <CheckCircle className="h-6 w-6 text-green-500" /> : <BookOpen className="h-6 w-6 text-primary" />
                  ) : (
                    <Lock className="h-6 w-6 text-muted-foreground" />
                  )}
                  {course.title}
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  {course.description.substring(0, 100)}...
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <p className="text-sm text-muted-foreground mb-4">Progression: {progress}%</p>
                <Link to={`/courses/${course.id}`}>
                  <Button className="w-full" disabled={!isAccessible}>
                    {isAccessible ? (isCompleted ? "Revoir le cours" : "Commencer le cours") : "Verrouillé"}
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {index < sortedCourses.length - 1 && (
              <div className="relative w-1 h-16 bg-border flex items-center justify-center">
                <ArrowDown className={cn(
                  "h-6 w-6 absolute text-border",
                  isAccessible && getCourseCompletionStatus(course) ? "text-primary animate-bounce" : "text-muted-foreground"
                )} />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default CourseProgressionView;