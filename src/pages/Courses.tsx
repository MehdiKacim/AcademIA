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
import { BookOpen, Lock, CheckCircle, Search } from "lucide-react"; // Import icons, including Search
import { cn } from "@/lib/utils"; // Import cn
import { Input } from "@/components/ui/input"; // Import Input
import React, { useState, useMemo } from "react"; // Import useState and useMemo

const Courses = () => {
  const { currentRole } = useRole();
  const dummyCourses = loadCourses(); // Charger les cours depuis le localStorage
  const [searchQuery, setSearchQuery] = useState(''); // État pour la requête de recherche

  // Filtrer les cours en fonction du rôle et de la requête de recherche
  const getCoursesForRole = useMemo(() => {
    const lowerCaseQuery = searchQuery.toLowerCase();

    const filtered = dummyCourses.filter(course =>
      course.title.toLowerCase().includes(lowerCaseQuery) ||
      course.description.toLowerCase().includes(lowerCaseQuery)
    );

    if (currentRole === 'student') {
      return filtered.map(course => {
        const completedModules = course.modules.filter(m => m.isCompleted).length;
        const totalModules = course.modules.length;
        const progress = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;
        return {
          ...course,
          progress: progress,
        };
      });
    } else if (currentRole === 'creator') {
      return filtered.map(course => ({
        ...course,
        status: Math.random() > 0.5 ? "Publié" : "Brouillon", // Dummy status
        students: Math.floor(Math.random() * 200), // Dummy student count
      }));
    } else if (currentRole === 'tutor') {
      // For tutors, show supervised courses (dummy data for now)
      // This part might need more complex filtering if tutor supervises specific courses/students
      // For now, it will just show all courses that match the search query,
      // and then map them to a tutor-specific display format.
      return filtered.map(course => ({
        studentName: "Élève fictif", // Placeholder
        courseTitle: course.title,
        progress: Math.floor(Math.random() * 100), // Dummy progress
        alerts: "Aucune alerte", // Placeholder
      }));
    }
    return [];
  }, [dummyCourses, currentRole, searchQuery]); // Dépendances pour useMemo

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
            {coursesToDisplay.map((course: any) => { // Use 'any' for simplicity due to mixed types
              const isCompleted = course.modules.every((m: any) => m.isCompleted);
              const completedModulesCount = course.modules.filter((m: any) => m.isCompleted).length;
              const totalModulesCount = course.modules.length;
              const progressPercentage = totalModulesCount > 0 ? Math.round((completedModulesCount / totalModulesCount) * 100) : 0;

              return (
                <Card
                  key={course.id}
                  className={cn(
                    "flex flex-col shadow-lg transition-all duration-300 ease-in-out",
                    isCompleted && "border-green-500 ring-2 ring-green-500/50"
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
                      {isCompleted ? (
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
                      Progression: {progressPercentage}% ({completedModulesCount}/{totalModulesCount} modules)
                    </p>
                    <Link to={`/courses/${course.id}`}>
                      <Button className="w-full">
                        {isCompleted ? "Revoir le cours" : "Commencer le cours"}
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
            {coursesToDisplay.map((course: any) => ( // Use 'any' for simplicity due to mixed types
              <Card key={course.id}>
                <CardHeader>
                  <CardTitle>{course.title}</CardTitle>
                  <CardDescription>{course.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Statut: {course.status}</p>
                  <p className="text-sm text-muted-foreground">Élèves inscrits: {course.students}</p>
                  <div className="flex gap-2 mt-4">
                    <Link to={`/create-course/${course.id}`}> {/* Lien de modification */}
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
            {coursesToDisplay.map((data: any, index: number) => ( // Use 'any' for simplicity due to mixed types
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
      <div className="relative mb-6 max-w-md mx-auto p-2 bg-card border rounded-xl shadow-md"> {/* Added bg-card, border, rounded-xl, shadow-md, p-2 */}
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground" /> {/* Increased icon size and adjusted left padding */}
        <Input
          placeholder="Rechercher un cours..."
          className="pl-12 h-14 text-base rounded-lg shadow-none focus:ring-2 focus:ring-primary focus:ring-offset-2 border-none bg-transparent" {/* Adjusted pl, h, removed shadow, border, bg */}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      {renderCoursesContent()}
    </div>
  );
};

export default Courses;