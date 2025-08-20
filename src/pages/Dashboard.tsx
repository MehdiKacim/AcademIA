import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRole } from "@/contexts/RoleContext";
import { loadCourses } from "@/lib/courseData";
import { getAllStudentCourseProgress } from "@/lib/studentData"; // Import Supabase function
import { Course, StudentCourseProgress } from "@/lib/dataModels"; // Import types
import React, { useState, useEffect } from "react";

const Dashboard = () => {
  const { currentUserProfile, currentRole, isLoadingUser } = useRole();
  const [courses, setCourses] = useState<Course[]>([]);
  const [studentCourseProgresses, setStudentCourseProgresses] = useState<StudentCourseProgress[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const loadedCourses = await loadCourses();
      setCourses(loadedCourses);
      const loadedProgresses = await getAllStudentCourseProgress();
      setStudentCourseProgresses(loadedProgresses);
    };
    fetchData();
  }, [currentUserProfile]); // Re-fetch if user profile changes

  if (isLoadingUser) {
    return (
      <div className="text-center py-20">
        <h1 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
          Chargement du tableau de bord...
        </h1>
        <p className="text-lg text-muted-foreground">
          Veuillez patienter.
        </p>
      </div>
    );
  }

  const renderDashboardContent = () => {
    if (!currentUserProfile) {
      return (
        <div className="text-center py-20">
          <h1 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
            Accès Restreint
          </h1>
          <p className="text-lg text-muted-foreground">
            Veuillez vous connecter pour accéder au tableau de bord.
          </p>
        </div>
      );
    }

    if (currentRole === 'student') {
      const studentProgress = studentCourseProgresses.filter(p => p.user_id === currentUserProfile.id);

      const enrolledCourses = courses.filter(c => studentProgress.some(ec => ec.course_id === c.id));
      const completedCoursesCount = enrolledCourses.filter(c => {
        const progress = studentProgress.find(ec => ec.course_id === c.id);
        return progress && progress.modules_progress.every(m => m.is_completed);
      }).length;

      const totalModulesCompleted = studentProgress.reduce((acc, courseProgress) =>
        acc + courseProgress.modules_progress.filter(m => m.is_completed).length, 0
      );
      const totalModulesAvailable = courses.reduce((acc, course) => acc + course.modules.length, 0);
      const overallProgress = totalModulesAvailable > 0 ? Math.round((totalModulesCompleted / totalModulesAvailable) * 100) : 0;

      return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Mes Cours Actuels</CardTitle>
              <CardDescription>Continuez votre apprentissage.</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Vous avez {enrolledCourses.length} cours en cours ou terminés.</p>
              <p className="text-sm text-muted-foreground">Reprenez là où vous en étiez !</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Cours Terminés</CardTitle>
              <CardDescription>Votre succès jusqu'à présent.</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Vous avez terminé {completedCoursesCount} cours.</p>
              <p className="text-sm text-muted-foreground">Continuez sur cette lancée !</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Progression Globale</CardTitle>
              <CardDescription>Votre avancement général.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">{overallProgress}%</p>
              <p className="text-sm text-muted-foreground">Modules terminés : {totalModulesCompleted} / {totalModulesAvailable}</p>
            </CardContent>
          </Card>
        </div>
      );
    } else if (currentRole === 'creator') {
      const createdCourses = courses; // Assuming all courses are created by this creator for demo
      const publishedCoursesCount = createdCourses.filter(c => c.modules.some(m => m.isCompleted)).length; // Simple heuristic for 'published'
      const totalStudents = studentCourseProgresses.length; // Total students with any progress

      return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Mes Cours Créés</CardTitle>
              <CardDescription>Gérez vos contenus d'apprentissage.</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Vous avez créé {createdCourses.length} cours.</p>
              <p className="text-sm text-muted-foreground">{publishedCoursesCount} sont publiés.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Statistiques des Élèves</CardTitle>
              <CardDescription>Engagement et progression des apprenants.</CardDescription>
            </CardHeader>
            <CardContent>
              <p>{totalStudents} élèves inscrits au total.</p>
              <p className="text-sm text-muted-foreground">Taux de complétion moyen : ~70% (estimation)</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Nouveaux Inscrits</CardTitle>
              <CardDescription>Les derniers arrivants.</CardDescription>
            </CardHeader>
            <CardContent>
              <p>5 nouveaux élèves cette semaine.</p>
            </CardContent>
          </Card>
        </div>
      );
    } else if (currentRole === 'tutor') {
      const supervisedStudents = studentCourseProgresses.slice(0, 2); // Just taking first two for demo
      return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Mes Élèves</CardTitle>
              <CardDescription>Suivez la progression de vos enfants/protégés.</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Vous suivez {supervisedStudents.length} élèves : {supervisedStudents.map(s => s.user_id).join(', ')}.</p> {/* Placeholder for user names */}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Alertes de Progression</CardTitle>
              <CardDescription>Points nécessitant votre attention.</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Alertes fictives pour le moment.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Communication</CardTitle>
              <CardDescription>Messages récents.</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Messages fictifs pour le moment.</p>
            </CardContent>
          </Card>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
        Tableau de bord {currentRole === 'student' ? 'Élève' : currentRole === 'creator' ? 'Créateur' : 'Tuteur'}
      </h1>
      {renderDashboardContent()}
    </div>
  );
};

export default Dashboard;