import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, Send, ArrowLeft, ArrowRight, CheckCircle } from "lucide-react";
import { useCourseChat } from "@/contexts/CourseChatContext";
import { showSuccess, showError } from '@/utils/toast';
import { Progress } from "@/components/ui/progress";
import NotesSection from "@/components/NotesSection";
import { generateNoteKey } from "@/lib/notes";

interface Module {
  title: string;
  content: string;
  isCompleted: boolean;
  level?: number; // Ajout de la propriété level pour la hiérarchie visuelle
}

interface Course {
  id: string;
  title: string;
  description: string;
  modules: Module[];
  skillsToAcquire: string[];
}

// Données fictives (doit être la même que dans CourseDetail.tsx)
const initialDummyCourses: Course[] = [
  {
    id: '1',
    title: "Introduction à l'IA",
    description: "Découvrez les fondements de l'intelligence artificielle, ses applications et son impact sur le monde moderne.",
    modules: [
      { title: "Module 1: Qu'est-ce que l'IA ?", content: "Définition, histoire et types d'IA. L'IA est un domaine de l'informatique qui vise à créer des machines capables de simuler l'intelligence humaine. Cela inclut l'apprentissage, la résolution de problèmes, la reconnaissance de la parole et la prise de décision. Son histoire remonte aux années 1950 avec des pionniers comme Alan Turing. Aujourd'hui, l'IA se manifeste sous diverses formes, de l'IA faible (spécialisée) à l'IA forte (générale).", isCompleted: true, level: 0 },
      { title: "Module 2: Apprentissage Automatique (Intro)", content: "Concepts de base du Machine Learning. Le Machine Learning est une branche de l'IA qui permet aux systèmes d'apprendre à partir de données sans être explicitement programmés.", isCompleted: false, level: 0 },
      { title: "Module 2.1: Apprentissage Supervisé", content: "Détails sur les modèles supervisés. L'apprentissage supervisé utilise des données étiquetées pour entraîner des modèles (ex: classification, régression).", isCompleted: false, level: 1 },
      { title: "Module 2.2: Apprentissage Non-Supervisé", content: "Détails sur les modèles non-supervisés. L'apprentissage non supervisé trouve des motifs dans des données non étiquetées (ex: clustering, réduction de dimensionnalité).", isCompleted: false, level: 1 },
      { title: "Module 3: Réseaux de Neurones", content: "Introduction aux réseaux de neurones et au Deep Learning. Les réseaux de neurones sont des modèles inspirés du cerveau humain, composés de couches de 'neurones' interconnectés. Le Deep Learning, une sous-catégorie du Machine Learning, utilise des réseaux de neurones profonds (avec de nombreuses couches) pour apprendre des représentations complexes des données, ce qui a révolutionné des domaines comme la vision par ordinateur et le traitement du langage naturel.", isCompleted: false, level: 0 },
      { title: "Module 4: Applications de l'IA", content: "Exemples concrets : vision par ordinateur, traitement du langage naturel. L'IA est omniprésente : reconnaissance faciale, assistants vocaux, voitures autonomes, systèmes de recommandation, diagnostics médicaux. La vision par ordinateur permet aux machines de 'voir' et d'interpréter des images, tandis que le traitement du langage naturel (NLP) leur permet de comprendre et de générer du langage humain.", isCompleted: false, level: 0 },
    ],
    skillsToAcquire: ["Comprendre l'IA", "Maîtriser le ML", "Appliquer le Deep Learning", "Analyser les données"]
  },
  {
    id: '2',
    title: "React pour débutants",
    description: "Apprenez les fondamentaux de React, la bibliothèque JavaScript populaire pour construire des interfaces utilisateur interactives.",
    modules: [
      { title: "Module 1: Les bases de React", content: "Composants, JSX, props et état. React est une bibliothèque JavaScript pour construire des interfaces utilisateur. Les composants sont les blocs de construction réutilisables. JSX est une extension syntaxique qui permet d'écrire du HTML dans JavaScript. Les props sont des données passées des composants parents aux enfants, et l'état gère les données internes d'un composant qui peuvent changer au fil du temps.", isCompleted: true, level: 0 },
      { title: "Module 2: Hooks et gestion d'état", content: "useState, useEffect, useContext et Reducers. Les Hooks sont des fonctions qui vous permettent d'utiliser l'état et d'autres fonctionnalités de React sans écrire de classes. `useState` gère l'état local, `useEffect` gère les effets secondaires (comme les appels API), et `useContext` permet de partager des données entre composants sans passer les props manuellement. Les Reducers sont utilisés pour une gestion d'état plus complexe.", isCompleted: true, level: 0 },
      { title: "Module 3: Routage avec React Router", content: "Navigation entre les pages de votre application. React Router est une bibliothèque standard pour le routage côté client dans les applications React. Elle permet de créer des applications à page unique (SPA) avec plusieurs vues, où l'URL change sans recharger la page entière. Vous définissez des routes qui correspondent à des composants spécifiques.", isCompleted: false, level: 0 },
      { title: "Module 4: Requêtes API et cycle de vie", content: "Fetching de données et gestion des effets secondaires. Dans React, vous utilisez généralement `useEffect` pour effectuer des requêtes API lorsque le composant est monté ou lorsque certaines dépendances changent. Le cycle de vie d'un composant React inclut le montage (quand il est ajouté au DOM), la mise à jour (quand ses props ou son état changent) et le démontage (quand il est retiré du DOM).", isCompleted: false, level: 0 },
    ],
    skillsToAcquire: ["Développer avec React", "Gérer l'état", "Naviguer avec React Router", "Intégrer des APIs"]
  },
  {
    id: '3',
    title: "Algorithmes Avancés",
    description: "Maîtrisez les structures de données complexes et les algorithmes efficaces pour résoudre des problèmes informatiques avancés.",
    modules: [
      { title: "Module 1: Structures de données avancées", content: "Arbres, graphes, tables de hachage.", isCompleted: false, level: 0 },
      { title: "Module 2: Algorithmes de tri et de recherche", content: "Quicksort, Mergesort, recherche binaire.", isCompleted: false, level: 0 },
      { title: "Module 3: Programmation dynamique", content: "Optimisation de problèmes complexes.", isCompleted: false, level: 0 },
      { title: "Module 4: Algorithmes de graphes", content: "Dijkstra, BFS, DFS.", isCompleted: false, level: 0 },
    ],
    skillsToAcquire: ["Maîtriser les structures de données", "Optimiser les algorithmes", "Résoudre des problèmes complexes", "Analyser les graphes"]
  },
  {
    id: '4',
    title: "Développement Web Fullstack",
    description: "Apprenez à construire des applications web complètes, du frontend au backend, avec les technologies modernes.",
    modules: [
      { title: "Module 1: Introduction au Web", content: "Historique, HTML, CSS, JavaScript.", isCompleted: true, level: 0 },
      { title: "Module 2: Frontend avec React", content: "Composants, état, props.", isCompleted: false, level: 0 },
      { title: "Module 2.1: Gestion des formulaires", content: "React Hook Form et validation.", isCompleted: false, level: 1 },
      { title: "Module 2.2: Styles avec Tailwind CSS", content: "Utility-first CSS.", isCompleted: false, level: 1 },
      { title: "Module 3: Backend avec Node.js", content: "Express.js, API REST.", isCompleted: false, level: 0 },
      { title: "Module 3.1: Bases de données SQL", content: "PostgreSQL et ORM.", isCompleted: false, level: 1 },
      { title: "Module 3.2: Authentification", content: "JWT et sessions.", isCompleted: false, level: 1 },
      { title: "Module 4: Déploiement", content: "Hébergement et CI/CD.", isCompleted: false, level: 0 },
    ],
    skillsToAcquire: ["Développer Frontend", "Développer Backend", "Gérer les bases de données", "Déployer des applications"]
  },
];

