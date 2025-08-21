import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import AuthMenu from './AuthMenu'; // Import the AuthMenu component

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

const AuthModal = ({ isOpen, onClose, onLoginSuccess }: AuthModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-md p-0">
        {/* AuthMenu handles its own header and content */}
        <AuthMenu onClose={onClose} onLoginSuccess={onLoginSuccess} />
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;