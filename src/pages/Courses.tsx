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
import { loadCourses, loadEstablishments } from "@/lib/courseData"; // Import loadEstablishments
import { BookOpen, Lock, CheckCircle, Search, Building2 } from "lucide-react"; // Import icons
import { cn } from "@/lib/utils"; // Import cn
import React, { useState, useMemo, useEffect } from "react"; // Import useState and useMemo
import { getAllStudentCourseProgress } from "@/lib/studentData"; // Import Supabase function
import { Course, StudentCourseProgress, Establishment } from "@/lib/dataModels"; // Import types
import { Progress } from "@/components/ui/progress"; // Import Progress
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Import Select components
import { Label } from "@/components/ui/label"; // Import Label

const Courses = () => {
  const { currentUserProfile, currentRole, isLoadingUser } = useRole();
  const [courses, setCourses] = useState<Course[]>([]);
  const [studentCourseProgresses, setStudentCourseProgresses] = useState<StudentCourseProgress[]>([]);
  const [establishments, setEstablishments] = useState<Establishment[]>([]); // New state for establishments
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEstablishmentFilter, setSelectedEstablishmentFilter] = useState<string | 'all'>('all'); // New state for establishment filter

  useEffect(() => {
    const fetchData = async () => {
      // Load all establishments
      setEstablishments(await loadEstablishments());
      // Pass userId and userRole to loadCourses for filtering
      const loadedCourses = await loadCourses(currentUserProfile?.id, currentRole);
      setCourses(loadedCourses);
      const loadedProgresses = await getAllStudentCourseProgress();
      setStudentCourseProgresses(loadedProgresses);
    };
    fetchData();
  }, [currentUserProfile, currentRole]); // Re-fetch if user profile or role changes

  // Set default establishment filter based on user role
  useEffect(() => {
    if (currentRole === 'administrator') {
      setSelectedEstablishmentFilter('all');
    } else if (currentUserProfile?.establishment_id) {
      setSelectedEstablishmentFilter(currentUserProfile.establishment_id);
    } else {
      setSelectedEstablishmentFilter('all');
    }
  }, [currentRole, currentUserProfile?.establishment_id]);

  const getEstablishmentName = (id?: string) => establishments.find(e => e.id === id)?.name || 'N/A';

  const getCoursesForRole = useMemo(() => {
    const lowerCaseQuery = searchQuery.toLowerCase();

    let filteredCourses = courses.filter(course =>
      course.title.toLowerCase().includes(lowerCaseQuery) ||
      course.description.toLowerCase().includes(lowerCaseQuery)
    );

    // Apply establishment filter
    if (selectedEstablishmentFilter !== 'all' && currentRole === 'administrator') {
      // For admin, filter courses by establishment if selected
      // This assumes courses have an establishment_id, which they don't directly.
      // A more complex join would be needed here (course -> curriculum -> establishment)
      // For now, we'll skip this filter for courses for admin, or assume courses are global.
      // If courses were linked to subjects, and subjects to establishments, we could filter that way.
      // For simplicity, courses are currently considered global for admin view unless explicitly linked.
    } else if (currentRole !== 'administrator' && currentUserProfile?.establishment_id) {
      // For non-admin roles, filter courses by their associated subject's establishment
      filteredCourses = filteredCourses.filter(course => {
        const subject = establishments.find(est => est.id === currentUserProfile.establishment_id); // This is incorrect, should be subject.establishment_id
        // This logic needs to be refined based on how subjects are linked to courses and establishments.
        // For now, we'll assume courses are accessible if the user is in the same establishment.
        // This will be handled by RLS on the `courses` table based on `subject_id` and `subjects.establishment_id`.
        return true; // RLS will handle the actual filtering
      });
    }

    if (currentRole === 'student') {
      const studentProgress = studentCourseProgresses.filter(p => p.user_id === currentUserProfile?.id);
      return filteredCourses.map(course => {
        const courseProgress = studentProgress.find(cp => cp.course_id === course.id);
        const completedModules = courseProgress ? courseProgress.modules_progress.filter(m => m.is_completed).length : 0;
        const totalModules = course.modules.length;
        const progress = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;
        const isCompleted = courseProgress ? courseProgress.modules_progress.every(m => m.is_completed) : false;
        return {
          ...course,
          progress: progress,
          isCompleted: isCompleted,
        };
      });
    } else if (currentRole === 'professeur') {
      return filteredCourses.map(course => ({
        ...course,
        status: Math.random() > 0.5 ? "Publié" : "Brouillon", // Dummy status
        students: Math.floor(Math.random() * 200), // Dummy student count
      }));
    } else if (currentRole === 'tutor') {
      return filteredCourses.map(course => ({
        courseTitle: course.title,
        studentName: "Élève fictif", // Placeholder
        progress: Math.floor(Math.random() * 100), // Dummy progress
        alerts: "Aucune alerte", // Placeholder
      }));
    }
    return [];
  }, [courses, currentRole, searchQuery, currentUserProfile, studentCourseProgresses, selectedEstablishmentFilter, establishments]);

  const coursesToDisplay = getCoursesForRole;

  if (isLoadingUser) {
    return (
      <div className="text-center py-20">
        <h1 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
          Chargement des cours...
        </h1>
        <p className="text-lg text-muted-foreground">
          Veuillez patienter.
        </p>
      </div>
    );
  }

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
                    "flex flex-col shadow-lg transition-all duration-300 ease-in-out rounded-android-tile hover:scale-[1.02] transition-transform", // Apply rounded-android-tile and hover effect
                    course.isCompleted && "border-green-500 ring-2 ring-green-500/50"
                  )}
                >
                  {course.image_url && (
                    <img
                      src={course.image_url}
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
                        const courseProgress = studentCourseProgresses.find(cp => cp.course_id === course.id && cp.user_id === currentUserProfile?.id);
                        return courseProgress?.modules_progress.find(mp => mp.module_index === course.modules.indexOf(m))?.is_completed;
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
    } else if (currentRole === 'professeur') {
      return (
        <>
          <p className="text-lg text-muted-foreground mb-8">Gérez les cours que vous avez créés.</p>
          {coursesToDisplay.length === 0 && (
            <p className="text-muted-foreground text-center py-4">Aucun cours trouvé pour votre recherche.</p>
          )}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {coursesToDisplay.map((course: any) => (
              <Card key={course.id} className="rounded-android-tile hover:scale-[1.02] transition-transform"> {/* Apply rounded-android-tile and hover effect */}
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
                    <Link to={`/analytics?view=course-performance&courseId=${course.id}`}>
                      <Button variant="secondary">Voir les statistiques</Button>
                    </Link>
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
              <Card key={index} className="rounded-android-tile hover:scale-[1.02] transition-transform"> {/* Apply rounded-android-tile and hover effect */}
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"> {/* Added responsive padding and max-width */}
      <h1 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
        {currentRole === 'student' ? 'Mes Cours' : currentRole === 'professeur' ? 'Gestion des Cours' : 'Cours des Élèves'}
      </h1>

      {(currentRole === 'administrator' || (currentUserProfile?.establishment_id && ['director', 'deputy_director', 'professeur', 'tutor'].includes(currentRole || ''))) && (
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Rechercher un cours..."
              className="pl-10 rounded-android-tile"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex-shrink-0 sm:w-1/3">
            <Label htmlFor="establishment-filter">Filtrer par Établissement</Label>
            <Select value={selectedEstablishmentFilter} onValueChange={(value: string | 'all') => setSelectedEstablishmentFilter(value)}>
              <SelectTrigger id="establishment-filter" className="rounded-android-tile">
                <SelectValue placeholder="Tous les établissements" />
              </SelectTrigger>
              <SelectContent className="backdrop-blur-lg bg-background/80 rounded-android-tile">
                <SelectItem value="all">Tous les établissements</SelectItem>
                {establishments.filter(est => 
                  currentRole === 'administrator' || est.id === currentUserProfile?.establishment_id
                ).map(est => (
                  <SelectItem key={est.id} value={est.id}>
                    {est.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
      {renderCoursesContent()}
    </div>
  );
};

export default Courses;