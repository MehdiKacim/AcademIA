import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRole } from "@/contexts/RoleContext";
import { loadCourses } from "@/lib/courseData";
import { dummyStudents } from "@/lib/studentData";
import { User, BookOpen, GraduationCap, PenTool, Users, Mail, CheckCircle } from "lucide-react";

const Profile = () => {
  const { currentRole } = useRole();
  const courses = loadCourses();
  // For demo purposes, we'll assume a default user for each role.
  // In a real app, this would come from an authenticated user context.
  const currentUser = dummyStudents[0]; // Assuming Alice is our default student for now

  const renderProfileContent = () => {
    if (!currentUser) {
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

    if (currentRole === 'student') {
      const enrolledCourses = courses.filter(c => c.modules.some(m => m.isCompleted));
      const completedCoursesCount = enrolledCourses.filter(c => c.modules.every(m => m.isCompleted)).length;
      const totalModulesCompleted = courses.reduce((acc, course) => acc + course.modules.filter(m => m.isCompleted).length, 0);
      const totalModules = courses.reduce((acc, course) => acc + course.modules.length, 0);
      const overallProgress = totalModules > 0 ? Math.round((totalModulesCompleted / totalModules) * 100) : 0;

      return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="lg:col-span-3">
            <CardHeader className="flex flex-row items-center space-x-4">
              <User className="h-12 w-12 text-primary" />
              <div>
                <CardTitle className="text-3xl">{currentUser.firstName} {currentUser.lastName}</CardTitle>
                <CardDescription className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" /> {currentUser.email}
                </CardDescription>
              </div>
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
              <p className="text-sm text-muted-foreground">Modules terminés : {totalModulesCompleted} / {totalModules}</p>
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
              <CardTitle>Cours en Cours</CardTitle>
              <CardDescription>Les cours sur lesquels vous travaillez.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 text-sm text-muted-foreground">
                {enrolledCourses.slice(0, 3).map(course => ( // Show first 3 enrolled courses
                  <li key={course.id}>{course.title}</li>
                ))}
                {enrolledCourses.length > 3 && <li>...et {enrolledCourses.length - 3} autres.</li>}
                {enrolledCourses.length === 0 && <li>Aucun cours en cours.</li>}
              </ul>
            </CardContent>
          </Card>
        </div>
      );
    } else if (currentRole === 'creator') {
      const createdCourses = courses; // Assuming all dummyCourses are created by this creator for demo
      const publishedCoursesCount = createdCourses.filter(c => c.modules.some(m => m.isCompleted)).length;
      const totalStudents = createdCourses.reduce((acc, course) => acc + Math.floor(Math.random() * 200), 0);

      return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="lg:col-span-3">
            <CardHeader className="flex flex-row items-center space-x-4">
              <PenTool className="h-12 w-12 text-primary" />
              <div>
                <CardTitle className="text-3xl">{currentUser.firstName} {currentUser.lastName}</CardTitle>
                <CardDescription className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" /> {currentUser.email}
                </CardDescription>
              </div>
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
                {createdCourses.slice(0, 3).map(course => ( // Show first 3 courses
                  <li key={course.id}>{course.title}</li>
                ))}
                {createdCourses.length === 0 && <li>Aucun cours créé.</li>}
              </ul>
            </CardContent>
          </Card>
        </div>
      );
    } else if (currentRole === 'tutor') {
      const supervisedStudents = dummyStudents.slice(0, 2); // Taking first two for demo
      const studentsAtRisk = supervisedStudents.filter(s => s.enrolledCoursesProgress.some(ec => ec.modulesProgress.some(mp => mp.sectionsProgress.some(sp => sp.quizResult && !sp.quizResult.passed)))).length;

      return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="lg:col-span-3">
            <CardHeader className="flex flex-row items-center space-x-4">
              <Users className="h-12 w-12 text-primary" />
              <div>
                <CardTitle className="text-3xl">{currentUser.firstName} {currentUser.lastName}</CardTitle>
                <CardDescription className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" /> {currentUser.email}
                </CardDescription>
              </div>
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
                  <li key={student.id}>{student.firstName} {student.lastName}: {Math.floor(Math.random() * 100)}% de progression moyenne</li>
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
              <ul className="list-disc pl-5 text-sm text-muted-foreground">
                <li>{supervisedStudents[0]?.firstName} a des difficultés en algèbre.</li>
                <li>{supervisedStudents[1]?.firstName} a terminé le module 3 de Physique.</li>
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
    </div>
  );
};

export default Profile;