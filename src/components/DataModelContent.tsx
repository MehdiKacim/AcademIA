import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Code, Database, Users, BookOpen, LayoutList, School, User, GraduationCap, PenTool } from "lucide-react";

const DataModelContent = () => {
  const dataModels = {
    User: `
interface User {
  id: string;
  email: string;
  username: string;
  passwordHash: string; // Hashed password
  role: 'student' | 'creator' | 'tutor';
}
    `,
    Student: `
interface Student {
  id: string; // Student profile ID
  userId: string; // Link to the User account
  firstName: string;
  lastName: string;
  classId?: string; // Link to the class
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
    CreatorProfile: `
interface CreatorProfile {
  id: string; // Creator profile ID
  userId: string; // Link to the User account
  establishmentIds: string[]; // List of Establishment IDs this creator is associated with
  // Add any specific creator fields here, e.g., bio, expertise
}
    `,
    TutorProfile: `
interface TutorProfile {
  id: string; // Tutor profile ID
  userId: string; // Link to the User account
  // Add any specific tutor fields here, e.g., subjects, availability
}
    `,
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
  creatorIds: string[]; // List of User IDs (creators/teachers) associated with this class
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
      case 'User': return <User className="h-5 w-5 text-primary" />;
      case 'Student': return <GraduationCap className="h-5 w-5 text-primary" />;
      case 'CreatorProfile': return <PenTool className="h-5 w-5 text-primary" />;
      case 'TutorProfile': return <Users className="h-5 w-5 text-primary" />;
      case 'Establishment': return <School className="h-5 w-5 text-primary" />;
      case 'Curriculum': return <LayoutList className="h-5 w-5 text-primary" />;
      case 'Class': return <Users className="h-5 w-5 text-primary" />;
      case 'Course': return <BookOpen className="h-5 w-5 text-primary" />;
      default: return <Code className="h-5 w-5 text-primary" />;
    }
  };

  return (
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
  );
};

export default DataModelContent;