const ModuleDetail = () => {
  const { courseId, moduleIndex } = useParams<{ courseId: string; moduleIndex: string }>();
  const navigate = useNavigate();
  const { setCourseContext, setModuleContext, openChat } = useCourseChat();

  const course = initialDummyCourses.find(c => c.id === courseId);
  const currentModuleIndex = parseInt(moduleIndex || '0', 10);
  const module = course?.modules[currentModuleIndex];

  useEffect(() => {
    if (course && module) {
      setCourseContext(course.id, course.title);
      setModuleContext(module.title);
    } else {
      setCourseContext(null, null);
      setModuleContext(null);
    }
    return () => {
      setCourseContext(null, null);
      setModuleContext(null);
    };
  }, [courseId, moduleIndex, course, module, setCourseContext, setModuleContext]);

  if (!course || !module) {
    return (
      <div className="text-center py-20">
        <h1 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
          Module non trouvé
        </h1>
        <p className="text-lg text-muted-foreground">
          Le module que vous recherchez n'existe pas.
        </p>
        <Button onClick={() => navigate(`/courses/${courseId}`)} className="mt-4">
          Retour au cours
        </Button>
      </div>
    );
  }

  // Vérifier si le module est accessible (le précédent doit être complété)
  const isModuleAccessible = currentModuleIndex === 0 || course.modules[currentModuleIndex - 1]?.isCompleted;

  if (!isModuleAccessible) {
    return (
      <div className="text-center py-20">
        <h1 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
          Module Verrouillé
        </h1>
        <p className="text-lg text-muted-foreground">
          Veuillez compléter le module précédent pour accéder à celui-ci.
        </p>
        <Button onClick={() => navigate(`/courses/${courseId}`)} className="mt-4">
          Retour au cours
        </Button>
      </div>
    );
  }

  const handleMarkModuleComplete = () => {
    // Dans une vraie application, cela mettrait à jour l'état global ou la base de données
    // Pour cette démo, nous allons simuler la mise à jour et rediriger
    const updatedCourses = initialDummyCourses.map(c =>
      c.id === courseId
        ? {
            ...c,
            modules: c.modules.map((mod, idx) =>
              idx === currentModuleIndex ? { ...mod, isCompleted: true } : mod
            ),
          }
        : c
    );
    // Mettre à jour les données fictives pour la prochaine fois (simple pour la démo)
    // En production, cela serait géré par un état global ou une API
    Object.assign(initialDummyCourses, updatedCourses); // Ceci est une astuce simple pour la démo, pas pour la production

    showSuccess(`Module "${module.title}" marqué comme terminé !`);

    // Naviguer vers le module suivant ou revenir au cours si c'est le dernier
    if (currentModuleIndex < course.modules.length - 1) {
      navigate(`/courses/${courseId}/modules/${currentModuleIndex + 1}`);
    } else {
      showSuccess("Félicitations ! Vous avez terminé tous les modules de ce cours.");
      navigate(`/courses/${courseId}`);
    }
  };

  const handleAskAiaAboutModule = () => {
    openChat(`J'ai une question sur le module "${module.title}" du cours "${course.title}".`);
  };

  const totalModules = course.modules.length;
  const completedModules = course.modules.filter(m => m.isCompleted).length;
  const progressPercentage = Math.round((completedModules / totalModules) * 100);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between mb-6">
        <Button variant="outline" onClick={() => navigate(`/courses/${courseId}`)}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Retour au cours
        </Button>
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
          {course.title}
        </h1>
        <div></div> {/* Placeholder for alignment */}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{module.title}</span>
            {module.isCompleted && <CheckCircle className="h-6 w-6 text-green-500" />}
          </CardTitle>
          <CardDescription>
            Module {currentModuleIndex + 1} sur {totalModules}
          </CardDescription>
          <Progress value={progressPercentage} className="w-full mt-2" />
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">{module.content}</p>
          <div className="flex flex-wrap gap-4 justify-between items-center">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => navigate(`/courses/${courseId}/modules/${currentModuleIndex - 1}`)}
                disabled={currentModuleIndex === 0}
              >
                <ArrowLeft className="h-4 w-4 mr-2" /> Précédent
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(`/courses/${courseId}/modules/${currentModuleIndex + 1}`)}
                disabled={currentModuleIndex === totalModules - 1 || !module.isCompleted}
              >
                Suivant <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
            <div className="flex gap-2">
              {!module.isCompleted && (
                <Button onClick={handleMarkModuleComplete}>
                  <CheckCircle className="h-4 w-4 mr-2" /> Marquer comme terminé
                </Button>
              )}
              <Button variant="secondary" onClick={handleAskAiaAboutModule}>
                <Send className="h-4 w-4 mr-2" /> Demander à AiA
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <section>
        <NotesSection noteKey={generateNoteKey('module', course.id, currentModuleIndex)} title={module.title} />
      </section>
    </div>
  );
};

export default ModuleDetail;