import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  MotionCard,
} from "@/components/ui/card";
import { useRole } from "@/contexts/RoleContext";
import { loadCourses, loadEstablishments, getEstablishmentName, loadClasses, loadCurricula } from "@/lib/courseData";
import { getAllStudentCourseProgress, getAllProfiles, getAllStudentClassEnrollments } from "@/lib/studentData";
import { Course, StudentCourseProgress, Profile, Class, Curriculum, StudentClassEnrollment, Establishment } from "@/lib/dataModels";
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button, MotionButton } from "@/components/ui/button";
import { CheckCircle, BookOpen, Users, GraduationCap, PenTool, BriefcaseBusiness, BotMessageSquare, LayoutList, Building2, BarChart2, UserCog, MessageSquare, AlertTriangle, Code } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { showError } from "@/utils/toast";
import { useCourseChat } from "@/contexts/CourseChatContext"; // Import useCourseChat

const Dashboard = () => {
  const { currentUserProfile, currentRole, isLoadingUser } = useRole();
  const { openChat } = useCourseChat(); // Use openChat from context
  const [courses, setCourses] = useState<Course[]>([]);
  const [studentCourseProgresses, setStudentCourseProgresses] = useState<StudentCourseProgress[]>([]);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [curricula, setCurricula] = useState<Curriculum[]>([]);
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [allStudentClassEnrollments, setAllStudentClassEnrollments] = useState<StudentClassEnrollment[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
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
        setEstablishments(await loadEstablishments());
        setAllStudentClassEnrollments(await getAllStudentClassEnrollments());
      } catch (error: any) {
        console.error("Error fetching data for Dashboard:", error);
        showError(`Erreur lors du chargement des données du tableau de bord: ${error.message}`);
      }
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

      const nextCourseToResume = coursesInProgress.length > 0 ? coursesInProgress[0] : null;

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
            <MotionCard className="rounded-android-tile backdrop-blur-lg bg-card/80 shadow-card-shadow" whileHover={{ scale: 1.02, boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)" }}>
              <CardHeader>
                <CardTitle className={gradientClasses}>Mon Parcours Actuel</CardTitle>
                <CardDescription>Reprenez là où vous en étiez.</CardDescription>
              </CardHeader>
              <CardContent>
                {nextCourseToResume ? (
                  <>
                    <p className="text-2xl font-bold text-primary">{nextCourseToResume.title}</p>
                    <p className="text-sm text-muted-foreground">Cours en cours.</p>
                    <Link to={`/courses/${nextCourseToResume.id}`} className="mt-4 block">
                      <MotionButton className="w-full" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                        <BookOpen className="h-4 w-4 mr-2" /> Reprendre le cours
                      </MotionButton>
                    </Link>
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-bold text-muted-foreground">Aucun cours en cours</p>
                    <p className="text-sm text-muted-foreground">Commencez un nouveau cours dès maintenant !</p>
                    <Link to="/courses" className="mt-4 block">
                      <MotionButton className="w-full" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                        <BookOpen className="h-4 w-4 mr-2" /> Explorer les cours
                      </MotionButton>
                    </Link>
                  </>
                )}
              </CardContent>
            </MotionCard>
          </motion.div>

          <motion.div variants={cardVariants}>
            <MotionCard className="rounded-android-tile backdrop-blur-lg bg-card/80 shadow-card-shadow" whileHover={{ scale: 1.02, boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)" }}>
              <CardHeader>
                <CardTitle className={gradientClasses}>Progression Globale</CardTitle>
                <CardDescription>Votre avancement général.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-primary">{overallProgress}%</p>
                <Progress value={overallProgress} className="w-full mt-2" />
                <p className="text-sm text-muted-foreground mt-2">Modules terminés : {totalModulesCompleted} / {totalModulesAvailable}</p>
                <Link to="/analytics?view=personal" className="mt-4 block">
                  <MotionButton variant="outline" className="w-full" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                    <BarChart2 className="h-4 w-4 mr-2" /> Voir mes statistiques
                  </MotionButton>
                </Link>
              </CardContent>
            </MotionCard>
          </motion.div>

          <motion.div variants={cardVariants}>
            <MotionCard className="rounded-android-tile backdrop-blur-lg bg-card/80 shadow-card-shadow" whileHover={{ scale: 1.02, boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)" }}>
              <CardHeader>
                <CardTitle className={gradientClasses}>Mes Réussites</CardTitle>
                <CardDescription>Vos succès jusqu'à présent.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-primary">{completedCoursesCount}</p>
                <p className="text-sm text-muted-foreground">cours terminés sur {enrolledCourses.length} inscrits.</p>
                <Link to="/courses" className="mt-4 block">
                  <MotionButton variant="outline" className="w-full" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                    <CheckCircle className="h-4 w-4 mr-2" /> Voir tous les cours terminés
                  </MotionButton>
                </Link>
              </CardContent>
            </MotionCard>
          </motion.div>

          <motion.div variants={cardVariants} className="lg:col-span-full">
            <MotionCard className="rounded-android-tile backdrop-blur-lg bg-card/80 shadow-card-shadow" whileHover={{ scale: 1.02, boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)" }}>
              <CardHeader>
                <CardTitle className={gradientClasses}>Besoin d'aide ?</CardTitle>
                <CardDescription>Discutez avec votre tuteur AiA.</CardDescription>
              </CardHeader>
              <CardContent>
                <MotionButton onClick={() => openChat()} className="w-full" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                  <BotMessageSquare className="h-4 w-4 mr-2" /> Poser une question à AiA
                </MotionButton>
              </CardContent>
            </MotionCard>
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
            <MotionCard className="rounded-android-tile backdrop-blur-lg bg-card/80 shadow-card-shadow" whileHover={{ scale: 1.02, boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)" }}>
              <CardHeader>
                <CardTitle className={gradientClasses}>Mes Cours & Créations</CardTitle>
                <CardDescription>Gérez vos contenus d'apprentissage.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-primary">{createdCourses.length}</p>
                <p className="text-sm text-muted-foreground">{publishedCoursesCount} sont publiés.</p>
                <Link to="/courses" className="mt-4 block">
                  <MotionButton className="w-full" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                    <BookOpen className="h-4 w-4 mr-2" /> Gérer mes cours
                  </MotionButton>
                </Link>
                <Link to="/create-course" className="mt-2 block">
                  <MotionButton variant="outline" className="w-full" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                    <PenTool className="h-4 w-4 mr-2" /> Créer un nouveau cours
                  </MotionButton>
                </Link>
              </CardContent>
            </MotionCard>
          </motion.div>

          <motion.div variants={cardVariants}>
            <MotionCard className="rounded-android-tile backdrop-blur-lg bg-card/80 shadow-card-shadow" whileHover={{ scale: 1.02, boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)" }}>
              <CardHeader>
                <CardTitle className={gradientClasses}>Impact sur les Élèves</CardTitle>
                <CardDescription>Nombre total d'élèves inscrits à vos cours.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-primary">{studentsInMyCourses}</p>
                <p className="text-sm text-muted-foreground">élèves uniques.</p>
                <Link to="/analytics?view=overview" className="mt-4 block">
                  <MotionButton variant="outline" className="w-full" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                    <BarChart2 className="h-4 w-4 mr-2" /> Voir les analytiques
                  </MotionButton>
                </Link>
              </CardContent>
            </MotionCard>
          </motion.div>

          <motion.div variants={cardVariants}>
            <MotionCard className="rounded-android-tile backdrop-blur-lg bg-card/80 shadow-card-shadow" whileHover={{ scale: 1.02, boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)" }}>
              <CardHeader>
                <CardTitle className={gradientClasses}>Gestion des Classes</CardTitle>
                <CardDescription>Organisez vos élèves en classes.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-primary">{classes.filter(cls => cls.creator_ids.includes(currentUserProfile.id)).length}</p>
                <p className="text-sm text-muted-foreground">classes gérées.</p>
                <Link to="/classes" className="mt-4 block">
                  <MotionButton variant="outline" className="w-full" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                    <Users className="h-4 w-4 mr-2" /> Gérer les classes
                  </MotionButton>
                </Link>
              </CardContent>
            </MotionCard>
          </motion.div>

          <motion.div variants={cardVariants} className="lg:col-span-full">
            <MotionCard className="rounded-android-tile backdrop-blur-lg bg-card/80 shadow-card-shadow" whileHover={{ scale: 1.02, boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)" }}>
              <CardHeader>
                <CardTitle className={gradientClasses}>Communication Rapide</CardTitle>
                <CardDescription>Envoyez des messages à vos élèves ou collègues.</CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/messages" className="block">
                  <MotionButton className="w-full" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                    <MessageSquare className="h-4 w-4 mr-2" /> Accéder à la messagerie
                  </MotionButton>
                </Link>
              </CardContent>
            </MotionCard>
          </motion.div>
        </motion.div>
      );
    } else if (currentRole === 'tutor') {
      const studentsInMyEstablishment = allProfiles.filter(p => p.role === 'student' && p.establishment_id === currentUserProfile.establishment_id);
      const studentsAtRisk = studentsInMyEstablishment.filter(s => studentCourseProgresses.some(scp => scp.user_id === s.id && scp.modules_progress.some(mp => mp.sections_progress.some(sp => sp.quiz_result && !sp.quiz_result.passed)))).length;
      const totalSupervisedStudents = studentsInMyEstablishment.length;

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
            <MotionCard className="rounded-android-tile backdrop-blur-lg bg-card/80 shadow-card-shadow" whileHover={{ scale: 1.02, boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)" }}>
              <CardHeader>
                <CardTitle className={gradientClasses}>Mes Élèves Supervisés</CardTitle>
                <CardDescription>Nombre d'élèves sous votre tutelle.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-primary">{totalSupervisedStudents}</p>
                <p className="text-sm text-muted-foreground">élèves au total dans votre établissement.</p>
                <Link to="/pedagogical-management" className="mt-4 block">
                  <MotionButton className="w-full" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                    <GraduationCap className="h-4 w-4 mr-2" /> Gérer les élèves
                  </MotionButton>
                </Link>
              </CardContent>
            </MotionCard>
          </motion.div>

          <motion.div variants={cardVariants}>
            <MotionCard className="rounded-android-tile backdrop-blur-lg bg-card/80 shadow-card-shadow" whileHover={{ scale: 1.02, boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)" }}>
              <CardHeader>
                <CardTitle className={gradientClasses}>Élèves en Difficulté</CardTitle>
                <CardDescription>Élèves nécessitant une attention particulière.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-destructive">{studentsAtRisk}</p>
                <p className="text-sm text-muted-foreground">élèves avec des difficultés récentes.</p>
                <Link to="/analytics?view=alerts" className="mt-4 block">
                  <MotionButton variant="outline" className="w-full" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                    <AlertTriangle className="h-4 w-4 mr-2" /> Voir les alertes
                  </MotionButton>
                </Link>
              </CardContent>
            </MotionCard>
          </motion.div>

          <motion.div variants={cardVariants}>
            <MotionCard className="rounded-android-tile backdrop-blur-lg bg-card/80 shadow-card-shadow" whileHover={{ scale: 1.02, boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)" }}>
              <CardHeader>
                <CardTitle className={gradientClasses}>Performance des Classes</CardTitle>
                <CardDescription>Vue d'ensemble de la progression par classe.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-primary">{classes.filter(cls => cls.establishment_id === currentUserProfile.establishment_id).length}</p>
                <p className="text-sm text-muted-foreground">classes supervisées.</p>
                <Link to="/analytics?view=class-performance" className="mt-4 block">
                  <MotionButton variant="outline" className="w-full" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                    <BarChart2 className="h-4 w-4 mr-2" /> Voir les performances
                  </MotionButton>
                </Link>
              </CardContent>
            </MotionCard>
          </motion.div>

          <motion.div variants={cardVariants} className="lg:col-span-full">
            <MotionCard className="rounded-android-tile backdrop-blur-lg bg-card/80 shadow-card-shadow" whileHover={{ scale: 1.02, boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)" }}>
              <CardHeader>
                <CardTitle className={gradientClasses}>Contacter un Élève</CardTitle>
                <CardDescription>Envoyez un message rapide à un élève.</CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/messages" className="block">
                  <MotionButton className="w-full" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                    <MessageSquare className="h-4 w-4 mr-2" /> Accéder à la messagerie
                  </MotionButton>
                </Link>
              </CardContent>
            </MotionCard>
          </motion.div>
        </motion.div>
      );
    } else if (currentRole === 'administrator') {
      const totalDirectors = allProfiles.filter(p => p.role === 'director').length;
      const totalDeputyDirectors = allProfiles.filter(p => p.role === 'deputy_director').length;
      const totalEstablishments = establishments.length;
      const totalProfessors = allProfiles.filter(p => p.role === 'professeur').length;
      const totalStudents = allProfiles.filter(p => p.role === 'student').length;
      const totalCourses = courses.length;

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
            <MotionCard className="rounded-android-tile backdrop-blur-lg bg-card/80 shadow-card-shadow" whileHover={{ scale: 1.02, boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)" }}>
              <CardHeader>
                <CardTitle className={gradientClasses}>Statistiques Globales</CardTitle>
                <CardDescription>Vue d'ensemble de la plateforme.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-primary">{totalStudents} Élèves</p>
                <p className="text-2xl font-bold text-primary">{totalProfessors} Professeurs</p>
                <p className="text-sm text-muted-foreground mt-2">{totalEstablishments} Établissements, {totalCourses} Cours</p>
                <Link to="/analytics?view=overview" className="mt-4 block">
                  <MotionButton variant="outline" className="w-full" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                    <BarChart2 className="h-4 w-4 mr-2" /> Analytiques globales
                  </MotionButton>
                </Link>
              </CardContent>
            </MotionCard>
          </motion.div>

          <motion.div variants={cardVariants}>
            <MotionCard className="rounded-android-tile backdrop-blur-lg bg-card/80 shadow-card-shadow" whileHover={{ scale: 1.02, boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)" }}>
              <CardHeader>
                <CardTitle className={gradientClasses}>Gestion des Utilisateurs</CardTitle>
                <CardDescription>Administrateurs, Directeurs, Professeurs, Élèves.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-primary">{allProfiles.length} Utilisateurs</p>
                <p className="text-sm text-muted-foreground">Dont {totalDirectors} Directeurs, {totalDeputyDirectors} Directeurs Adjoints.</p>
                <Link to="/admin-users" className="mt-4 block">
                  <MotionButton className="w-full" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                    <UserCog className="h-4 w-4 mr-2" /> Gérer les utilisateurs
                  </MotionButton>
                </Link>
              </CardContent>
            </MotionCard>
          </motion.div>

          <motion.div variants={cardVariants}>
            <MotionCard className="rounded-android-tile backdrop-blur-lg bg-card/80 shadow-card-shadow" whileHover={{ scale: 1.02, boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)" }}>
              <CardHeader>
                <CardTitle className={gradientClasses}>Gestion des Établissements</CardTitle>
                <CardDescription>Créez et gérez les établissements scolaires.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-primary">{totalEstablishments}</p>
                <p className="text-sm text-muted-foreground">établissements gérés.</p>
                <Link to="/establishments" className="mt-4 block">
                  <MotionButton className="w-full" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                    <Building2 className="h-4 w-4 mr-2" /> Gérer les établissements
                  </MotionButton>
                </Link>
              </CardContent>
            </MotionCard>
          </motion.div>

          <motion.div variants={cardVariants} className="lg:col-span-full">
            <MotionCard className="rounded-android-tile backdrop-blur-lg bg-card/80 shadow-card-shadow" whileHover={{ scale: 1.02, boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)" }}>
              <CardHeader>
                <CardTitle className={gradientClasses}>Configuration Système</CardTitle>
                <CardDescription>Accès aux outils d'administration avancés.</CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/admin-menu-management" className="block">
                  <MotionButton className="w-full" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                    <LayoutList className="h-4 w-4 mr-2" /> Gérer les menus
                  </MotionButton>
                </Link>
                <Link to="/data-model" className="mt-2 block">
                  <MotionButton variant="outline" className="w-full" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                    <Code className="h-4 w-4 mr-2" /> Voir le modèle de données
                  </MotionButton>
                </Link>
              </CardContent>
            </MotionCard>
          </motion.div>
        </motion.div>
      );
    } else if (currentRole === 'director' || currentRole === 'deputy_director') {
      const studentsInMyScope = allProfiles.filter(p => p.role === 'student' && p.establishment_id === currentUserProfile.establishment_id).length;
      const professeursInMyScope = allProfiles.filter(p => p.role === 'professeur' && p.establishment_id === currentUserProfile.establishment_id).length;
      const classesInMyScope = classes.filter(cls => cls.establishment_id === currentUserProfile.establishment_id).length;
      const curriculaInMyScope = curricula.filter(cur => cur.establishment_id === currentUserProfile.establishment_id).length;

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
            <MotionCard className="rounded-android-tile backdrop-blur-lg bg-card/80 shadow-card-shadow" whileHover={{ scale: 1.02, boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)" }}>
              <CardHeader>
                <CardTitle className={gradientClasses}>Vue d'Ensemble de l'Établissement</CardTitle>
                <CardDescription>Statistiques clés de votre établissement.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-primary">{currentUserProfile.establishment_id ? getEstablishmentName(currentUserProfile.establishment_id, establishments) : 'N/A'}</p>
                <p className="text-sm text-muted-foreground mt-2">{professeursInMyScope} Professeurs, {studentsInMyScope} Élèves</p>
                <p className="text-sm text-muted-foreground">{curriculaInMyScope} Cursus, {classesInMyScope} Classes</p>
                <Link to="/establishments" className="mt-4 block">
                  <MotionButton variant="outline" className="w-full" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                    <Building2 className="h-4 w-4 mr-2" /> Gérer l'établissement
                  </MotionButton>
                </Link>
              </CardContent>
            </MotionCard>
          </motion.div>

          <motion.div variants={cardVariants}>
            <MotionCard className="rounded-android-tile backdrop-blur-lg bg-card/80 shadow-card-shadow" whileHover={{ scale: 1.02, boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)" }}>
              <CardHeader>
                <CardTitle className={gradientClasses}>Gestion du Personnel</CardTitle>
                <CardDescription>Gérez les professeurs et tuteurs de votre établissement.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-primary">{professeursInMyScope} Professeurs</p>
                <p className="text-sm text-muted-foreground">et {allProfiles.filter(p => p.role === 'tutor' && p.establishment_id === currentUserProfile.establishment_id).length} Tuteurs.</p>
                <Link to="/admin-users" className="mt-4 block">
                  <MotionButton className="w-full" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                    <Users className="h-4 w-4 mr-2" /> Gérer le personnel
                  </MotionButton>
                </Link>
              </CardContent>
            </MotionCard>
          </motion.div>

          <motion.div variants={cardVariants}>
            <MotionCard className="rounded-android-tile backdrop-blur-lg bg-card/80 shadow-card-shadow" whileHover={{ scale: 1.02, boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)" }}>
              <CardHeader>
                <CardTitle className={gradientClasses}>Structure Pédagogique</CardTitle>
                <CardDescription>Gérez les cursus et classes de votre établissement.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-primary">{curriculaInMyScope} Cursus</p>
                <p className="text-sm text-muted-foreground">et {classesInMyScope} Classes.</p>
                <Link to="/curricula" className="mt-4 block">
                  <MotionButton className="w-full" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                    <LayoutList className="h-4 w-4 mr-2" /> Gérer les cursus & classes
                  </MotionButton>
                </Link>
              </CardContent>
            </MotionCard>
          </motion.div>

          <motion.div variants={cardVariants} className="lg:col-span-full">
            <MotionCard className="rounded-android-tile backdrop-blur-lg bg-card/80 shadow-card-shadow" whileHover={{ scale: 1.02, boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)" }}>
              <CardHeader>
                <CardTitle className={gradientClasses}>Analytiques</CardTitle>
                <CardDescription>Accédez aux statistiques détaillées de votre établissement.</CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/analytics?view=overview" className="block">
                  <MotionButton className="w-full" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                    <BarChart2 className="h-4 w-4 mr-2" /> Voir les analytiques
                  </MotionButton>
                </Link>
              </CardContent>
            </MotionCard>
          </motion.div>
        </motion.div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background blobs for immersive design */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/10 rounded-full filter blur-3xl opacity-50 animate-blob"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-secondary/20 rounded-full filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
      <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-7xl mx-auto"
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