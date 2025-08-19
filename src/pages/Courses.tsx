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

const Courses = () => {
  const { currentRole } = useRole();

  const studentCourses = [
    { id: '1', title: "Introduction à l'IA", description: "Les bases de l'intelligence artificielle.", progress: 50 },
    { id: '2', title: "React pour débutants", description: "Apprenez les fondamentaux de React.", progress: 25 },
    { id: '3', title: "Algorithmes Avancés", description: "Maîtrisez les structures de données complexes.", progress: 80 },
    { id: '4', title: "Développement Web Fullstack", description: "Apprenez à construire des applications web complètes, du frontend au backend, avec les technologies modernes.", progress: 10 },
    { id: '5', title: "Fondamentaux de la Science des Données", description: "Explorez les concepts clés de la science des données.", progress: 0 }, // Nouveau cours
  ];

  const creatorCourses = [
    { id: 101, title: "Développement Web Fullstack", description: "Créez des applications web complètes.", status: "Publié", students: 150 },
    { id: 102, title: "Machine Learning avec Python", description: "Introduction aux concepts du ML.", status: "Brouillon", students: 0 },
    { id: 103, title: "Design UI/UX", description: "Principes de conception d'interfaces utilisateur.", status: "Publié", students: 80 },
    { id: 104, title: "Fondamentaux de la Science des Données", description: "Explorez les concepts clés de la science des données.", status: "Brouillon", students: 0 }, // Nouveau cours
  ];

  const tutorSupervisedCourses = [
    { studentName: "John Doe", courseTitle: "Mathématiques Avancées", progress: 60, alerts: "Difficultés en géométrie" },
    { studentName: "Jane Smith", courseTitle: "Physique Quantique", progress: 90, alerts: "Excellent progrès" },
  ];

  const renderCoursesContent = () => {
    if (currentRole === 'student') {
      return (
        <>
          <p className="text-lg text-muted-foreground mb-8">Voici les cours auxquels vous êtes inscrit(e) et votre progression.</p>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {studentCourses.map(course => (
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
            {creatorCourses.map(course => (
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
            {tutorSupervisedCourses.map((data, index) => (
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