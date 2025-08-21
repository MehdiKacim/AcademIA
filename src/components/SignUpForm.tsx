import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from '@/utils/toast';
import { getProfileByUsername } from '@/lib/studentData'; // Import getProfileByUsername

const signUpSchema = z.object({
  firstName: z.string().min(1, "Le prénom est requis."),
  lastName: z.string().min(1, "Le nom est requis."),
  username: z.string().min(3, "Le nom d'utilisateur doit contenir au moins 3 caractères.").max(50, "Le nom d'utilisateur ne peut pas dépasser 50 caractères.").regex(/^[a-zA-Z0-9_]+$/, "Le nom d'utilisateur ne peut contenir que des lettres, des chiffres et des underscores."),
  email: z.string().email("Veuillez entrer une adresse email valide."),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères."),
  role: z.enum(["student", "teacher"], { message: "Veuillez sélectionner un rôle." }),
});

type SignUpFormValues = z.infer<typeof signUpSchema>;

interface SignUpFormProps {
  onSuccess: (email: string) => void;
  onError: (message: string) => void;
}

export const SignUpForm: React.FC<SignUpFormProps> = ({ onSuccess, onError }) => {
  const [isLoading, setIsLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
  });

  const onSubmit = async (values: SignUpFormValues) => {
    setIsLoading(true);
    try {
      // 1. Check for existing username in profiles table
      const isUsernameTaken = await getProfileByUsername(values.username);
      if (isUsernameTaken) {
        setError("username", { type: "manual", message: "Ce nom d'utilisateur est déjà pris." });
        onError("Ce nom d'utilisateur est déjà pris.");
        setIsLoading(false);
        return;
      }

      // 2. Attempt Supabase Auth signup (handles email uniqueness)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: { // This data goes into user_metadata, which the trigger can use
            first_name: values.firstName,
            last_name: values.lastName,
            username: values.username,
            role: values.role,
          },
        },
      });

      if (authError) {
        if (authError.message.includes('User already registered')) {
          setError("email", { type: "manual", message: "Cet email est déjà enregistré. Veuillez vous connecter." });
          onError("Cet email est déjà enregistré. Veuillez vous connecter.");
        } else {
          onError(`Erreur d'inscription: ${authError.message}`);
        }
        setIsLoading(false);
        return;
      }

      if (authData.user) {
        // Profile creation is handled by the 'handle_new_user' trigger in Supabase.
        // No need for client-side upsert into public.profiles here.
        onSuccess(values.email);
      } else {
        // This case might happen if email confirmation is required and no user object is returned immediately
        onSuccess(values.email); // Still consider it a success for the user, they just need to confirm email
      }

    } catch (error: any) {
      console.error("Signup error:", error);
      onError(`Une erreur inattendue est survenue: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">Prénom</Label>
          <Input id="firstName" {...register("firstName")} />
          {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName.message}</p>}
        </div>
        <div>
          <Label htmlFor="lastName">Nom</Label>
          <Input id="lastName" {...register("lastName")} />
          {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName.message}</p>}
        </div>
      </div>
      <div>
        <Label htmlFor="username">Nom d'utilisateur</Label>
        <Input id="username" {...register("username")} />
        {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username.message}</p>}
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" {...register("email")} />
        {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
      </div>
      <div>
        <Label htmlFor="password">Mot de passe</Label>
        <Input id="password" type="password" {...register("password")} />
        {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
      </div>
      <div>
        <Label htmlFor="role">Rôle</Label>
        <Select onValueChange={(value) => register("role").onChange({ target: { value } })} defaultValue="">
          <SelectTrigger id="role">
            <SelectValue placeholder="Sélectionner un rôle" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="student">Élève</SelectItem>
            <SelectItem value="teacher">Professeur</SelectItem>
          </SelectContent>
        </Select>
        {errors.role && <p className="text-red-500 text-sm mt-1">{errors.role.message}</p>}
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Inscription en cours..." : "S'inscrire"}
      </Button>
    </form>
  );
};