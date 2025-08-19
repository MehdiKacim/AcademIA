import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, Send, Lock, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCourseChat } from "@/contexts/CourseChatContext";
import { motion } from 'framer-motion';
import { showSuccess, showError } from '@/utils/toast';
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import NotesSection from "@/components/NotesSection";
import { generateNoteKey } from "@/lib/notes";
import CourseModuleList from "@/components/CourseModuleList"; // Nouvelle importation

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

const initialDummyCourses: Course[] = [
  {
    id: '1',
    title: "Introduction à l'IA",
    description: "Découvrez les fondements de l'intelligence artificielle, ses applications et son impact sur le monde moderne.",
    modules: [
      { title: "Module 1: Qu'est-ce que l'IA ?", content: "L'intelligence artificielle (IA) est un domaine de l'informatique qui vise à créer des machines capables de simuler l'intelligence humaine. Cela inclut l'apprentissage, la résolution de problèmes, la reconnaissance de la parole et la prise de décision. Son histoire remonte aux années 1950 avec des pionniers comme Alan Turing. Aujourd'hui, l'IA se manifeste sous diverses formes, de l'IA faible (spécialisée) à l'IA forte (générale).", isCompleted: true, level: 0 },
      { title: "Module 2: Apprentissage Automatique (Intro)", content: "Le Machine Learning est une branche de l'IA qui permet aux systèmes d'apprendre à partir de données sans être explicitement programmés. Ce module couvre les concepts fondamentaux, les types d'apprentissage (supervisé, non supervisé, par renforcement) et les algorithmes courants comme la régression linéaire et la classification.", isCompleted: false, level: 0 },
      { title: "Module 2.1: Apprentissage Supervisé", content: "L'apprentissage supervisé utilise des données étiquetées pour entraîner des modèles. Nous explorerons des algorithmes tels que les machines à vecteurs de support (SVM), les arbres de décision et les forêts aléatoires, ainsi que les métriques d'évaluation associées.", isCompleted: false, level: 1 },
      { title: "Module 2.2: Apprentissage Non-Supervisé", content: "L'apprentissage non supervisé trouve des motifs dans des données non étiquetées. Ce module aborde le clustering (K-means, DBSCAN) et la réduction de dimensionnalité (PCA), des techniques essentielles pour l'exploration de données.", isCompleted: false, level: 1 },
      { title: "Module 3: Réseaux de Neurones", content: "Les réseaux de neurones sont des modèles inspirés du cerveau humain, composés de couches de 'neurones' interconnectés. Le Deep Learning, une sous-catégorie du Machine Learning, utilise des réseaux de neurones profonds (avec de nombreuses couches) pour apprendre des représentations complexes des données, ce qui a révolutionné des domaines comme la vision par ordinateur et le traitement du langage naturel.", isCompleted: false, level: 0 },
      { title: "Module 4: Applications de l'IA", content: "L'IA est omniprésente : reconnaissance faciale, assistants vocaux, voitures autonomes, systèmes de recommandation, diagnostics médicaux. La vision par ordinateur permet aux machines de 'voir' et d'interpréter des images, tandis que le traitement du langage naturel (NLP) leur permet de comprendre et de générer du langage humain.", isCompleted: false, level: 0 },
    ],
    skillsToAcquire: ["Comprendre l'IA", "Maîtriser le ML", "Appliquer le Deep Learning", "Analyser les données"]
  },
  {
    id: '2',
    title: "React pour débutants",
    description: "Apprenez les fondamentaux de React, la bibliothèque JavaScript populaire pour construire des interfaces utilisateur interactives.",
    modules: [
      { title: "Module 1: Les bases de React", content: "React est une bibliothèque JavaScript pour construire des interfaces utilisateur. Les composants sont les blocs de construction réutilisables. JSX est une extension syntaxique qui permet d'écrire du HTML dans JavaScript. Les props sont des données passées des composants parents aux enfants, et l'état gère les données internes d'un composant qui peuvent changer au fil du temps.", isCompleted: true, level: 0 },
      { title: "Module 2: Hooks et gestion d'état", content: "Les Hooks sont des fonctions qui vous permettent d'utiliser l'état et d'autres fonctionnalités de React sans écrire de classes. `useState` gère l'état local, `useEffect` gère les effets secondaires (comme les appels API), et `useContext` permet de partager des données entre composants sans passer les props manuellement. Les Reducers sont utilisés pour une gestion d'état plus complexe.", isCompleted: true, level: 0 },
      { title: "Module 3: Routage avec React Router", content: "React Router est une bibliothèque standard pour le routage côté client dans les applications React. Elle permet de créer des applications à page unique (SPA) avec plusieurs vues, où l'URL change sans recharger la page entière. Vous définissez des routes qui correspondent à des composants spécifiques et apprenez à naviguer entre elles.", isCompleted: false, level: 0 },
      { title: "Module 4: Requêtes API et cycle de vie", content: "Dans React, vous utilisez généralement `useEffect` pour effectuer des requêtes API lorsque le composant est monté ou lorsque certaines dépendances changent. Ce module explore comment gérer le fetching de données, les états de chargement et d'erreur, et comment interagir avec des API externes de manière asynchrone.", isCompleted: false, level: 0 },
    ],
    skillsToAcquire: ["Développer avec React", "Gérer l'état", "Naviguer avec React Router", "Intégrer des APIs"]
  },
  {
    id: '3',
    title: "Algorithmes Avancés",
    description: "Maîtrisez les structures de données complexes et les algorithmes efficaces pour résoudre des problèmes informatiques avancés.",
    modules: [
      { title: "Module 1: Structures de données avancées", content: "Ce module explore les structures de données complexes telles que les arbres (binaires, AVL, B-trees), les graphes (représentations, parcours) et les tables de hachage. Comprendre leur fonctionnement est crucial pour optimiser les performances de vos applications.", isCompleted: false, level: 0 },
      { title: "Module 2: Algorithmes de tri et de recherche", content: "Plongez dans les algorithmes de tri efficaces comme Quicksort, Mergesort et Heapsort, ainsi que les techniques de recherche avancées telles que la recherche binaire et la recherche par interpolation. Nous analyserons leur complexité temporelle et spatiale.", isCompleted: false, level: 0 },
      { title: "Module 3: Programmation dynamique", content: "La programmation dynamique est une méthode puissante pour résoudre des problèmes complexes en les décomposant en sous-problèmes plus petits. Ce module vous enseignera les principes de la PD, y compris la mémorisation et la tabulation, à travers des exemples classiques.", isCompleted: false, level: 0 },
      { title: "Module 4: Algorithmes de graphes", content: "Découvrez les algorithmes fondamentaux sur les graphes, essentiels pour la modélisation de réseaux et de relations. Nous couvrirons les parcours en largeur (BFS) et en profondeur (DFS), l'algorithme de Dijkstra pour les plus courts chemins, et l'algorithme de Kruskal pour les arbres couvrants minimaux.", isCompleted: false, level: 0 },
    ],
    skillsToAcquire: ["Maîtriser les structures de données", "Optimiser les algorithmes", "Résoudre des problèmes complexes", "Analyser les graphes"]
  },
  {
    id: '4',
    title: "Développement Web Fullstack",
    description: "Apprenez à construire des applications web complètes, du frontend au backend, avec les technologies modernes.",
    modules: [
      { title: "Module 1: Introduction au Web", content: "Ce module couvre l'historique du web, les principes fondamentaux de HTML pour la structure, CSS pour le style, et JavaScript pour l'interactivité. Vous comprendrez comment ces trois piliers fonctionnent ensemble pour créer des pages web dynamiques.", isCompleted: true, level: 0 },
      { title: "Module 2: Frontend avec React", content: "Plongez dans le développement frontend avec React. Vous apprendrez à créer des composants réutilisables, à gérer l'état de votre application avec des hooks comme `useState` et `useEffect`, et à utiliser les props pour la communication entre composants.", isCompleted: false, level: 0 },
      { title: "Module 2.1: Gestion des formulaires", content: "Maîtrisez la création et la validation de formulaires complexes en React. Ce sous-module se concentre sur l'utilisation de `React Hook Form` pour une gestion efficace des entrées utilisateur et `Zod` pour la validation de schéma, garantissant la robustesse de vos formulaires.", isCompleted: false, level: 1 },
      { title: "Module 2.2: Styles avec Tailwind CSS", content: "Découvrez Tailwind CSS, un framework CSS utilitaire-first qui vous permet de construire des designs personnalisés directement dans votre balisage HTML. Apprenez à styliser rapidement et efficacement vos composants React sans quitter votre fichier JavaScript.", isCompleted: false, level: 1 },
      { title: "Module 3: Backend avec Node.js", content: "Passez au développement backend avec Node.js et Express.js. Ce module vous enseignera comment construire des API RESTful, gérer les requêtes HTTP, et structurer votre application côté serveur pour une performance optimale.", isCompleted: false, level: 0 },
      { title: "Module 3.1: Bases de données SQL", content: "Explorez les bases de données relationnelles avec PostgreSQL. Vous apprendrez les concepts SQL, la conception de schémas de base de données, et l'utilisation d'un ORM (Object-Relational Mapper) pour interagir avec votre base de données depuis Node.js.", isCompleted: false, level: 1 },
      { title: "Module 3.2: Authentification", content: "Implémentez des systèmes d'authentification sécurisés pour vos applications web. Ce sous-module couvre les concepts de JWT (JSON Web Tokens), la gestion des sessions, et les meilleures pratiques pour protéger les routes et les données de vos utilisateurs.", isCompleted: false, level: 1 },
      { title: "Module 4: Déploiement", content: "Ce module vous guide à travers le processus de déploiement de vos applications fullstack. Vous apprendrez à préparer votre code pour la production, à choisir des plateformes d'hébergement (comme Vercel ou Netlify pour le frontend, Heroku ou Render pour le backend), et à mettre en place des pipelines CI/CD pour des déploiements automatisés.", isCompleted: false, level: 0 },
    ],
    skillsToAcquire: ["Développer Frontend", "Développer Backend", "Gérer les bases de données", "Déployer des applications"]
  },
  {
    id: '5',
    title: "Fondamentaux de la Science des Données",
    description: "Explorez les concepts clés de la science des données, de la collecte à l'analyse et la visualisation.",
    modules: [
      { title: "Module 1: Introduction aux Données", content: "Ce module définit la science des données, son rôle croissant dans l'industrie, et les compétences clés requises. Vous comprendrez le cycle de vie des données, de la collecte à l'interprétation, et l'importance de l'éthique des données.", isCompleted: true, level: 0 },
      { title: "Module 2: Collecte et Préparation des Données", content: "Apprenez les techniques de collecte de données à partir de diverses sources (API, bases de données, web scraping). Ce module couvre également les étapes cruciales de nettoyage, de transformation et de gestion des données manquantes pour préparer vos ensembles de données à l'analyse.", isCompleted: false, level: 0 },
      { title: "Module 2.1: Exploration des Données (EDA)", content: "L'EDA est une étape essentielle pour comprendre vos données. Ce sous-module vous enseignera comment utiliser des statistiques descriptives et des techniques de visualisation (histogrammes, nuages de points, boîtes à moustaches) pour découvrir des motifs, des anomalies et des relations.", isCompleted: false, level: 1 },
      { title: "Module 2.2: Ingénierie des Caractéristiques", content: "L'ingénierie des caractéristiques est l'art de créer de nouvelles variables à partir de données brutes pour améliorer la performance des modèles. Ce module explore des techniques comme l'encodage catégoriel, la normalisation, la standardisation et la création de caractéristiques polynomiales.", isCompleted: false, level: 1 },
      { title: "Module 3: Modélisation Prédictive", content: "Introduction aux concepts de la modélisation prédictive. Ce module couvre les algorithmes de régression (linéaire, logistique) et de classification (k-NN, arbres de décision), en expliquant comment construire et entraîner des modèles pour faire des prédictions.", isCompleted: false, level: 0 },
      { title: "Module 3.1: Évaluation des Modèles", content: "Apprenez à évaluer la performance de vos modèles prédictifs. Ce sous-module aborde des métriques clés comme la précision, le rappel, le score F1, l'AUC-ROC, et les techniques pour détecter et prévenir le surapprentissage et le sous-apprentissage.", isCompleted: false, level: 1 },
      { title: "Module 4: Déploiement et Maintien", content: "Ce module traite de la mise en production des modèles de science des données. Vous apprendrez à déployer vos modèles en tant qu'API, à les intégrer dans des applications existantes, et à mettre en place des systèmes de monitoring pour assurer leur performance continue et leur maintenance.", isCompleted: false, level: 0 },
    ],
    skillsToAcquire: ["Collecte de données", "Analyse statistique", "Modélisation ML", "Visualisation"]
  },
];

