import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, Send, Lock, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCourseChat } from "@/contexts/CourseChatContext";
import { showSuccess, showError } from '@/utils/toast';
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import NotesSection from "@/components/NotesSection";
import { generateNoteKey } from "@/lib/notes";
import CourseModuleList from "@/components/CourseModuleList";
import { loadCourses, Course, Module, ModuleSection } from "@/lib/courseData"; // Import loadCourses
import { useRole } from '@/contexts/RoleContext';
import { loadStudents, getStudentProfileByUserId, updateStudentProfile } from '@/lib/studentData';

const CourseDetail = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { currentUser, currentRole } = useRole();
  const { setCourseContext, setModuleContext, openChat } = useCourseChat();

  const [courses, setCourses] = useState<Course[]>(loadCourses());
  const [studentProfiles, setStudentProfiles] = useState(loadStudents());

  const course = courses.find(c => c.id === courseId);
  const studentProfile = currentUser && currentRole === 'student' ? getStudentProfileByUserId(currentUser.id) : undefined;

  useEffect(() => {
    setCourses(loadCourses());
    setStudentProfiles(loadStudents());
  }, [courseId]); // Re-load if courseId changes

  useEffect(() => {
    if (course) {
      setCourseContext(course.id, course.title);
    } else {
      setCourseContext(null, null);
    }
    return () => {
      setCourseContext(null, null);
      setModuleContext(null);
    };
  }, [courseId, course, setCourseContext, setModuleContext]);

  const handleAskAiaAboutCourse = () => {
    if (course) {
      setModuleContext(null);
      openChat(`J'ai une question sur le cours "${course.title}".`);
    }
  };

  if (!course) {
    return (
      <div className="text-center py-20">
        <h1 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
          Cours non trouvé
        </h1>
        <p className="text-lg text-muted-foreground">
          Le cours que vous recherchez n'existe pas.
        </p>
      </div>
    );
  }

  // Calculate progress based on current user's student profile
  let progressPercentage = 0;
  let completedModules = 0;
  const totalModules = course.modules.length;

  if (studentProfile) {
    const courseProgress = studentProfile.enrolledCoursesProgress.find(cp => cp.courseId === course.id);
    if (courseProgress) {
      completedModules = courseProgress.modulesProgress.filter(m => m.isCompleted).length;
      progressPercentage = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;
    } else {
      // If student is not enrolled, enroll them automatically
      const newCourseProgress = {
        courseId: course.id,
        isCompleted: false,
        modulesProgress: course.modules.map((_, index) => ({
          moduleIndex: index,
          isCompleted: false,
          sectionsProgress: course.modules[index].sections.map((_, secIndex) => ({
            sectionIndex: secIndex,
            isCompleted: false,
          })),
        })),
      };
      const updatedStudentProfile = {
        ...studentProfile,
        enrolledCoursesProgress: [...studentProfile.enrolledCoursesProgress, newCourseProgress],
      };
      updateStudentProfile(updatedStudentProfile);
      setStudentProfiles(loadStudents()); // Refresh local state
      showSuccess(`Vous êtes maintenant inscrit au cours "${course.title}" !`);
    }
  }

  return (
    <div className="space-y-8">
      {course.imageUrl && (
        <img
          src={course.imageUrl}
          alt={`Image pour le cours ${course.title}`}
          className="w-full h-64 object-cover rounded-lg mb-8 shadow-md"
        />
      )}
      <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
        {course.title}
      </h1>
      <p className="text-lg text-muted-foreground">{course.description}</p>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Compétences à acquérir</h2>
        <div className="flex flex-wrap gap-2 mb-6">
          {course.skillsToAcquire.map((skill, index) => (
            <Badge key={index} variant="secondary" className="text-sm px-3 py-1">
              {skill}
            </Badge>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Progression du cours</h2>
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Progress value={progressPercentage} className="w-full" />
              <span className="text-lg font-medium">{progressPercentage}%</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {completedModules} modules terminés sur {totalModules}
            </p>
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Visualisation du parcours</h2>
        <CourseModuleList course={course} studentProfile={studentProfile} />
      </section>

      <section>
        <NotesSection noteKey={generateNoteKey('course', course.id)} title={course.title} />
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Bot className="h-6 w-6 text-primary" /> Demandez à AiA sur ce cours
        </h2>
        <Card>
          <CardContent className="p-6 space-y-4">
            <p className="text-muted-foreground mb-4">
              Cliquez ci-dessous pour poser une question à AiA concernant ce cours.
            </p>
            <Button onClick={handleAskAiaAboutCourse}>
              <Send className="h-5 w-5 mr-2" /> Poser une question à AiA sur ce cours
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default CourseDetail;