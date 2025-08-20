import React, { useState, useEffect, useRef } from 'react';
import { useRole } from "@/contexts/RoleContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Edit, Trash2, Users, School, BookOpen, GraduationCap, Mail, ArrowLeft, Search, UserCheck, UserX, Loader2 } from "lucide-react"; // Import Loader2
import {
  Establishment,
  Class,
  Curriculum,
  Student,
} from "@/lib/dataModels";
import {
  loadData,
  saveData,
  addData,
  updateData,
  deleteData,
} from "@/lib/localStorageUtils";
import { showSuccess, showError } from "@/utils/toast";
import { dummyStudents, saveStudents, addStudent, deleteStudent, updateStudent, getStudentById } from '@/lib/studentData';
import { useCourseChat } from '@/contexts/CourseChatContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const LOCAL_STORAGE_ESTABLISHMENTS_KEY = 'academia_establishments';
const LOCAL_STORAGE_CLASSES_KEY = 'academia_classes';
const LOCAL_STORAGE_CURRICULA_KEY = 'academia_curricula';

const ClassManagement = () => {
  const { currentRole } = useRole();
  const { openChat } = useCourseChat();

  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [curricula, setCurricula] = useState<Curriculum[]>([]);
  const [currentStudents, setCurrentStudents] = useState<Student[]>([]);
  const [selectedClassIdForStudents, setSelectedClassIdForStudents] = useState<string | null>(null);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');

  // States for add/edit forms (existing ones)
  const [newEstablishmentName, setNewEstablishmentName] = useState('');
  const [newClassName, setNewClassName] = useState('');
  const [newCurriculumName, setNewCurriculumName] = useState('');

  // New states for student assignment
  const [usernameToAssign, setUsernameToAssign] = useState('');
  const [foundStudent, setFoundStudent] = useState<Student | null>(null);
  const [classToAssign, setClassToAssign] = useState<string | undefined>(undefined);
  const [isSearchingStudent, setIsSearchingStudent] = useState(false); // New loading state for search
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null); // Debounce ref

  useEffect(() => {
    setEstablishments(loadData<Establishment>(LOCAL_STORAGE_ESTABLISHMENTS_KEY, [{ id: 'est1', name: 'École Primaire Alpha' }]));
    setClasses(loadData<Class>(LOCAL_STORAGE_CLASSES_KEY, [{ id: 'class1', name: 'CE1 A', establishmentId: 'est1', studentIds: ['student1', 'student2'] }, { id: 'class2', name: 'CE2 B', establishmentId: 'est1', studentIds: ['student3'] }]));
    setCurricula(loadData<Curriculum>(LOCAL_STORAGE_CURRICULA_KEY, [{ id: 'cur1', name: 'Cursus Fondamental', courseIds: ['1', '2'] }]));
    setCurrentStudents(dummyStudents); // Ensure this is always up-to-date
  }, []);

  // Debounced search effect for usernameToAssign
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    if (usernameToAssign.trim() === '') {
      setFoundStudent(null);
      setIsSearchingStudent(false);
      return;
    }

    setIsSearchingStudent(true);
    setFoundStudent(null); // Clear previous result

    debounceTimeoutRef.current = setTimeout(() => {
      const student = dummyStudents.find(s => s.username.toLowerCase() === usernameToAssign.trim().toLowerCase());
      setFoundStudent(student || null);
      setIsSearchingStudent(false);
      if (!student) {
        showError("Aucun élève trouvé avec ce nom d'utilisateur.");
      }
    }, 500); // 500ms debounce

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [usernameToAssign]);


  const handleAddEstablishment = () => {
    if (newEstablishmentName.trim()) {
      const newEst: Establishment = { id: `est${Date.now()}`, name: newEstablishmentName.trim() };
      setEstablishments(prev => addData(LOCAL_STORAGE_ESTABLISHMENTS_KEY, newEst));
      setNewEstablishmentName('');
      showSuccess("Établissement ajouté !");
    } else {
      showError("Le nom de l'établissement est requis.");
    }
  };

  const handleDeleteEstablishment = (id: string) => {
    setEstablishments(prev => deleteData(LOCAL_STORAGE_ESTABLISHMENTS_KEY, id));
    const updatedClasses = classes.filter(cls => cls.establishmentId !== id);
    saveData(LOCAL_STORAGE_CLASSES_KEY, updatedClasses);
    setClasses(updatedClasses);
    showSuccess("Établissement supprimé !");
  };

  const handleAddClass = (establishmentId: string) => {
    if (newClassName.trim()) {
      const newCls: Class = { id: `class${Date.now()}`, name: newClassName.trim(), establishmentId, studentIds: [] };
      setClasses(prev => addData(LOCAL_STORAGE_CLASSES_KEY, newCls));
      setNewClassName('');
      showSuccess("Classe ajoutée !");
    } else {
      showError("Le nom de la classe est requis.");
    }
  };

  const handleDeleteClass = (id: string) => {
    setClasses(prev => deleteData(LOCAL_STORAGE_CLASSES_KEY, id));
    const updatedStudents = currentStudents.map(student =>
      student.classId === id ? { ...student, classId: undefined } : student
    );
    saveStudents(updatedStudents);
    setCurrentStudents(updatedStudents);
    showSuccess("Classe supprimée !");
  };

  const handleAddCurriculum = () => {
    if (newCurriculumName.trim()) {
      const newCur: Curriculum = { id: `cur${Date.now()}`, name: newCurriculumName.trim(), courseIds: [] };
      setCurricula(prev => addData(LOCAL_STORAGE_CURRICULA_KEY, newCur));
      setNewCurriculumName('');
      showSuccess("Cursus ajouté !");
    } else {
      showError("Le nom du cursus est requis.");
    }
  };

  const handleDeleteCurriculum = (id: string) => {
    setCurricula(prev => deleteData(LOCAL_STORAGE_CURRICULA_KEY, id));
    showSuccess("Cursus supprimé !");
  };

  const handleAssignStudentToClass = () => {
    if (!foundStudent) {
      showError("Veuillez d'abord rechercher un élève.");
      return;
    }
    if (!classToAssign) {
      showError("Veuillez sélectionner une classe.");
      return;
    }

    if (foundStudent.classId === classToAssign) {
      showError("Cet élève est déjà dans cette classe.");
      return;
    }

    // Remove from old class if any
    if (foundStudent.classId) {
      const oldClass = classes.find(cls => cls.id === foundStudent.classId);
      if (oldClass) {
        const updatedOldClass = { ...oldClass, studentIds: oldClass.studentIds.filter(id => id !== foundStudent.id) };
        setClasses(prev => prev.map(cls => cls.id === oldClass.id ? updatedOldClass : cls));
        saveData(LOCAL_STORAGE_CLASSES_KEY, classes.map(cls => cls.id === oldClass.id ? updatedOldClass : cls));
      }
    }

    // Add to new class
    const newClass = classes.find(cls => cls.id === classToAssign);
    if (newClass) {
      const updatedNewClass = { ...newClass, studentIds: [...newClass.studentIds, foundStudent.id] };
      setClasses(prev => prev.map(cls => cls.id === newClass.id ? updatedNewClass : cls));
      saveData(LOCAL_STORAGE_CLASSES_KEY, classes.map(cls => cls.id === newClass.id ? updatedNewClass : cls));
    }

    const updatedStudent = {
      ...foundStudent,
      classId: classToAssign,
      establishmentId: classes.find(c => c.id === classToAssign)?.establishmentId,
    };
    const updatedStudents = updateStudent(updatedStudent);
    setCurrentStudents(updatedStudents);

    showSuccess(`Élève ${foundStudent.firstName} ${foundStudent.lastName} affecté à la classe ${newClass?.name} !`);
    setUsernameToAssign('');
    setFoundStudent(null);
    setClassToAssign(undefined);
  };

  const handleRemoveStudentFromClass = (studentId: string, classId: string) => {
    const studentToUpdate = currentStudents.find(s => s.id === studentId);
    if (studentToUpdate) {
      const updatedStudent = {
        ...studentToUpdate,
        classId: undefined,
        establishmentId: undefined,
      };
      const updatedStudents = updateStudent(updatedStudent);
      setCurrentStudents(updatedStudents);

      const updatedClasses = classes.map(cls => {
        if (cls.id === classId) {
          return { ...cls, studentIds: cls.studentIds.filter(id => id !== studentId) };
        }
        return cls;
      });
      saveData(LOCAL_STORAGE_CLASSES_KEY, updatedClasses);
      setClasses(updatedClasses);
      showSuccess(`Élève retiré de la classe !`);
    }
  };

  const handleDeleteStudent = (id: string) => {
    const updatedStudents = deleteStudent(id);
    setCurrentStudents(updatedStudents);
    showSuccess("Élève supprimé !");
  };

  const handleInviteStudentToCourse = (student: Student, courseTitle: string) => {
    openChat(`Bonjour ${student.firstName} ${student.lastName}, je vous invite à découvrir le cours "${courseTitle}" !`);
  };

  const handleSendMessageToStudent = (student: Student) => {
    openChat(`Bonjour ${student.firstName} ${student.lastName}, j'ai une question ou un message pour vous.`);
  };

  const handleViewStudentsInClass = (classId: string) => {
    setSelectedClassIdForStudents(classId);
  };

  const handleBackToClasses = () => {
    setSelectedClassIdForStudents(null);
  };

  const selectedClass = selectedClassIdForStudents ? classes.find(cls => cls.id === selectedClassIdForStudents) : null;
  const studentsInSelectedClass = selectedClass ? currentStudents.filter(student => student.classId === selectedClass.id) : [];

  const filteredStudents = currentStudents.filter(student =>
    student.firstName.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
    student.lastName.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
    student.username.toLowerCase().includes(studentSearchQuery.toLowerCase().replace('@', '')) ||
    student.email.toLowerCase().includes(studentSearchQuery.toLowerCase())
  );

  if (currentRole !== 'creator') {
    return (
      <div className="text-center py-20">
        <h1 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
          Accès Restreint
        </h1>
        <p className="text-lg text-muted-foreground">
          Seuls les créateurs (professeurs) peuvent accéder à cette page pour gérer les classes.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
        Gestion des Établissements et Classes
      </h1>
      <p className="text-lg text-muted-foreground">
        En tant que professeur, gérez vos établissements, classes, cursus et élèves.
      </p>

      <Tabs defaultValue="establishments" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="establishments">
            <School className="h-4 w-4 mr-2" /> Établissements
          </TabsTrigger>
          <TabsTrigger value="classes">
            <Users className="h-4 w-4 mr-2" /> Classes
          </TabsTrigger>
          <TabsTrigger value="curricula">
            <BookOpen className="h-4 w-4 mr-2" /> Cursus
          </TabsTrigger>
          <TabsTrigger value="students">
            <GraduationCap className="h-4 w-4 mr-2" /> Élèves
          </TabsTrigger>
        </TabsList>

        <TabsContent value="establishments" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Gérer les Établissements</CardTitle>
              <CardDescription>Ajoutez, modifiez ou supprimez des établissements.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Nom du nouvel établissement"
                  value={newEstablishmentName}
                  onChange={(e) => setNewEstablishmentName(e.target.value)}
                />
                <Button onClick={handleAddEstablishment}>
                  <PlusCircle className="h-4 w-4 mr-2" /> Ajouter
                </Button>
              </div>
              <div className="space-y-2">
                {establishments.map((est) => (
                  <div key={est.id} className="flex items-center justify-between p-3 border rounded-md">
                    <span>{est.name}</span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => console.log('Modifier établissement', est.id)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteEstablishment(est.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="classes" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Gérer les Classes</CardTitle>
              <CardDescription>Ajoutez, modifiez ou supprimez des classes et gérez leurs élèves.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {establishments.length === 0 ? (
                <p className="text-muted-foreground">Veuillez d'abord créer un établissement.</p>
              ) : (
                establishments.map(est => (
                  <Card key={est.id} className="p-4 space-y-3">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <School className="h-5 w-5 text-primary" /> {est.name}
                    </h3>
                    <div className="flex gap-2">
                      <Input
                        placeholder={`Nom de la nouvelle classe pour ${est.name}`}
                        value={newClassName}
                        onChange={(e) => setNewClassName(e.target.value)}
                      />
                      <Button onClick={() => handleAddClass(est.id)}>
                        <PlusCircle className="h-4 w-4 mr-2" /> Ajouter Classe
                      </Button>
                    </div>
                    <div className="space-y-2 pl-4 border-l">
                      {classes.filter(cls => cls.establishmentId === est.id).map(cls => (
                        <div key={cls.id} className="flex items-center justify-between p-3 border rounded-md bg-muted/20">
                          <span>{cls.name} ({cls.studentIds.length} élèves)</span>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleViewStudentsInClass(cls.id)}>
                              <GraduationCap className="h-4 w-4 mr-1" /> Élèves
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => console.log('Modifier classe', cls.id)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => handleDeleteClass(cls.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                ))
              )}
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
                    <Card key={student.id} className="p-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{student.firstName} {student.lastName} (@{student.username})</p>
                        <p className="text-sm text-muted-foreground">{student.email}</p>
                      </div>
                      <div className="flex gap-2">
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
        </TabsContent>

        <TabsContent value="curricula" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Gérer les Cursus Scolaires</CardTitle>
              <CardDescription>Créez et gérez des ensembles de cours pour vos classes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Nom du nouveau cursus"
                  value={newCurriculumName}
                  onChange={(e) => setNewCurriculumName(e.target.value)}
                />
                <Button onClick={handleAddCurriculum}>
                  <PlusCircle className="h-4 w-4 mr-2" /> Ajouter
                </Button>
              </div>
              <div className="space-y-2">
                {curricula.map((cur) => (
                  <div key={cur.id} className="flex items-center justify-between p-3 border rounded-md">
                    <span>{cur.name} ({cur.courseIds.length} cours)</span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => console.log('Gérer cours du cursus', cur.id)}>
                        <BookOpen className="h-4 w-4 mr-1" /> Cours
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => console.log('Modifier cursus', cur.id)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteCurriculum(cur.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Gérer les Élèves</CardTitle>
              <CardDescription>Recherchez des élèves par nom d'utilisateur et affectez-les à des classes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <h3 className="text-lg font-semibold">Affecter un élève à une classe</h3>
              <div className="relative flex gap-2">
                <Input
                  placeholder="Nom d'utilisateur de l'élève (ex: @john_doe)"
                  value={usernameToAssign}
                  onChange={(e) => setUsernameToAssign(e.target.value)}
                />
                {isSearchingStudent && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-muted-foreground" />
                )}
              </div>

              {foundStudent && (
                <div className="p-3 border rounded-md bg-muted/20 space-y-2">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-green-500" />
                    <p className="font-medium">Élève trouvé : {foundStudent.firstName} {foundStudent.lastName} (@{foundStudent.username})</p>
                  </div>
                  <p className="text-sm text-muted-foreground">Email : {foundStudent.email}</p>
                  {foundStudent.classId && (
                    <p className="text-sm text-muted-foreground">Actuellement dans : {classes.find(c => c.id === foundStudent.classId)?.name}</p>
                  )}
                  <div className="flex gap-2 mt-2">
                    <Select value={classToAssign} onValueChange={setClassToAssign}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Sélectionner une classe" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map(cls => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.name} ({establishments.find(e => e.id === cls.establishmentId)?.name})
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
              {!foundStudent && usernameToAssign.trim() && !isSearchingStudent && (
                <div className="p-3 border rounded-md bg-red-50/20 text-red-700 flex items-center gap-2">
                  <UserX className="h-5 w-5" />
                  <p>Aucun élève trouvé avec le nom d'utilisateur "{usernameToAssign}".</p>
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
                {filteredStudents.length === 0 ? (
                  <p className="text-muted-foreground">Aucun élève trouvé pour votre recherche.</p>
                ) : (
                  filteredStudents.map((student) => (
                    <Card key={student.id} className="p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div className="flex-grow">
                        <p className="font-medium">{student.firstName} {student.lastName} <span className="text-sm text-muted-foreground">(@{student.username})</span></p>
                        <p className="text-sm text-muted-foreground">{student.email}</p>
                        {student.classId && (
                          <p className="text-xs text-muted-foreground">
                            Classe: {classes.find(cls => cls.id === student.classId)?.name}
                            {student.establishmentId && ` (${establishments.find(est => est.id === student.establishmentId)?.name})`}
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
                            onChange={(e) => handleAssignStudentToClass(student.id, e.target.value)}
                          >
                            <option value="">Affecter à une classe</option>
                            {classes.map(cls => (
                              <option key={cls.id} value={cls.id}>{cls.name} ({establishments.find(e => e.id === cls.establishmentId)?.name})</option>
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClassManagement;