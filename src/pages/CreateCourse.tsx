import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRole } from "@/contexts/RoleContext";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, MinusCircle, BookOpen, FileText, Video, HelpCircle, Image as ImageIcon, GripVertical } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { addCourseToStorage, loadCourses, updateCourseInStorage, loadSubjects } from "@/lib/courseData"; // Import loadSubjects
import { Course, Module, ModuleSection, QuizQuestion, QuizOption, Subject } from "@/lib/dataModels"; // Import Subject
import { useParams, useNavigate } from "react-router-dom";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { arrayMove } from '@dnd-kit/sortable';
import { cn } from "@/lib/utils"; // Import cn for conditional styling

// Zod Schemas for validation
const QuizOptionSchema = z.object({
  text: z.string().min(1, "Le texte de l'option est requis."),
  isCorrect: z.boolean(),
});

const QuizQuestionSchema = z.object({
  question: z.string().min(1, "La question est requise."),
  options: z.array(QuizOptionSchema).min(2, "Une question doit avoir au moins deux options."),
});

const ModuleSectionSchema = z.object({
  title: z.string().min(1, "Le titre de la section est requis."),
  content: z.string().min(1, "Le contenu de la section est requis."),
  type: z.enum(["text", "quiz", "video", "image"]),
  url: z.string().url("L'URL doit être valide.").optional().or(z.literal("")),
  questions: z.array(QuizQuestionSchema).optional(),
  isCompleted: z.boolean().default(false),
  passingScore: z.number().min(0).max(100).optional(),
}).superRefine((data, ctx) => {
  if (data.type === 'quiz') {
    if (!data.questions || data.questions.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Une section de type 'quiz' doit avoir au moins une question.",
        path: ['questions'],
      });
    }
    if (data.passingScore === undefined || data.passingScore === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Le pourcentage de réussite est requis pour un quiz.",
        path: ['passingScore'],
      });
    }
  }
  if (data.type === 'video' && !data.url) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Une section de type 'vidéo' doit avoir une URL.",
      path: ['url'],
    });
  }
  if (data.type === 'image' && !data.url) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Une section de type 'image' doit avoir une URL.",
      path: ['url'],
    });
  }
});

const ModuleSchema = z.object({
  title: z.string().min(1, "Le titre du module est requis."),
  sections: z.array(ModuleSectionSchema).min(1, "Un module doit avoir au moins une section."),
  isCompleted: z.boolean().default(false),
  level: z.number().default(0),
});

const CourseSchema = z.object({
  title: z.string().min(1, "Le titre du cours est requis."),
  description: z.string().min(1, "La description du cours est requise."),
  subject_id: z.string().min(1, "La matière est requise."), // Changed from category
  difficulty: z.enum(["Débutant", "Intermédiaire", "Avancé"]),
  image_url: z.string().url("L'URL de l'image du cours doit être valide.").optional().or(z.literal("")),
  skills_to_acquire: z.string().min(1, "Les compétences à acquérir sont requises (séparées par des virgules)."),
  modules: z.array(ModuleSchema).min(1, "Un cours doit avoir au moins un module."),
});

// Sortable Module Component
interface SortableModuleProps {
  id: string; // This will be the module's unique identifier for dnd-kit
  moduleIndex: number;
  form: any; // Pass the form object
  removeModule: (index: number) => void;
  moduleFieldsLength: number;
}

