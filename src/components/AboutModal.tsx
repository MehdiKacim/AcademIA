import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import About from "@/pages/About"; // Import the About page content
import { ScrollArea } from "@/components/ui/scroll-area"; // Import ScrollArea
import { cn } from '@/lib/utils'; // Import cn for conditional styling

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AboutModal = ({ isOpen, onClose }: AboutModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn(
        "w-full h-svh flex flex-col p-6 backdrop-blur-lg bg-background/80 rounded-android-tile", // Full screen on mobile, apply rounded-android-tile
        "sm:max-w-2xl sm:h-[90vh]" // Max width and height on larger screens
      )}>
        <div className="flex flex-col h-full"> {/* Wrap children in a single div */}
          <DialogHeader className="mb-4 text-center flex-shrink-0">
            <DialogTitle className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan text-center">
              À Propos d'AcademIA
            </DialogTitle>
            <DialogDescription className="text-center">
              Découvrez les informations sur l'application et son développement.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-grow min-h-0 p-4 h-full">
            <About />
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AboutModal;