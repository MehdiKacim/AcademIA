import React, { useState, useEffect } from 'react';
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
import { PlusCircle, Edit, Trash2, CalendarDays, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { SchoolYear } from "@/lib/dataModels";
import { showSuccess, showError } from "@/utils/toast";
import {
  loadSchoolYears,
  addSchoolYear,
  updateSchoolYear,
  deleteSchoolYear,
  getActiveSchoolYear,
} from '@/lib/courseData';
import { useRole } from '@/contexts/RoleContext';
import { format, parseISO, addYears, addDays } from 'date-fns'; // Added addDays
import { fr } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from '@/lib/utils';
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge"; // Import Badge
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"; // Added Dialog imports

const SchoolYearManagementPage = () => {
  const { currentUserProfile, currentRole, isLoadingUser } = useRole();
  const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([]);
  const [newSchoolYearName, setNewSchoolYearName] = useState('');
  const [newSchoolYearStartDate, setNewSchoolYearStartDate] = useState<Date | undefined>(undefined);
  const [newSchoolYearEndDate, setNewSchoolYearEndDate] = useState<Date | undefined>(undefined);
  const [isCreatingYear, setIsCreatingYear] = useState(false);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentYearToEdit, setCurrentYearToEdit] = useState<SchoolYear | null>(null);
  const [editName, setEditName] = useState('');
  const [editStartDate, setEditStartDate] = useState<Date | undefined>(undefined);
  const [editEndDate, setEditEndDate] = useState<Date | undefined>(undefined);
  const [editIsActive, setEditIsActive] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setSchoolYears(await loadSchoolYears());
    };
    fetchData();
  }, []);

  const isAllowedToManage = currentRole === 'administrator' || currentRole === 'director' || currentRole === 'deputy_director';

  const handleAddSchoolYear = async () => {
    if (!currentUserProfile || !isAllowedToManage) {
      showError("Vous n'êtes pas autorisé à ajouter une année scolaire.");
      return;
    }
    if (!newSchoolYearName.trim() || !newSchoolYearStartDate || !newSchoolYearEndDate) {
      showError("Le nom, la date de début et la date de fin sont requis.");
      return;
    }
    if (newSchoolYearStartDate >= newSchoolYearEndDate) {
      showError("La date de fin doit être postérieure à la date de début.");
      return;
    }

    setIsCreatingYear(true);
    try {
      const newYear: Omit<SchoolYear, 'id' | 'created_at' | 'updated_at'> = {
        name: newSchoolYearName.trim(),
        start_date: newSchoolYearStartDate.toISOString().split('T')[0],
        end_date: newSchoolYearEndDate.toISOString().split('T')[0],
        is_active: true, // New year is always active by default
      };
      const addedYear = await addSchoolYear(newYear);
      if (addedYear) {
        setSchoolYears(await loadSchoolYears());
        setNewSchoolYearName('');
        setNewSchoolYearStartDate(undefined);
        setNewSchoolYearEndDate(undefined);
        showSuccess("Année scolaire créée et activée !");
      } else {
        showError("Échec de l'ajout de l'année scolaire.");
      }
    } catch (error: any) {
      console.error("Error adding school year:", error);
      showError(`Erreur lors de l'ajout de l'année scolaire: ${error.message}`);
    } finally {
      setIsCreatingYear(false);
    }
  };

  const handleDeleteSchoolYear = async (id: string) => {
    if (!currentUserProfile || !isAllowedToManage) {
      showError("Vous n'êtes pas autorisé à supprimer une année scolaire.");
      return;
    }
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette année scolaire ? Cette action est irréversible.")) {
      try {
        await deleteSchoolYear(id);
        setSchoolYears(await loadSchoolYears());
        showSuccess("Année scolaire supprimée !");
      } catch (error: any) {
        console.error("Error deleting school year:", error);
        showError(`Erreur lors de la suppression de l'année scolaire: ${error.message}`);
      }
    }
  };

  const handleEditSchoolYear = (year: SchoolYear) => {
    if (!currentUserProfile || !isAllowedToManage) {
      showError("Vous n'êtes pas autorisé à modifier une année scolaire.");
      return;
    }
    setCurrentYearToEdit(year);
    setEditName(year.name);
    setEditStartDate(parseISO(year.start_date));
    setEditEndDate(parseISO(year.end_date));
    setEditIsActive(year.is_active);
    setIsEditDialogOpen(true);
  };

  const handleSaveEditedSchoolYear = async () => {
    if (!currentUserProfile || !isAllowedToManage) {
      showError("Vous n'êtes pas autorisé à modifier une année scolaire.");
      return;
    }
    if (!currentYearToEdit) return;
    if (!editName.trim() || !editStartDate || !editEndDate) {
      showError("Le nom, la date de début et la date de fin sont requis.");
      return;
    }
    if (editStartDate >= editEndDate) {
      showError("La date de fin doit être postérieure à la date de début.");
      return;
    }

    setIsSavingEdit(true);
    try {
      const updatedYear: SchoolYear = {
        ...currentYearToEdit,
        name: editName.trim(),
        start_date: editStartDate.toISOString().split('T')[0],
        end_date: editEndDate.toISOString().split('T')[0],
        is_active: editIsActive,
      };
      const savedYear = await updateSchoolYear(updatedYear);
      if (savedYear) {
        setSchoolYears(await loadSchoolYears());
        showSuccess("Année scolaire mise à jour !");
        setIsEditDialogOpen(false);
        setCurrentYearToEdit(null);
      } else {
        showError("Échec de la mise à jour de l'année scolaire.");
      }
    } catch (error: any) {
      console.error("Error saving edited school year:", error);
      showError(`Erreur lors de la sauvegarde de l'année scolaire: ${error.message}`);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleGenerateNextYear = async () => {
    if (!currentUserProfile || !isAllowedToManage) {
      showError("Vous n'êtes pas autorisé à générer une année scolaire.");
      return;
    }
    const latestYear = schoolYears.length > 0 ? schoolYears[0] : null; // Assuming sorted by start_date DESC
    let nextStartDate: Date;
    let nextEndDate: Date;
    let nextName: string;

    if (latestYear) {
      const lastEndDate = parseISO(latestYear.end_date);
      nextStartDate = addDays(lastEndDate, 1); // Start the day after the previous year ended
      nextEndDate = addYears(nextStartDate, 1); // One year duration from the new start date
      nextEndDate = addDays(nextEndDate, -1); // Adjust to end on July 31st (one day before the next August 1st)
      nextName = `${format(nextStartDate, 'yyyy')}-${format(nextEndDate, 'yyyy')}`;
    } else {
      // If no years exist, start from August 1st of the current calendar year
      const currentCalendarYear = new Date().getFullYear();
      nextStartDate = new Date(currentCalendarYear, 7, 1); // August is month 7 (0-indexed)
      nextEndDate = new Date(currentCalendarYear + 1, 6, 31); // July is month 6 (0-indexed)
      nextName = `${currentCalendarYear}-${currentCalendarYear + 1}`;
    }

    setNewSchoolYearName(nextName);
    setNewSchoolYearStartDate(nextStartDate);
    setNewSchoolYearEndDate(nextEndDate);
  };

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

  if (!currentUserProfile || !isAllowedToManage) {
    return (
      <div className="text-center py-20">
        <h1 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
          Accès Restreint
        </h1>
        <p className="text-lg text-muted-foreground">
          Seuls les administrateurs, directeurs et directeurs adjoints peuvent accéder à cette page.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
        Gestion des Années Scolaires
      </h1>
      <p className="text-lg text-muted-foreground mb-8">
        Créez et gérez les années scolaires de la plateforme. Une seule année scolaire peut être active à la fois.
      </p>

      <Card className="rounded-android-tile"> {/* Apply rounded-android-tile */}
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlusCircle className="h-6 w-6 text-primary" /> Créer une nouvelle année scolaire
          </CardTitle>
          <CardDescription>Ajoutez une nouvelle année scolaire et activez-la.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" onClick={handleGenerateNextYear} className="w-full">
            Générer la prochaine année scolaire
          </Button>
          <div className="grid gap-2">
            <Label htmlFor="new-year-name">Nom de l'année scolaire</Label>
            <Input
              id="new-year-name"
              placeholder="Ex: 2023-2024"
              value={newSchoolYearName}
              onChange={(e) => setNewSchoolYearName(e.target.value)}
              required
            />
            <div>
              <Label htmlFor="new-year-start-date" className="text-sm font-medium mb-2 block">Date de début</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal rounded-android-tile", // Apply rounded-android-tile
                      !newSchoolYearStartDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {newSchoolYearStartDate ? format(newSchoolYearStartDate, "PPP", { locale: fr }) : <span>Sélectionner une date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 backdrop-blur-lg bg-background/80 rounded-android-tile"> {/* Apply rounded-android-tile */}
                  <Calendar
                    mode="single"
                    selected={newSchoolYearStartDate}
                    onSelect={setNewSchoolYearStartDate}
                    initialFocus
                    locale={fr}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label htmlFor="new-year-end-date" className="text-sm font-medium mb-2 block">Date de fin</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal rounded-android-tile", // Apply rounded-android-tile
                      !newSchoolYearEndDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {newSchoolYearEndDate ? format(newSchoolYearEndDate, "PPP", { locale: fr }) : <span>Sélectionner une date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 backdrop-blur-lg bg-background/80 rounded-android-tile"> {/* Apply rounded-android-tile */}
                  <Calendar
                    mode="single"
                    selected={newSchoolYearEndDate}
                    onSelect={setNewSchoolYearEndDate}
                    initialFocus
                    locale={fr}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <Button onClick={handleAddSchoolYear} disabled={isCreatingYear || !newSchoolYearName.trim() || !newSchoolYearStartDate || !newSchoolYearEndDate}>
              {isCreatingYear ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <PlusCircle className="h-4 w-4 mr-2" />} Créer et Activer
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-android-tile"> {/* Apply rounded-android-tile */}
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-primary" /> Liste des Années Scolaires
          </CardTitle>
          <CardDescription>Visualisez et gérez les années scolaires existantes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 mt-4">
            {schoolYears.length === 0 ? (
              <p className="text-muted-foreground">Aucune année scolaire à afficher.</p>
            ) : (
              schoolYears.map((year) => (
                <Card key={year.id} className={cn("p-3 border rounded-android-tile", year.is_active ? "border-green-500 ring-2 ring-green-500/50 bg-green-50/20" : "")}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{year.name}</span>
                    <div className="flex gap-2">
                      {year.is_active && <Badge variant="default" className="bg-green-500 rounded-full">Active</Badge>}
                      <Button variant="outline" size="sm" onClick={() => handleEditSchoolYear(year)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteSchoolYear(year.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    Du {format(parseISO(year.start_date), 'dd/MM/yyyy', { locale: fr })} au {format(parseISO(year.end_date), 'dd/MM/yyyy', { locale: fr })}
                  </div>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {currentYearToEdit && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px] backdrop-blur-lg bg-background/80 rounded-android-tile"> {/* Apply rounded-android-tile */}
            <DialogHeader>
              <DialogTitle>Modifier l'année scolaire</DialogTitle>
              <DialogDescription>
                Mettez à jour les informations de l'année scolaire.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">
                  Nom
                </Label>
                <Input
                  id="edit-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="col-span-3"
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-start-date" className="text-sm font-medium mb-2 block">Date de début</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal rounded-android-tile", // Apply rounded-android-tile
                        !editStartDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarDays className="mr-2 h-4 w-4" />
                      {editStartDate ? format(editStartDate, "PPP", { locale: fr }) : <span>Sélectionner une date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 backdrop-blur-lg bg-background/80 rounded-android-tile"> {/* Apply rounded-android-tile */}
                    <Calendar
                      mode="single"
                      selected={editStartDate}
                      onSelect={setEditStartDate}
                      initialFocus
                      locale={fr}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label htmlFor="edit-end-date" className="text-sm font-medium mb-2 block">Date de fin</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal rounded-android-tile", // Apply rounded-android-tile
                        !editEndDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarDays className="mr-2 h-4 w-4" />
                      {editEndDate ? format(editEndDate, "PPP", { locale: fr }) : <span>Sélectionner une date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 backdrop-blur-lg bg-background/80 rounded-android-tile"> {/* Apply rounded-android-tile */}
                    <Calendar
                      mode="single"
                      selected={editEndDate}
                      onSelect={setEditEndDate}
                      initialFocus
                      locale={fr}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex items-center justify-between col-span-4">
                <Label htmlFor="edit-is-active">Année active</Label>
                <Switch
                  id="edit-is-active"
                  checked={editIsActive}
                  onCheckedChange={setEditIsActive}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSaveEditedSchoolYear} disabled={isSavingEdit}>
                {isSavingEdit ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : "Enregistrer les modifications"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default SchoolYearManagementPage;