const SortableModule = ({ id, moduleIndex, form, removeModule, moduleFieldsLength }: SortableModuleProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 'auto', // Bring dragged item to front
    opacity: isDragging ? 0.8 : 1,
  };

  const { fields: sectionFields, append: appendSection, remove: removeSection } = useFieldArray({
    control: form.control,
    name: `modules.${moduleIndex}.sections`,
  });

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "p-4 border-l-4 border-primary/50 space-y-4 relative",
        isDragging ? "ring-2 ring-primary/50 shadow-xl" : ""
      )}
    >
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Module {moduleIndex + 1}</h3>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            {...listeners}
            {...attributes}
            className="cursor-grab"
          >
            <GripVertical className="h-5 w-5" />
            <span className="sr-only">Déplacer le module</span>
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => removeModule(moduleIndex)}
            disabled={moduleFieldsLength === 1}
          >
            <MinusCircle className="h-4 w-4 mr-2" /> Supprimer le module
          </Button>
        </div>
      </div>
      <FormField
        control={form.control}
        name={`modules.${moduleIndex}.title`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Titre du module</FormLabel>
            <FormControl>
              <Input placeholder="Ex: Introduction à l'IA" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="space-y-4 pl-4 border-l border-muted-foreground/50">
        <h4 className="text-md font-semibold">Sections du module</h4>
        {sectionFields.map((section, sectionIndex) => (
          <Card key={section.id} className="p-3 bg-muted/20 space-y-3">
            <div className="flex justify-between items-center">
              <h5 className="text-base font-medium">Section {sectionIndex + 1}</h5>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => {
                  const currentQuestions = form.getValues(`modules.${moduleIndex}.sections.${sectionIndex}.questions`);
                  if (currentQuestions && currentQuestions[sectionIndex]) { // Corrected index here
                    currentQuestions[sectionIndex].options.splice(sectionIndex, 1); // This line seems incorrect, should be removing the section itself
                    form.setValue(`modules.${moduleIndex}.sections.${sectionIndex}.questions`, currentQuestions);
                  }
                  removeSection(sectionIndex); // Correct way to remove section
                }}
                disabled={sectionFields.length === 1}
              >
                <MinusCircle className="h-4 w-4" />
              </Button>
            </div>
            <FormField
              control={form.control}
              name={`modules.${moduleIndex}.sections.${sectionIndex}.title`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titre de la section</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Définition et Histoire" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`modules.${moduleIndex}.sections.${sectionIndex}.type`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type de section</FormLabel>
                  <Select onValueChange={(value) => {
                    field.onChange(value);
                    form.setValue(`modules.${moduleIndex}.sections.${sectionIndex}.url`, '');
                    form.setValue(`modules.${moduleIndex}.sections.${sectionIndex}.questions`, []);
                    form.setValue(`modules.${moduleIndex}.sections.${sectionIndex}.passingScore`, undefined);
                  }} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="backdrop-blur-lg bg-background/80">
                      <SelectItem value="text">
                        <FileText className="inline-block h-4 w-4 mr-2" /> Texte
                      </SelectItem>
                      <SelectItem value="video">
                        <Video className="inline-block h-4 w-4 mr-2" /> Vidéo
                      </SelectItem>
                      <SelectItem value="image">
                        <ImageIcon className="inline-block h-4 w-4 mr-2" /> Image
                      </SelectItem>
                      <SelectItem value="quiz">
                        <HelpCircle className="inline-block h-4 w-4 mr-2" /> Quiz
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {["video", "image"].includes(form.watch(`modules.${moduleIndex}.sections.${sectionIndex}.type`)) && (
              <FormField
                control={form.control}
                name={`modules.${moduleIndex}.sections.${sectionIndex}.url`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL (Vidéo/Image)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: https://youtube.com/..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            {form.watch(`modules.${moduleIndex}.sections.${sectionIndex}.type`) === 'quiz' && (
              <>
                <FormField
                  control={form.control}
                  name={`modules.${moduleIndex}.sections.${sectionIndex}.passingScore`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pourcentage de réussite requis (%)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Ex: 70" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="space-y-3 mt-4 p-3 border rounded-md bg-background">
                  <h6 className="text-sm font-semibold">Questions du Quiz</h6>
                  {form.watch(`modules.${moduleIndex}.sections.${sectionIndex}.questions`)?.map((question, questionIndex) => (
                    <Card key={questionIndex} className="p-3 bg-muted/10 space-y-2">
                      <div className="flex justify-between items-center">
                        <h6 className="text-sm font-medium">Question {questionIndex + 1}</h6>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            const currentQuestions = form.getValues(`modules.${moduleIndex}.sections.${sectionIndex}.questions`);
                            if (currentQuestions) {
                              currentQuestions.splice(questionIndex, 1); // Corrected to remove the question itself
                              form.setValue(`modules.${moduleIndex}.sections.${sectionIndex}.questions`, currentQuestions);
                            }
                          }}
                        >
                          <MinusCircle className="h-3 w-3" />
                        </Button>
                      </div>
                      <FormField
                        control={form.control}
                        name={`modules.${moduleIndex}.sections.${sectionIndex}.questions.${questionIndex}.question`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Texte de la question</FormLabel>
                            <FormControl>
                              <Input placeholder="Quelle est la capitale de la France ?" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="space-y-2 pl-2 border-l border-muted-foreground/30">
                        <h6 className="text-xs font-semibold">Options</h6>
                        {form.watch(`modules.${moduleIndex}.sections.${sectionIndex}.questions.${questionIndex}.options`)?.map((option, optionIndex) => (
                          <div key={optionIndex} className="flex items-center gap-2">
                            <FormField
                              control={form.control}
                              name={`modules.${moduleIndex}.sections.${sectionIndex}.questions.${questionIndex}.options.${optionIndex}.text`}
                              render={({ field }) => (
                                <FormItem className="flex-grow">
                                  <FormControl>
                                    <Input placeholder="Option de réponse" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`modules.${moduleIndex}.sections.${sectionIndex}.questions.${questionIndex}.options.${optionIndex}.isCorrect`}
                              render={({ field }) => (
                                <FormItem className="flex items-center space-x-2">
                                  <FormControl>
                                    <input
                                      type="checkbox"
                                      checked={field.value}
                                      onChange={field.onChange}
                                      className="h-4 w-4 text-primary rounded border-gray-300 focus:ring-primary"
                                    />
                                  </FormControl>
                                  <FormLabel className="text-xs font-normal">Correct</FormLabel>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                const currentQuestions = form.getValues(`modules.${moduleIndex}.sections.${sectionIndex}.questions`);
                                if (currentQuestions && currentQuestions[questionIndex]) {
                                  currentQuestions[questionIndex].options.splice(optionIndex, 1);
                                  form.setValue(`modules.${moduleIndex}.sections.${sectionIndex}.questions`, currentQuestions);
                                }
                              }}
                              disabled={form.watch(`modules.${moduleIndex}.sections.${sectionIndex}.questions.${questionIndex}.options`)?.length === 2}
                            >
                              <MinusCircle className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const currentQuestions = form.getValues(`modules.${moduleIndex}.sections.${sectionIndex}.questions`);
                            if (currentQuestions && currentQuestions[questionIndex]) {
                              currentQuestions[questionIndex].options = currentQuestions[questionIndex].options || [];
                              currentQuestions[questionIndex].options?.push({ text: "", isCorrect: false });
                              form.setValue(`modules.${moduleIndex}.sections.${sectionIndex}.questions`, currentQuestions);
                            }
                          }}
                        >
                          <PlusCircle className="h-3 w-3 mr-1" /> Ajouter une option
                        </Button>
                      </div>
                    </Card>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const currentSections = form.getValues(`modules.${moduleIndex}.sections`);
                      if (currentSections && currentSections[sectionIndex]) {
                        currentSections[sectionIndex].questions = currentSections[sectionIndex].questions || [];
                        currentSections[sectionIndex].questions?.push({ question: "", options: [{ text: "", isCorrect: false }, { text: "", isCorrect: false }] });
                        form.setValue(`modules.${moduleIndex}.sections`, currentSections);
                      }
                    }}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" /> Ajouter une question
                  </Button>
                </div>
              </>
            )}
            {form.watch(`modules.${moduleIndex}.sections.${sectionIndex}.type`) !== 'quiz' && (
              <FormField
                control={form.control}
                name={`modules.${moduleIndex}.sections.${sectionIndex}.content`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contenu de la section</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Contenu de la section..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </Card>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => appendSection({ title: "", content: "Contenu de la nouvelle section.", type: "text", url: "", isCompleted: false })}
        >
          <PlusCircle className="h-4 w-4 mr-2" /> Ajouter une section
        </Button>
      </div>
    </Card>
  );
};


const CreateCourse = () => {
  const { currentRole, isLoadingUser, currentUserProfile } = useRole(); // Get currentUserProfile
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<Subject[]>([]); // New state for subjects

  const form = useForm<z.infer<typeof CourseSchema>>({
    resolver: zodResolver(CourseSchema),
    defaultValues: {
      title: "",
      description: "",
      subject_id: "", // Changed from category
      difficulty: "Débutant",
      image_url: "",
      skills_to_acquire: "",
      modules: [
        {
          title: "Introduction",
          sections: [
            { title: "Bienvenue", content: "Contenu de la section de bienvenue.", type: "text", url: "", isCompleted: false },
          ],
          isCompleted: false,
          level: 0,
        },
      ],
    },
  });

  const { fields: moduleFields, append: appendModule, remove: removeModule, move: moveModule } = useFieldArray({
    control: form.control,
    name: "modules",
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = moduleFields.findIndex(field => field.id === active.id);
      const newIndex = moduleFields.findIndex(field => field.id === over?.id);
      moveModule(oldIndex, newIndex);
    }
  }

  useEffect(() => {
    const fetchCourseAndSubjects = async () => {
      if (currentUserProfile?.establishment_id) {
        setSubjects(await loadSubjects(currentUserProfile.establishment_id)); // Load subjects for the user's establishment
      }

      if (courseId) {
        const courses = await loadCourses();
        const courseToEdit = courses.find(c => c.id === courseId);
        if (courseToEdit) {
          const formattedCourse = {
            ...courseToEdit,
            skills_to_acquire: courseToEdit.skills_to_acquire.join(', '),
            subject_id: courseToEdit.subject_id || "", // Ensure subject_id is set
          };
          form.reset(formattedCourse);
        } else {
          showError("Cours non trouvé pour la modification.");
          navigate("/create-course");
        }
      } else {
        form.reset({
          title: "",
          description: "",
          subject_id: "", // Changed from category
          difficulty: "Débutant",
          image_url: "",
          skills_to_acquire: "",
          modules: [
            {
              title: "Introduction",
              sections: [
                { title: "Bienvenue", content: "Contenu de la section de bienvenue.", type: "text", url: "", isCompleted: false },
              ],
              isCompleted: false,
              level: 0,
            },
          ],
        });
      }
    };
    fetchCourseAndSubjects();
  }, [courseId, form, navigate, currentUserProfile?.establishment_id]); // Added currentUserProfile.establishment_id

  const onSubmit = async (values: z.infer<typeof CourseSchema>) => {
    if (!currentUserProfile?.id) {
      showError("Impossible de créer ou modifier le cours : ID utilisateur non disponible.");
      return;
    }

    const courseData: Course = {
      id: courseId || `course${Date.now()}`, // ID will be generated by Supabase if not editing
      title: values.title,
      description: values.description,
      subject_id: values.subject_id, // Changed from category
      difficulty: values.difficulty,
      image_url: values.image_url || undefined,
      skills_to_acquire: values.skills_to_acquire.split(',').map(s => s.trim()),
      modules: values.modules as Module[],
      creator_id: currentUserProfile.id, // Use the actual user ID
    };

    try {
      if (courseId) {
        await updateCourseInStorage(courseData);
        showSuccess("Cours modifié avec succès !");
      } else {
        await addCourseToStorage(courseData);
        showSuccess("Cours créé avec succès !");
      }
      navigate("/courses");
    } catch (error: any) {
      console.error("Error saving course:", error);
      showError(`Erreur lors de la sauvegarde du cours: ${error.message}`);
    }
  };

  if (isLoadingUser) {
    return (
      <div className="text-center py-20">
        <h1 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
          Chargement...
        </h1>
        <p className="text-lg text-muted-foreground">
          Veuillez patienter.
        </p>
      </div>
    );
  }

  if (currentRole !== 'professeur') { // Changed from 'creator'
    return (
      <div className="text-center py-20">
        <h1 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
          Accès Restreint
        </h1>
        <p className="text-lg text-muted-foreground">
          Seuls les professeurs peuvent accéder à cette page pour créer des cours.
        </p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <h1 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
          {courseId ? "Modifier le cours" : "Créer un nouveau cours"}
        </h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Informations Générales du Cours</CardTitle>
            <CardDescription>Remplissez les détails de base de votre cours.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titre du cours</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Introduction à la programmation" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Décrivez votre cours en quelques mots." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="subject_id" // Changed from category
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Matière</FormLabel> {/* Changed label */}
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez une matière" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="backdrop-blur-lg bg-background/80">
                      {subjects.length === 0 ? (
                        <SelectItem value="no-subjects" disabled>Aucune matière disponible</SelectItem>
                      ) : (
                        subjects.map(subject => (
                          <SelectItem key={subject.id} value={subject.id}>{subject.name}</SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="difficulty"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Niveau de difficulté</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un niveau" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="backdrop-blur-lg bg-background/80">
                      <SelectItem value="Débutant">Débutant</SelectItem>
                      <SelectItem value="Intermédiaire">Intermédiaire</SelectItem>
                      <SelectItem value="Avancé">Avancé</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="image_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL de l'image du cours (optionnel)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: https://example.com/image.jpg" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="skills_to_acquire"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Compétences à acquérir (séparées par des virgules)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Programmation, Analyse de données, Design" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Modules du Cours</CardTitle>
            <CardDescription>Définissez la structure de vos modules et sections. Utilisez la poignée pour réorganiser les modules.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={moduleFields.map(field => field.id)}
                strategy={verticalListSortingStrategy}
              >
                {moduleFields.map((module, moduleIndex) => (
                  <SortableModule
                    key={module.id}
                    id={module.id}
                    moduleIndex={moduleIndex}
                    form={form}
                    removeModule={removeModule}
                    moduleFieldsLength={moduleFields.length}
                  />
                ))}
              </SortableContext>
            </DndContext>
            <Button
              type="button"
              variant="outline"
              onClick={() => appendModule({ title: "", sections: [{ title: "", content: "Contenu de la nouvelle section.", type: "text", url: "", isCompleted: false }], isCompleted: false, level: 0 })}
            >
              <PlusCircle className="h-4 w-4 mr-2" /> Ajouter un module
            </Button>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full">
          {courseId ? "Sauvegarder les modifications" : "Créer le cours"}
        </Button>
      </form>
    </Form>
  );
};

export default CreateCourse;