const CourseDetail = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [courses, setCourses] = useState<Course[]>(initialDummyCourses);
  const course = courses.find(c => c.id === courseId);
  const { setCourseContext, setModuleContext, openChat } = useCourseChat();

  useEffect(() => {
    if (course) {
      setCourseContext(course.id, course.title);
    } else {
      setCourseContext(null, null);
    }
    return () => {
      setCourseContext(null, null);
      setModuleContext(null);
    };
  }, [courseId, course, setCourseContext, setModuleContext]);

  const handleAskAiaAboutCourse = () => {
    if (course) {
      setModuleContext(null);
      openChat(`J'ai une question sur le cours "${course.title}".`);
    }
  };

  if (!course) {
    return (
      <div className="text-center py-20">
        <h1 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
          Cours non trouvé
        </h1>
        <p className="text-lg text-muted-foreground">
          Le cours que vous recherchez n'existe pas.
        </p>
      </div>
    );
  }

  const totalModules = course.modules.length;
  const completedModules = course.modules.filter(m => m.isCompleted).length;
  const progressPercentage = Math.round((completedModules / totalModules) * 100);

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
        {course.title}
      </h1>
      <p className="text-lg text-muted-foreground">{course.description}</p>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Compétences à acquérir</h2>
        <div className="flex flex-wrap gap-2 mb-6">
          {course.skillsToAcquire.map((skill, index) => (
            <Badge key={index} variant="secondary" className="text-sm px-3 py-1">
              {skill}
            </Badge>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Progression du cours</h2>
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Progress value={progressPercentage} className="w-full" />
              <span className="text-lg font-medium">{progressPercentage}%</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {completedModules} modules terminés sur {totalModules}
            </p>
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Visualisation du parcours</h2>
        <CourseModuleList course={course} /> {/* Utilisation du nouveau composant */}
      </section>

      <section>
        <NotesSection noteKey={generateNoteKey('course', course.id)} title={course.title} />
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Bot className="h-6 w-6 text-primary" /> Demandez à AiA sur ce cours
        </h2>
        <Card>
          <CardContent className="p-6 space-y-4">
            <p className="text-muted-foreground mb-4">
              Cliquez ci-dessous pour poser une question à AiA concernant ce cours.
            </p>
            <Button onClick={handleAskAiaAboutCourse}>
              <Send className="h-5 w-5 mr-2" /> Poser une question à AiA sur ce cours
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default CourseDetail;