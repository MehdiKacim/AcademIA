import React from 'react';
import { Button } from "@/components/ui/button";
import { LoginForm } from "@/components/LoginForm";
import { showSuccess } from '@/utils/toast';

interface AuthMenuProps {
  onClose: () => void;
  onLoginSuccess: () => void;
}

const AuthMenu = ({ onClose, onLoginSuccess }: AuthMenuProps) => {
  const handleLoginSuccess = () => {
    showSuccess("Connexion réussie !");
    onLoginSuccess();
  };

  return (
    <div className="p-6"> {/* Wrap in a div with padding */}
      <LoginForm
        onSuccess={handleLoginSuccess}
      />
    </div>
  );
};

export default AuthMenu;