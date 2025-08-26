import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, Send, ArrowLeft, ArrowRight, CheckCircle, PlusCircle, NotebookText, HelpCircle } from "lucide-react";
import { useCourseChat } from "@/contexts/CourseChatContext";
import { showSuccess, showError } from '@/utils/toast';
import { Progress } from "@/components/ui/progress";
import QuickNoteDialog from "@/components/QuickNoteDialog";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { generateNoteKey, getNotes, addNote, updateNote, deleteNote } from "@/lib/notes"; // Import notes functions
import NotesSection from "@/components/NotesSection";
import { Badge } from "@/components/ui/badge";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Course, Module, ModuleSection } from "@/lib/dataModels"; // Corrected import path
import { loadCourses } from "@/lib/courseData"; // Keep loadCourses from courseData
import { useRole } from '@/contexts/RoleContext';
import { getStudentCourseProgress, upsertStudentCourseProgress } from '@/lib/studentData';
import QuizComponent from "@/components/QuizComponent";
import { StudentCourseProgress as StudentCourseProgressType } from '@/lib/dataModels'; // Import the type

const ModuleDetail = () => {
  const { courseId, moduleIndex } = useParams<{ courseId: string; moduleIndex: string }>();
  const navigate = useNavigate();
  const { currentUserProfile, currentRole, isLoadingUser } = useRole();
  const { setCourseContext, setModuleContext, openChat } = useCourseChat();
  const isMobile = useIsMobile();
  const location = useLocation();

  const [courses, setCourses] = useState<Course[]>([]);
  const [studentCourseProgress, setStudentCourseProgress] = useState<StudentCourseProgressType | null>(null);

  const currentModuleIndex = parseInt(moduleIndex || '0', 10);
  const course = courses.find(c => c.id === courseId);
  const module = course?.modules[currentModuleIndex];

  const moduleProgress = studentCourseProgress?.modules_progress.find(mp => mp.module_index === currentModuleIndex);

  const [isQuickNoteDialogOpen, setIsQuickNoteDialogOpen] = useState(false);
  const [currentNoteContext, setCurrentNoteContext] = useState({ key: '', title: '' });
  const [refreshNotesSection, setRefreshNotesSection] = useState(0);
  const [highlightedElementId, setHighlightedElementId] = useState<string | null>(null);
  const [visibleNotesKey, setVisibleNotesKey] = useState<string | null>(null);

  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const loadedCourses = await loadCourses();
      setCourses(loadedCourses);
      if (currentUserProfile && currentRole === 'student' && courseId) {
        const progress = await getStudentCourseProgress(currentUserProfile.id, courseId);
        setStudentCourseProgress(progress);
      }
    };
    fetchData();
  }, [courseId, moduleIndex, currentUserProfile, currentRole]); // Re-fetch if courseId or moduleIndex changes

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

  const scrollToSection = useCallback((sectionIdx: number) => {
    if (sectionRefs.current[sectionIdx]) {
      sectionRefs.current[sectionIdx]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  if (isLoadingUser) {
    return (
      <div className="text-center py-20">
        <h1 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
          Chargement du module...
        </h1>
        <p className="text-lg text-muted-foreground">
          Veuillez patienter.
        </p>
      </div>
    );
  }

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

  // Determine module accessibility based on student progress
  const isModuleAccessible = currentRole === 'student'
    ? (studentCourseProgress?.modules_progress.find(mp => mp.module_index === currentModuleIndex - 1)?.is_completed || currentModuleIndex === 0)
    : true; // Always accessible for non-students (creators/tutors)

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

  const markSectionComplete = async (sectionIdx: number, quizResult?: { score: number; total: number; passed: boolean }) => {
    if (!currentUserProfile || !studentCourseProgress || !moduleProgress) {
      showError("Impossible de marquer la section comme terminée. Profil étudiant non trouvé ou progression non chargée.");
      return;
    }

    const updatedSectionsProgress = moduleProgress.sections_progress.map((sec, idx) => {
      if (idx === sectionIdx) {
        return {
          ...sec,
          is_completed: true, // Use is_completed
          quiz_result: quizResult || sec.quiz_result, // Use quiz_result
        };
      }
      return sec;
    });

    const updatedModuleProgress = {
      ...moduleProgress,
      sections_progress: updatedSectionsProgress, // Use sections_progress
    };

    const updatedModulesProgress = studentCourseProgress.modules_progress.map((mod, idx) =>
      idx === currentModuleIndex ? updatedModuleProgress : mod
    );

    const updatedCourseProgress: StudentCourseProgressType = {
      ...studentCourseProgress,
      modules_progress: updatedModulesProgress, // Use modules_progress
      is_completed: updatedModulesProgress.every(mp => mp.is_completed), // Use is_completed
    };

    try {
      const savedProgress = await upsertStudentCourseProgress(updatedCourseProgress);
      if (savedProgress) {
        setStudentCourseProgress(savedProgress);
        showSuccess(`Section "${module.sections[sectionIdx].title}" marquée comme terminée !`);
      } else {
        showError("Échec de la mise à jour de la progression de la section.");
      }
    } catch (error: any) {
      console.error("Error marking section complete:", error);
      showError(`Erreur lors de la mise à jour de la progression: ${error.message}`);
    }
  };

  const handleMarkModuleComplete = async () => {
    if (!currentUserProfile || !studentCourseProgress || !moduleProgress) {
      showError("Impossible de marquer le module comme terminé. Profil étudiant non trouvé ou progression non chargée.");
      return;
    }

    const allSectionsCompleted = moduleProgress.sections_progress.every(section => section.is_completed);

    if (!allSectionsCompleted) {
      showError("Veuillez compléter toutes les sections de ce module avant de le marquer comme terminé.");
      return;
    }

    const updatedModuleProgress = { ...moduleProgress, is_completed: true }; // Use is_completed

    const updatedModulesProgress = studentCourseProgress.modules_progress.map((mod, idx) =>
      idx === currentModuleIndex ? updatedModuleProgress : mod
    );

    const updatedCourseProgress: StudentCourseProgressType = {
      ...studentCourseProgress,
      modules_progress: updatedModulesProgress, // Use modules_progress
      is_completed: updatedModulesProgress.every(mp => mp.is_completed), // Use is_completed
    };

    try {
      const savedProgress = await upsertStudentCourseProgress(updatedCourseProgress);
      if (savedProgress) {
        setStudentCourseProgress(savedProgress);
        showSuccess(`Module "${module.title}" marqué comme terminé !`);

        if (currentModuleIndex < course.modules.length - 1) {
          navigate(`/courses/${courseId}/modules/${currentModuleIndex + 1}`);
        } else {
          showSuccess("Félicitations ! Vous avez terminé tous les modules de ce cours.");
          navigate(`/courses/${courseId}`);
        }
      } else {
        showError("Échec de la mise à jour de la progression du module.");
      }
    } catch (error: any) {
      console.error("Error marking module complete:", error);
      showError(`Erreur lors de la mise à jour de la progression: ${error.message}`);
    }
  };

  const handleQuizComplete = async (score: number, total: number, passed: boolean, sectionIdx: number) => {
    if (!currentUserProfile || !studentCourseProgress || !moduleProgress) {
      showError("Impossible de marquer le quiz comme terminé. Profil étudiant non trouvé ou progression non chargée.");
      return;
    }

    const quizResult = { score, total, passed };

    if (passed) {
      showSuccess(`Quiz terminé ! Votre score : ${score}/${total}. Vous avez réussi !`);
      await markSectionComplete(sectionIdx, quizResult);
    } else {
      showError(`Quiz terminé ! Votre score : ${score}/${total}. Vous n'avez pas atteint le seuil de réussite.`);
      // Update quiz result without marking section complete if failed
      const updatedSectionsProgress = moduleProgress.sections_progress.map((sec, idx) => {
        if (idx === sectionIdx) {
          return {
            ...sec,
            quiz_result: quizResult, // Use quiz_result
          };
        }
        return sec;
      });

      const updatedModuleProgress = {
        ...moduleProgress,
        sections_progress: updatedSectionsProgress, // Use sections_progress
      };

      const updatedModulesProgress = studentCourseProgress.modules_progress.map((mod, idx) =>
        idx === currentModuleIndex ? updatedModuleProgress : mod
      );

      const updatedCourseProgress: StudentCourseProgressType = {
        ...studentCourseProgress,
        modules_progress: updatedModulesProgress, // Use modules_progress
      };

      try {
        const savedProgress = await upsertStudentCourseProgress(updatedCourseProgress);
        if (savedProgress) {
          setStudentCourseProgress(savedProgress);
        } else {
          showError("Échec de la mise à jour du résultat du quiz.");
        }
      } catch (error: any) {
        console.error("Error updating quiz result:", error);
        showError(`Erreur lors de la mise à jour du résultat du quiz: ${error.message}`);
      }
    }
  };

  const handleAskAiaAboutSection = (sectionTitle: string) => {
    openChat(`J'ai une question sur la section "${sectionTitle}" du module "${module.title}" du cours "${course.title}".`);
  };

  const handleAskAiaAboutModule = () => {
    openChat(`J'ai une question sur le module "${module.title}" du cours "${course.title}".`);
  };

  const handleOpenQuickNoteDialog = (title: string, sectionIdx?: number) => {
    const key = sectionIdx !== undefined
      ? generateNoteKey('section', course.id, currentModuleIndex, sectionIdx)
      : generateNoteKey('module', course.id, currentModuleIndex);
    setCurrentNoteContext({
      key: key,
      title: title,
    });
    setIsQuickNoteDialogOpen(true);
  };

  const handleNoteAdded = useCallback(() => {
    setRefreshNotesSection(prev => prev + 1);
  }, []);

  // Calculate module progress for display
  let moduleDisplayProgress = 0;
  let moduleDisplayCompletedSections = 0;
  const totalSectionsInModule = module.sections.length;

  if (moduleProgress) {
    moduleDisplayCompletedSections = moduleProgress.sections_progress.filter(s => s.is_completed).length;
    moduleDisplayProgress = totalSectionsInModule > 0 ? Math.round((moduleDisplayCompletedSections / totalSectionsInModule) * 100) : 0;
  }

  const moduleNoteKey = generateNoteKey('module', course.id, currentModuleIndex);

  const allSectionsInModuleCompleted = moduleProgress?.sections_progress.every(section => section.is_completed) || false;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-8"> {/* Added responsive padding and max-width */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="outline" onClick={() => navigate(`/courses/${courseId}`)}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Retour au cours
        </Button>
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
          {course.title}
        </h1>
        <div></div>
      </div>

      <ContextMenu onOpenChange={(open) => setHighlightedElementId(open ? `module-${course.id}-${currentModuleIndex}` : null)}>
        <ContextMenuTrigger asChild>
          <Card className={cn(
            "relative rounded-android-tile", // Apply rounded-android-tile
            highlightedElementId === `module-${course.id}-${currentModuleIndex}` ? "bg-primary/10" : ""
          )}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{module.title}</span>
                {moduleProgress?.is_completed && <CheckCircle className="h-6 w-6 text-green-500" />}
              </CardTitle>
              <CardDescription>
                Module {currentModuleIndex + 1} sur {course.modules.length}
              </CardDescription>
              <Progress value={moduleDisplayProgress} className="w-full mt-2" />
            </CardHeader>
            <CardContent>
              {module.sections.map((section, index) => {
                const sectionNoteKey = generateNoteKey('section', course.id, currentModuleIndex, index);
                const sectionProgress = moduleProgress?.sections_progress.find(sp => sp.section_index === index);
                const isSectionCompleted = sectionProgress?.is_completed || false;
                const quizResult = sectionProgress?.quiz_result;

                const isSectionAccessible = index === 0 || (moduleProgress?.sections_progress.find(sp => sp.section_index === index - 1)?.is_completed || false);

                return (
                  <div key={index} className="mb-6">
                    <ContextMenu onOpenChange={(open) => setHighlightedElementId(open ? `section-${course.id}-${currentModuleIndex}-${index}` : null)}>
                      <ContextMenuTrigger className="block w-full">
                        <div
                          id={`section-${index}`} // Ajout de l'ID pour le défilement
                          ref={el => sectionRefs.current[index] = el}
                          className={cn(
                            "p-4 border rounded-android-tile cursor-context-menu", // Apply rounded-android-tile
                            highlightedElementId === `section-${course.id}-${currentModuleIndex}-${index}` ? "bg-primary/10" : "bg-muted/10",
                            !isSectionAccessible && "opacity-50 cursor-not-allowed",
                            section.type === 'quiz' && "border-dashed border-primary/50 bg-primary/5"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
                              {section.type === 'quiz' && <HelpCircle className="h-5 w-5 text-primary" />}
                              <span>{section.title}</span>
                              {isSectionCompleted && <CheckCircle className="h-5 w-5 text-green-500" />}
                            </h3>
                            {quizResult && (
                              <Badge variant={quizResult.passed ? "default" : "destructive"} className="text-sm rounded-android-tile"> {/* Apply rounded-android-tile */}
                                {quizResult.score}/{quizResult.total} ({((quizResult.score / quizResult.total) * 100).toFixed(0)}%) {quizResult.passed ? 'Réussi' : 'Échoué'}
                              </Badge>
                            )}
                          </div>
                          {!isSectionAccessible ? (
                            <p className="text-muted-foreground mt-2">Veuillez compléter la section précédente pour accéder à celle-ci.</p>
                          ) : (
                            <>
                              {section.type === 'video' && section.url ? (
                                <div className="relative w-full aspect-video my-4 rounded-android-tile overflow-hidden"> {/* Apply rounded-android-tile */}
                                  <iframe
                                    src={section.url}
                                    title={section.title}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    className="absolute top-0 left-0 w-full h-full"
                                  ></iframe>
                                </div>
                              ) : section.type === 'image' && section.url ? (
                                <img src={section.url} alt={section.title} className="max-w-full h-auto rounded-android-tile my-4" /> // Apply rounded-android-tile
                              ) : section.type === 'quiz' && section.questions ? (
                                <div className="my-4">
                                  <QuizComponent
                                    questions={section.questions}
                                    passingScore={section.passingScore || 0}
                                    onQuizComplete={(score, total, passed) => handleQuizComplete(score, total, passed, index)}
                                  />
                                </div>
                              ) : (
                                <p className="text-muted-foreground mt-2">{section.content}</p>
                              )}
                              {!isSectionCompleted && section.type !== 'quiz' && (
                                <Button
                                  onClick={() => markSectionComplete(index)}
                                  className="mt-4"
                                  size="sm"
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" /> Marquer comme lu
                                </Button>
                              )}
                              <p className="text-xs text-muted-foreground mt-2">Clic droit pour les options</p>
                            </>
                          )}
                        </div>
                      </ContextMenuTrigger>
                      <ContextMenuContent className="w-auto p-1 rounded-android-tile"> {/* Apply rounded-android-tile */}
                        {currentUserProfile && (
                          <>
                            <ContextMenuItem className="p-2" onClick={() => setVisibleNotesKey(visibleNotesKey === sectionNoteKey ? null : sectionNoteKey)}>
                              <NotebookText className="mr-2 h-4 w-4" /> {visibleNotesKey === sectionNoteKey ? 'Masquer les notes' : 'Afficher les notes'}
                            </ContextMenuItem>
                            <ContextMenuItem className="p-2" onClick={() => handleOpenQuickNoteDialog(section.title, index)}>
                              <PlusCircle className="mr-2 h-4 w-4" /> Ajouter une note rapide
                            </ContextMenuItem>
                          </>
                        )}
                        <ContextMenuItem className="p-2" onClick={() => handleAskAiaAboutSection(section.title)}>
                          <Bot className="mr-2 h-4 w-4" /> Demander à AiA
                        </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
                    {visibleNotesKey === sectionNoteKey && currentUserProfile && (
                      <NotesSection
                        noteKey={sectionNoteKey}
                        title={section.title}
                        userId={currentUserProfile.id}
                        refreshKey={refreshNotesSection}
                      />
                    )}
                  </div>
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
                    disabled={currentModuleIndex === course.modules.length - 1 || !moduleProgress?.is_completed}
                  >
                    Suivant <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
                <div className="flex gap-2">
                  {!moduleProgress?.is_completed && (
                    <Button onClick={handleMarkModuleComplete} disabled={!allSectionsInModuleCompleted}>
                      <CheckCircle className="h-4 w-4 mr-2" /> Marquer comme terminé
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-auto p-1 rounded-android-tile"> {/* Apply rounded-android-tile */}
          {currentUserProfile && (
            <>
              <ContextMenuItem className="p-2" onClick={() => setVisibleNotesKey(visibleNotesKey === moduleNoteKey ? null : moduleNoteKey)}>
                <NotebookText className="mr-2 h-4 w-4" /> {visibleNotesKey === moduleNoteKey ? 'Masquer les notes du module' : 'Afficher les notes du module'}
              </ContextMenuItem>
              <ContextMenuItem className="p-2" onClick={() => handleOpenQuickNoteDialog(module.title)}>
                <PlusCircle className="mr-2 h-4 w-4" /> Ajouter une note rapide au module
              </ContextMenuItem>
            </>
          )}
          <ContextMenuItem className="p-2" onClick={handleAskAiaAboutModule}>
            <Bot className="mr-2 h-4 w-4" /> Demander à AiA sur ce module
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {visibleNotesKey === moduleNoteKey && currentUserProfile && (
        <NotesSection
          noteKey={moduleNoteKey}
          title={module.title}
          userId={currentUserProfile.id}
          refreshKey={refreshNotesSection}
        />
      )}

      {currentUserProfile && (
        <div className={cn(
          "fixed z-40 p-4",
          isMobile ? "bottom-20 left-4" : "bottom-4 left-4"
        )}>
          <Button
            size="lg"
            className="rounded-full h-14 w-14 shadow-lg animate-bounce-slow"
            onClick={() => handleOpenQuickNoteDialog(module.title)}
          >
            <PlusCircle className="h-7 w-7" />
            <span className="sr-only">Ajouter une note rapide pour le module</span>
          </Button>
        </div>
      )}

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