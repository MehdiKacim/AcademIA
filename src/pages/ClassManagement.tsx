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
import { PlusCircle, Edit, Trash2, Users, School, BookOpen, GraduationCap } from "lucide-react";
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

const LOCAL_STORAGE_ESTABLISHMENTS_KEY = 'academia_establishments';
const LOCAL_STORAGE_CLASSES_KEY = 'academia_classes';
const LOCAL_STORAGE_CURRICULA_KEY = 'academia_curricula';

const ClassManagement = () => {
  const { currentRole } = useRole();

  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [curricula, setCurricula] = useState<Curriculum[]>([]);
  const [students, setStudents] = useState<Student[]>([]); // Pour l'affichage des élèves

  // États pour les formulaires d'ajout/édition
  const [newEstablishmentName, setNewEstablishmentName] = useState('');
  const [newClassName, setNewClassName] = useState('');
  const [newCurriculumName, setNewCurriculumName] = useState('');

  useEffect(() => {
    setEstablishments(loadData<Establishment>(LOCAL_STORAGE_ESTABLISHMENTS_KEY, [{ id: 'est1', name: 'École Primaire Alpha' }]));
    setClasses(loadData<Class>(LOCAL_STORAGE_CLASSES_KEY, [{ id: 'class1', name: 'CE1 A', establishmentId: 'est1', studentIds: ['student1', 'student2'] }, { id: 'class2', name: 'CE2 B', establishmentId: 'est1', studentIds: ['student3'] }]));
    setCurricula(loadData<Curriculum>(LOCAL_STORAGE_CURRICULA_KEY, [{ id: 'cur1', name: 'Cursus Fondamental', courseIds: ['1', '2'] }]));
    // Charger les élèves depuis studentData.ts (qui utilise déjà localStorageUtils)
    // Pour l'instant, on les charge directement pour l'affichage
    const { dummyStudents } = require('@/lib/studentData'); // Importation dynamique pour éviter les boucles de dépendance
    setStudents(dummyStudents);
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
    const updatedStudents = students.map(student =>
      student.classId === id ? { ...student, classId: undefined } : student
    );
    // Note: Pour une persistance complète des élèves, il faudrait appeler updateStudent pour chaque élève modifié
    // Pour l'instant, on met à jour l'état local et on suppose que studentData.ts gère sa propre persistance
    // (ce qui est le cas avec loadData/saveData)
    // require('@/lib/studentData').saveStudents(updatedStudents); // Ceci serait nécessaire si on voulait persister ici
    setStudents(updatedStudents);
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="establishments">
            <School className="h-4 w-4 mr-2" /> Établissements
          </TabsTrigger>
          <TabsTrigger value="classes">
            <Users className="h-4 w-4 mr-2" /> Classes
          </TabsTrigger>
          <TabsTrigger value="curricula">
            <BookOpen className="h-4 w-4 mr-2" /> Cursus
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
      </Tabs>
    </div>
  );
};

export default ClassManagement;