import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Keep Input for potential future use or if it's used elsewhere
import { Textarea } from "@/components/ui/textarea"; // Keep Textarea for potential future use or if it's used elsewhere
import { Bot, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCourseChat } from "@/contexts/CourseChatContext"; // New import

const dummyCourses = [
  {
    id: '1',
    title: "Introduction à l'IA",
    description: "Découvrez les fondements de l'intelligence artificielle, ses applications et son impact sur le monde moderne.",
    modules: [
      { title: "Module 1: Qu'est-ce que l'IA ?", content: "Définition, histoire et types d'IA." },
      { title: "Module 2: Apprentissage Automatique", content: "Concepts de base du Machine Learning, supervisé et non supervisé." },
      { title: "Module 3: Réseaux de Neurones", content: "Introduction aux réseaux de neurones et au Deep Learning." },
      { title: "Module 4: Applications de l'IA", content: "Exemples concrets : vision par ordinateur, traitement du langage naturel." },
    ],
  },
  {
    id: '2',
    title: "React pour débutants",
    description: "Apprenez les fondamentaux de React, la bibliothèque JavaScript populaire pour construire des interfaces utilisateur interactives.",
    modules: [
      { title: "Module 1: Les bases de React", content: "Composants, JSX, props et état." },
      { title: "Module 2: Hooks et gestion d'état", content: "useState, useEffect, useContext et Reducers." },
      { title: "Module 3: Routage avec React Router", content: "Navigation entre les pages de votre application." },
      { title: "Module 4: Requêtes API et cycle de vie", content: "Fetching de données et gestion des effets secondaires." },
    ],
  },
  {
    id: '3',
    title: "Algorithmes Avancés",
    description: "Maîtrisez les structures de données complexes et les algorithmes efficaces pour résoudre des problèmes informatiques avancés.",
    modules: [
      { title: "Module 1: Structures de données avancées", content: "Arbres, graphes, tables de hachage." },
      { title: "Module 2: Algorithmes de tri et de recherche", content: "Quicksort, Mergesort, recherche binaire." },
      { title: "Module 3: Programmation dynamique", content: "Optimisation de problèmes complexes." },
      { title: "Module 4: Algorithmes de graphes", content: "Dijkstra, BFS, DFS." },
    ],
  },
];

const CourseDetail = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const course = dummyCourses.find(c => c.id === courseId);
  const { setCourseContext, setModuleContext, openChat } = useCourseChat(); // Use the new context hook

  // Set course context when component mounts or courseId changes
  useEffect(() => {
    if (course) {
      setCourseContext(course.id, course.title);
    } else {
      setCourseContext(null, null); // Clear context if course not found
    }
    // Clean up context when component unmounts
    return () => {
      setCourseContext(null, null);
      setModuleContext(null); // Clear module context too
    };
  }, [courseId, course, setCourseContext, setModuleContext]);

  const handleAskAiaAboutCourse = () => {
    if (course) {
      setModuleContext(null); // Clear module context if asking about the whole course
      openChat(`J'ai une question sur le cours "${course.title}".`);
    }
  };

  const handleAskAiaAboutModule = (moduleTitle: string) => {
    if (course) {
      setModuleContext(moduleTitle); // Set the specific module context
      openChat(`J'ai une question sur le module "${moduleTitle}" du cours "${course.title}".`);
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

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
        {course.title}
      </h1>
      <p className="text-lg text-muted-foreground">{course.description}</p>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Modules du cours</h2>
        <div className="grid gap-4">
          {course.modules.map((module, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle>{module.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">{module.content}</p>
                <Button
                  variant="outline"
                  onClick={() => handleAskAiaAboutModule(module.title)}
                >
                  <Send className="h-4 w-4 mr-2" /> Demander à AiA sur ce module
                </Button>
              </CardContent>
            </Card>
          ))}
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