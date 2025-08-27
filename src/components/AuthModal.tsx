import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle as DrawerPrimitiveTitle,
  DrawerDescription as DrawerPrimitiveDescription,
  DrawerFooter,
  // DrawerClose, // REMOVED
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import AuthMenu from './AuthMenu';
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

const AuthModal = ({ isOpen, onClose, onLoginSuccess }: AuthModalProps) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent className="h-auto mt-24 rounded-t-lg flex flex-col backdrop-blur-lg bg-background/80 overflow-hidden rounded-android-tile">
          <div className="flex flex-col h-full relative">
            <DrawerHeader className="text-center">
              {/* Removed React.Fragment as DrawerHeader is a simple div */}
              <DrawerPrimitiveTitle className="text-2xl font-bold">Connexion</DrawerPrimitiveTitle>
              <DrawerPrimitiveDescription>Entrez vos identifiants pour accéder à votre espace.</DrawerPrimitiveDescription>
            </DrawerHeader>
            {/* Replaced DrawerClose with a direct Button to avoid asChild conflict */}
            <Button variant="ghost" size="icon" onClick={onClose} className="absolute right-4 top-4">
              <X className="h-5 w-5" />
              <span className="sr-only">Fermer</span>
            </Button>
            <AuthMenu onClose={onClose} onLoginSuccess={onLoginSuccess} />
            <DrawerFooter>
              {/* Footer content if needed, or just for spacing */}
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-md p-0 backdrop-blur-lg bg-background/80 overflow-hidden rounded-android-tile">
        <div className="flex flex-col h-full relative">
          <DialogHeader className="text-center pb-2">
            {/* Removed React.Fragment as DialogHeader is a simple div */}
            <DialogTitle className="text-2xl">Connexion</DialogTitle>
            <DialogDescription>Entrez vos identifiants pour accéder à votre espace.</DialogDescription>
          </DialogHeader>
          {/* Kept the direct Button for Dialog as it was already working */}
          <Button variant="ghost" size="icon" onClick={onClose} className="absolute right-4 top-4">
            <X className="h-5 w-5" />
            <span className="sr-only">Fermer</span>
          </Button>
          <AuthMenu onClose={onClose} onLoginSuccess={onLoginSuccess} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;