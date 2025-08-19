import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, Send, ArrowLeft, ArrowRight, CheckCircle, PlusCircle, NotebookText } from "lucide-react";
import { useCourseChat } from "@/contexts/CourseChatContext";
import { showSuccess, showError } from '@/utils/toast';
import { Progress } from "@/components/ui/progress";
import QuickNoteDialog from "@/components/QuickNoteDialog";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { generateNoteKey, getNotes } from "@/lib/notes";
import NotesSection from "@/components/NotesSection";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area"; // Nouvelle importation
import { dummyCourses, Course, Module, ModuleSection } from "@/lib/courseData";

const ModuleDetail = () => {
  const { courseId, moduleIndex } = useParams<{ courseId: string; moduleIndex: string }>();
  const navigate = useNavigate();
  const { setCourseContext, setModuleContext, openChat } = useCourseChat();
  const isMobile = useIsMobile();

  const course = dummyCourses.find(c => c.id === courseId);
  const currentModuleIndex = parseInt(moduleIndex || '0', 10);
  const module = course?.modules[currentModuleIndex];

  const [isQuickNoteDialogOpen, setIsQuickNoteDialogOpen] = useState(false);
  const [currentNoteContext, setCurrentNoteContext] = useState({ key: '', title: '' });
  const [refreshNotesSection, setRefreshNotesSection] = useState(0);

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
    const updatedCourses = dummyCourses.map(c =>
      c.id === courseId
        ? {
            ...c,
            modules: c.modules.map((mod, idx) =>
              idx === currentModuleIndex ? { ...mod, isCompleted: true } : mod
            ),
          }
        : c
    );
    Object.assign(dummyCourses, updatedCourses);

    showSuccess(`Module "${module.title}" marqué comme terminé !`);

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
    setRefreshNotesSection(prev => prev + 1);
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
          {module.sections.map((section, index) => {
            const sectionNoteKey = generateNoteKey('section', course.id, currentModuleIndex, index);
            const sectionNotes = getNotes(sectionNoteKey);
            const hasNotes = sectionNotes.length > 0;

            return (
              <ContextMenu key={index}>
                <ContextMenuTrigger className="block w-full">
                  <div className="mb-6 p-4 border rounded-md bg-muted/10 cursor-context-menu">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-semibold text-foreground">{section.title}</h3>
                      {hasNotes && (
                        <div className="flex items-center gap-2 text-primary">
                          <NotebookText className="h-5 w-5" />
                          <span className="text-sm font-medium">{sectionNotes.length} notes</span>
                        </div>
                      )}
                    </div>
                    {section.type === 'video' && section.url ? (
                      <div className="relative w-full aspect-video my-4 rounded-md overflow-hidden">
                        <iframe
                          src={section.url}
                          title={section.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="absolute top-0 left-0 w-full h-full"
                        ></iframe>
                      </div>
                    ) : section.type === 'image' && section.url ? (
                      <img src={section.url} alt={section.title} className="max-w-full h-auto rounded-md my-4" />
                    ) : section.type === 'quiz' ? (
                      <div className="p-4 bg-accent rounded-md text-accent-foreground flex flex-col items-center justify-center text-center my-4">
                        <p className="text-lg font-medium mb-2">Quiz : {section.title}</p>
                        <p className="text-sm mb-4">{section.content}</p>
                        <Button>Commencer le Quiz</Button>
                      </div>
                    ) : (
                      <p className="text-muted-foreground mt-2">{section.content}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">Clic droit pour les options</p>

                    {hasNotes && (
                      <Accordion type="single" collapsible className="w-full mt-4">
                        <AccordionItem value={`section-notes-${index}`}>
                          <AccordionTrigger className="py-2 text-sm font-medium text-primary hover:no-underline">
                            Voir mes notes pour cette section ({sectionNotes.length})
                          </AccordionTrigger>
                          <AccordionContent className="pt-2 pb-0">
                            <ScrollArea className="h-32 w-full rounded-md border p-2 bg-background/50">
                              <ul className="list-disc pl-4 space-y-1 text-sm text-foreground">
                                {sectionNotes.map((note, noteIdx) => (
                                  <li key={noteIdx}>{note}</li>
                                ))}
                              </ul>
                            </ScrollArea>
                            <div className="text-right mt-2">
                              <Link to="/all-notes" className="text-xs text-muted-foreground hover:underline">
                                Gérer toutes mes notes
                              </Link>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    )}
                  </div>
                </ContextMenuTrigger>
                <ContextMenuContent className="w-64">
                  <ContextMenuItem onClick={() => handleOpenQuickNoteDialog(section.title, index)}>
                    <NotebookText className="mr-2 h-4 w-4" /> Ajouter une note rapide
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => handleAskAiaAboutSection(section.title)}>
                    <Bot className="mr-2 h-4 w-4" /> Demander à AiA
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            );
          })}
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

      <section>
        <NotesSection noteKey={generateNoteKey('module', course.id, currentModuleIndex)} title={module.title} refreshKey={refreshNotesSection} />
      </section>

      {/* Bouton flottant pour ajouter une note rapide pour le module entier */}
      <div className={cn(
        "fixed z-40 p-4",
        isMobile ? "bottom-20 left-4" : "bottom-4 left-4"
      )}>
        <Button
          size="lg"
          className="rounded-full h-14 w-14 shadow-lg animate-bounce-slow"
          onClick={() => handleOpenQuickNoteDialog(module.title, -1)}
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