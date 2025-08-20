import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
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
import { loadCourses, Course, Module, ModuleSection, getAccessibleCourseIdsForStudent } from "@/lib/courseData"; // Import loadCourses and getAccessibleCourseIdsForStudent
import { useRole } from '@/contexts/RoleContext';
import { getStudentCourseProgress, upsertStudentCourseProgress } from '@/lib/studentData';
import { StudentCourseProgress as StudentCourseProgressType } from '@/lib/dataModels'; // Import the type

const CourseDetail = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { currentUserProfile, currentRole, isLoadingUser } = useRole();
  const { setCourseContext, setModuleContext, openChat } = useCourseChat();

  const [courses, setCourses] = useState<Course[]>([]);
  const [studentCourseProgress, setStudentCourseProgress] = useState<StudentCourseProgressType | null>(null);
  const [isCourseAccessible, setIsCourseAccessible] = useState(false); // New state for course accessibility

  useEffect(() => {
    const fetchData = async () => {
      // Load all courses first to find the specific course
      const allLoadedCourses = await loadCourses();
      setCourses(allLoadedCourses);

      const foundCourse = allLoadedCourses.find(c => c.id === courseId);

      if (currentUserProfile && currentRole === 'student' && courseId) {
        const accessibleIds = await getAccessibleCourseIdsForStudent(currentUserProfile.id);
        const accessible = accessibleIds.includes(courseId);
        setIsCourseAccessible(accessible);

        if (accessible) {
          const progress = await getStudentCourseProgress(currentUserProfile.id, courseId);
          setStudentCourseProgress(progress);
        }
      } else {
        // For non-students (creators/tutors) or if no user, assume accessible if course exists
        setIsCourseAccessible(!!foundCourse);
      }
    };
    fetchData();
  }, [courseId, currentUserProfile, currentRole]);

  const course = courses.find(c => c.id === courseId);

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

  if (isLoadingUser) {
    return (
      <div className="text-center py-20">
        <h1 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
          Chargement du cours...
        </h1>
        <p className="text-lg text-muted-foreground">
          Veuillez patienter.
        </p>
      </div>
    );
  }

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

  if (currentRole === 'student' && !isCourseAccessible) {
    return (
      <div className="text-center py-20">
        <h1 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
          Accès au cours refusé
        </h1>
        <p className="text-lg text-muted-foreground">
          Ce cours n'est pas accessible pour votre classe ou votre rôle.
        </p>
        <Button onClick={() => navigate("/courses")} className="mt-4">
          Retour à la liste des cours
        </Button>
      </div>
    );
  }

  // Calculate progress based on current user's student profile
  let progressPercentage = 0;
  let completedModules = 0;
  const totalModules = course.modules.length;

  if (currentUserProfile && currentRole === 'student' && isCourseAccessible) {
    if (!studentCourseProgress) {
      // If student is not enrolled, enroll them automatically
      const newCourseProgress: StudentCourseProgressType = {
        id: `progress${Date.now()}`, // Dummy ID, Supabase will generate
        user_id: currentUserProfile.id,
        course_id: course.id,
        is_completed: false,
        modules_progress: course.modules.map((_, index) => ({
          module_index: index,
          is_completed: false,
          sections_progress: course.modules[index].sections.map((_, secIndex) => ({
            section_index: secIndex,
            is_completed: false,
          })),
        })),
      };
      upsertStudentCourseProgress(newCourseProgress).then(savedProgress => {
        if (savedProgress) {
          setStudentCourseProgress(savedProgress);
          showSuccess(`Vous êtes maintenant inscrit au cours "${course.title}" !`);
        } else {
          showError("Échec de l'inscription au cours.");
        }
      }).catch(err => {
        console.error("Error enrolling student:", err);
        showError("Erreur lors de l'inscription au cours.");
      });
    } else {
      completedModules = studentCourseProgress.modules_progress.filter(m => m.is_completed).length;
      progressPercentage = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;
    }
  }

  return (
    <div className="space-y-8">
      {course.image_url && (
        <img
          src={course.image_url}
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
          {course.skills_to_acquire.map((skill, index) => (
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
        <CourseModuleList course={course} studentCourseProgress={studentCourseProgress} />
      </section>

      <section>
        {currentUserProfile && (
          <NotesSection noteKey={generateNoteKey('course', course.id)} title={course.title} userId={currentUserProfile.id} />
        )}
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