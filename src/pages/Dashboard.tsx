import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRole } from "@/contexts/RoleContext";
import { loadCourses, loadClasses, loadCurricula } from "@/lib/courseData";
import { getAllStudentCourseProgress, getAllProfiles, getAllStudentClassEnrollments } from "@/lib/studentData";
import { Course, StudentCourseProgress, Profile, Class, Curriculum, StudentClassEnrollment } from "@/lib/dataModels";
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion"; // Import motion for animations
import { cn } from "@/lib/utils"; // Import cn for conditional styling

const Dashboard = () => {
  const { currentUserProfile, currentRole, isLoadingUser } = useRole();
  const [courses, setCourses] = useState<Course[]>([]);
  const [studentCourseProgresses, setStudentCourseProgresses] = useState<StudentCourseProgress[]>([]);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [curricula, setCurricula] = useState<Curriculum[]>([]);
  const [allStudentClassEnrollments, setAllStudentClassEnrollments] = useState<StudentClassEnrollment[]>([]);

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
      const loadedCurricula = await loadCurricula();
      setCurricula(loadedCurricula);
      setAllStudentClassEnrollments(await getAllStudentClassEnrollments());
    };
    fetchData();
  }, [currentUserProfile]);

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

  const cardVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: "easeOut" } },
  };

  const gradientClasses = "text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan";

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
        <motion.div 
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 w-full max-w-5xl mx-auto"
          initial="hidden"
          animate="visible"
          variants={{
            visible: {
              transition: {
                staggerChildren: 0.1,
              },
            },
          }}
        >
          <motion.div variants={cardVariants}>
            <Card className="rounded-android-tile hover:scale-[1.02] transition-transform bg-card/80 backdrop-blur-lg">
              <CardHeader>
                <CardTitle className={gradientClasses}>Mes Cours Actuels</CardTitle>
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
          </motion.div>
          <motion.div variants={cardVariants}>
            <Card className="rounded-android-tile hover:scale-[1.02] transition-transform bg-card/80 backdrop-blur-lg">
              <CardHeader>
                <CardTitle className={gradientClasses}>Cours Terminés</CardTitle>
                <CardDescription>Votre succès jusqu'à présent.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-primary">{completedCoursesCount}</p>
                <p className="text-sm text-muted-foreground">cours terminés sur {enrolledCourses.length} inscrits.</p>
                {completedCoursesCount > 0 && (
                  <Link to="/courses" className="mt-4 block">
                    <Button variant="outline" className="w-full">Voir tous les cours terminées</Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          </motion.div>
          <motion.div variants={cardVariants}>
            <Card className="rounded-android-tile hover:scale-[1.02] transition-transform bg-card/80 backdrop-blur-lg">
              <CardHeader>
                <CardTitle className={gradientClasses}>Progression Globale</CardTitle>
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
          </motion.div>
        </motion.div>
      );
    } else if (currentRole === 'professeur') {
      const createdCourses = courses.filter(c => c.creator_id === currentUserProfile.id);
      const publishedCoursesCount = createdCourses.filter(c => c.modules.some(m => m.sections.length > 0)).length;
      
      const studentsInMyCourses = new Set(
        studentCourseProgresses
          .filter(scp => createdCourses.some(cc => cc.id === scp.course_id))
          .map(scp => scp.user_id)
      ).size;

      return (
        <motion.div 
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 w-full max-w-5xl mx-auto"
          initial="hidden"
          animate="visible"
          variants={{
            visible: {
              transition: {
                staggerChildren: 0.1,
              },
            },
          }}
        >
          <motion.div variants={cardVariants}>
            <Card className="rounded-android-tile hover:scale-[1.02] transition-transform bg-card/80 backdrop-blur-lg">
              <CardHeader>
                <CardTitle className={gradientClasses}>Mes Cours Créés</CardTitle>
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
          </motion.div>
          <motion.div variants={cardVariants}>
            <Card className="rounded-android-tile hover:scale-[1.02] transition-transform bg-card/80 backdrop-blur-lg">
              <CardHeader>
                <CardTitle className={gradientClasses}>Impact sur les Élèves</CardTitle>
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
          </motion.div>
          <motion.div variants={cardVariants}>
            <Card className="rounded-android-tile hover:scale-[1.02] transition-transform bg-card/80 backdrop-blur-lg">
              <CardHeader>
                <CardTitle className={gradientClasses}>Gestion des Classes</CardTitle>
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
          </motion.div>
        </motion.div>
      );
    } else if (currentRole === 'tutor') {
      const managedClassIds = classes.filter(cls => cls.creator_ids.includes(currentUserProfile.id)).map(cls => cls.id);
      const studentsInMyClasses = allProfiles.filter(p => 
        p.role === 'student' && allStudentClassEnrollments.some(e => e.student_id === p.id && managedClassIds.includes(e.class_id))
      );
      
      const studentsAtRisk = studentsInMyClasses.filter(s => studentCourseProgresses.some(scp => scp.user_id === s.id && scp.modules_progress.some(mp => mp.sections_progress.some(sp => sp.quiz_result && !sp.quiz_result.passed)))).length;
      const totalSupervisedStudents = studentsInMyClasses.length;

      return (
        <motion.div 
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 w-full max-w-5xl mx-auto"
          initial="hidden"
          animate="visible"
          variants={{
            visible: {
              transition: {
                staggerChildren: 0.1,
              },
            },
          }}
        >
          <motion.div variants={cardVariants}>
            <Card className="rounded-android-tile hover:scale-[1.02] transition-transform bg-card/80 backdrop-blur-lg">
              <CardHeader>
                <CardTitle className={gradientClasses}>Élèves Supervisés</CardTitle>
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
          </motion.div>
          <motion.div variants={cardVariants}>
            <Card className="rounded-android-tile hover:scale-[1.02] transition-transform bg-card/80 backdrop-blur-lg">
              <CardHeader>
                <CardTitle className={gradientClasses}>Élèves en Difficulté</CardTitle>
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
          </motion.div>
          <motion.div variants={cardVariants}>
            <Card className="rounded-android-tile hover:scale-[1.02] transition-transform bg-card/80 backdrop-blur-lg">
              <CardHeader>
                <CardTitle className={gradientClasses}>Performance des Classes</CardTitle>
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
          </motion.div>
        </motion.div>
      );
    } else if (currentRole === 'administrator') {
      const totalDirectors = allProfiles.filter(p => p.role === 'director').length;
      const totalDeputyDirectors = allProfiles.filter(p => p.role === 'deputy_director').length;

      return (
        <motion.div 
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 w-full max-w-5xl mx-auto"
          initial="hidden"
          animate="visible"
          variants={{
            visible: {
              transition: {
                staggerChildren: 0.1,
              },
            },
          }}
        >
          <motion.div variants={cardVariants}>
            <Card className="rounded-android-tile hover:scale-[1.02] transition-transform bg-card/80 backdrop-blur-lg">
              <CardHeader>
                <CardTitle className={gradientClasses}>Utilisateurs Administrateurs</CardTitle>
                <CardDescription>Nombre total d'administrateurs sur la plateforme.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-primary">{allProfiles.filter(p => p.role === 'administrator').length}</p>
                <Link to="/admin-users" className="mt-4 block">
                  <Button className="w-full">Gérer les administrateurs</Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div variants={cardVariants}>
            <Card className="rounded-android-tile hover:scale-[1.02] transition-transform bg-card/80 backdrop-blur-lg">
              <CardHeader>
                <CardTitle className={gradientClasses}>Directeurs</CardTitle>
                <CardDescription>Nombre total de directeurs sur la plateforme.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-primary">{totalDirectors}</p>
                <Link to="/admin-users" className="mt-4 block">
                  <Button variant="outline" className="w-full">Gérer les directeurs</Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div variants={cardVariants}>
            <Card className="rounded-android-tile hover:scale-[1.02] transition-transform bg-card/80 backdrop-blur-lg">
              <CardHeader>
                <CardTitle className={gradientClasses}>Directeurs Adjoints</CardTitle>
                <CardDescription>Nombre total de directeurs adjoints sur la plateforme.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-primary">{totalDeputyDirectors}</p>
                <Link to="/admin-users" className="mt-4 block">
                  <Button variant="outline" className="w-full">Gérer les directeurs adjoints</Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      );
    } else if (currentRole === 'director' || currentRole === 'deputy_director') {
      const studentsInMyScope = allProfiles.filter(p => p.role === 'student').length;
      const professeursInMyScope = allProfiles.filter(p => p.role === 'professeur').length;
      const classesInMyScope = classes.length;
      const curriculaInMyScope = curricula.length;

      return (
        <motion.div 
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 w-full max-w-5xl mx-auto"
          initial="hidden"
          animate="visible"
          variants={{
            visible: {
              transition: {
                staggerChildren: 0.1,
              },
            },
          }}
        >
          <motion.div variants={cardVariants}>
            <Card className="rounded-android-tile hover:scale-[1.02] transition-transform bg-card/80 backdrop-blur-lg">
              <CardHeader>
                <CardTitle className={gradientClasses}>Mon Rôle</CardTitle>
                <CardDescription>Vue d'overview de votre rôle.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-primary">{currentRole === 'director' ? 'Directeur' : 'Directeur Adjoint'}</p>
                <Link to="/profile" className="mt-4 block">
                  <Button className="w-full">Voir mon profil</Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div variants={cardVariants}>
            <Card className="rounded-android-tile hover:scale-[1.02] transition-transform bg-card/80 backdrop-blur-lg">
              <CardHeader>
                <CardTitle className={gradientClasses}>Personnel & Élèves</CardTitle>
                <CardDescription>Nombre de professeurs et d'élèves.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-primary">{professeursInMyScope} Professeurs, {studentsInMyScope} Élèves</p>
                <Link to="/admin-users" className="mt-4 block">
                  <Button variant="outline" className="w-full">Gérer les utilisateurs</Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div variants={cardVariants}>
            <Card className="rounded-android-tile hover:scale-[1.02] transition-transform bg-card/80 backdrop-blur-lg">
              <CardHeader>
                <CardTitle className={gradientClasses}>Structure Pédagogique</CardTitle>
                <CardDescription>Cursus et classes.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-primary">{curriculaInMyScope} Cursus, {classesInMyScope} Classes</p>
                <Link to="/curricula" className="mt-4 block">
                  <Button variant="outline" className="w-full">Gérer les cursus et classes</Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div variants={cardVariants} className="lg:col-span-3">
            <Card className="rounded-android-tile hover:scale-[1.02] transition-transform bg-card/80 backdrop-blur-lg">
              <CardHeader>
                <CardTitle className={gradientClasses}>Analytiques</CardTitle>
                <CardDescription>Accédez aux statistiques détaillées.</CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/analytics?view=overview" className="mt-4 block">
                  <Button className="w-full">Voir les analytiques</Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 relative overflow-hidden"> {/* Removed min-h-screen */}
      {/* Background blobs for immersive design */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/10 rounded-full filter blur-3xl opacity-50 animate-blob"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-secondary/20 rounded-full filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
      <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-7xl mx-auto" // Keep max-width for the main content block
      >
        <h1 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan text-center">
          Tableau de bord {currentUserProfile?.first_name} {currentUserProfile?.last_name} ({currentRole === 'student' ? 'Élève' : currentRole === 'professeur' ? 'Professeur' : currentRole === 'tutor' ? 'Tuteur' : currentRole === 'director' ? 'Directeur' : currentRole === 'deputy_director' ? 'Directeur Adjoint' : 'Administrateur'})
        </h1>
        {renderDashboardContent()}
      </motion.div>
    </div>
  );
};

export default Dashboard;