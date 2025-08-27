import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LockKeyhole, CheckCircle, ArrowLeft } from 'lucide-react';
import Logo from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import LoadingSpinner from "@/components/LoadingSpinner";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordUpdated, setIsPasswordUpdated] = useState(false);

  useEffect(() => {
    // Check if there's an active session after redirection from email link
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // If no session, it means the user hasn't clicked the link or session expired
        // Or they are on this page without a valid reset token.
        // We might want to redirect them or show an error.
        // For now, we'll let them try to set a password, Supabase will handle token validation.
      }
    };
    checkSession();
  }, []);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim() || !confirmPassword.trim()) {
      showError("Veuillez remplir tous les champs.");
      return;
    }
    if (newPassword.trim().length < 6) {
      showError("Le nouveau mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    if (newPassword.trim() !== confirmPassword.trim()) {
      showError("Les mots de passe ne correspondent pas.");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword.trim(),
      });

      if (error) {
        console.error("Password reset error:", error);
        showError(`Erreur lors de la réinitialisation du mot de passe: ${error.message}`);
      } else {
        showSuccess("Votre mot de passe a été mis à jour avec succès !");
        setIsPasswordUpdated(true);
      }
    } catch (error: any) {
      console.error("Unexpected error during password reset:", error);
      showError(`Une erreur inattendue est survenue: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const variants = {
    enter: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -50 },
    initial: { opacity: 0, y: 50 },
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4 relative overflow-hidden">
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/10 rounded-full filter blur-3xl opacity-50 animate-blob"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-secondary/20 rounded-full filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="mb-8"
      >
        <Logo iconClassName="w-24 h-24" showText={false} />
      </motion.div>

      <Card className="w-full max-w-md p-6 rounded-android-tile shadow-xl backdrop-blur-lg bg-background/80">
        <CardHeader className="text-center mb-4">
          <CardTitle className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
            Réinitialiser le mot de passe
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Définissez un nouveau mot de passe pour votre compte.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <motion.div
            key={isPasswordUpdated ? 'success' : 'form'}
            initial="initial"
            animate="enter"
            exit="exit"
            variants={variants}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {isPasswordUpdated ? (
              <div className="space-y-4 text-center">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <CardTitle className="text-2xl font-bold">Mot de passe mis à jour !</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Votre mot de passe a été changé avec succès. Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
                </CardDescription>
                <Button type="button" className="w-full" onClick={() => navigate('/auth')}>
                  <ArrowLeft className="h-4 w-4 mr-2" /> Retour à la connexion
                </Button>
              </div>
            ) : (
              <form onSubmit={handlePasswordReset} className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="new-password">Nouveau mot de passe</Label>
                  <Input
                    id="new-password"
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirm-password">Confirmer le nouveau mot de passe</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <LoadingSpinner iconClassName="h-4 w-4 mr-2" /> : "Réinitialiser le mot de passe"}
                </Button>
                <Button type="button" variant="outline" className="w-full" onClick={() => navigate('/auth')}>
                  <ArrowLeft className="h-4 w-4 mr-2" /> Annuler
                </Button>
              </form>
            )}
          </motion.div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;