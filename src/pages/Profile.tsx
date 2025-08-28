import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  MotionCard, // Import MotionCard
} from "@/components/ui/card";
import { useRole } from "@/contexts/RoleContext";
import { loadCourses, loadEstablishments, getEstablishmentName } from "@/lib/courseData"; // Import getEstablishmentName
import { getProfileById, updateProfile, getStudentCourseProgress, upsertStudentCourseProgress, getAllStudentCourseProgress, getUserFullName } from "@/lib/studentData";
import type { Profile } from "@/lib/dataModels"; // Import Profile as type
import { Course, StudentCourseProgress, Establishment } from "@/lib/dataModels"; // Re-added Establishment type
import { User, BookOpen, GraduationCap, PenTool, Users, Mail, CheckCircle, Edit, Clock, BriefcaseBusiness, UserCog, Building2, CalendarDays } from "lucide-react"; // Added Building2 and CalendarDays icon
import { Button, MotionButton } from "@/components/ui/button"; // Import MotionButton
import { Progress } from "@/components/ui/progress";
import { Link, useNavigate, useOutletContext } from "react-router-dom"; // Import Link, useNavigate, and useOutletContext
import EditProfileDialog from "@/components/EditProfileDialog";
import { showSuccess, showError } from '@/utils/toast';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ProfilePageOutletContext {
  setIsAdminModalOpen: (isOpen: boolean) => void;
}

const Profile = () => {
  const { currentUserProfile, currentRole, setCurrentUserProfile, isLoadingUser } = useRole();
  const { setIsAdminModalOpen } = useOutletContext<ProfilePageOutletContext>(); // Get setIsAdminModalOpen from context
  const [courses, setCourses] = useState<Course[]>([]);
  const [studentCourseProgresses, setStudentCourseProgresses] = useState<StudentCourseProgress[]>([]);
  const [establishments, setEstablishments] = useState<Establishment[]>([]); // Re-added establishments state
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const navigate = useNavigate(); // Initialize useNavigate

  // console.log("[Profile Page] Rendering. isLoadingUser:", isLoadingUser, "currentUserProfile:", currentUserProfile ? currentUserProfile.id : "null", "currentRole:", currentRole); // Removed log

  useEffect(() => {
    const fetchData = async () => {
      try {
        // console.log("[Profile Page] useEffect: Fetching courses and student progress..."); // Removed log
        const loadedCourses = await loadCourses();
        setCourses(loadedCourses);
        // console.log("[Profile Page] Loaded courses:", loadedCourses); // Removed log
        const loadedProgresses = await getAllStudentCourseProgress();
        setStudentCourseProgresses(loadedProgresses);
        // console.log("[Profile Page] Loaded student progresses:", loadedProgresses); // Removed log
        setEstablishments(await loadEstablishments()); // Re-added loadEstablishments
      } catch (error: any) {
        console.error("Error fetching data for Profile page:", error);
        showError(`Erreur lors du chargement des données du profil: ${error.message}`);
      }
    };
    fetchData();
  }, [currentUserProfile]); // Re-fetch if user profile changes

  const handleUpdateProfile = async (updatedProfile: Profile) => {
    try {
      const savedProfile = await updateProfile(updatedProfile);
      if (savedProfile) {
        setCurrentUserProfile(savedProfile); // Update the context with the new profile
        showSuccess("Profil mis à jour avec succès !");
      } else {
        showError("Échec de la mise à jour du profil.");
      }
    } catch (error: any) {
      console.error("Error updating profile:", error);
      showError(`Erreur lors de la mise à jour du profil: ${error.message}`);
    }
  };

  const handleSendMessageToUser = (userId: string) => {
    navigate(`/messages?contactId=${userId}`);
  };

  // Removed local getEstablishmentName declaration. Now imported.

  if (isLoadingUser) {
    // console.log("[Profile Page] Displaying loading state."); // Removed log
    return (
      <div className="text-center py-20">
        <h1 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
          Chargement du profil...
        </h1>
        <p className="text-lg text-muted-foreground">
          Veuillez patienter.
        </p>
      </div>
    );
  }

  if (!currentUserProfile) {
    // console.log("[Profile Page] Displaying 'Profile not found' state."); // Removed log
    return (
      <div className="text-center py-20">
        <h1 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
          Profil non trouvé
        </h1>
        <p className="text-lg text-muted-foreground">
          Veuillez vous connecter pour voir votre profil.
        </p>
      </div>
    );
  }

  const renderProfileContent = () => {
    // console.log("[Profile Page] renderProfileContent: currentRole =", currentRole); // Removed log
    if (currentRole === 'student') {
      // console.log("[Profile Page] renderProfileContent: Rendering student profile."); // Removed log
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

      const recentActivities = [
        { id: 1, type: "completed", description: `Terminé le module "Qu'est-ce que l'IA ?" du cours "Introduction à l'IA"`, date: "2 jours ago" },
        { id: 2, type: "started", description: `Commencé le cours "React pour débutants"`, date: "1 semaine ago" },
        { id: 3, type: "note", description: `Ajouté une note à la section "Props et État"`, date: "3 jours ago" },
      ];

      return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <MotionCard className="lg:col-span-full rounded-android-tile" whileHover={{ scale: 1.01, boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)" }}> {/* Changed to lg:col-span-full */}
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0 sm:space-x-4"> {/* Adjusted for responsiveness */}
              <div className="flex items-center space-x-4">
                <User className="h-12 w-12 text-primary" />
                <div>
                  <CardTitle className="text-3xl">{currentUserProfile.first_name} {currentUserProfile.last_name}</CardTitle>
                  <CardDescription className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" /> {currentUserProfile.email}
                  </CardDescription>
                  <CardDescription className="flex items-center gap-2 text-muted-foreground">
                    @{currentUserProfile.username}
                  </CardDescription>
                  {currentUserProfile.establishment_id && (
                    <CardDescription className="flex items-center gap-2 text-muted-foreground">
                      <Building2 className="h-4 w-4" /> {getEstablishmentName(currentUserProfile.establishment_id, establishments)}
                    </CardDescription>
                  )}
                  {currentUserProfile.enrollment_start_date && currentUserProfile.enrollment_end_date && (
                    <CardDescription className="flex items-center gap-2 text-muted-foreground">
                      <CalendarDays className="h-4 w-4" /> Du {format(parseISO(currentUserProfile.enrollment_start_date), 'dd/MM/yyyy', { locale: fr })} au {format(parseISO(currentUserProfile.enrollment_end_date), 'dd/MM/yyyy', { locale: fr })}
                    </CardDescription>
                  )}
                </div>
              </div>
              <MotionButton variant="outline" onClick={() => setIsEditProfileModalOpen(true)} className="w-full sm:w-auto" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}> {/* Made button full width on small screens */}
                <Edit className="h-4 w-4 mr-2" /> Modifier le profil
              </MotionButton>
            </CardHeader>
            <CardContent>
              <p className="text-lg text-muted-foreground">Rôle actuel: Élève</p>
            </CardContent>
          </MotionCard>

          <MotionCard className="rounded-android-tile" whileHover={{ scale: 1.01, boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)" }}> {/* Apply rounded-android-tile */}
            <CardHeader>
              <CardTitle>Progression Globale</CardTitle>
              <CardDescription>Votre avancement général dans les cours.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">{overallProgress}%</p>
              <Progress value={overallProgress} className="w-full mt-2" />
              <p className="text-sm text-muted-foreground mt-2">Modules terminés : {totalModulesCompleted} / {totalModulesAvailable}</p>
            </CardContent>
          </MotionCard>
          <MotionCard className="rounded-android-tile" whileHover={{ scale: 1.01, boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)" }}> {/* Apply rounded-android-tile */}
            <CardHeader>
              <CardTitle>Cours Terminés</CardTitle>
              <CardDescription>Votre succès jusqu'à présent.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">{completedCoursesCount}</p>
              <p className="text-sm text-muted-foreground">cours terminés sur {enrolledCourses.length} inscrits.</p>
              <ul className="list-disc pl-5 text-sm text-muted-foreground mt-4">
                {enrolledCourses.filter(c => {
                  const progress = studentProgress.find(ec => ec.course_id === c.id);
                  return progress && progress.modules_progress.every(m => m.is_completed);
                }).slice(0, 3).map(course => (
                  <li key={course.id}>{course.title} <CheckCircle className="inline h-3 w-3 text-green-500 ml-1" /></li>
                ))}
                {completedCoursesCount === 0 && <li>Aucun cours terminé.</li>}
              </ul>
            </CardContent>
          </MotionCard>
          <MotionCard className="rounded-android-tile" whileHover={{ scale: 1.01, boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)" }}> {/* Apply rounded-android-tile */}
            <CardHeader>
              <CardTitle>Activité Récente</CardTitle>
              <CardDescription>Vos dernières actions sur la plateforme.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {recentActivities.map(activity => (
                  <li key={activity.id} className="flex items-center text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 mr-2 text-primary" />
                    <span>{activity.description}</span>
                    <span className="ml-auto text-xs italic">{activity.date}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </MotionCard>
        </div>
      );
    } else if (currentRole === 'professeur') {
      // console.log("[Profile Page] renderProfileContent: Rendering professeur profile."); // Removed log
      const createdCourses = courses; // Assuming all courses are created by this creator for demo
      const publishedCoursesCount = createdCourses.filter(c => c.modules.some(m => m.sections.some(s => s.content))).length; // Heuristic: has at least one section
      const totalStudents = studentCourseProgresses.length; // Total students with any progress

      const topCourses = createdCourses.sort((a, b) => (b.modules.length > 0 ? b.modules.reduce((acc, m) => acc + m.sections.length, 0) : 0) - (a.modules.length > 0 ? a.modules.reduce((acc, m) => acc + m.sections.length, 0) : 0)).slice(0, 3); // Sort by number of sections
      const recentActivities = [
        { id: 1, type: "created", description: `Créé le cours "Développement Web Fullstack"`, date: "5 jours ago" },
        { id: 2, type: "updated", description: `Mis à jour le module 2 de "Algorithmes Avancés"`, date: "2 jours ago" },
        { id: 3, type: "published", description: `Publié le cours "Programmation en C#"`, date: "1 semaine ago" },
      ];

      return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <MotionCard className="lg:col-span-full rounded-android-tile" whileHover={{ scale: 1.01, boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)" }}> {/* Changed to lg:col-span-full */}
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0 sm:space-x-4"> {/* Adjusted for responsiveness */}
              <div className="flex items-center space-x-4">
                <PenTool className="h-12 w-12 text-primary" />
                <div>
                  <CardTitle className="text-3xl">{currentUserProfile.first_name} {currentUserProfile.last_name}</CardTitle>
                  <CardDescription className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" /> {currentUserProfile.email}
                  </CardDescription>
                  <CardDescription className="flex items-center gap-2 text-muted-foreground">
                    @{currentUserProfile.username}
                  </CardDescription>
                  {currentUserProfile.establishment_id && (
                    <CardDescription className="flex items-center gap-2 text-muted-foreground">
                      <Building2 className="h-4 w-4" /> {getEstablishmentName(currentUserProfile.establishment_id, establishments)}
                    </CardDescription>
                  )}
                </div>
              </div>
              <MotionButton variant="outline" onClick={() => setIsEditProfileModalOpen(true)} className="w-full sm:w-auto" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}> {/* Made button full width on small screens */}
                <Edit className="h-4 w-4 mr-2" /> Modifier le profil
              </MotionButton>
            </CardHeader>
            <CardContent>
              <p className="text-lg text-muted-foreground">Rôle actuel: Professeur</p>
            </CardContent>
          </MotionCard>

          <MotionCard className="rounded-android-tile" whileHover={{ scale: 1.01, boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)" }}> {/* Apply rounded-android-tile */}
            <CardHeader>
              <CardTitle>Cours Créés</CardTitle>
              <CardDescription>Vos contributions à la plateforme.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">{createdCourses.length}</p>
              <p className="text-sm text-muted-foreground">Dont {publishedCoursesCount} publiés.</p>
            </CardContent>
          </MotionCard>
          <MotionCard className="rounded-android-tile" whileHover={{ scale: 1.01, boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)" }}> {/* Apply rounded-android-tile */}
            <CardHeader>
              <CardTitle>Impact sur les Élèves</CardTitle>
              <CardDescription>Nombre total d'élèves inscrits à vos cours.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">{totalStudents}</p>
              <p className="text-sm text-muted-foreground">élèves uniques.</p>
            </CardContent>
          </MotionCard>
          <MotionCard className="rounded-android-tile" whileHover={{ scale: 1.01, boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)" }}> {/* Apply rounded-android-tile */}
            <CardHeader>
              <CardTitle>Cours Populaires</CardTitle>
              <CardDescription>Vos cours les plus consultés.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 text-sm text-muted-foreground">
                {topCourses.map(course => (
                  <li key={course.id}>
                    <Link to={`/courses/${course.id}`} className="hover:underline text-primary">
                      {course.title}
                    </Link>
                  </li>
                ))}
                {createdCourses.length === 0 && <li>Aucun cours créé.</li>}
              </ul>
            </CardContent>
          </MotionCard>
          <MotionCard className="lg:col-span-full rounded-android-tile" whileHover={{ scale: 1.01, boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)" }}> {/* Apply rounded-android-tile */}
            <CardHeader>
              <CardTitle>Activité Récente</CardTitle>
              <CardDescription>Vos dernières actions en tant que créateur.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {recentActivities.map(activity => (
                  <li key={activity.id} className="flex items-center text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 mr-2 text-primary" />
                    <span>{activity.description}</span>
                    <span className="ml-auto text-xs italic">{activity.date}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </MotionCard>
        </div>
      );
    } else if (currentRole === 'tutor') {
      // console.log("[Profile Page] renderProfileContent: Rendering tutor profile."); // Removed log
      const supervisedStudents = studentCourseProgresses.slice(0, 2); // Taking first two for demo
      const studentsAtRisk = supervisedStudents.filter(s => s.modules_progress.some(mp => mp.sections_progress.some(sp => sp.quiz_result && !sp.quiz_result.passed))).length;

      const recentAlerts = [
        { id: 1, studentId: supervisedStudents[0]?.user_id, description: `a des difficultés en algèbre.`, date: "1 jour ago" },
        { id: 2, studentId: supervisedStudents[1]?.user_id, description: `n'a pas accédé au cours "Algorithmes Avancés" depuis 5 jours.`, date: "3 jours ago" },
      ].filter(alert => alert.studentId && studentCourseProgresses.some(s => s.user_id === alert.studentId)); // Filter out alerts for non-existent users or students not in filtered list

      return (
        <div className="grid gap-6 md:grid-cols-2 lg:col-span-3">
          <MotionCard className="lg:col-span-full rounded-android-tile" whileHover={{ scale: 1.01, boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)" }}> {/* Changed to lg:col-span-full */}
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0 sm:space-x-4"> {/* Adjusted for responsiveness */}
              <div className="flex items-center space-x-4">
                <Users className="h-12 w-12 text-primary" />
                <div>
                  <CardTitle className="text-3xl">{currentUserProfile.first_name} {currentUserProfile.last_name}</CardTitle>
                  <CardDescription className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" /> {currentUserProfile.email}
                  </CardDescription>
                  <CardDescription className="flex items-center gap-2 text-muted-foreground">
                    @{currentUserProfile.username}
                  </CardDescription>
                  {currentUserProfile.establishment_id && (
                    <CardDescription className="flex items-center gap-2 text-muted-foreground">
                      <Building2 className="h-4 w-4" /> {getEstablishmentName(currentUserProfile.establishment_id, establishments)}
                    </CardDescription>
                  )}
                </div>
              </div>
              <MotionButton variant="outline" onClick={() => setIsEditProfileModalOpen(true)} className="w-full sm:w-auto" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}> {/* Made button full width on small screens */}
                <Edit className="h-4 w-4 mr-2" /> Modifier le profil
              </MotionButton>
            </CardHeader>
            <CardContent>
              <p className="text-lg text-muted-foreground">Rôle actuel: Tuteur</p>
            </CardContent>
          </MotionCard>

          <MotionCard className="rounded-android-tile" whileHover={{ scale: 1.01, boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)" }}> {/* Apply rounded-android-tile */}
            <CardHeader>
              <CardTitle>Élèves Supervisés</CardTitle>
              <CardDescription>Nombre d'élèves sous votre tutelle.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">{supervisedStudents.length}</p>
              <p className="text-sm text-muted-foreground">Élèves en difficulté : {studentsAtRisk}</p>
            </CardContent>
          </MotionCard>
          <MotionCard className="rounded-android-tile" whileHover={{ scale: 1.01, boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)" }}> {/* Apply rounded-android-tile */}
            <CardHeader>
              <CardTitle>Progression des Élèves</CardTitle>
              <CardDescription>Vue d'overview de l'avancement de vos élèves.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 text-sm text-muted-foreground">
                {supervisedStudents.map(student => (
                  <li key={student.user_id}>
                    {/* Resolve full name asynchronously */}
                    <ResolveUserName userId={student.user_id} />: {Math.floor(Math.random() * 100)}% de progression moyenne
                    <MotionButton variant="ghost" size="sm" className="ml-2" onClick={() => handleSendMessageToUser(student.user_id)} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <Mail className="h-4 w-4" />
                    </MotionButton>
                  </li>
                ))}
                {supervisedStudents.length === 0 && <li>Aucun élève supervisé.</li>}
              </ul>
            </CardContent>
          </MotionCard>
          <MotionCard className="rounded-android-tile" whileHover={{ scale: 1.01, boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)" }}> {/* Apply rounded-android-tile */}
            <CardHeader>
              <CardTitle>Alertes Récentes</CardTitle>
              <CardDescription>Informations importantes sur vos élèves.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {recentAlerts.map(alert => (
                  <li key={alert.id} className="flex items-center text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 mr-2 text-primary" />
                    <span><ResolveUserName userId={alert.studentId} /> {alert.description}</span>
                    <span className="ml-auto text-xs italic">{alert.date}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </MotionCard>
        </div>
      );
    } else if (currentRole === 'administrator' || currentRole === 'director' || currentRole === 'deputy_director') {
      // console.log("[Profile Page] renderProfileContent: Rendering administrator/director/deputy_director profile."); // Removed log
      // For admin/director roles, we can show basic profile info and maybe some high-level stats
      return (
        <div className="grid gap-6 md:grid-cols-2 lg:col-span-3">
          <MotionCard className="lg:col-span-full rounded-android-tile" whileHover={{ scale: 1.01, boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)" }}> {/* Changed to lg:col-span-full */}
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0 sm:space-x-4"> {/* Adjusted for responsiveness */}
              <div className="flex items-center space-x-4">
                <BriefcaseBusiness className="h-12 w-12 text-primary" />
                <div>
                  <CardTitle className="text-3xl">{currentUserProfile.first_name} {currentUserProfile.last_name}</CardTitle>
                  <CardDescription className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" /> {currentUserProfile.email}
                  </CardDescription>
                  <CardDescription className="flex items-center gap-2 text-muted-foreground">
                    @{currentUserProfile.username}
                  </CardDescription>
                  {currentUserProfile.establishment_id && (
                    <CardDescription className="flex items-center gap-2 text-muted-foreground">
                      <Building2 className="h-4 w-4" /> {getEstablishmentName(currentUserProfile.establishment_id, establishments)}
                    </CardDescription>
                  )}
                </div>
              </div>
              <MotionButton variant="outline" onClick={() => setIsEditProfileModalOpen(true)} className="w-full sm:w-auto" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}> {/* Made button full width on small screens */}
                <Edit className="h-4 w-4 mr-2" /> Modifier le profil
              </MotionButton>
            </CardHeader>
            <CardContent>
              <p className="text-lg text-muted-foreground">
                Rôle actuel: {currentRole === 'administrator' ? 'Administrateur' : currentRole === 'director' ? 'Directeur' : 'Directeur Adjoint'}
              </p>
            </CardContent>
          </MotionCard>
          {/* Add more admin/director specific cards here if needed, e.g., quick stats or links */}
          <MotionCard className="rounded-android-tile" whileHover={{ scale: 1.01, boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)" }}> {/* Apply rounded-android-tile */}
            <CardHeader>
              <CardTitle>Accès Rapide</CardTitle>
              <CardDescription>Liens utiles pour votre rôle.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {currentRole === 'administrator' && (
                  <>
                    <li><Link to="/admin-users" className="text-primary hover:underline">Gérer les utilisateurs</Link></li>
                    <li><Link to="/establishments" className="text-primary hover:underline">Gérer les établissements</Link></li>
                    <li><Link to="/analytics?view=overview" className="text-primary hover:underline">Voir les analytiques globales</Link></li>
                  </>
                )}
                {(currentRole === 'director' || currentRole === 'deputy_director') && (
                  <>
                    <li><Link to="/admin-users" className="text-primary hover:underline">Gérer les professeurs</Link></li>
                    <li><Link to="/students" className="text-primary hover:underline">Gérer les élèves</Link></li>
                    <li><Link to="/analytics?view=overview" className="text-primary hover:underline">Voir les analytiques</Link></li>
                  </>
                )}
              </ul>
            </CardContent>
          </MotionCard>
          {currentRole === 'administrator' && (
            <MotionCard className="rounded-android-tile" whileHover={{ scale: 1.01, boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)" }}> {/* Apply rounded-android-tile */}
              <CardHeader>
                <CardTitle>Outils Administrateur</CardTitle>
                <CardDescription>Accès aux fonctions d'administration avancées.</CardDescription>
              </CardHeader>
              <CardContent>
                <MotionButton onClick={() => setIsAdminModalOpen(true)} className="w-full" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                  <UserCog className="h-4 w-4 mr-2" /> Ouvrir le panneau Admin
                </MotionButton>
              </CardContent>
            </MotionCard>
          )}
        </div>
      );
    }
    // console.log("[Profile Page] renderProfileContent: No matching role found for rendering content. Current role:", currentRole); // Removed log
    return null; // Fallback if no role matches
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"> {/* Added responsive padding and max-width */}
      <h1 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
        Mon Profil ({currentUserProfile?.first_name} {currentUserProfile?.last_name})
      </h1>
      {renderProfileContent()}

      {currentUserProfile && (
        <EditProfileDialog
          isOpen={isEditProfileModalOpen}
          onClose={() => setIsEditProfileModalOpen(false)}
          currentUserProfile={currentUserProfile}
          onSave={handleUpdateProfile}
        />
      )}
    </div>
  );
};

// Helper component to resolve user name asynchronously
const ResolveUserName = ({ userId }: { userId: string }) => {
  const [userName, setUserName] = useState('Chargement...');
  useEffect(() => {
    const fetchName = async () => {
      const name = await getUserFullName(userId);
      setUserName(name);
    };
    fetchName();
  }, [userId]);
  return <>{userName}</>;
};

export default Profile;