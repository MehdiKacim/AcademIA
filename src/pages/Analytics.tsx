import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const Analytics = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">Progression et Analytiques</h1>
      <Card>
        <CardHeader>
          <CardTitle>Vue d'ensemble</CardTitle>
          <CardDescription>Suivi de la progression globale des élèves.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Graphiques et statistiques à venir ici.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;