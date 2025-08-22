import React, { useState, useEffect, useRef } from 'react';
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
import { PlusCircle, Trash2, Users, GraduationCap, Mail, Search, UserCheck, UserX, Loader2 } from "lucide-react";
import { Class, Profile, Curriculum, Establishment } from "@/lib/dataModels"; // Import Profile and Curriculum, Establishment
import { showSuccess, showError } from "@/utils/toast";
import {
  getAllProfiles,
  findProfileByUsername,
  updateProfile,
  deleteProfile,
} from '@/lib/studentData';
import { useCourseChat } from '@/contexts/CourseChatContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  loadClasses,
  loadCurricula,
  updateClassInStorage,
  addClassToStorage,
  deleteClassFromStorage,
  loadEstablishments,
} from '@/lib/courseData';

// Shadcn UI components for autocomplete
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRole } from '@/contexts/RoleContext';
import { useNavigate } from 'react-router-dom';

const ClassManagementPage = () => {
  const { currentUserProfile, currentRole, isLoadingUser } = useRole();
  const { openChat } = useCourseChat();
  const navigate = useNavigate();
  
  // Main states for data
  const [classes, setClasses] = useState<Class[]>([]);
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [curricula, setCurricula] = useState<Curriculum[]>([]);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);

  // States for add/edit forms
  const [newClassName, setNewClassName] = useState('');
  const [newClassCurriculumId, setNewClassCurriculumId] = useState<string>("");

  // State for viewing students in a class
  const [selectedClassIdForStudents, setSelectedClassIdForStudents] = useState<string | null>(null);

  // States for student assignment (autocomplete)
  const [usernameToAssign, setUsernameToAssign] = useState('');
  const [foundUserForAssignment, setFoundUserForAssignment] = useState<Profile | null>(null);
  const [classToAssign, setClassToAssign] = useState<string>("");
  const [isSearchingUser, setIsSearchingUser] = useState(false);
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [openCommand, setOpenCommand] = useState(false);

  const [classSearchQuery, setClassSearchQuery] = useState('');

  // Load initial data
  useEffect(() => {
    const fetchData = async () => {
      setClasses(await loadClasses());
      setCurricula(await loadCurricula());
      setEstablishments(await loadEstablishments());
      setAllProfiles(await getAllProfiles());
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
          setNewClassCurriculumId("");
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

  const handleRemoveStudentFromClass = async (studentProfileId: string) => {
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

  // Debounced search for user username (autocomplete)
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    if (usernameToAssign.trim() === '') {
      setFoundUserForAssignment(null);
      setIsSearchingUser(false);
      return;
    }

    setIsSearchingUser(true);
    setFoundUserForAssignment(null);

    debounceTimeoutRef.current = setTimeout(async () => {
      const profile = await findProfileByUsername(usernameToAssign.trim());
      setFoundUserForAssignment(profile || null);
      setIsSearchingUser(false);
    }, 500);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [usernameToAssign]);

  const handleAssignStudentToClass = async () => {
    if (!foundUserForAssignment) {
      showError("Veuillez d'abord sélectionner un élève.");
      return;
    }
    if (!classToAssign) {
      showError("Veuillez sélectionner une classe.");
      return;
    }

    if (foundUserForAssignment.role !== 'student') {
      showError("Seuls les profils d'élèves peuvent être affectés à une classe.");
      return;
    }

    if (foundUserForAssignment.class_id === classToAssign) {
      showError("Cet élève est déjà dans cette classe.");
      return;
    }

    try {
      const updatedStudentProfile = await updateProfile({
        id: foundUserForAssignment.id,
        class_id: classToAssign,
      });

      if (updatedStudentProfile) {
        setAllProfiles(await getAllProfiles()); // Re-fetch all profiles
        setClasses(await loadClasses()); // Re-fetch classes to update student counts
        showSuccess(`Élève ${updatedStudentProfile.first_name} ${updatedStudentProfile.last_name} affecté à la classe ${getClassName(classToAssign)} !`);
        setUsernameToAssign('');
        setFoundUserForAssignment(null);
        setClassToAssign("");
        setOpenCommand(false);
      } else {
        showError("Échec de l'affectation de l'élève.");
      }
    } catch (error: any) {
      console.error("Error assigning student to class:", error);
      showError(`Erreur lors de l'affectation de l'élève: ${error.message}`);
    }
  };

  const selectedClass = selectedClassIdForStudents ? classes.find(cls => cls.id === selectedClassIdForStudents) : null;
  const studentsInSelectedClass = selectedClass ? allProfiles.filter(profile => profile.role === 'student' && profile.class_id === selectedClass.id) : [];

  const filteredUsersForDropdown = usernameToAssign.trim() === ''
    ? []
    : allProfiles.filter(p =>
        p.role === 'student' &&
        (p.username.toLowerCase().includes(usernameToAssign.toLowerCase()) ||
        p.first_name.toLowerCase().includes(usernameToAssign.toLowerCase()) ||
        p.last_name.toLowerCase().includes(usernameToAssign.toLowerCase()))
      ).slice(0, 10);

  const filteredClasses = classSearchQuery.trim() === ''
    ? []
    : classes.filter(cls => cls.name.toLowerCase().includes(classSearchQuery.toLowerCase()));

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
        Créez et gérez des classes, et affectez-y des élèves.
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" /> Classes
          </CardTitle>
          <CardDescription>Créez de nouvelles classes et gérez les existantes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <h3 className="text-lg font-semibold">Ajouter une nouvelle classe</h3>
          <div className="grid gap-2">
            <Label htmlFor="new-class-name">Nom de la classe</Label>
            <Input
              id="new-class-name"
              placeholder="Ex: Terminale S1"
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
            />
            <Label htmlFor="new-class-curriculum">Cursus</Label>
            <Select value={newClassCurriculumId} onValueChange={setNewClassCurriculumId}>
              <SelectTrigger id="new-class-curriculum">
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
              <PlusCircle className="h-4 w-4 mr-2" /> Ajouter la classe
            </Button>
          </div>

          <h3 className="text-lg font-semibold mt-6">Affecter un élève à une classe</h3>
          <div className="relative">
            <Popover open={openCommand} onOpenChange={setOpenCommand}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openCommand}
                  className="w-full justify-between"
                >
                  {foundUserForAssignment ? `${foundUserForAssignment.first_name} ${foundUserForAssignment.last_name} (@${foundUserForAssignment.username})` : "Rechercher un élève..."}
                  <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                <Command>
                  <CommandInput
                    placeholder="Rechercher par nom d'utilisateur..."
                    value={usernameToAssign}
                    onValueChange={(value) => {
                      setUsernameToAssign(value);
                      setFoundUserForAssignment(null);
                    }}
                  />
                  <CommandList>
                    {isSearchingUser && usernameToAssign.trim() !== '' && (
                      <CommandEmpty className="py-2 text-center text-muted-foreground flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> Recherche...
                      </CommandEmpty>
                    )}
                    {!isSearchingUser && filteredUsersForDropdown.length === 0 && usernameToAssign.trim() !== '' && (
                      <CommandEmpty className="py-2 text-center text-muted-foreground">
                        Aucun élève trouvé pour "{usernameToAssign}".
                      </CommandEmpty>
                    )}
                    <CommandGroup>
                      {filteredUsersForDropdown.map((profile) => (
                        <CommandItem
                          key={profile.id}
                          value={profile.username}
                          onSelect={() => {
                            setFoundUserForAssignment(profile);
                            setUsernameToAssign(profile.username);
                            setOpenCommand(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              foundUserForAssignment?.id === profile.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {profile.first_name} {profile.last_name} (@{profile.username})
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {foundUserForAssignment && (
            <div className="p-3 border rounded-md bg-muted/20 space-y-2">
              <div className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-green-500" />
                <p className="font-medium">{foundUserForAssignment.first_name} {foundUserForAssignment.last_name} <span className="text-sm text-muted-foreground">(@{foundUserForAssignment.username})</span></p>
              </div>
              <p className="text-sm text-muted-foreground">Email : {foundUserForAssignment.email}</p>
              {foundUserForAssignment.class_id && (
                <p className="text-sm text-muted-foreground">Actuellement dans : {getClassName(foundUserForAssignment.class_id)} (Cursus: {getCurriculumName(classes.find(c => c.id === foundUserForAssignment.class_id)?.curriculum_id)})</p>
              )}
              <div className="flex gap-2 mt-2">
                <Select value={classToAssign} onValueChange={setClassToAssign}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Sélectionner une classe" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map(cls => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name} ({getCurriculumName(cls.curriculum_id)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleAssignStudentToClass} disabled={!classToAssign}>
                  <PlusCircle className="h-4 w-4 mr-2" /> Affecter
                </Button>
              </div>
            </div>
          )}

          <h3 className="text-lg font-semibold mt-6">Liste de toutes les classes</h3>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom de classe..."
              className="pl-10"
              value={classSearchQuery}
              onChange={(e) => setClassSearchQuery(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            {classSearchQuery.trim() === '' ? (
              <p className="text-muted-foreground text-center py-4">Veuillez saisir un terme de recherche pour afficher les classes.</p>
            ) : filteredClasses.length === 0 ? (
              <p className="text-muted-foreground">Aucune classe trouvée pour votre recherche.</p>
            ) : (
              filteredClasses.map((cls) => (
                <Card key={cls.id} className="p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="flex-grow">
                    <p className="font-medium">{cls.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Cursus: {getCurriculumName(cls.curriculum_id)} (Établissement: {getEstablishmentName(curricula.find(c => c.id === cls.curriculum_id)?.establishment_id)})
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Élèves: {allProfiles.filter(p => p.role === 'student' && p.class_id === cls.id).length}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
                    <Button variant="outline" size="sm" onClick={() => handleViewStudentsInClass(cls.id)}>
                      <Users className="h-4 w-4 mr-1" /> Voir les élèves
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteClass(cls.id)}>
                      <Trash2 className="h-4 w-4" /> Supprimer
                    </Button>
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
                    <Button variant="destructive" size="sm" onClick={() => handleRemoveStudentFromClass(student.id)}>
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