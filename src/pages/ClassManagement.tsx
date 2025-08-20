import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, Search, Users, BookOpen, GraduationCap } from "lucide-react";
import { useRole } from "@/contexts/RoleContext";
import { Profile, Course } from '@/lib/dataModels';
import { getAllStudents, getStudentsByCourseId } from '@/lib/studentData'; // Assuming these functions exist
import { getAllCoursesByTeacherId } from '@/lib/courseData'; // Assuming this function exists
import { showSuccess, showError } from '@/utils/toast';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const ClassManagement = () => {
  const { currentUserProfile, isLoadingUser } = useRole();
  const [searchTerm, setSearchTerm] = useState('');
  const [allStudents, setAllStudents] = useState<Profile[]>([]);
  const [teacherCourses, setTeacherCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);

  useEffect(() => {
    const fetchInitialData = async () => {
      if (!currentUserProfile || currentUserProfile.role !== 'teacher') {
        setIsLoadingStudents(false);
        setIsLoadingCourses(false);
        return;
      }

      // Fetch all students (or students relevant to this teacher)
      setIsLoadingStudents(true);
      try {
        const studentsData = await getAllStudents(); // Or a more specific function like getStudentsByTeacherId
        setAllStudents(studentsData.filter(s => s.role === 'student')); // Ensure only students are listed
      } catch (error) {
        console.error("Error fetching students:", error);
        showError("Erreur lors du chargement des élèves.");
      } finally {
        setIsLoadingStudents(false);
      }

      // Fetch courses taught by the current teacher
      setIsLoadingCourses(true);
      try {
        const coursesData = await getAllCoursesByTeacherId(currentUserProfile.id);
        setTeacherCourses(coursesData);
      } catch (error) {
        console.error("Error fetching courses:", error);
        showError("Erreur lors du chargement des cours.");
      } finally {
        setIsLoadingCourses(false);
      }
    };

    fetchInitialData();
  }, [currentUserProfile]);

  // Filter students based on search term and selected course
  const filteredStudents = useMemo(() => {
    let studentsToFilter = allStudents;

    // First, filter by selected course if any
    if (selectedCourseId) {
      // This assumes getStudentsByCourseId returns students for a specific course
      // For simplicity, we'll filter from allStudents here.
      // In a real app, you might re-fetch students specific to the course.
      const course = teacherCourses.find(c => c.id === selectedCourseId);
      if (course && course.student_ids) {
        studentsToFilter = allStudents.filter(student => course.student_ids.includes(student.id));
      } else {
        studentsToFilter = []; // No students in this course or course not found
      }
    }

    // Then, filter by search term
    if (!searchTerm) {
      return studentsToFilter;
    }
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return studentsToFilter.filter(student =>
      student.first_name?.toLowerCase().includes(lowerCaseSearchTerm) ||
      student.last_name?.toLowerCase().includes(lowerCaseSearchTerm) ||
      student.username?.toLowerCase().includes(lowerCaseSearchTerm) ||
      student.email?.toLowerCase().includes(lowerCaseSearchTerm)
    );
  }, [searchTerm, allStudents, selectedCourseId, teacherCourses]);

  if (isLoadingUser || isLoadingStudents || isLoadingCourses) {
    return (
      <div className="text-center py-20">
        <h1 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
          Chargement de la gestion des classes...
        </h1>
        <p className="text-lg text-muted-foreground">
          Veuillez patienter.
        </p>
      </div>
    );
  }

  if (!currentUserProfile || currentUserProfile.role !== 'teacher') {
    return (
      <div className="text-center py-20">
        <h1 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
          Accès Restreint
        </h1>
        <p className="text-lg text-muted-foreground">
          Seuls les professeurs peuvent accéder à cette page.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
        Gestion des Classes et Élèves
      </h1>
      <p className="text-lg text-muted-foreground">
        Gérez vos cours et les élèves qui y sont inscrits.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Section Cours */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" /> Mes Cours
            </CardTitle>
            <Button asChild size="sm">
              <Link to="/create-course">
                <PlusCircle className="h-4 w-4 mr-2" /> Nouveau Cours
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {teacherCourses.length === 0 ? (
              <p className="text-muted-foreground">Vous n'avez pas encore créé de cours.</p>
            ) : (
              <div className="space-y-2">
                {teacherCourses.map(course => (
                  <Card key={course.id} className="p-3 flex items-center justify-between hover:bg-accent transition-colors">
                    <div>
                      <p className="font-medium">{course.title}</p>
                      <p className="text-sm text-muted-foreground">{course.description?.substring(0, 50)}...</p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/course/${course.id}/manage`}>Gérer</Link>
                    </Button>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section Élèves */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <GraduationCap className="h-6 w-6 text-primary" /> Mes Élèves
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="flex-grow">
                <Label htmlFor="student-search">Rechercher un élève</Label>
                <Input
                  id="student-search"
                  placeholder="Nom, prénom, pseudo ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="flex-shrink-0 sm:w-1/3">
                <Label htmlFor="course-filter">Filtrer par cours</Label>
                <Select onValueChange={(value) => setSelectedCourseId(value === "all" ? null : value)} value={selectedCourseId || "all"}>
                  <SelectTrigger id="course-filter">
                    <SelectValue placeholder="Tous les cours" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les cours</SelectItem>
                    {teacherCourses.map(course => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {filteredStudents.length === 0 ? (
              <p className="text-muted-foreground">
                {searchTerm || selectedCourseId ? "Aucun élève trouvé avec ces critères." : "Aucun élève n'est encore inscrit."}
              </p>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                {filteredStudents.map(student => (
                  <Card key={student.id} className="p-3 flex items-center gap-3 hover:bg-accent transition-colors">
                    <Avatar>
                      <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${student.first_name} ${student.last_name}`} />
                      <AvatarFallback>{student.first_name[0]}{student.last_name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-grow">
                      <p className="font-medium">{student.first_name} {student.last_name}</p>
                      <p className="text-sm text-muted-foreground">@{student.username} - {student.email}</p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/profile/${student.id}`}>Voir profil</Link>
                    </Button>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClassManagement;