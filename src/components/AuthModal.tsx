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
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer"; // Import Drawer components
import { useIsMobile } from "@/hooks/use-mobile"; // Import useIsMobile
import AuthMenu from './AuthMenu'; // Import the AuthMenu component

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
        <DrawerContent className="h-auto mt-24 rounded-t-lg flex flex-col backdrop-blur-lg bg-background/80 overflow-hidden"> {/* Added overflow-hidden here */}
          <div className="mx-auto w-full max-w-sm">
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
      <DialogContent className="w-full max-w-md p-0 backdrop-blur-lg bg-background/80 overflow-hidden"> {/* Added overflow-hidden here */}
        {/* AuthMenu handles its own header and content */}
        <AuthMenu onClose={onClose} onLoginSuccess={onLoginSuccess} />
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;