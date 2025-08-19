import React from "react";
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
import { PlusCircle, MinusCircle, BookOpen, FileText, Video, HelpCircle, Image as ImageIcon } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { dummyCourses, Course } from "@/lib/courseData"; // Import Course interface

// Zod Schemas for validation
const ModuleSectionSchema = z.object({
  title: z.string().min(1, "Le titre de la section est requis."),
  content: z.string().min(1, "Le contenu de la section est requis."),
  type: z.enum(["text", "quiz", "video", "image"]),
  url: z.string().url("L'URL doit être valide.").optional().or(z.literal("")),
});

const ModuleSchema = z.object({
  title: z.string().min(1, "Le titre du module est requis."),
  sections: z.array(ModuleSectionSchema).min(1, "Un module doit avoir au moins une section."),
  isCompleted: z.boolean().default(false), // Default for new courses
  level: z.number().default(0), // Default for new courses
});

const CourseSchema = z.object({
  title: z.string().min(1, "Le titre du cours est requis."),
  description: z.string().min(1, "La description du cours est requise."),
  category: z.string().min(1, "La catégorie est requise."),
  difficulty: z.enum(["Débutant", "Intermédiaire", "Avancé"]),
  imageUrl: z.string().url("L'URL de l'image doit être valide.").optional().or(z.literal("")),
  skillsToAcquire: z.string().min(1, "Les compétences à acquérir sont requises (séparées par des virgules)."),
  modules: z.array(ModuleSchema).min(1, "Un cours doit avoir au moins un module."),
});

const CreateCourse = () => {
  const { currentRole } = useRole();

  const form = useForm<z.infer<typeof CourseSchema>>({
    resolver: zodResolver(CourseSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      difficulty: "Débutant",
      imageUrl: "",
      skillsToAcquire: "",
      modules: [
        {
          title: "Introduction",
          sections: [
            { title: "Bienvenue", content: "Contenu de la section de bienvenue.", type: "text", url: "" },
          ],
          isCompleted: false,
          level: 0,
        },
      ],
    },
  });

  const { fields: moduleFields, append: appendModule, remove: removeModule } = useFieldArray({
    control: form.control,
    name: "modules",
  });

  const onSubmit = (values: z.infer<typeof CourseSchema>) => {
    // Explicitly construct newCourse to match the Course interface
    const newCourse: Course = {
      id: (dummyCourses.length + 1).toString(), // Simple ID generation
      title: values.title,
      description: values.description,
      category: values.category, // Now included in Course interface
      difficulty: values.difficulty, // Now included in Course interface
      imageUrl: values.imageUrl || undefined, // Ensure empty string becomes undefined
      skillsToAcquire: values.skillsToAcquire.split(',').map(s => s.trim()),
      modules: values.modules,
    };

    dummyCourses.push(newCourse); // Directly modifying for demo
    console.log("Nouveau cours créé:", newCourse);
    showSuccess("Cours créé avec succès !");
    form.reset(); // Reset form after submission
  };

  if (currentRole !== 'creator') {
    return (
      <div className="text-center py-20">
        <h1 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
          Accès Restreint
        </h1>
        <p className="text-lg text-muted-foreground">
          Seuls les créateurs peuvent accéder à cette page pour créer des cours.
        </p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <h1 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">Créer un nouveau cours</h1>
        
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
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Catégorie</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Informatique, Mathématiques" {...field} />
                  </FormControl>
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
                    <SelectContent>
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
              name="imageUrl"
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
              name="skillsToAcquire"
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
            <CardDescription>Définissez la structure de vos modules et sections.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {moduleFields.map((module, moduleIndex) => (
              <Card key={module.id} className="p-4 border-l-4 border-primary/50 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Module {moduleIndex + 1}</h3>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removeModule(moduleIndex)}
                    disabled={moduleFields.length === 1}
                  >
                    <MinusCircle className="h-4 w-4 mr-2" /> Supprimer le module
                  </Button>
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
                  {form.watch(`modules.${moduleIndex}.sections`).map((section, sectionIndex) => (
                    <Card key={sectionIndex} className="p-3 bg-muted/20 space-y-3">
                      <div className="flex justify-between items-center">
                        <h5 className="text-base font-medium">Section {sectionIndex + 1}</h5>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            const currentModules = form.getValues("modules");
                            currentModules[moduleIndex].sections.splice(sectionIndex, 1);
                            form.setValue("modules", currentModules);
                          }}
                          disabled={form.watch(`modules.${moduleIndex}.sections`).length === 1}
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
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Sélectionnez un type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
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
                      <FormField
                        control={form.control}
                        name={`modules.${moduleIndex}.sections.${sectionIndex}.content`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contenu de la section</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Contenu détaillé de la section..." {...field} />
                            </FormControl>
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
                    </Card>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const currentModules = form.getValues("modules");
                      currentModules[moduleIndex].sections.push({ title: "", content: "", type: "text", url: "" });
                      form.setValue("modules", currentModules);
                    }}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" /> Ajouter une section
                  </Button>
                </div>
              </Card>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => appendModule({ title: "", sections: [{ title: "", content: "", type: "text", url: "" }], isCompleted: false, level: 0 })}
            >
              <PlusCircle className="h-4 w-4 mr-2" /> Ajouter un module
            </Button>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full">Créer le cours</Button>
      </form>
    </Form>
  );
};

export default CreateCourse;