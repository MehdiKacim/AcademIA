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

const Courses = () => {
  const { currentRole } = useRole();
  const dummyCourses = loadCourses(); // Charger les cours depuis le localStorage

  // Filter courses based on role or display all for creators
  const getCoursesForRole = () => {
    if (currentRole === 'student') {
      // For students, show all courses (or could filter by enrolled courses if we had user data)
      return dummyCourses.map(course => {
        const completedModules = course.modules.filter(m => m.isCompleted).length;
        const totalModules = course.modules.length;
        const progress = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;
        return {
          ...course,
          progress: progress,
        };
      });
    } else if (currentRole === 'creator') {
      // For creators, show all courses they created (or all for demo)
      return dummyCourses.map(course => ({
        ...course,
        status: Math.random() > 0.5 ? "Publié" : "Brouillon", // Dummy status
        students: Math.floor(Math.random() * 200), // Dummy student count
      }));
    } else if (currentRole === 'tutor') {
      // For tutors, show supervised courses (dummy data for now)
      return [
        { studentName: "John Doe", courseTitle: "Mathématiques Avancées", progress: 60, alerts: "Difficultés en géométrie" },
        { studentName: "Jane Smith", courseTitle: "Physique Quantique", progress: 90, alerts: "Excellent progrès" },
      ];
    }
    return [];
  };

  const coursesToDisplay = getCoursesForRole();

  const renderCoursesContent = () => {
    if (currentRole === 'student') {
      return (
        <>
          <p className="text-lg text-muted-foreground mb-8">Voici les cours auxquels vous êtes inscrit(e) et votre progression.</p>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {coursesToDisplay.map((course: any) => ( // Use 'any' for simplicity due to mixed types
              <Card key={course.id}>
                <CardHeader>
                  <CardTitle>{course.title}</CardTitle>
                  <CardDescription>{course.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Progression: {course.progress}%</p>
                  <Link to={`/courses/${course.id}`} className="w-full">
                    <Button variant="outline" className="mt-4 w-full">Continuer le cours</Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      );
    } else if (currentRole === 'creator') {
      return (
        <>
          <p className="text-lg text-muted-foreground mb-8">Gérez les cours que vous avez créés.</p>
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
                    <Button variant="outline">Modifier</Button>
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
      {renderCoursesContent()}
    </div>
  );
};

export default Courses;