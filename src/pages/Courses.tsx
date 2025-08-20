import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRole } from "@/contexts/RoleContext";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { loadCourses } from "@/lib/courseData"; // Import loadCourses
import { BookOpen, Lock, CheckCircle } from "lucide-react"; // Import icons
import { cn } from "@/lib/utils"; // Import cn
import React, { useState, useMemo, useEffect } from "react"; // Import useState and useMemo
import { loadStudents, getStudentProfileByUserId } from "@/lib/studentData";

const Courses = () => {
  const { currentUser, currentRole } = useRole();
  const [courses, setCourses] = useState(loadCourses());
  const [studentProfiles, setStudentProfiles] = useState(loadStudents());
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setCourses(loadCourses());
    setStudentProfiles(loadStudents());
  }, []); // Load data once on mount

  const studentProfile = currentUser && currentRole === 'student' ? getStudentProfileByUserId(currentUser.id) : undefined;

  const getCoursesForRole = useMemo(() => {
    const lowerCaseQuery = searchQuery.toLowerCase();

    const filtered = courses.filter(course =>
      course.title.toLowerCase().includes(lowerCaseQuery) ||
      course.description.toLowerCase().includes(lowerCaseQuery)
    );

    if (currentRole === 'student') {
      return filtered.map(course => {
        const courseProgress = studentProfile?.enrolledCoursesProgress.find(cp => cp.courseId === course.id);
        const completedModules = courseProgress ? courseProgress.modulesProgress.filter(m => m.isCompleted).length : 0;
        const totalModules = course.modules.length;
        const progress = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;
        const isCompleted = courseProgress ? courseProgress.modulesProgress.every(m => m.isCompleted) : false;
        return {
          ...course,
          progress: progress,
          isCompleted: isCompleted,
        };
      });
    } else if (currentRole === 'creator') {
      return filtered.map(course => ({
        ...course,
        status: Math.random() > 0.5 ? "Publié" : "Brouillon", // Dummy status
        students: Math.floor(Math.random() * 200), // Dummy student count
      }));
    } else if (currentRole === 'tutor') {
      return filtered.map(course => ({
        courseTitle: course.title,
        studentName: "Élève fictif", // Placeholder
        progress: Math.floor(Math.random() * 100), // Dummy progress
        alerts: "Aucune alerte", // Placeholder
      }));
    }
    return [];
  }, [courses, currentRole, searchQuery, studentProfile]);

  const coursesToDisplay = getCoursesForRole;

  const renderCoursesContent = () => {
    if (currentRole === 'student') {
      return (
        <>
          <p className="text-lg text-muted-foreground mb-8">Voici les cours disponibles. Cliquez sur un cours pour voir sa progression par modules.</p>
          {coursesToDisplay.length === 0 && (
            <p className="text-muted-foreground text-center py-4">Aucun cours trouvé pour votre recherche.</p>
          )}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {coursesToDisplay.map((course: any) => {
              return (
                <Card
                  key={course.id}
                  className={cn(
                    "flex flex-col shadow-lg transition-all duration-300 ease-in-out",
                    course.isCompleted && "border-green-500 ring-2 ring-green-500/50"
                  )}
                >
                  {course.imageUrl && (
                    <img
                      src={course.imageUrl}
                      alt={`Image pour le cours ${course.title}`}
                      className="w-full h-40 object-cover rounded-t-lg"
                    />
                  )}
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{course.title}</span>
                      {course.isCompleted ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <BookOpen className="h-5 w-5 text-primary" />
                      )}
                    </CardTitle>
                    <CardDescription className="mb-2 text-sm">
                      {course.description.substring(0, 100)}...
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow flex flex-col justify-between">
                    <p className="text-sm text-muted-foreground mb-4">
                      Progression: {course.progress}% ({course.modules.filter((m: any) => {
                        const courseProgress = studentProfile?.enrolledCoursesProgress.find(cp => cp.courseId === course.id);
                        return courseProgress?.modulesProgress.find(mp => mp.moduleIndex === course.modules.indexOf(m))?.isCompleted;
                      }).length}/{course.modules.length} modules)
                    </p>
                    <Link to={`/courses/${course.id}`}>
                      <Button className="w-full">
                        {course.isCompleted ? "Revoir le cours" : "Commencer le cours"}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      );
    } else if (currentRole === 'creator') {
      return (
        <>
          <p className="text-lg text-muted-foreground mb-8">Gérez les cours que vous avez créés.</p>
          {coursesToDisplay.length === 0 && (
            <p className="text-muted-foreground text-center py-4">Aucun cours trouvé pour votre recherche.</p>
          )}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {coursesToDisplay.map((course: any) => (
              <Card key={course.id}>
                <CardHeader>
                  <CardTitle>{course.title}</CardTitle>
                  <CardDescription>{course.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Statut: {course.status}</p>
                  <p className="text-sm text-muted-foreground">Élèves inscrits: {course.students}</p>
                  <div className="flex gap-2 mt-4">
                    <Link to={`/create-course/${course.id}`}>
                      <Button variant="outline">Modifier</Button>
                    </Link>
                    <Button variant="secondary">Voir les statistiques</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link to="/create-course">
              <Button size="lg">Créer un nouveau cours</Button>
            </Link>
          </div>
        </>
      );
    } else if (currentRole === 'tutor') {
      return (
        <>
          <p className="text-lg text-muted-foreground mb-8">Suivez les cours de vos élèves.</p>
          {coursesToDisplay.length === 0 && (
            <p className="text-muted-foreground text-center py-4">Aucun cours trouvé pour votre recherche.</p>
          )}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {coursesToDisplay.map((data: any, index: number) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle>{data.courseTitle}</CardTitle>
                  <CardDescription>Élève: {data.studentName}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Progression: {data.progress}%</p>
                  <Button variant="outline" className="mt-4 w-full">Voir le détail</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      );
    }
    return null;
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
        {currentRole === 'student' ? 'Mes Cours' : currentRole === 'creator' ? 'Gestion des Cours' : 'Cours des Élèves'}
      </h1>
      {renderCoursesContent()}
    </div>
  );
};

export default Courses;