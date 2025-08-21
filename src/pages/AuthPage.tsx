import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoginForm } from "@/components/LoginForm";
import { SignUpForm } from "@/components/SignUpForm";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from '@/utils/toast';
import { useNavigate, Link } from 'react-router-dom'; // Import Link
import { useRole } from '@/contexts/RoleContext'; // Import useRole

const AuthPage = () => {
  const [activeTab, setActiveTab] = useState("login");
  const navigate = useNavigate();
  const { fetchUserProfile } = useRole(); // Get fetchUserProfile from context

  const handleLoginSuccess = async () => {
    showSuccess("Connexion réussie !");
    // fetchUserProfile is called by the onAuthStateChange listener in RoleContext
    // after successful login, so no need to call it explicitly here.
    navigate('/dashboard');
  };

  const handleSignUpSuccess = async (email: string) => {
    showSuccess(`Inscription réussie ! Veuillez vérifier votre email (${email}) pour confirmer votre compte.`);
    setActiveTab("login"); // Switch to login tab after successful signup
  };

  const handleSignUpError = (message: string) => {
    showError(message);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
            Bienvenue
          </CardTitle>
          <CardDescription>
            Connectez-vous ou créez un compte pour accéder à la plateforme.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Se connecter</TabsTrigger>
              <TabsTrigger value="signup">S'inscrire</TabsTrigger>
            </TabsList>
            <TabsContent value="login" className="mt-4">
              <LoginForm onSuccess={handleLoginSuccess} />
            </TabsContent>
            <TabsContent value="signup" className="mt-4">
              <SignUpForm onSuccess={handleSignUpSuccess} onError={handleSignUpError} />
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardContent className="text-center mt-4">
          <Link to="/welcome" className="text-sm text-muted-foreground hover:underline">
            En savoir plus sur AcademIA
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;