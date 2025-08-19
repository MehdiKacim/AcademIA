import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRole } from "@/contexts/RoleContext"; // Importation du hook useRole

const Dashboard = () => {
  const { currentRole } = useRole(); // Utilisation du hook useRole

  const renderDashboardContent = () => {
    if (currentRole === 'student') {
      return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Mes Cours Actuels</CardTitle>
              <CardDescription>Continuez votre apprentissage.</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Vous avez 3 cours en cours. Reprenez là où vous en étiez !</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Prochaines Leçons</CardTitle>
              <CardDescription>Ce qui vous attend.</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Module 4: Algorithmes avancés - Disponible demain.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Performance Globale</CardTitle>
              <CardDescription>Votre progression générale.</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Score moyen : 85%</p>
            </CardContent>
          </Card>
        </div>
      );
    } else if (currentRole === 'creator') {
      return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Mes Cours Créés</CardTitle>
              <CardDescription>Gérez vos contenus d'apprentissage.</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Vous avez créé 5 cours. 2 sont en brouillon.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Statistiques des Élèves</CardTitle>
              <CardDescription>Vue d'ensemble de la progression.</CardDescription>
            </CardHeader>
            <CardContent>
              <p>120 élèves inscrits. 75% de complétion moyenne.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Nouveaux Inscrits</CardTitle>
              <CardDescription>Les derniers arrivants.</CardDescription>
            </CardHeader>
            <CardContent>
              <p>5 nouveaux élèves cette semaine.</p>
            </CardContent>
          </Card>
        </div>
      );
    } else if (currentRole === 'tutor') {
      return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Mes Élèves</CardTitle>
              <CardDescription>Suivez la progression de vos enfants/protégés.</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Vous suivez 2 élèves. John et Jane.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Alertes de Progression</CardTitle>
              <CardDescription>Points nécessitant votre attention.</CardDescription>
            </CardHeader>
            <CardContent>
              <p>John a des difficultés en algèbre. Jane excelle en géométrie.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Communication</CardTitle>
              <CardDescription>Messages récents.</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Nouveau message de l'enseignant de John.</p>
            </CardContent>
          </Card>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
        Tableau de bord {currentRole === 'student' ? 'Élève' : currentRole === 'creator' ? 'Créateur' : 'Tuteur'}
      </h1>
      {renderDashboardContent()}
    </div>
  );
};

export default Dashboard;