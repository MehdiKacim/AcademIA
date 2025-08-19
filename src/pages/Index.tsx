import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Logo from "@/components/Logo";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  SlidersHorizontal,
  MessageSquareQuote,
  ShieldCheck,
  Target,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

const Index = () => {
  const methodology = [
    {
      icon: <Target className="w-12 h-12 text-primary" />,
      title: "Évaluation Initiale",
      description:
        "L'IA analyse vos connaissances pour créer un parcours sur mesure.",
    },
    {
      icon: <SlidersHorizontal className="w-12 h-12 text-primary" />,
      title: "Apprentissage Adaptatif",
      description:
        "Des leçons qui s'ajustent en temps réel à votre rythme et à vos difficultés.",
    },
    {
      icon: <MessageSquareQuote className="w-12 h-12 text-primary" />,
      title: "Feedback Instantané",
      description:
        "Recevez des retours et des conseils de votre tuteur IA pour progresser plus vite.",
    },
    {
      icon: <ShieldCheck className="w-12 h-12 text-primary" />,
      title: "Consolidation des Acquis",
      description:
        "Des exercices ciblés pour renforcer vos points faibles et assurer une maîtrise durable.",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>

      <header className="p-4 flex justify-between items-center border-b">
        <Logo />
        <nav className="flex items-center gap-4">
          <ThemeToggle />
          <Link to="/login">
            <Button variant="outline">Se connecter</Button>
          </Link>
        </nav>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center text-center p-4">
        <section className="py-20">
          <div className="relative">
            <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/10 rounded-full filter blur-3xl opacity-50 animate-blob"></div>
            <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-secondary/20 rounded-full filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>

            <div className="flex justify-center mb-8">
              <Logo iconClassName="w-32 h-32" showText={false} />
            </div>
            <h2 className="text-5xl md:text-6xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
              L'Avenir de l'Apprentissage est Ici
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              AcademIA transforme l'éducation avec des parcours personnalisés, un
              suivi intelligent et un tuteur IA pour libérer le potentiel de
              chaque apprenant.
            </p>
            <div className="flex gap-4 justify-center">
              <Link to="/login">
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Commencer l'aventure
                </Button>
              </Link>
              <Link to="/register">
                <Button size="lg" variant="secondary">
                  Créer un compte
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="py-20 w-full">
          <h3 className="text-3xl md:text-4xl font-bold mb-4">
            Notre Méthodologie Révolutionnaire
          </h3>
          <p className="text-lg text-muted-foreground mb-12 max-w-3xl mx-auto">
            Un parcours d'apprentissage unique, guidé par l'intelligence
            artificielle, pour une maîtrise complète.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto px-4">
            {methodology.map((item, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <div className="flex justify-center mb-4">{item.icon}</div>
                  <CardTitle>{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <footer className="p-4 text-center text-sm text-muted-foreground border-t">
        © {new Date().getFullYear()} AcademIA. Tous droits réservés.
      </footer>
    </div>
  );
};

export default Index;