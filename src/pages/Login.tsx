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

const Login = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm border-primary/20 shadow-lg shadow-primary/10">
        <CardHeader>
          <CardTitle className="text-2xl">Connexion</CardTitle>
          <CardDescription>
            Entrez vos identifiants pour accéder à votre espace.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
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
          <Link to="/dashboard" className="w-full">
            <Button className="w-full">Se connecter</Button>
          </Link>
          <div className="text-sm text-muted-foreground">
            Pas de compte?{" "}
            <Link to="/register" className="text-primary hover:underline">
              Créer un compte
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;