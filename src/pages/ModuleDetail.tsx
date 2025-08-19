import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, Send, ArrowLeft, ArrowRight, CheckCircle, PlusCircle } from "lucide-react";
import { useCourseChat } from "@/contexts/CourseChatContext";
import { showSuccess, showError } from '@/utils/toast';
import { Progress } from "@/components/ui/progress";
import QuickNoteDialog from "@/components/QuickNoteDialog";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { generateNoteKey } from "@/lib/notes";

interface ModuleSection {
  title: string;
  content: string;
  type?: 'text' | 'quiz' | 'video';
}

interface Module {
  title: string;
  sections: ModuleSection[];
  isCompleted: boolean;
  level?: number;
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
      {
        title: "Module 1: Qu'est-ce que l'IA ?",
        sections: [
          { title: "Définition et Histoire", content: "L'intelligence artificielle (IA) est un domaine de l'informatique qui vise à créer des machines capables de simuler l'intelligence humaine. Cela inclut l'apprentissage, la résolution de problèmes, la reconnaissance de la parole et la prise de décision. Son histoire remonte aux années 1950 avec des pionniers comme Alan Turing. Aujourd'hui, l'IA se manifeste sous diverses formes, de l'IA faible (spécialisée) à l'IA forte (générale)." },
          { title: "Types d'IA", content: "On distingue principalement l'IA faible (ANI - Artificial Narrow Intelligence), conçue pour une tâche spécifique (ex: reconnaissance faciale), et l'IA forte (AGI - Artificial General Intelligence), capable de comprendre, apprendre et appliquer l'intelligence à n'importe quel problème, comme un être humain. L'ASI (Artificial Super Intelligence) est une IA hypothétique surpassant l'intelligence humaine." },
        ],
        isCompleted: true,
        level: 0
      },
      {
        title: "Module 2: Apprentissage Automatique (Intro)",
        sections: [
          { title: "Principes Fondamentaux", content: "Le Machine Learning est une branche de l'IA qui permet aux systèmes d'apprendre à partir de données sans être explicitement programmés. Ce module couvre les concepts fondamentaux, les types d'apprentissage (supervisé, non supervisé, par renforcement) et les algorithmes courants comme la régression linéaire et la classification." },
          { title: "Apprentissage Supervisé", content: "L'apprentissage supervisé utilise des données étiquetées pour entraîner des modèles. Nous explorerons des algorithmes tels que les machines à vecteurs de support (SVM), les arbres de décision et les forêts aléatoires, ainsi que les métriques d'évaluation associées." },
          { title: "Apprentissage Non-Supervisé", content: "L'apprentissage non supervisé trouve des motifs dans des données non étiquetées. Ce module aborde le clustering (K-means, DBSCAN) et la réduction de dimensionnalité (PCA), des techniques essentielles pour l'exploration de données." },
        ],
        isCompleted: false,
        level: 0
      },
      {
        title: "Module 3: Réseaux de Neurones et Deep Learning",
        sections: [
          { title: "Introduction aux Réseaux de Neurones", content: "Les réseaux de neurones sont des modèles inspirés du cerveau humain, composés de couches de 'neurones' interconnectés. Chaque neurone reçoit des entrées, effectue un calcul et transmet une sortie. L'apprentissage se fait par ajustement des poids des connexions." },
          { title: "Deep Learning", content: "Le Deep Learning, une sous-catégorie du Machine Learning, utilise des réseaux de neurones profonds (avec de nombreuses couches) pour apprendre des représentations complexes des données. Cela a révolutionné des domaines comme la vision par ordinateur et le traitement du langage naturel." },
          { title: "Types de Réseaux", content: "Nous aborderons les réseaux de neurones convolutifs (CNN) pour l'image, les réseaux de neurones récurrents (RNN) pour les séquences, et les transformeurs pour le traitement du langage naturel." },
        ],
        isCompleted: false,
        level: 0
      },
      {
        title: "Module 4: Applications de l'IA",
        sections: [
          { title: "Vision par Ordinateur", content: "La vision par ordinateur permet aux machines de 'voir' et d'interpréter des images et des vidéos. Applications : reconnaissance faciale, détection d'objets, voitures autonomes, diagnostics médicaux par imagerie." },
          { title: "Traitement du Langage Naturel (NLP)", content: "Le NLP permet aux machines de comprendre, interpréter et générer du langage humain. Applications : assistants vocaux, traduction automatique, analyse de sentiments, chatbots." },
          { title: "Systèmes de Recommandation", content: "L'IA est utilisée pour recommander des produits, des films, de la musique, etc., en analysant les préférences et le comportement des utilisateurs. Exemples : Netflix, Amazon, Spotify." },
        ],
        isCompleted: false,
        level: 0
      },
    ],
    skillsToAcquire: ["Comprendre l'IA", "Maîtriser le ML", "Appliquer le Deep Learning", "Analyser les données"]
  },
  {
    id: '2',
    title: "React pour débutants",
    description: "Apprenez les fondamentaux de React, la bibliothèque JavaScript populaire pour construire des interfaces utilisateur interactives.",
    modules: [
      {
        title: "Module 1: Les bases de React",
        sections: [
          { title: "Qu'est-ce que React ?", content: "React est une bibliothèque JavaScript déclarative, efficace et flexible pour construire des interfaces utilisateur. Elle permet de créer des composants UI réutilisables." },
          { title: "Composants et JSX", content: "Les composants sont les blocs de construction fondamentaux de React. JSX est une extension syntaxique qui permet d'écrire du HTML-like code directement dans JavaScript, facilitant la création d'éléments React." },
          { title: "Props et État", content: "Les props (propriétés) sont des données passées des composants parents aux enfants, rendant les composants réutilisables. L'état gère les données internes d'un composant qui peuvent changer au fil du temps, déclenchant un re-rendu de l'UI." },
        ],
        isCompleted: true,
        level: 0
      },
      {
        title: "Module 2: Hooks et gestion d'état",
        sections: [
          { title: "Introduction aux Hooks", content: "Les Hooks sont des fonctions qui vous permettent d'utiliser l'état et d'autres fonctionnalités de React sans écrire de classes. Ils ont été introduits dans React 16.8." },
          { title: "useState et useEffect", content: "`useState` est le Hook le plus fondamental pour ajouter l'état local à un composant fonctionnel. `useEffect` vous permet d'effectuer des effets secondaires (comme les requêtes de données, les abonnements ou la modification directe du DOM) dans les composants fonctionnels." },
          { title: "useContext et useReducer", content: "`useContext` permet de partager des données entre composants sans passer les props manuellement à chaque niveau. `useReducer` est une alternative à `useState` pour la gestion d'état plus complexe, souvent utilisée avec un `reducer` pour des logiques de transition d'état." },
        ],
        isCompleted: true,
        level: 0
      },
      {
        title: "Module 3: Routage avec React Router",
        sections: [
          { title: "Principes du Routage Client-Side", content: "React Router est une bibliothèque standard pour le routage côté client dans les applications React. Elle permet de créer des applications à page unique (SPA) avec plusieurs vues, où l'URL change sans recharger la page entière." },
          { title: "Configuration des Routes", content: "Vous apprendrez à définir des routes en utilisant les composants `<BrowserRouter>`, `<Routes>` et `<Route>`, en associant des chemins d'URL à des composants React spécifiques." },
          { title: "Navigation Programmatic", content: "Utilisation du hook `useNavigate` pour la navigation programmatique, permettant de rediriger les utilisateurs après une action (ex: soumission de formulaire)." },
        ],
        isCompleted: false,
        level: 0
      },
      {
        title: "Module 4: Requêtes API et cycle de vie",
        sections: [
          { title: "Fetching de Données avec useEffect", content: "Dans React, vous utilisez généralement `useEffect` pour effectuer des requêtes API lorsque le composant est monté ou lorsque certaines dépendances changent. Il est crucial de gérer les états de chargement et d'erreur." },
          { title: "Gestion des États de Chargement et d'Erreur", content: "Implémentation de logiques pour afficher des indicateurs de chargement et des messages d'erreur, améliorant l'expérience utilisateur lors des interactions asynchrones." },
          { title: "Nettoyage des Effets", content: "Apprenez à nettoyer les effets secondaires (ex: annuler des requêtes, désabonner des écouteurs) en retournant une fonction de nettoyage dans `useEffect` pour éviter les fuites de mémoire." },
        ],
        isCompleted: false,
        level: 0
      },
    ],
    skillsToAcquire: ["Développer avec React", "Gérer l'état", "Naviguer avec React Router", "Intégrer des APIs"]
  },
  {
    id: '3',
    title: "Algorithmes Avancés",
    description: "Maîtrisez les structures de données complexes et les algorithmes efficaces pour résoudre des problèmes informatiques avancés.",
    modules: [
      {
        title: "Module 1: Structures de données avancées",
        sections: [
          { title: "Arbres et Graphes", content: "Ce module explore les structures de données complexes telles que les arbres (binaires, AVL, B-trees), les graphes (représentations, parcours) et les tables de hachage. Comprendre leur fonctionnement est crucial pour optimiser les performances de vos applications." },
          { title: "Tables de Hachage", content: "Les tables de hachage offrent un accès rapide aux données. Nous étudierons leur fonctionnement interne, les collisions et les stratégies de résolution, ainsi que leurs applications pratiques." },
        ],
        isCompleted: false,
        level: 0
      },
      {
        title: "Module 2: Algorithmes de tri et de recherche",
        sections: [
          { title: "Tris Efficaces", content: "Plongez dans les algorithmes de tri efficaces comme Quicksort, Mergesort et Heapsort, ainsi que les techniques de recherche avancées telles que la recherche binaire et la recherche par interpolation. Nous analyserons leur complexité temporelle et spatiale." },
          { title: "Recherche Avancée", content: "Au-delà de la recherche binaire, nous explorerons des techniques pour des structures de données spécifiques et des scénarios de recherche plus complexes." },
        ],
        isCompleted: false,
        level: 0
      },
      {
        title: "Module 3: Programmation dynamique",
        sections: [
          { title: "Principes de la PD", content: "La programmation dynamique est une méthode puissante pour résoudre des problèmes complexes en les décomposant en sous-problèmes plus petits. Ce module vous enseignera les principes de la PD, y compris la mémorisation et la tabulation, à travers des exemples classiques." },
          { title: "Exemples Classiques", content: "Nous étudierons des problèmes comme la suite de Fibonacci, le problème du sac à dos, et le plus long sous-séquence commune pour illustrer l'application de la programmation dynamique." },
        ],
        isCompleted: false,
        level: 0
      },
      {
        title: "Module 4: Algorithmes de graphes",
        sections: [
          { title: "Parcours de Graphes", content: "Découvrez les algorithmes fondamentaux sur les graphes, essentiels pour la modélisation de réseaux et de relations. Nous couvrirons les parcours en largeur (BFS) et en profondeur (DFS)." },
          { title: "Plus Courts Chemins et Arbres Couvrants", content: "Nous aborderons l'algorithme de Dijkstra pour les plus courts chemins et l'algorithme de Kruskal pour les arbres couvrants minimaux, avec des applications concrètes." },
        ],
        isCompleted: false,
        level: 0
      },
    ],
    skillsToAcquire: ["Maîtriser les structures de données", "Optimiser les algorithmes", "Résoudre des problèmes complexes", "Analyser les graphes"]
  },
  {
    id: '4',
    title: "Développement Web Fullstack",
    description: "Apprenez à construire des applications web complètes, du frontend au backend, avec les technologies modernes.",
    modules: [
      {
        title: "Module 1: Introduction au Web",
        sections: [
          { title: "Historique et Fondamentaux", content: "Ce module couvre l'historique du web, les principes fondamentaux de HTML pour la structure, CSS pour le style, et JavaScript pour l'interactivité. Vous comprendrez comment ces trois piliers fonctionnent ensemble pour créer des pages web dynamiques." },
          { title: "Fonctionnement Client-Serveur", content: "Comprenez comment les navigateurs (clients) interagissent avec les serveurs web pour récupérer et afficher le contenu, y compris les requêtes HTTP et les réponses." },
        ],
        isCompleted: true,
        level: 0
      },
      {
        title: "Module 2: Frontend avec React",
        sections: [
          { title: "Composants et Props", content: "Plongez dans le développement frontend avec React. Vous apprendrez à créer des composants réutilisables et à utiliser les props pour la communication entre composants." },
          { title: "Gestion de l'État avec Hooks", content: "Maîtrisez la gestion de l'état de votre application avec des hooks comme `useState` et `useEffect` pour créer des interfaces dynamiques et réactives." },
          { title: "Gestion des formulaires et Validation", content: "Maîtrisez la création et la validation de formulaires complexes en React. Ce sous-module se concentre sur l'utilisation de `React Hook Form` pour une gestion efficace des entrées utilisateur et `Zod` pour la validation de schéma, garantissant la robustesse de vos formulaires." },
          { title: "Styles avec Tailwind CSS", content: "Découvrez Tailwind CSS, un framework CSS utilitaire-first qui vous permet de construire des designs personnalisés directement dans votre balisage HTML. Apprenez à styliser rapidement et efficacement vos composants React sans quitter votre fichier JavaScript." },
        ],
        isCompleted: false,
        level: 0
      },
      {
        title: "Module 3: Backend avec Node.js",
        sections: [
          { title: "API RESTful avec Express.js", content: "Passez au développement backend avec Node.js et Express.js. Ce module vous enseignera comment construire des API RESTful, gérer les requêtes HTTP, et structurer votre application côté serveur pour une performance optimale." },
          { title: "Bases de données SQL avec PostgreSQL", content: "Explorez les bases de données relationnelles avec PostgreSQL. Vous apprendrez les concepts SQL, la conception de schémas de base de données, et l'utilisation d'un ORM (Object-Relational Mapper) pour interagir avec votre base de données depuis Node.js." },
          { title: "Authentification et Sécurité", content: "Implémentez des systèmes d'authentification sécurisés pour vos applications web. Ce sous-module couvre les concepts de JWT (JSON Web Tokens), la gestion des sessions, et les meilleures pratiques pour protéger les routes et les données de vos utilisateurs." },
        ],
        isCompleted: false,
        level: 0
      },
      {
        title: "Module 4: Déploiement et Maintenance",
        sections: [
          { title: "Préparation pour la Production", content: "Ce module vous guide à travers le processus de déploiement de vos applications fullstack. Vous apprendrez à préparer votre code pour la production (optimisation, minification)." },
          { title: "Plateformes d'Hébergement", content: "Choisissez des plateformes d'hébergement adaptées (comme Vercel ou Netlify pour le frontend, Heroku ou Render pour le backend) et comprenez leurs spécificités." },
          { title: "CI/CD et Monitoring", content: "Mettez en place des pipelines CI/CD (Intégration Continue/Déploiement Continu) pour des déploiements automatisés et des systèmes de monitoring pour assurer la performance continue et la maintenance de vos applications." },
        ],
        isCompleted: false,
        level: 0
      },
    ],
    skillsToAcquire: ["Développer Frontend", "Développer Backend", "Gérer les bases de données", "Déployer des applications"]
  },
  {
    id: '5',
    title: "Fondamentaux de la Science des Données",
    description: "Explorez les concepts clés de la science des données, de la collecte à l'analyse et la visualisation.",
    modules: [
      {
        title: "Module 1: Introduction aux Données",
        sections: [
          { title: "Définition et Rôle", content: "Ce module définit la science des données, son rôle croissant dans l'industrie, et les compétences clés requises. Vous comprendrez le cycle de vie des données, de la collecte à l'interprétation." },
          { title: "Éthique des Données", content: "L'importance de l'éthique des données, de la confidentialité et de la partialité dans les algorithmes d'IA." },
        ],
        isCompleted: true,
        level: 0
      },
      {
        title: "Module 2: Collecte et Préparation des Données",
        sections: [
          { title: "Techniques de Collecte", content: "Apprenez les techniques de collecte de données à partir de diverses sources (API, bases de données, web scraping)." },
          { title: "Nettoyage et Transformation", content: "Ce module couvre également les étapes cruciales de nettoyage, de transformation et de gestion des données manquantes pour préparer vos ensembles de données à l'analyse." },
          { title: "Exploration des Données (EDA)", content: "L'EDA est une étape essentielle pour comprendre vos données. Ce sous-module vous enseignera comment utiliser des statistiques descriptives et des techniques de visualisation (histogrammes, nuages de points, boîtes à moustaches) pour découvrir des motifs, des anomalies et des relations." },
          { title: "Ingénierie des Caractéristiques", content: "L'ingénierie des caractéristiques est l'art de créer de nouvelles variables à partir de données brutes pour améliorer la performance des modèles. Ce module explore des techniques comme l'encodage catégoriel, la normalisation, la standardisation et la création de caractéristiques polynomiales." },
        ],
        isCompleted: false,
        level: 0
      },
      {
        title: "Module 3: Modélisation Prédictive",
        sections: [
          { title: "Concepts de Modélisation", content: "Introduction aux concepts de la modélisation prédictive. Ce module couvre les algorithmes de régression (linéaire, logistique) et de classification (k-NN, arbres de décision), en expliquant comment construire et entraîner des modèles pour faire des prédictions." },
          { title: "Évaluation des Modèles", content: "Apprenez à évaluer la performance de vos modèles prédictifs. Ce sous-module aborde des métriques clés comme la précision, le rappel, le score F1, l'AUC-ROC, et les techniques pour détecter et prévenir le surapprentissage et le sous-apprentissage." },
        ],
        isCompleted: false,
        level: 0
      },
      {
        title: "Module 4: Déploiement et Maintien",
        sections: [
          { title: "Mise en Production", content: "Ce module traite de la mise en production des modèles de science des données. Vous apprendrez à déployer vos modèles en tant qu'API et à les intégrer dans des applications existantes." },
          { title: "Monitoring et Maintenance", content: "Mettez en place des systèmes de monitoring pour assurer leur performance continue et leur maintenance, y compris la détection de la dérive des données et le réentraînement des modèles." },
        ],
        isCompleted: false,
        level: 0
      },
    ],
    skillsToAcquire: ["Collecte de données", "Analyse statistique", "Modélisation ML", "Visualisation"]
  },
];

