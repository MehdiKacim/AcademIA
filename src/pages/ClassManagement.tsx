import React, { useState, useEffect } from 'react';
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
import { PlusCircle, Edit, Trash2, Users, School, BookOpen, GraduationCap, Mail } from "lucide-react";
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
import { dummyStudents, saveStudents, addStudent, deleteStudent, updateStudent } from '@/lib/studentData'; // Importation des fonctions CRUD pour les élèves
import { useCourseChat } from '@/contexts/CourseChatContext'; // Pour envoyer des messages à AiA

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

  // États pour les formulaires d'ajout/édition
  const [newEstablishmentName, setNewEstablishmentName] = useState('');
  const [newClassName, setNewClassName] = useState('');
  const [newCurriculumName, setNewCurriculumName] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [selectedClassForStudent, setSelectedClassForStudent] = useState<string | undefined>(undefined);


  useEffect(() => {
    setEstablishments(loadData<Establishment>(LOCAL_STORAGE_ESTABLISHMENTS_KEY, [{ id: 'est1', name: 'École Primaire Alpha' }]));
    setClasses(loadData<Class>(LOCAL_STORAGE_CLASSES_KEY, [{ id: 'class1', name: 'CE1 A', establishmentId: 'est1', studentIds: ['student1', 'student2'] }, { id: 'class2', name: 'CE2 B', establishmentId: 'est1', studentIds: ['student3'] }]));
    setCurricula(loadData<Curriculum>(LOCAL_STORAGE_CURRICULA_KEY, [{ id: 'cur1', name: 'Cursus Fondamental', courseIds: ['1', '2'] }]));
    setCurrentStudents(dummyStudents); // Charger les élèves depuis la variable exportée
  }, []);

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
    // Supprimer aussi les classes liées à cet établissement
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
    // Mettre à jour les élèves qui étaient dans cette classe
    const updatedStudents = currentStudents.map(student =>
      student.classId === id ? { ...student, classId: undefined } : student
    );
    saveStudents(updatedStudents); // Sauvegarder les élèves mis à jour
    setCurrentStudents(updatedStudents); // Mettre à jour l'état local des élèves
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
    // Il faudrait aussi mettre à jour les classes qui utilisaient ce cursus
    showSuccess("Cursus supprimé !");
  };

  const handleAddStudent = () => {
    if (newStudentName.trim() && newStudentEmail.trim()) {
      const newStudentId = `student${Date.now()}`;
      const newStu: Student = {
        id: newStudentId,
        name: newStudentName.trim(),
        email: newStudentEmail.trim(),
        classId: selectedClassForStudent,
        establishmentId: selectedClassForStudent ? classes.find(c => c.id === selectedClassForStudent)?.establishmentId : undefined,
        enrolledCoursesProgress: [],
      };
      const updatedStudents = addStudent(newStu); // Utilise la fonction addStudent de studentData.ts
      setCurrentStudents(updatedStudents);
      setNewStudentName('');
      setNewStudentEmail('');
      setSelectedClassForStudent(undefined);
      showSuccess("Élève ajouté !");
    } else {
      showError("Le nom et l'email de l'élève sont requis.");
    }
  };

  const handleDeleteStudent = (id: string) => {
    const updatedStudents = deleteStudent(id); // Utilise la fonction deleteStudent de studentData.ts
    setCurrentStudents(updatedStudents);
    showSuccess("Élève supprimé !");
  };

  const handleAssignStudentToClass = (studentId: string, classId: string) => {
    const studentToUpdate = currentStudents.find(s => s.id === studentId);
    if (studentToUpdate) {
      const updatedStudent = {
        ...studentToUpdate,
        classId: classId,
        establishmentId: classes.find(c => c.id === classId)?.establishmentId,
      };
      const updatedStudents = updateStudent(updatedStudent); // Utilise la fonction updateStudent
      setCurrentStudents(updatedStudents);

      // Mettre à jour la liste des élèves dans la classe
      const updatedClasses = classes.map(cls => {
        if (cls.id === classId && !cls.studentIds.includes(studentId)) {
          return { ...cls, studentIds: [...cls.studentIds, studentId] };
        }
        // Si l'élève était dans une autre classe, le retirer de cette classe
        if (cls.id !== classId && cls.studentIds.includes(studentId)) {
          return { ...cls, studentIds: cls.studentIds.filter(id => id !== studentId) };
        }
        return cls;
      });
      saveData(LOCAL_STORAGE_CLASSES_KEY, updatedClasses);
      setClasses(updatedClasses);
      showSuccess(`Élève affecté à la classe !`);
    }
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

  const handleInviteStudentToCourse = (student: Student, courseTitle: string) => {
    openChat(`Bonjour ${student.name}, je vous invite à découvrir le cours "${courseTitle}" !`);
  };

  const handleSendMessageToStudent = (student: Student) => {
    openChat(`Bonjour ${student.name}, j'ai une question ou un message pour vous.`);
  };


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
        <TabsList className="grid w-full grid-cols-4"> {/* Augmenté à 4 colonnes */}
          <TabsTrigger value="establishments">
            <School className="h-4 w-4 mr-2" /> Établissements
          </TabsTrigger>
          <TabsTrigger value="classes">
            <Users className="h-4 w-4 mr-2" /> Classes
          </TabsTrigger>
          <TabsTrigger value="curricula">
            <BookOpen className="h-4 w-4 mr-2" /> Cursus
          </TabsTrigger>
          <TabsTrigger value="students"> {/* Nouvel onglet Élèves */}
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
                            {/* Bouton pour gérer les élèves de la classe (à implémenter plus tard) */}
                            <Button variant="outline" size="sm" onClick={() => console.log('Gérer élèves de la classe', cls.id)}>
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

        <TabsContent value="students" className="mt-4"> {/* Contenu du nouvel onglet Élèves */}
          <Card>
            <CardHeader>
              <CardTitle>Gérer les Élèves</CardTitle>
              <CardDescription>Invitez de nouveaux élèves et gérez leurs affectations.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <h3 className="text-lg font-semibold">Inviter un nouvel élève</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <Input
                  placeholder="Nom de l'élève"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                />
                <Input
                  type="email"
                  placeholder="Email de l'élève"
                  value={newStudentEmail}
                  onChange={(e) => setNewStudentEmail(e.target.value)}
                />
                {/* Sélecteur de classe pour le nouvel élève */}
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={selectedClassForStudent || ''}
                  onChange={(e) => setSelectedClassForStudent(e.target.value || undefined)}
                >
                  <option value="">-- Choisir une classe (optionnel) --</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>{cls.name} ({establishments.find(e => e.id === cls.establishmentId)?.name})</option>
                  ))}
                </select>
              </div>
              <Button onClick={handleAddStudent} className="w-full">
                <PlusCircle className="h-4 w-4 mr-2" /> Inviter l'élève
              </Button>

              <h3 className="text-lg font-semibold mt-6">Liste des élèves</h3>
              <div className="space-y-2">
                {currentStudents.length === 0 ? (
                  <p className="text-muted-foreground">Aucun élève enregistré pour le moment.</p>
                ) : (
                  currentStudents.map((student) => (
                    <Card key={student.id} className="p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div className="flex-grow">
                        <p className="font-medium">{student.name}</p>
                        <p className="text-sm text-muted-foreground">{student.email}</p>
                        {student.classId && (
                          <p className="text-xs text-muted-foreground">
                            Classe: {classes.find(cls => cls.id === student.classId)?.name}
                            {student.establishmentId && ` (${establishments.find(est => est.id === student.establishmentId)?.name})`}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
                        {/* Affecter/Retirer de la classe */}
                        {student.classId ? (
                          <Button variant="outline" size="sm" onClick={() => handleRemoveStudentFromClass(student.id, student.classId!)}>
                            <Users className="h-4 w-4 mr-1" /> Retirer de la classe
                          </Button>
                        ) : (
                          <select
                            className="flex h-9 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value="" // Valeur vide pour forcer la sélection
                            onChange={(e) => handleAssignStudentToClass(student.id, e.target.value)}
                          >
                            <option value="">Affecter à une classe</option>
                            {classes.map(cls => (
                              <option key={cls.id} value={cls.id}>{cls.name} ({establishments.find(e => e.id === cls.establishmentId)?.name})</option>
                            ))}
                          </select>
                        )}

                        {/* Envoyer un message */}
                        <Button variant="outline" size="sm" onClick={() => handleSendMessageToStudent(student)}>
                          <Mail className="h-4 w-4 mr-1" /> Message
                        </Button>
                        {/* Supprimer l'élève */}
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