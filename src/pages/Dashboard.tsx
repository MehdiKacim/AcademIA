import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRole } from "@/contexts/RoleContext";
import { loadCourses, loadClasses, loadCurricula } from "@/lib/courseData"; // Removed loadEstablishments
import { getAllStudentCourseProgress, getAllProfiles, getAllStudentClassEnrollments } from "@/lib/studentData"; // Import Supabase function
import { Course, StudentCourseProgress, Profile, Class, Curriculum, StudentClassEnrollment } from "@/lib/dataModels"; // Removed Establishment type
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

const Dashboard = () => {
  const { currentUserProfile, currentRole, isLoadingUser } = useRole();
  const [courses, setCourses] = useState<Course[]>([]);
  const [studentCourseProgresses, setStudentCourseProgresses] = useState<StudentCourseProgress[]>([]);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]); // For professeur/tutor to count students
  const [classes, setClasses] = useState<Class[]>([]); // For professeur/tutor to count students in classes
  // Removed establishments state
  const [curricula, setCurricula] = useState<Curriculum[]>([]); // For admin
  const [allStudentClassEnrollments, setAllStudentClassEnrollments] = useState<StudentClassEnrollment[]>([]); // New state

  useEffect(() => {
    const fetchData = async () => {
      const loadedCourses = await loadCourses();
      setCourses(loadedCourses);
      const loadedProgresses = await getAllStudentCourseProgress();
      setStudentCourseProgresses(loadedProgresses);
      const loadedProfiles = await getAllProfiles();
      setAllProfiles(loadedProfiles);
      const loadedClasses = await loadClasses();
      setClasses(loadedClasses);
      // Removed loadEstablishments
      const loadedCurricula = await loadCurricula(); // Fetch curricula
      setCurricula(loadedCurricula);
      setAllStudentClassEnrollments(await getAllStudentClassEnrollments()); // Fetch all enrollments
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

      const coursesInProgress = enrolledCourses.filter(c => {
        const progress = studentProgress.find(ec => ec.course_id === c.id);
        return progress && !progress.modules_progress.every(m => m.is_completed);
      });

      return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Mes Cours Actuels</CardTitle>
              <CardDescription>Continuez votre apprentissage.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">{coursesInProgress.length}</p>
              <p className="text-sm text-muted-foreground">cours en cours.</p>
              {coursesInProgress.length > 0 && (
                <Link to={`/courses/${coursesInProgress[0].id}`} className="mt-4 block">
                  <Button className="w-full">Reprendre le dernier cours</Button>
                </Link>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Cours Terminés</CardTitle>
              <CardDescription>Votre succès jusqu'à présent.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">{completedCoursesCount}</p>
              <p className="text-sm text-muted-foreground">cours terminés sur {enrolledCourses.length} inscrits.</p>
              {completedCoursesCount > 0 && (
                <Link to="/courses" className="mt-4 block">
                  <Button variant="outline" className="w-full">Voir tous les cours terminés</Button>
                </Link>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Progression Globale</CardTitle>
              <CardDescription>Votre avancement général.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">{overallProgress}%</p>
              <Progress value={overallProgress} className="w-full mt-2" />
              <p className="text-sm text-muted-foreground mt-2">Modules terminés : {totalModulesCompleted} / {totalModulesAvailable}</p>
              <Link to="/analytics?view=personal" className="mt-4 block">
                <Button variant="outline" className="w-full">Voir mes statistiques</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      );
    } else if (currentRole === 'professeur') { // Changed from 'creator'
      const createdCourses = courses.filter(c => c.creator_id === currentUserProfile.id);
      const publishedCoursesCount = createdCourses.filter(c => c.modules.some(m => m.sections.length > 0)).length; // Heuristic: has at least one section
      
      const studentsInMyCourses = new Set(
        studentCourseProgresses
          .filter(scp => createdCourses.some(cc => cc.id === scp.course_id))
          .map(scp => scp.user_id)
      ).size;

      return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Mes Cours Créés</CardTitle>
              <CardDescription>Gérez vos contenus d'apprentissage.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">{createdCourses.length}</p>
              <p className="text-sm text-muted-foreground">{publishedCoursesCount} sont publiés.</p>
              <Link to="/courses" className="mt-4 block">
                <Button className="w-full">Gérer mes cours</Button>
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Impact sur les Élèves</CardTitle>
              <CardDescription>Nombre total d'élèves inscrits à vos cours.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">{studentsInMyCourses}</p>
              <p className="text-sm text-muted-foreground">élèves uniques.</p>
              <Link to="/analytics?view=overview" className="mt-4 block">
                <Button variant="outline" className="w-full">Voir les analytiques</Button>
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Gestion des Classes</CardTitle>
              <CardDescription>Organisez vos élèves en classes.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">{classes.filter(cls => cls.creator_ids.includes(currentUserProfile.id)).length}</p>
              <p className="text-sm text-muted-foreground">classes gérées.</p>
              <Link to="/classes" className="mt-4 block">
                <Button variant="outline" className="w-full">Gérer les classes</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      );
    } else if (currentRole === 'tutor') {
      // Filter students based on classes managed by the current tutor
      const managedClassIds = classes.filter(cls => cls.creator_ids.includes(currentUserProfile.id)).map(cls => cls.id);
      const studentsInMyClasses = allProfiles.filter(p => 
        p.role === 'student' && allStudentClassEnrollments.some(e => e.student_id === p.id && managedClassIds.includes(e.class_id))
      );
      
      const studentsAtRisk = studentsInMyClasses.filter(s => studentCourseProgresses.some(scp => scp.user_id === s.id && scp.modules_progress.some(mp => mp.sections_progress.some(sp => sp.quiz_result && !sp.quiz_result.passed)))).length;
      const totalSupervisedStudents = studentsInMyClasses.length;

      return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Élèves Supervisés</CardTitle>
              <CardDescription>Nombre d'élèves sous votre tutelle.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">{totalSupervisedStudents}</p>
              <p className="text-sm text-muted-foreground">élèves au total.</p>
              <Link to="/pedagogical-management" className="mt-4 block">
                <Button className="w-full">Voir tous les élèves</Button>
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Élèves en Difficulté</CardTitle>
              <CardDescription>Élèves nécessitant une attention particulière.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-destructive">{studentsAtRisk}</p>
              <p className="text-sm text-muted-foreground">élèves avec des difficultés récentes.</p>
              <Link to="/analytics?view=alerts" className="mt-4 block">
                <Button variant="outline" className="w-full">Voir les alertes</Button>
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Performance des Classes</CardTitle>
              <CardDescription>Vue d'overview de la progression par classe.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">{classes.filter(cls => cls.creator_ids.includes(currentUserProfile.id)).length}</p>
              <p className="text-sm text-muted-foreground">classes supervisées.</p>
              <Link to="/analytics?view=class-performance" className="mt-4 block">
                <Button variant="outline" className="w-full">Voir les performances</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      );
    } else if (currentRole === 'administrator') { // Administrator
      // Removed totalEstablishments
      const totalDirectors = allProfiles.filter(p => p.role === 'director').length;
      const totalDeputyDirectors = allProfiles.filter(p => p.role === 'deputy_director').length;

      return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Utilisateurs Administrateurs</CardTitle>
              <CardDescription>Nombre total d'administrateurs sur la plateforme.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">{allProfiles.filter(p => p.role === 'administrator').length}</p>
              <Link to="/admin-users" className="mt-4 block">
                <Button className="w-full">Gérer les administrateurs</Button>
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Directeurs</CardTitle>
              <CardDescription>Nombre total de directeurs sur la plateforme.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">{totalDirectors}</p>
              <Link to="/admin-users" className="mt-4 block">
                <Button variant="outline" className="w-full">Gérer les directeurs</Button>
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Directeurs Adjoints</CardTitle>
              <CardDescription>Nombre total de directeurs adjoints sur la plateforme.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">{totalDeputyDirectors}</p>
              <Link to="/admin-users" className="mt-4 block">
                <Button variant="outline" className="w-full">Gérer les directeurs adjoints</Button>
              </Link>
            </CardContent>
          </Card>
          {/* Removed Global Analytics card for Administrator */}
        </div>
      );
    } else if (currentRole === 'director' || currentRole === 'deputy_director') { // Director, Deputy Director
      // Removed myEstablishment
      const studentsInMyScope = allProfiles.filter(p => p.role === 'student').length; // Now counts all students
      const professeursInMyScope = allProfiles.filter(p => p.role === 'professeur').length; // Now counts all professeurs
      const classesInMyScope = classes.length; // Now counts all classes
      const curriculaInMyScope = curricula.length; // Now counts all curricula

      return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Mon Rôle</CardTitle>
              <CardDescription>Vue d'overview de votre rôle.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">{currentRole === 'director' ? 'Directeur' : 'Directeur Adjoint'}</p>
              <Link to="/profile" className="mt-4 block">
                <Button className="w-full">Voir mon profil</Button>
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Personnel & Élèves</CardTitle>
              <CardDescription>Nombre de professeurs et d'élèves.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">{professeursInMyScope} Professeurs, {studentsInMyScope} Élèves</p>
              <Link to="/admin-users" className="mt-4 block">
                <Button variant="outline" className="w-full">Gérer les utilisateurs</Button>
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Structure Pédagogique</CardTitle>
              <CardDescription>Cursus et classes.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">{curriculaInMyScope} Cursus, {classesInMyScope} Classes</p>
              <Link to="/curricula" className="mt-4 block">
                <Button variant="outline" className="w-full">Gérer les cursus et classes</Button>
              </Link>
            </CardContent>
          </Card>
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Analytiques</CardTitle>
              <CardDescription>Accédez aux statistiques détaillées.</CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/analytics?view=overview" className="mt-4 block">
                <Button className="w-full">Voir les analytiques</Button>
              </Link>
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
        Tableau de bord {currentUserProfile?.first_name} {currentUserProfile?.last_name} ({currentRole === 'student' ? 'Élève' : currentRole === 'professeur' ? 'Professeur' : currentRole === 'tutor' ? 'Tuteur' : currentRole === 'director' ? 'Directeur' : currentRole === 'deputy_director' ? 'Directeur Adjoint' : 'Administrateur'})
      </h1>
      {renderDashboardContent()}
    </div>
  );
};

export default Dashboard;