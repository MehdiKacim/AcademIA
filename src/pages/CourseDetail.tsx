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
import ModuleFlowVisualizer from "@/components/ModuleFlowVisualizer";
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

const initialDummyCourses: Course[] = [
  {
    id: '1',
    title: "Introduction à l'IA",
    description: "Découvrez les fondements de l'intelligence artificielle, ses applications et son impact sur le monde moderne.",
    modules: [
      { title: "Module 1: Qu'est-ce que l'IA ?", content: "Définition, histoire et types d'IA.", isCompleted: true, level: 0 },
      { title: "Module 2: Apprentissage Automatique (Intro)", content: "Concepts de base du Machine Learning.", isCompleted: false, level: 0 },
      { title: "Module 2.1: Apprentissage Supervisé", content: "Détails sur les modèles supervisés.", isCompleted: false, level: 1 },
      { title: "Module 2.2: Apprentissage Non-Supervisé", content: "Détails sur les modèles non-supervisés.", isCompleted: false, level: 1 },
      { title: "Module 3: Réseaux de Neurones", content: "Introduction aux réseaux de neurones et au Deep Learning.", isCompleted: false, level: 0 },
      { title: "Module 4: Applications de l'IA", content: "Exemples concrets : vision par ordinateur, traitement du langage naturel.", isCompleted: false, level: 0 },
    ],
    skillsToAcquire: ["Comprendre l'IA", "Maîtriser le ML", "Appliquer le Deep Learning", "Analyser les données"]
  },
  {
    id: '2',
    title: "React pour débutants",
    description: "Apprenez les fondamentaux de React, la bibliothèque JavaScript populaire pour construire des interfaces utilisateur interactives.",
    modules: [
      { title: "Module 1: Les bases de React", content: "Composants, JSX, props et état.", isCompleted: true, level: 0 },
      { title: "Module 2: Hooks et gestion d'état", content: "useState, useEffect, useContext et Reducers.", isCompleted: true, level: 0 },
      { title: "Module 3: Routage avec React Router", content: "Navigation entre les pages de votre application.", isCompleted: false, level: 0 },
      { title: "Module 4: Requêtes API et cycle de vie", content: "Fetching de données et gestion des effets secondaires.", isCompleted: false, level: 0 },
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
  {
    id: '5',
    title: "Fondamentaux de la Science des Données",
    description: "Explorez les concepts clés de la science des données, de la collecte à l'analyse et la visualisation.",
    modules: [
      { title: "Module 1: Introduction aux Données", content: "Qu'est-ce que la science des données, son importance.", isCompleted: true, level: 0 },
      { title: "Module 2: Collecte et Préparation des Données", content: "Sources de données, nettoyage, transformation.", isCompleted: false, level: 0 },
      { title: "Module 2.1: Exploration des Données (EDA)", content: "Statistiques descriptives, visualisation.", isCompleted: false, level: 1 },
      { title: "Module 2.2: Ingénierie des Caractéristiques", content: "Création de nouvelles variables.", isCompleted: false, level: 1 },
      { title: "Module 3: Modélisation Prédictive", content: "Introduction aux modèles, régression, classification.", isCompleted: false, level: 0 },
      { title: "Module 3.1: Évaluation des Modèles", content: "Métriques de performance, surapprentissage.", isCompleted: false, level: 1 },
      { title: "Module 4: Déploiement et Maintien", content: "Mise en production, monitoring.", isCompleted: false, level: 0 },
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
        <ModuleFlowVisualizer course={course} />
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