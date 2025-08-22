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
import { PlusCircle, Trash2, Users, GraduationCap, Mail, Search, UserCheck, UserX, Loader2, ArrowLeft } from "lucide-react";
import { Class, Profile, Curriculum, Establishment } from "@/lib/dataModels";
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
  loadEstablishments,
} from '@/lib/courseData';

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRole } from '@/contexts/RoleContext';
import { useNavigate, useSearchParams } from 'react-router-dom'; // Import useSearchParams

const StudentManagementPage = () => {
  const { currentUserProfile, currentRole, isLoadingUser } = useRole();
  const { openChat } = useCourseChat();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams(); // Initialize useSearchParams
  
  const [classes, setClasses] = useState<Class[]>([]);
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [curricula, setCurricula] = useState<Curriculum[]>([]);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);

  const [usernameToAssign, setUsernameToAssign] = useState('');
  const [foundUserForAssignment, setFoundUserForAssignment] = useState<Profile | null>(null);
  const [classToAssign, setClassToAssign] = useState<string>("");
  const [isSearchingUser, setIsSearchingUser] = useState(false);
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [openCommand, setOpenCommand] = useState(false);

  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string | null>(null); // New state for class filter

  // Get classId from URL for initial filtering
  const classIdFromUrl = searchParams.get('classId');

  useEffect(() => {
    const fetchData = async () => {
      setClasses(await loadClasses());
      setCurricula(await loadCurricula());
      setEstablishments(await loadEstablishments());
      setAllProfiles(await getAllProfiles());
    };
    fetchData();
  }, []);

  // Set initial class filter from URL
  useEffect(() => {
    if (classIdFromUrl) {
      setSelectedClassFilter(classIdFromUrl);
    } else {
      setSelectedClassFilter(null);
    }
  }, [classIdFromUrl]);

  const getEstablishmentName = (id?: string) => establishments.find(e => e.id === id)?.name || 'N/A';
  const getCurriculumName = (id?: string) => curricula.find(c => c.id === id)?.name || 'N/A';
  const getClassName = (id?: string) => classes.find(c => c.id === id)?.name || 'N/A';

  const handleRemoveStudentFromClass = async (studentProfileId: string) => {
    const studentToUpdate = allProfiles.find(p => p.id === studentProfileId && p.role === 'student');
    if (studentToUpdate) {
      try {
        await updateProfile({ id: studentToUpdate.id, class_id: null });
        setAllProfiles(await getAllProfiles()); // Refresh profiles after update
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
        setAllProfiles(await getAllProfiles()); // Refresh profiles after update
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

  const handleDeleteStudent = async (studentProfileId: string) => {
    const studentProfileToDelete = allProfiles.find(p => p.id === studentProfileId && p.role === 'student');
    if (!studentProfileToDelete) return;

    try {
      await deleteProfile(studentProfileId); // Delete the profile
      setAllProfiles(await getAllProfiles()); // Refresh profiles after deletion
      showSuccess("Élève supprimé !");
    } catch (error: any) {
      console.error("Error deleting student:", error);
      showError(`Erreur lors de la suppression de l'élève: ${error.message}`);
    }
  };

  const filteredUsersForDropdown = usernameToAssign.trim() === ''
    ? []
    : allProfiles.filter(p =>
        p.role === 'student' &&
        (p.username.toLowerCase().includes(usernameToAssign.toLowerCase()) ||
        p.first_name.toLowerCase().includes(usernameToAssign.toLowerCase()) ||
        p.last_name.toLowerCase().includes(usernameToAssign.toLowerCase()))
      ).slice(0, 10);

  const studentsToDisplay = React.useMemo(() => {
    let students = allProfiles.filter(p => p.role === 'student');

    if (selectedClassFilter && selectedClassFilter !== 'all') {
      students = students.filter(s => s.class_id === selectedClassFilter);
    }

    if (studentSearchQuery.trim()) {
      const lowerCaseQuery = studentSearchQuery.toLowerCase();
      students = students.filter(s =>
        s.first_name.toLowerCase().includes(lowerCaseQuery) ||
        s.last_name.toLowerCase().includes(lowerCaseQuery) ||
        s.username.toLowerCase().includes(lowerCaseQuery.replace('@', '')) ||
        s.email.toLowerCase().includes(lowerCaseQuery)
      );
    }
    return students;
  }, [allProfiles, selectedClassFilter, studentSearchQuery]);

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
        Gestion des Élèves
      </h1>
      <p className="text-lg text-muted-foreground mb-8">
        Recherchez des élèves et gérez leurs affectations aux classes.
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" /> Élèves
          </CardTitle>
          <CardDescription>Recherchez des élèves par nom d'utilisateur et affectez-les à des classes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <h3 className="text-lg font-semibold">Affecter un élève à une classe</h3>
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

          <h3 className="text-lg font-semibold mt-6">Liste de tous les élèves</h3>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, email ou @username..."
                className="pl-10"
                value={studentSearchQuery}
                onChange={(e) => setStudentSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex-shrink-0 sm:w-1/3">
              <Label htmlFor="class-filter">Filtrer par Classe</Label>
              <Select value={selectedClassFilter || "all"} onValueChange={(value) => {
                setSelectedClassFilter(value === "all" ? null : value);
                setSearchParams(params => {
                  if (value === "all") {
                    params.delete('classId');
                  } else {
                    params.set('classId', value);
                  }
                  return params;
                }, { replace: true });
              }}>
                <SelectTrigger id="class-filter">
                  <SelectValue placeholder="Toutes les classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les classes</SelectItem>
                  {classes.map(cls => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name} ({getCurriculumName(cls.curriculum_id)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            {studentsToDisplay.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                {studentSearchQuery.trim() === '' && !selectedClassFilter
                  ? "Aucun élève à afficher. Utilisez la recherche ou les filtres."
                  : "Aucun élève trouvé pour votre recherche ou vos filtres."}
              </p>
            ) : (
              studentsToDisplay.map((profile) => (
                <Card key={profile.id} className="p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="flex-grow">
                    <p className="font-medium">{profile.first_name} {profile.last_name} <span className="text-sm text-muted-foreground">(@{profile.username})</span></p>
                    <p className="text-sm text-muted-foreground">{profile.email}</p>
                    {profile.class_id && (
                      <p className="text-xs text-muted-foreground">
                        Classe: {getClassName(profile.class_id)} (Cursus: {getCurriculumName(classes.find(c => c.id === profile.class_id)?.curriculum_id)})
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
                    <Select
                      value={profile.class_id || ""}
                      onValueChange={async (classId) => {
                        if (classId) {
                          try {
                            const updatedProfile = await updateProfile({ id: profile.id, class_id: classId });
                            if (updatedProfile) {
                              setAllProfiles(await getAllProfiles());
                              showSuccess(`Élève ${updatedProfile.first_name} ${updatedProfile.last_name} affecté à la classe ${getClassName(classId)} !`);
                            } else {
                              showError("Échec de l'affectation de l'élève.");
                            }
                          } catch (error: any) {
                            console.error("Error assigning student to class:", error);
                            showError(`Erreur lors de l'affectation de l'élève: ${error.message}`);
                          }
                        }
                      }}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Changer de classe" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map(cls => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.name} ({getCurriculumName(cls.curriculum_id)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {profile.class_id && (
                      <Button variant="outline" size="sm" onClick={() => handleRemoveStudentFromClass(profile.id)}>
                        <UserX className="h-4 w-4 mr-1" /> Retirer
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => handleSendMessageToStudent(profile)}>
                      <Mail className="h-4 w-4 mr-1" /> Message
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteStudent(profile.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentManagementPage;