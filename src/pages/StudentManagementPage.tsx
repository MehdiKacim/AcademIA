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
import { Class, Student, User } from "@/lib/dataModels";
import { showSuccess, showError } from "@/utils/toast";
import {
  loadUsers,
  loadStudents,
  saveStudents,
  updateStudentProfile,
  deleteStudentProfile,
  getUserByUsername,
  getUserById,
} from '@/lib/studentData';
import { useCourseChat } from '@/contexts/CourseChatContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  loadClasses,
  loadCurricula,
  saveClasses,
} from '@/lib/courseData';

// Shadcn UI components for autocomplete
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRole } from '@/contexts/RoleContext';

const StudentManagementPage = () => {
  const { currentRole } = useRole();
  const { openChat } = useCourseChat();
  const [classes, setClasses] = useState<Class[]>([]);
  const [curricula, setCurricula] = useState(loadCurricula());
  const [users, setUsers] = useState<User[]>([]);
  const [studentProfiles, setStudentProfiles] = useState<Student[]>([]);

  // States for student assignment (autocomplete)
  const [usernameToAssign, setUsernameToAssign] = useState('');
  const [foundUserForAssignment, setFoundUserForAssignment] = useState<User | null>(null);
  const [classToAssign, setClassToAssign] = useState<string | undefined>(undefined);
  const [isSearchingUser, setIsSearchingUser] = useState(false);
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [openCommand, setOpenCommand] = useState(false);

  const [studentSearchQuery, setStudentSearchQuery] = useState('');

  useEffect(() => {
    setClasses(loadClasses());
    setCurricula(loadCurricula());
    setUsers(loadUsers());
    setStudentProfiles(loadStudents());
  }, []);

  const getClassName = (id?: string) => classes.find(c => c.id === id)?.name || 'N/A';
  const getCurriculumName = (id?: string) => curricula.find(c => c.id === id)?.name || 'N/A';
  const getUserFullName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : 'N/A';
  };
  const getUserUsername = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? user.username : 'N/A';
  };
  const getUserEmail = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? user.email : 'N/A';
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

    debounceTimeoutRef.current = setTimeout(() => {
      const user = getUserByUsername(usernameToAssign.trim());
      setFoundUserForAssignment(user || null);
      setIsSearchingUser(false);
    }, 500);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [usernameToAssign]);

  const handleAssignStudentToClass = () => {
    if (!foundUserForAssignment) {
      showError("Veuillez d'abord sélectionner un élève.");
      return;
    }
    if (!classToAssign) {
      showError("Veuillez sélectionner une classe.");
      return;
    }

    const studentProfile = studentProfiles.find(s => s.userId === foundUserForAssignment.id);
    if (!studentProfile) {
      showError("Le profil étudiant de cet utilisateur n'existe pas.");
      return;
    }

    if (studentProfile.classId === classToAssign) {
      showError("Cet élève est déjà dans cette classe.");
      return;
    }

    // Remove from old class if any
    if (studentProfile.classId) {
      const oldClass = classes.find(cls => cls.id === studentProfile.classId);
      if (oldClass) {
        const updatedOldClass = { ...oldClass, studentIds: oldClass.studentIds.filter(id => id !== studentProfile.id) };
        setClasses(prev => prev.map(cls => cls.id === oldClass.id ? updatedOldClass : cls));
        saveClasses(classes.map(cls => cls.id === oldClass.id ? updatedOldClass : cls));
      }
    }

    // Add to new class
    const newClass = classes.find(cls => cls.id === classToAssign);
    if (newClass) {
      const updatedNewClass = { ...newClass, studentIds: [...newClass.studentIds, studentProfile.id] };
      setClasses(prev => prev.map(cls => cls.id === newClass.id ? updatedNewClass : cls));
      saveClasses(classes.map(cls => cls.id === newClass.id ? updatedNewClass : cls));
    }

    const updatedStudentProfile = {
      ...studentProfile,
      classId: classToAssign,
    };
    setStudentProfiles(updateStudentProfile(updatedStudentProfile));

    showSuccess(`Élève ${foundUserForAssignment.firstName} ${foundUserForAssignment.lastName} affecté à la classe ${newClass?.name} !`);
    setUsernameToAssign('');
    setFoundUserForAssignment(null);
    setClassToAssign(undefined);
    setOpenCommand(false);
  };

  const handleRemoveStudentFromClass = (studentProfileId: string, classId: string) => {
    const studentToUpdate = studentProfiles.find(s => s.id === studentProfileId);
    if (studentToUpdate) {
      const updatedStudent = {
        ...studentToUpdate,
        classId: undefined,
      };
      setStudentProfiles(updateStudentProfile(updatedStudent));

      const updatedClasses = classes.map(cls => {
        if (cls.id === classId) {
          return { ...cls, studentIds: cls.studentIds.filter(id => id !== studentProfileId) };
        }
        return cls;
      });
      saveClasses(updatedClasses);
      setClasses(updatedClasses);
      showSuccess(`Élève retiré de la classe !`);
    }
  };

  const handleDeleteStudent = (studentProfileId: string) => {
    const studentProfileToDelete = studentProfiles.find(s => s.id === studentProfileId);
    if (!studentProfileToDelete) return;

    // Delete the student profile
    setStudentProfiles(deleteStudentProfile(studentProfileId));

    // Remove student profile from any classes they might be in
    const updatedClasses = classes.map(cls => ({
      ...cls,
      studentIds: cls.studentIds.filter(id => id !== studentProfileId)
    }));
    saveClasses(updatedClasses);
    setClasses(updatedClasses);

    showSuccess("Élève supprimé !");
  };

  const handleSendMessageToStudent = (studentProfile: Student) => {
    const user = users.find(u => u.id === studentProfile.userId);
    if (user) {
      openChat(`Bonjour ${user.firstName} ${user.lastName}, j'ai une question ou un message pour vous.`);
    }
  };

  const filteredUsersForDropdown = usernameToAssign.trim() === ''
    ? []
    : users.filter(u =>
        u.role === 'student' &&
        (u.username.toLowerCase().includes(usernameToAssign.toLowerCase()) ||
        u.firstName.toLowerCase().includes(usernameToAssign.toLowerCase()) ||
        u.lastName.toLowerCase().includes(usernameToAssign.toLowerCase()))
      ).slice(0, 10);

  const filteredStudentProfiles = studentProfiles.filter(student => {
    const user = getUserById(student.userId);
    if (!user) return false;
    const lowerCaseQuery = studentSearchQuery.toLowerCase();
    return user.firstName.toLowerCase().includes(lowerCaseQuery) ||
           user.lastName.toLowerCase().includes(lowerCaseQuery) ||
           user.username.toLowerCase().includes(lowerCaseQuery.replace('@', '')) ||
           user.email.toLowerCase().includes(lowerCaseQuery);
  });

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
        Recherchez des élèves par nom d'utilisateur et affectez-les à des classes.
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
                  {foundUserForAssignment ? `${foundUserForAssignment.firstName} ${foundUserForAssignment.lastName} (@${foundUserForAssignment.username})` : "Rechercher un élève..."}
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
                      {filteredUsersForDropdown.map((user) => (
                        <CommandItem
                          key={user.id}
                          value={user.username}
                          onSelect={() => {
                            setFoundUserForAssignment(user);
                            setUsernameToAssign(user.username);
                            setOpenCommand(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              foundUserForAssignment?.id === user.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {user.firstName} {user.lastName} (@{user.username})
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
                <p className="font-medium">Élève sélectionné : {getUserFullName(foundUserForAssignment.id)} <span className="text-sm text-muted-foreground">(@{getUserUsername(foundUserForAssignment.id)})</span></p>
              </div>
              <p className="text-sm text-muted-foreground">Email : {getUserEmail(foundUserForAssignment.id)}</p>
              {studentProfiles.find(s => s.userId === foundUserForAssignment.id)?.classId && (
                <p className="text-sm text-muted-foreground">Actuellement dans : {getClassName(studentProfiles.find(s => s.userId === foundUserForAssignment.id)?.classId)} (Cursus: {getCurriculumName(classes.find(c => c.id === studentProfiles.find(s => s.userId === foundUserForAssignment.id)?.classId)?.curriculumId)})</p>
              )}
              <div className="flex gap-2 mt-2">
                <Select value={classToAssign} onValueChange={setClassToAssign}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Sélectionner une classe" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map(cls => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name} ({getCurriculumName(cls.curriculumId)})
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
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom, email ou @username..."
              className="pl-10"
              value={studentSearchQuery}
              onChange={(e) => setStudentSearchQuery(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            {filteredStudentProfiles.length === 0 ? (
              <p className="text-muted-foreground">Aucun élève trouvé pour votre recherche.</p>
            ) : (
              filteredStudentProfiles.map((student) => (
                <Card key={student.id} className="p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="flex-grow">
                    <p className="font-medium">{getUserFullName(student.userId)} <span className="text-sm text-muted-foreground">(@{getUserUsername(student.userId)})</span></p>
                    <p className="text-sm text-muted-foreground">{getUserEmail(student.userId)}</p>
                    {student.classId && (
                      <p className="text-xs text-muted-foreground">
                        Classe: {getClassName(student.classId)} (Cursus: {getCurriculumName(classes.find(c => c.id === student.classId)?.curriculumId)})
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
                    {student.classId ? (
                      <Button variant="outline" size="sm" onClick={() => handleRemoveStudentFromClass(student.id, student.classId!)}>
                        <Users className="h-4 w-4 mr-1" /> Retirer de la classe
                      </Button>
                    ) : (
                      <select
                        className="flex h-9 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value=""
                        onChange={(e) => {
                          const classId = e.target.value;
                          if (classId) {
                            const studentToAssign = studentProfiles.find(s => s.id === student.id);
                            if (studentToAssign) {
                              const updatedStudent = { ...studentToAssign, classId: classId };
                              setStudentProfiles(updateStudentProfile(updatedStudent));

                              const targetClass = classes.find(cls => cls.id === classId);
                              if (targetClass) {
                                const updatedTargetClass = { ...targetClass, studentIds: [...targetClass.studentIds, student.id] };
                                setClasses(prev => prev.map(cls => cls.id === targetClass.id ? updatedTargetClass : cls));
                                saveClasses(classes.map(cls => cls.id === targetClass.id ? updatedTargetClass : cls));
                              }
                              showSuccess(`Élève ${getUserFullName(student.userId)} affecté à la classe ${getClassName(classId)} !`);
                            }
                          }
                        }}
                      >
                        <option value="">Affecter à une classe</option>
                        {classes.map(cls => (
                          <option key={cls.id} value={cls.id}>{cls.name} ({getCurriculumName(cls.curriculumId)})</option>
                        ))}
                      </select>
                    )}

                    <Button variant="outline" size="sm" onClick={() => handleSendMessageToStudent(student)}>
                      <Mail className="h-4 w-4 mr-1" /> Message
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteStudent(student.id)}>
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