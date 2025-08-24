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
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import About from "@/pages/About"; // Import the About page content
import { ScrollArea } from "@/components/ui/scroll-area"; // Import ScrollArea

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AboutModal = ({ isOpen, onClose }: AboutModalProps) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent className="max-h-[90vh] rounded-t-lg flex flex-col backdrop-blur-lg bg-background/80">
          <div className="mx-auto w-full max-w-md flex-grow flex flex-col">
            <DrawerHeader className="text-center flex-shrink-0">
              <DrawerTitle className="text-center">À Propos d'AcademIA</DrawerTitle>
              <DrawerDescription className="text-center">
                Découvrez les informations sur l'application et son développement.
              </DrawerDescription>
            </DrawerHeader>
            <ScrollArea className="flex-grow min-h-0"> {/* Use ScrollArea directly here */}
              <About />
            </ScrollArea>
            <DrawerFooter className="flex-shrink-0">
              {/* Footer content if needed, or just for spacing */}
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-2xl h-[90vh] flex flex-col p-6 backdrop-blur-lg bg-background/80">
        <DialogHeader className="mb-4 text-center">
          <DialogTitle className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan text-center">
            À Propos d'AcademIA
          </DialogTitle>
          <DialogDescription className="text-center">
            Découvrez les informations sur l'application et son développement.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto pr-2">
          <About />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AboutModal;