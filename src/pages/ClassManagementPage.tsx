import React, { useState, useEffect } from 'react';
import { useRole } from "@/contexts/RoleContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Edit, Trash2, Users, GraduationCap, Mail, ArrowLeft, LayoutList } from "lucide-react";
import {
  Class,
  Curriculum,
  Establishment,
  Profile, // Import Profile
  StudentCourseProgress, // Import StudentCourseProgress
} from "@/lib/dataModels";
import { showSuccess, showError } from "@/utils/toast";
import {
  loadClasses,
  addClassToStorage,
  deleteClassFromStorage,
  loadCurricula,
  loadEstablishments,
  updateClassInStorage, // Import updateClassInStorage
} from '@/lib/courseData';
import { getAllProfiles, updateProfile, getUserFullName, getUserUsername, getUserEmail } from '@/lib/studentData'; // Import Supabase functions
import { useCourseChat } from '@/contexts/CourseChatContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from 'react-router-dom'; // Import useNavigate

const ClassManagementPage = () => {
  const { currentUserProfile, currentRole, isLoadingUser } = useRole();
  const { openChat } = useCourseChat();
  const navigate = useNavigate();
  
  // Main states for data
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [curricula, setCurricula] = useState<Curriculum[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]); // All profiles, including students

  // States for add/edit forms
  const [newClassName, setNewClassName] = useState('');
  const [newClassCurriculumId, setNewClassCurriculumId] = useState<string | undefined>(undefined);

  // State for viewing students in a class
  const [selectedClassIdForStudents, setSelectedClassIdForStudents] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    const fetchData = async () => {
      setEstablishments(await loadEstablishments());
      setCurricula(await loadCurricula());
      setClasses(await loadClasses());
      setAllProfiles(await getAllProfiles()); // Load all profiles
    };
    fetchData();
  }, []);

  // Helper functions to get names from IDs
  const getEstablishmentName = (id?: string) => establishments.find(e => e.id === id)?.name || 'N/A';
  const getCurriculumName = (id?: string) => curricula.find(c => c.id === id)?.name || 'N/A';
  
  // --- Class Management ---
  const handleAddClass = async () => {
    if (!currentUserProfile) {
      showError("Vous devez être connecté pour ajouter une classe.");
      return;
    }
    if (newClassName.trim() && newClassCurriculumId) {
      const selectedCurriculum = curricula.find(c => c.id === newClassCurriculumId);
      if (!selectedCurriculum) {
        showError("Cursus sélectionné introuvable.");
        return;
      }
      const formattedClassName = `${selectedCurriculum.name}-${newClassName.trim()}`;
      const newCls: Class = {
        id: '', // Supabase will generate
        name: formattedClassName,
        curriculum_id: newClassCurriculumId,
        creator_ids: [currentUserProfile.id], // Assign current creator
      };
      try {
        const addedClass = await addClassToStorage(newCls);
        if (addedClass) {
          setClasses(await loadClasses()); // Re-fetch to get the new list
          setNewClassName('');
          setNewClassCurriculumId(undefined);
          showSuccess("Classe ajoutée !");
        } else {
          showError("Échec de l'ajout de la classe.");
        }
      } catch (error: any) {
        console.error("Error adding class:", error);
        showError(`Erreur lors de l'ajout de la classe: ${error.message}`);
      }
    } else {
      showError("Le nom de la classe et le cursus sont requis.");
    }
  };

  const handleDeleteClass = async (id: string) => {
    try {
      await deleteClassFromStorage(id);
      setClasses(await loadClasses()); // Re-fetch to get the updated list
      // Remove class_id from associated student profiles
      const studentsInClass = allProfiles.filter(p => p.role === 'student' && p.class_id === id);
      for (const studentProfile of studentsInClass) {
        await updateProfile({ id: studentProfile.id, class_id: null }); // Set class_id to null
      }
      setAllProfiles(await getAllProfiles()); // Re-fetch all profiles
      showSuccess("Classe supprimée !");
    } catch (error: any) {
      console.error("Error deleting class:", error);
      showError(`Erreur lors de la suppression de la classe: ${error.message}`);
    }
  };

  const handleRemoveStudentFromClass = async (studentProfileId: string, classId: string) => {
    const studentToUpdate = allProfiles.find(p => p.id === studentProfileId && p.role === 'student');
    if (studentToUpdate) {
      try {
        await updateProfile({ id: studentToUpdate.id, class_id: null }); // Set class_id to null
        setAllProfiles(await getAllProfiles()); // Re-fetch all profiles
        setClasses(await loadClasses()); // Re-fetch classes to update student counts
        showSuccess(`Élève retiré de la classe !`);
      } catch (error: any) {
        console.error("Error removing student from class:", error);
        showError(`Erreur lors du retrait de l'élève: ${error.message}`);
      }
    }
  };

  const handleSendMessageToStudent = (studentProfile: Profile) => {
    navigate(`/messages?contactId=${studentProfile.id}`);
  };

  const handleViewStudentsInClass = (classId: string) => {
    setSelectedClassIdForStudents(classId);
  };

  const handleBackToClasses = () => {
    setSelectedClassIdForStudents(null);
  };

  const selectedClass = selectedClassIdForStudents ? classes.find(cls => cls.id === selectedClassIdForStudents) : null;
  const studentsInSelectedClass = selectedClass ? allProfiles.filter(profile => profile.role === 'student' && profile.class_id === selectedClass.id) : [];

  if (isLoadingUser) {
    return (
      <div className="text-center py-20">
        <h1 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
          Chargement...
        </h1>
        <p className="text-lg text-muted-foreground">
          Veuillez patienter.
        </p>
      </div>
    );
  }

  if (currentRole !== 'creator' && currentRole !== 'tutor') {
    return (
      <div className="text-center py-20">
        <h1 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
          Accès Restreint
        </h1>
        <p className="text-lg text-muted-foreground">
          Seuls les créateurs (professeurs) et les tuteurs peuvent accéder à cette page.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
        Gestion des Classes
      </h1>
      <p className="text-lg text-muted-foreground mb-8">
        Ajoutez, modifiez ou supprimez des classes, et gérez les élèves qui y sont affectés.
      </p>

      {/* --- Classes Section --- */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" /> Classes
          </CardTitle>
          <CardDescription>Ajoutez, modifiez ou supprimez des classes, liées à un cursus.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentRole === 'creator' && (
            <div className="grid gap-2">
              <Label htmlFor="new-class-name">Nom de la nouvelle classe</Label>
              <Input
                id="new-class-name"
                placeholder="Ex: 1ère Scientifique A"
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
              />
              <Label htmlFor="class-curriculum">Cursus</Label>
              <Select value={newClassCurriculumId} onValueChange={setNewClassCurriculumId}>
                <SelectTrigger id="class-curriculum">
                  <SelectValue placeholder="Sélectionner un cursus" />
                </SelectTrigger>
                <SelectContent>
                  {curricula.map(cur => (
                    <SelectItem key={cur.id} value={cur.id}>
                      {cur.name} ({getEstablishmentName(cur.establishment_id)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleAddClass} disabled={!newClassName.trim() || !newClassCurriculumId}>
                <PlusCircle className="h-4 w-4 mr-2" /> Ajouter Classe
              </Button>
            </div>
          )}
          <div className="space-y-2">
            {curricula.length === 0 && currentRole === 'creator' ? (
              <p className="text-muted-foreground">Veuillez d'abord créer un cursus pour ajouter des classes.</p>
            ) : classes.length === 0 ? (
              <p className="text-muted-foreground">Aucune classe créée.</p>
            ) : (
              curricula.map(cur => (
                <Card key={cur.id} className="p-4 space-y-3 bg-muted/20">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <LayoutList className="h-5 w-5 text-primary" /> Classes du cursus "{cur.name}" ({getEstablishmentName(cur.establishment_id)})
                  </h3>
                  <div className="space-y-2 pl-4 border-l">
                    {classes.filter(cls => cls.curriculum_id === cur.id).length === 0 ? (
                      <p className="text-muted-foreground text-sm">Aucune classe pour ce cursus.</p>
                    ) : (
                      classes.filter(cls => cls.curriculum_id === cur.id).map(cls => (
                        <div key={cls.id} className="flex items-center justify-between p-3 border rounded-md bg-background">
                          <span>{cls.name} ({allProfiles.filter(p => p.class_id === cls.id).length} élèves)</span>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleViewStudentsInClass(cls.id)}>
                              <GraduationCap className="h-4 w-4 mr-1" /> Élèves
                            </Button>
                            {currentRole === 'creator' && (
                              <>
                                <Button variant="outline" size="sm" onClick={() => console.log('Modifier classe', cls.id)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="destructive" size="sm" onClick={() => handleDeleteClass(cls.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                          {cls.creator_ids.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Professeurs: {cls.creator_ids.map(creatorId => {
                                const creatorProfile = allProfiles.find(p => p.id === creatorId);
                                return creatorProfile ? `${creatorProfile.first_name} ${creatorProfile.last_name}` : 'N/A';
                              }).join(', ')}
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {selectedClassIdForStudents && selectedClass && (
        <Card className="mt-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ArrowLeft className="h-5 w-5 cursor-pointer" onClick={handleBackToClasses} />
              Élèves de la classe "{selectedClass.name}"
            </CardTitle>
            <CardDescription>{studentsInSelectedClass.length} élève(s)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {studentsInSelectedClass.length === 0 ? (
              <p className="text-muted-foreground">Aucun élève dans cette classe.</p>
            ) : (
              studentsInSelectedClass.map(student => (
                <Card key={student.id} className="p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="flex-grow">
                    <p className="font-medium">{student.first_name} {student.last_name} <span className="text-sm text-muted-foreground">(@{student.username})</span></p>
                    <p className="text-sm text-muted-foreground">{student.email}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
                    <Button variant="outline" size="sm" onClick={() => handleSendMessageToStudent(student)}>
                      <Mail className="h-4 w-4 mr-1" /> Message
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleRemoveStudentFromClass(student.id, selectedClass.id)}>
                      <Trash2 className="h-4 w-4" /> Retirer
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ClassManagementPage;