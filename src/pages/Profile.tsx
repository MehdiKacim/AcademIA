import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRole } from "@/contexts/RoleContext";
import { loadCourses } from "@/lib/courseData"; // Still load courses from Supabase
import { getProfileById, updateProfile, getStudentCourseProgress, upsertStudentCourseProgress, getAllStudentCourseProgress, getUserFullName } from "@/lib/studentData";
import { Profile, Course, StudentCourseProgress } from "@/lib/dataModels"; // Import Profile, Course, StudentCourseProgress types
import { User, BookOpen, GraduationCap, PenTool, Users, Mail, CheckCircle, Edit, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Link, useNavigate } from "react-router-dom"; // Import Link and useNavigate
import EditProfileDialog from "@/components/EditProfileDialog";
import { showSuccess, showError } from '@/utils/toast';

const Profile = () => {
  const { currentUserProfile, currentRole, setCurrentUserProfile, isLoadingUser } = useRole();
  const [courses, setCourses] = useState<Course[]>([]);
  const [studentCourseProgresses, setStudentCourseProgresses] = useState<StudentCourseProgress[]>([]);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const navigate = useNavigate(); // Initialize useNavigate

  useEffect(() => {
    const fetchData = async () => {
      const loadedCourses = await loadCourses();
      setCourses(loadedCourses);
      const loadedProgresses = await getAllStudentCourseProgress();
      setStudentCourseProgresses(loadedProgresses);
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

  if (isLoadingUser) {
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

      const recentActivities = [
        { id: 1, type: "completed", description: `Terminé le module "Qu'est-ce que l'IA ?" du cours "Introduction à l'IA"`, date: "2 jours ago" },
        { id: 2, type: "started", description: `Commencé le cours "React pour débutants"`, date: "1 semaine ago" },
        { id: 3, type: "note", description: `Ajouté une note à la section "Props et État"`, date: "3 jours ago" },
      ];

      return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="lg:col-span-3">
            <CardHeader className="flex flex-row items-center justify-between space-x-4">
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
                </div>
              </div>
              <Button variant="outline" onClick={() => setIsEditProfileModalOpen(true)}>
                <Edit className="h-4 w-4 mr-2" /> Modifier le profil
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-lg text-muted-foreground">Rôle actuel: Élève</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Progression Globale</CardTitle>
              <CardDescription>Votre avancement général dans les cours.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">{overallProgress}%</p>
              <Progress value={overallProgress} className="w-full mt-2" />
              <p className="text-sm text-muted-foreground mt-2">Modules terminés : {totalModulesCompleted} / {totalModulesAvailable}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Cours Terminés</CardTitle>
              <CardDescription>Votre succès jusqu'à présent.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">{completedCoursesCount}</p>
              <p className="text-sm text-muted-foreground">Cours terminés sur {enrolledCourses.length} inscrits.</p>
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
          </Card>
          <Card>
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
          </Card>
        </div>
      );
    } else if (currentRole === 'creator') {
      const createdCourses = courses; // Assuming all courses are created by this creator for demo
      const publishedCoursesCount = createdCourses.filter(c => c.modules.some(m => m.isCompleted)).length;
      const totalStudents = studentCourseProgresses.length; // Total students with any progress

      const topCourses = createdCourses.sort((a, b) => (b.modules.filter(m => m.isCompleted).length / b.modules.length) - (a.modules.filter(m => m.isCompleted).length / a.modules.length)).slice(0, 3);
      const recentActivities = [
        { id: 1, type: "created", description: `Créé le cours "Développement Web Fullstack"`, date: "5 jours ago" },
        { id: 2, type: "updated", description: `Mis à jour le module 2 de "Algorithmes Avancés"`, date: "2 jours ago" },
        { id: 3, type: "published", description: `Publié le cours "Programmation en C#"`, date: "1 semaine ago" },
      ];

      return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="lg:col-span-3">
            <CardHeader className="flex flex-row items-center justify-between space-x-4">
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
                </div>
              </div>
              <Button variant="outline" onClick={() => setIsEditProfileModalOpen(true)}>
                <Edit className="h-4 w-4 mr-2" /> Modifier le profil
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-lg text-muted-foreground">Rôle actuel: Créateur</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cours Créés</CardTitle>
              <CardDescription>Vos contributions à la plateforme.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">{createdCourses.length}</p>
              <p className="text-sm text-muted-foreground">Dont {publishedCoursesCount} publiés.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Impact sur les Élèves</CardTitle>
              <CardDescription>Nombre total d'élèves inscrits à vos cours.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">{totalStudents}</p>
              <p className="text-sm text-muted-foreground">Élèves uniques.</p>
            </CardContent>
          </Card>
          <Card>
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
          </Card>
          <Card className="lg:col-span-3">
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
          </Card>
        </div>
      );
    } else if (currentRole === 'tutor') {
      const supervisedStudents = studentCourseProgresses.slice(0, 2); // Taking first two for demo
      const studentsAtRisk = supervisedStudents.filter(s => s.modules_progress.some(mp => mp.sections_progress.some(sp => sp.quiz_result && !sp.quiz_result.passed))).length;

      const recentAlerts = [
        { id: 1, studentId: supervisedStudents[0]?.user_id, description: `a des difficultés en algèbre.`, date: "1 jour ago" },
        { id: 2, studentId: supervisedStudents[1]?.user_id, description: `a terminé le module 3 de Physique.`, date: "3 jours ago" },
      ].filter(alert => alert.studentId && studentCourseProgresses.some(s => s.user_id === alert.studentId)); // Filter out alerts for non-existent users or students not in filtered list

      return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="lg:col-span-3">
            <CardHeader className="flex flex-row items-center justify-between space-x-4">
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
                </div>
              </div>
              <Button variant="outline" onClick={() => setIsEditProfileModalOpen(true)}>
                <Edit className="h-4 w-4 mr-2" /> Modifier le profil
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-lg text-muted-foreground">Rôle actuel: Tuteur</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Élèves Supervisés</CardTitle>
              <CardDescription>Nombre d'élèves sous votre tutelle.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">{supervisedStudents.length}</p>
              <p className="text-sm text-muted-foreground">Élèves en difficulté : {studentsAtRisk}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Progression des Élèves</CardTitle>
              <CardDescription>Vue d'ensemble de l'avancement de vos élèves.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 text-sm text-muted-foreground">
                {supervisedStudents.map(student => (
                  <li key={student.user_id}>
                    {getUserFullName(student.user_id)}: {Math.floor(Math.random() * 100)}% de progression moyenne
                    <Button variant="ghost" size="sm" className="ml-2" onClick={() => handleSendMessageToUser(student.user_id)}>
                      <Mail className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
                {supervisedStudents.length === 0 && <li>Aucun élève supervisé.</li>}
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Alertes Récentes</CardTitle>
              <CardDescription>Informations importantes sur vos élèves.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {recentAlerts.map(alert => (
                  <li key={alert.id} className="flex items-center text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 mr-2 text-primary" />
                    <span>{getUserFullName(alert.studentId)} {alert.description}</span>
                    <span className="ml-auto text-xs italic">{alert.date}</span>
                  </li>
                ))}
              </ul>
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
        Mon Profil
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

export default Profile;