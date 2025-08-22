import React, { useState, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from '@/utils/toast';
import { checkUsernameExists, checkEmailExists } from '@/lib/studentData';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils"; // Import cn for conditional styling

const signUpSchema = z.object({
  firstName: z.string().min(1, "Le prénom est requis."),
  lastName: z.string().min(1, "Le nom est requis."),
  username: z.string().min(3, "Le nom d'utilisateur doit contenir au moins 3 caractères.").max(50, "Le nom d'utilisateur ne peut pas dépasser 50 caractères.").regex(/^[a-zA-Z0-9_]+$/, "Le nom d'utilisateur ne peut contenir que des lettres, des chiffres et des underscores."),
  email: z.string().email("Veuillez entrer une adresse email valide."),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères."),
  role: z.enum(["student", "creator", "tutor"], { message: "Veuillez sélectionner un rôle." }),
});

type SignUpFormValues = z.infer<typeof signUpSchema>;

interface SignUpFormProps {
  onSuccess: (email: string) => void;
  onError: (message: string) => void;
}

export const SignUpForm: React.FC<SignUpFormProps> = ({ onSuccess, onError }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [usernameAvailabilityStatus, setUsernameAvailabilityStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [emailAvailabilityStatus, setEmailAvailabilityStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      username: "",
      email: "",
      password: "",
      role: undefined,
    },
  });

  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const validateUsername = useCallback(async (username: string) => {
    if (username.length < 3) {
      form.setError("username", { type: "manual", message: "Le nom d'utilisateur doit contenir au moins 3 caractères." });
      setUsernameAvailabilityStatus('idle');
      return false;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      form.setError("username", { type: "manual", message: "Le nom d'utilisateur ne peut contenir que des lettres, des chiffres et des underscores." });
      setUsernameAvailabilityStatus('idle');
      return false;
    }
    setUsernameAvailabilityStatus('checking');
    const isTaken = await checkUsernameExists(username);
    if (isTaken) {
      form.setError("username", { type: "manual", message: "Ce nom d'utilisateur est déjà pris." });
      setUsernameAvailabilityStatus('taken');
      return false;
    }
    form.clearErrors("username");
    setUsernameAvailabilityStatus('available');
    return true;
  }, [form]);

  const validateEmail = useCallback(async (email: string) => {
    if (!z.string().email().safeParse(email).success) {
      form.setError("email", { type: "manual", message: "Veuillez entrer une adresse email valide." });
      setEmailAvailabilityStatus('idle');
      return false;
    }
    setEmailAvailabilityStatus('checking');
    const isTaken = await checkEmailExists(email);
    if (isTaken) {
      form.setError("email", { type: "manual", message: "Cet email est déjà utilisé par un autre profil." });
      setEmailAvailabilityStatus('taken');
      return false;
    }
    form.clearErrors("email");
    setEmailAvailabilityStatus('available');
    return true;
  }, [form]);

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    form.setValue("username", value);
    if (value.trim() === '') {
        setUsernameAvailabilityStatus('idle');
        form.clearErrors("username");
        if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
        return;
    }
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    debounceTimeoutRef.current = setTimeout(() => {
      validateUsername(value);
    }, 500); // Debounce for 500ms
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    form.setValue("email", value);
    if (value.trim() === '') {
        setEmailAvailabilityStatus('idle');
        form.clearErrors("email");
        if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
        return;
    }
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    debounceTimeoutRef.current = setTimeout(() => {
      validateEmail(value);
    }, 500); // Debounce for 500ms
  };

  const onSubmit = async (values: SignUpFormValues) => {
    setIsLoading(true);
    try {
      // Re-run final validation before submission
      const isUsernameValid = await validateUsername(values.username);
      const isEmailValid = await validateEmail(values.email);

      if (!isUsernameValid || !isEmailValid) {
        onError("Veuillez corriger les erreurs du formulaire.");
        setIsLoading(false);
        return;
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            first_name: values.firstName,
            last_name: values.lastName,
            username: values.username,
            role: values.role,
          },
        },
      });

      if (authError) {
        if (authError.message.includes('User already registered')) {
          form.setError("email", { type: "manual", message: "Cet email est déjà enregistré. Veuillez vous connecter." });
          onError("Cet email est déjà enregistré. Veuillez vous connecter.");
        } else {
          onError(`Erreur d'inscription: ${authError.message}`);
        }
        setIsLoading(false);
        return;
      }

      onSuccess(values.email);

    } catch (error: any) {
      console.error("Signup error:", error);
      onError(`Une erreur inattendue est survenue: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prénom</FormLabel>
                <FormControl>
                  <Input id="firstName" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom</FormLabel>
                <FormControl>
                  <Input id="lastName" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom d'utilisateur</FormLabel>
              <FormControl>
                <Input id="username" {...field} onChange={handleUsernameChange} />
              </FormControl>
              <FormMessage />
              {usernameAvailabilityStatus === 'checking' && <p className="text-sm text-muted-foreground mt-1">Vérification...</p>}
              {usernameAvailabilityStatus === 'available' && <p className="text-sm text-green-600 mt-1">Nom d'utilisateur disponible !</p>}
              {usernameAvailabilityStatus === 'taken' && form.formState.errors.username && <p className="text-sm text-red-600 mt-1">{form.formState.errors.username.message}</p>}
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input id="email" type="email" {...field} onChange={handleEmailChange} />
              </FormControl>
              <FormMessage />
              {emailAvailabilityStatus === 'checking' && <p className="text-sm text-muted-foreground mt-1">Vérification...</p>}
              {emailAvailabilityStatus === 'available' && <p className="text-sm text-green-600 mt-1">Email disponible !</p>}
              {emailAvailabilityStatus === 'taken' && form.formState.errors.email && <p className="text-sm text-red-600 mt-1">{form.formState.errors.email.message}</p>}
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mot de passe</FormLabel>
              <FormControl>
                <Input id="password" type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rôle</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Sélectionner un rôle" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="student">Élève</SelectItem>
                  <SelectItem value="creator">Créateur (Professeur)</SelectItem>
                  <SelectItem value="tutor">Tuteur</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Inscription en cours..." : "S'inscrire"}
        </Button>
      </form>
    </Form>
  );
};