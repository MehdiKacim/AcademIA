import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, Send, Lock, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCourseChat } from "@/contexts/CourseChatContext";
import {
  Accordion, // Gardé au cas où, mais non utilisé pour les modules ici
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { motion } from 'framer-motion';
import { showSuccess, showError } from '@/utils/toast';
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface Module {
  title: string;
  content: string;
  isCompleted: boolean;
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
      { title: "Module 1: Qu'est-ce que l'IA ?", content: "Définition, histoire et types d'IA.", isCompleted: true },
      { title: "Module 2: Apprentissage Automatique", content: "Concepts de base du Machine Learning, supervisé et non supervisé.", isCompleted: false },
      { title: "Module 3: Réseaux de Neurones", content: "Introduction aux réseaux de neurones et au Deep Learning.", isCompleted: false },
      { title: "Module 4: Applications de l'IA", content: "Exemples concrets : vision par ordinateur, traitement du langage naturel.", isCompleted: false },
    ],
    skillsToAcquire: ["Comprendre l'IA", "Maîtriser le ML", "Appliquer le Deep Learning", "Analyser les données"]
  },
  {
    id: '2',
    title: "React pour débutants",
    description: "Apprenez les fondamentaux de React, la bibliothèque JavaScript populaire pour construire des interfaces utilisateur interactives.",
    modules: [
      { title: "Module 1: Les bases de React", content: "Composants, JSX, props et état.", isCompleted: true },
      { title: "Module 2: Hooks et gestion d'état", content: "useState, useEffect, useContext et Reducers.", isCompleted: true },
      { title: "Module 3: Routage avec React Router", content: "Navigation entre les pages de votre application.", isCompleted: false },
      { title: "Module 4: Requêtes API et cycle de vie", content: "Fetching de données et gestion des effets secondaires.", isCompleted: false },
    ],
    skillsToAcquire: ["Développer avec React", "Gérer l'état", "Naviguer avec React Router", "Intégrer des APIs"]
  },
  {
    id: '3',
    title: "Algorithmes Avancés",
    description: "Maîtrisez les structures de données complexes et les algorithmes efficaces pour résoudre des problèmes informatiques avancés.",
    modules: [
      { title: "Module 1: Structures de données avancées", content: "Arbres, graphes, tables de hachage.", isCompleted: false },
      { title: "Module 2: Algorithmes de tri et de recherche", content: "Quicksort, Mergesort, recherche binaire.", isCompleted: false },
      { title: "Module 3: Programmation dynamique", content: "Optimisation de problèmes complexes.", isCompleted: false },
      { title: "Module 4: Algorithmes de graphes", content: "Dijkstra, BFS, DFS.", isCompleted: false },
    ],
    skillsToAcquire: ["Maîtriser les structures de données", "Optimiser les algorithmes", "Résoudre des problèmes complexes", "Analyser les graphes"]
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
        <h2 className="text-2xl font-semibold mb-4">Modules du cours</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {course.modules.map((module, index) => {
            const isModuleAccessible = index === 0 || course.modules[index - 1]?.isCompleted;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className={cn(
                  "relative",
                  !isModuleAccessible && "opacity-50 cursor-not-allowed"
                )}
              >
                <Card className="h-full flex flex-col">
                  <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-lg font-medium">
                      {module.title}
                    </CardTitle>
                    {module.isCompleted ? (
                      <CheckCircle className="h-6 w-6 text-green-500" />
                    ) : (
                      <Lock className="h-6 w-6 text-muted-foreground" />
                    )}
                  </CardHeader>
                  <CardContent className="flex-grow flex flex-col justify-between">
                    <p className="text-sm text-muted-foreground mb-4">
                      {module.content.substring(0, 100)}...
                    </p>
                    <Link to={`/courses/${course.id}/modules/${index}`}>
                      <Button className="w-full" disabled={!isModuleAccessible}>
                        Accéder au module
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
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