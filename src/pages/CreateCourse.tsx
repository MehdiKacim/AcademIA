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

const CreateCourse = () => {
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
          <Button>Créer le cours</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateCourse;