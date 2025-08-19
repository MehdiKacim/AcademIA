import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRole } from "@/contexts/RoleContext";

const CreateCourse = () => {
  const { currentRole } = useRole();

  if (currentRole !== 'creator') {
    return (
      <div className="text-center py-20">
        <h1 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
          Accès Restreint
        </h1>
        <p className="text-lg text-muted-foreground">
          Seuls les créateurs peuvent accéder à cette page pour créer des cours.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">Créer un nouveau cours</h1>
      <Card>
        <CardHeader>
          <CardTitle>Informations du cours</CardTitle>
          <CardDescription>Remplissez les détails ci-dessous pour créer votre cours.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titre du cours</Label>
            <Input id="title" placeholder="Ex: Introduction à la programmation" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" placeholder="Décrivez votre cours en quelques mots." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Catégorie</Label>
            <Input id="category" placeholder="Ex: Informatique, Mathématiques" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="difficulty">Niveau de difficulté</Label>
            <Input id="difficulty" placeholder="Ex: Débutant, Intermédiaire, Avancé" />
          </div>
          <Button>Créer le cours</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateCourse;