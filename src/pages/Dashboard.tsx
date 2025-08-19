import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const Dashboard = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">Tableau de bord</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Mes Cours</CardTitle>
            <CardDescription>Accédez à vos cours en cours.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Vous avez 3 cours actifs.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Progression</CardTitle>
            <CardDescription>Suivez l'avancement de vos élèves.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>80% de progression moyenne.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Dernières activités.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Un élève a terminé un module.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;