const ModuleDetail = () => {
  const { courseId, moduleIndex } = useParams<{ courseId: string; moduleIndex: string }>();
  const navigate = useNavigate();
  const { setCourseContext, setModuleContext, openChat } = useCourseChat();
  const isMobile = useIsMobile();

  const course = initialDummyCourses.find(c => c.id === courseId);
  const currentModuleIndex = parseInt(moduleIndex || '0', 10);
  const module = course?.modules[currentModuleIndex];

  const [isQuickNoteDialogOpen, setIsQuickNoteDialogOpen] = useState(false);
  const [currentNoteContext, setCurrentNoteContext] = useState({ key: '', title: '' });

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

  const handleAskAiaAboutSection = (sectionTitle: string) => {
    openChat(`J'ai une question sur la section "${sectionTitle}" du module "${module.title}" du cours "${course.title}".`);
  };

  const handleOpenQuickNoteDialog = (sectionTitle: string, sectionIndex: number) => {
    setCurrentNoteContext({
      key: generateNoteKey('section', course.id, currentModuleIndex, sectionIndex),
      title: sectionTitle,
    });
    setIsQuickNoteDialogOpen(true);
  };

  const handleNoteAdded = useCallback(() => {
    // La note rapide est ajoutée, les notes seront visibles dans la page 'Toutes mes notes'.
    // Pas besoin de rafraîchir un composant spécifique ici.
  }, []);

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
          {module.sections.map((section, index) => (
            <div key={index} className="mb-6 p-4 border rounded-md bg-muted/10">
              <h3 className="text-xl font-semibold mb-2 text-foreground">{section.title}</h3>
              <p className="text-muted-foreground">{section.content}</p>
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenQuickNoteDialog(section.title, index)}
                >
                  <PlusCircle className="h-4 w-4 mr-2" /> Note rapide
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleAskAiaAboutSection(section.title)}
                >
                  <Send className="h-4 w-4 mr-2" /> Demander à AiA
                </Button>
              </div>
            </div>
          ))}
          <div className="flex flex-wrap gap-4 justify-between items-center mt-6">
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
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bouton flottant pour ajouter une note rapide (pour le module entier si besoin, ou peut être retiré si les notes par section suffisent) */}
      <div className={cn(
        "fixed z-40 p-4",
        isMobile ? "bottom-20 left-4" : "bottom-4 left-4" // Positionnement ajusté pour mobile
      )}>
        <Button
          size="lg"
          className="rounded-full h-14 w-14 shadow-lg animate-bounce-slow"
          onClick={() => handleOpenQuickNoteDialog(module.title, -1)} // -1 pour indiquer une note de module
        >
          <PlusCircle className="h-7 w-7" />
          <span className="sr-only">Ajouter une note rapide pour le module</span>
        </Button>
      </div>

      <QuickNoteDialog
        isOpen={isQuickNoteDialogOpen}
        onClose={() => setIsQuickNoteDialogOpen(false)}
        noteKey={currentNoteContext.key}
        contextTitle={currentNoteContext.title}
        onNoteAdded={handleNoteAdded}
      />
    </div>
  );
};

export default ModuleDetail;