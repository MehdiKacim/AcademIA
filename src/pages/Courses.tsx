import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const Courses = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">Mes Cours</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Placeholder course cards */}
        <Card>
          <CardHeader>
            <CardTitle>Introduction à l'IA</CardTitle>
            <CardDescription>Les bases de l'intelligence artificielle.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Progression: 50%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>React pour débutants</CardTitle>
            <CardDescription>Apprenez les fondamentaux de React.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Progression: 25%</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Courses;