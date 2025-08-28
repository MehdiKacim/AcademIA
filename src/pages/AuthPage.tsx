import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, MotionCard } from "@/components/ui/card"; // Import MotionCard
import { Button, MotionButton } from "@/components/ui/button"; // Import MotionButton
import { ArrowLeft, UserPlus, LockKeyhole, MailQuestion } from 'lucide-react';
import Logo from "@/components/Logo";
import { LoginForm } from "@/components/LoginForm";
import { SignUpInfo } from "@/components/SignUpInfo";
import { ForgotPasswordForm } from "@/components/ForgotPasswordForm";
import { showSuccess } from '@/utils/toast';
import { cn } from '@/lib/utils';

type AuthView = 'login' | 'signup-info' | 'forgot-password' | 'password-reset-success';

const AuthPage = () => {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<AuthView>('login');
  const [resetEmail, setResetEmail] = useState<string>('');

  const handleLoginSuccess = useCallback(() => {
    showSuccess("Connexion réussie !");
    navigate('/dashboard');
  }, [navigate]);

  const handleForgotPasswordSubmit = useCallback((email: string) => {
    setResetEmail(email);
    setCurrentView('password-reset-success');
  }, []);

  const renderContent = () => {
    switch (currentView) {
      case 'login':
        return (
          <LoginForm
            onSuccess={handleLoginSuccess}
            onSwitchToSignup={() => setCurrentView('signup-info')}
            onForgotPasswordClick={() => setCurrentView('forgot-password')}
          />
        );
      case 'signup-info':
        return (
          <SignUpInfo
            onSwitchToLogin={() => setCurrentView('login')}
          />
        );
      case 'forgot-password':
        return (
          <ForgotPasswordForm
            onSuccess={handleForgotPasswordSubmit}
            onSwitchToLogin={() => setCurrentView('login')}
          />
        );
      case 'password-reset-success':
        return (
          <div className="space-y-4 text-center">
            <MailQuestion className="h-16 w-16 text-primary mx-auto mb-4" />
            <CardTitle className="text-2xl font-bold">Email de réinitialisation envoyé !</CardTitle>
            <CardDescription className="text-muted-foreground">
              Un lien de réinitialisation de mot de passe a été envoyé à <span className="font-semibold text-foreground">{resetEmail}</span>. Veuillez vérifier votre boîte de réception (et vos spams).
            </CardDescription>
            <MotionButton type="button" className="w-full" onClick={() => setCurrentView('login')} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Retour à la connexion
            </MotionButton>
          </div>
        );
      default:
        return null;
    }
  };

  const pageTitle = {
    'login': 'Connexion',
    'signup-info': 'Création de compte',
    'forgot-password': 'Mot de passe oublié',
    'password-reset-success': 'Réinitialisation envoyée',
  }[currentView];

  const pageDescription = {
    'login': 'Entrez vos identifiants pour accéder à votre espace.',
    'signup-info': 'La création de compte est gérée par les administrateurs.',
    'forgot-password': 'Entrez votre email pour réinitialiser votre mot de passe.',
    'password-reset-success': 'Vérifiez votre boîte de réception pour le lien de réinitialisation.',
  }[currentView];

  const variants = {
    enter: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 },
    initial: { opacity: 0, x: 50 },
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4 relative overflow-hidden">
      {/* Background blobs for immersive design */}
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

      <MotionCard className="w-full max-w-md p-6 rounded-android-tile shadow-xl backdrop-blur-lg bg-background/80 relative" whileHover={{ scale: 1.01, boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)" }}> {/* Added relative positioning */}
        {window.history.length > 1 && ( // Only show back button if there's history
          <MotionButton
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="absolute top-4 left-4 z-10 rounded-full bg-muted/20 hover:bg-muted/40"
            aria-label="Retour"
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          >
            <ArrowLeft className="h-5 w-5" />
          </MotionButton>
        )}
        <CardHeader className="text-center mb-4">
          <CardTitle className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
            {pageTitle}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {pageDescription}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial="initial"
              animate="enter"
              exit="exit"
              variants={variants}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
          {currentView === 'login' && (
            <div className="mt-6 text-center space-y-2">
              <MotionButton variant="link" className="w-full text-sm" onClick={() => setCurrentView('forgot-password')} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                Mot de passe oublié ?
              </MotionButton>
              <MotionButton variant="link" className="w-full text-sm" onClick={() => setCurrentView('signup-info')} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                Pas encore de compte ?
              </MotionButton>
            </div>
          )}
        </CardContent>
      </MotionCard>
    </div>
  );
};

export default AuthPage;