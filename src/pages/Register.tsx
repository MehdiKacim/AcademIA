import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";

const Register = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm border-primary/20 shadow-lg shadow-primary/10">
        <CardHeader>
          <CardTitle className="text-2xl">Créer un compte</CardTitle>
          <CardDescription>
            Rejoignez AcademIA pour commencer votre parcours d'apprentissage.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nom complet</Label>
            <Input id="name" type="text" placeholder="John Doe" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input id="password" type="password" required />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button className="w-full">S'inscrire</Button>
          <div className="text-sm text-muted-foreground">
            Déjà un compte?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Se connecter
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Register;