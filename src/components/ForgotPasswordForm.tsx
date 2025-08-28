import React, { useState } from 'react';
import { Button, MotionButton } from "@/components/ui/button"; // Import MotionButton
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, MailQuestion } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { showError } from "@/utils/toast";
import LoadingSpinner from "@/components/LoadingSpinner";

interface ForgotPasswordFormProps {
  onSuccess: (email: string) => void;
  onSwitchToLogin: () => void;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onSuccess, onSwitchToLogin }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      showError("Veuillez entrer votre adresse email.");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`, // Ensure this URL is configured in Supabase Auth settings
      });

      if (error) {
        console.error("Forgot password error:", error);
        showError(`Erreur lors de la demande de réinitialisation: ${error.message}`);
      } else {
        onSuccess(email.trim());
      }
    } catch (error: any) {
      console.error("Unexpected error during forgot password:", error);
      showError(`Une erreur inattendue est survenue: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <MailQuestion className="h-16 w-16 text-primary mx-auto mb-4" />
      <div className="grid gap-2">
        <Label htmlFor="forgot-password-email">Email</Label>
        <Input
          id="forgot-password-email"
          type="email"
          placeholder="m@example.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
      </div>
      <MotionButton type="submit" className="w-full" disabled={isLoading} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
        {isLoading ? <LoadingSpinner iconClassName="h-4 w-4 mr-2" /> : "Envoyer le lien de réinitialisation"}
      </MotionButton>
      <MotionButton type="button" variant="outline" className="w-full" onClick={onSwitchToLogin} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
        <ArrowLeft className="h-4 w-4 mr-2" /> Retour à la connexion
      </MotionButton>
    </form>
  );
};