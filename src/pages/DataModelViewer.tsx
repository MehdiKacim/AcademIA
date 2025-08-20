import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Code, Database, Users, BookOpen, LayoutList, School } from "lucide-react";

const DataModelViewer = () => {
  const dataModels = {
    Establishment: `
interface Establishment {
  id: string;
  name: string;
  address?: string;
  contactEmail?: string;
}
    `,
    Curriculum: `
interface Curriculum {
  id: string;
  name: string;
  description?: string;
  establishmentId: string; // Link to parent establishment
  courseIds: string[]; // List of course IDs included in this curriculum
}
    `,
    Class: `
interface Class {
  id: string;
  name: string;
  curriculumId: string; // Link to parent curriculum
  studentIds: string[]; // List of student IDs in this class
}
    `,
    Student: `
interface Student {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  classId?: string; // Link to student's class
  enrolledCoursesProgress: {
    courseId: string;
    isCompleted: boolean;
    modulesProgress: {
      moduleIndex: number;
      isCompleted: boolean;
      sectionsProgress: {
        sectionIndex: number;
        isCompleted: boolean;
        quizResult?: { score: number; total: number; passed: boolean };
      }[];
    }[];
  }[];
}
    `,
    Course: `
interface Course {
  id: string;
  title: string;
  description: string;
  modules: Module[];
  skillsToAcquire: string[];
  imageUrl?: string;
  category?: string;
  difficulty?: 'Débutant' | 'Intermédiaire' | 'Avancé';
}
    `,
    Module: `
interface Module {
  title: string;
  sections: ModuleSection[];
  isCompleted: boolean;
  level: number;
}
    `,
    ModuleSection: `
interface ModuleSection {
  title: string;
  content: string;
  type?: 'text' | 'quiz' | 'video' | 'image';
  url?: string;
  questions?: QuizQuestion[];
  isCompleted: boolean;
  passingScore?: number;
  quizResult?: { score: number; total: number; passed: boolean };
}
    `,
    QuizQuestion: `
interface QuizQuestion {
  question: string;
  options: QuizOption[];
}
    `,
    QuizOption: `
interface QuizOption {
  text: string;
  isCorrect: boolean;
}
    `,
  };

  const getIcon = (modelName: string) => {
    switch (modelName) {
      case 'Establishment': return <School className="h-5 w-5 text-primary" />;
      case 'Curriculum': return <LayoutList className="h-5 w-5 text-primary" />;
      case 'Class': return <Users className="h-5 w-5 text-primary" />;
      case 'Student': return <Database className="h-5 w-5 text-primary" />;
      case 'Course': return <BookOpen className="h-5 w-5 text-primary" />;
      default: return <Code className="h-5 w-5 text-primary" />;
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
        Modèle de Données de l'Application
      </h1>
      <p className="text-lg text-muted-foreground">
        Voici la structure des données utilisées dans l'application, telles que définies dans les interfaces TypeScript.
      </p>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Object.entries(dataModels).map(([name, schema]) => (
          <Card key={name}>
            <CardHeader className="flex flex-row items-center gap-3">
              {getIcon(name)}
              <CardTitle>{name}</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-48 w-full rounded-md border p-4 font-mono text-sm bg-muted/20">
                <pre className="whitespace-pre-wrap">{schema.trim()}</pre>
              </ScrollArea>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DataModelViewer;