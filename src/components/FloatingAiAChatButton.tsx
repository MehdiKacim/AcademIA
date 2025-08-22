import React from 'react';
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react"; // Icône de baguette magique
import { useCourseChat } from "@/contexts/CourseChatContext";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

const FloatingAiAChatButton = () => {
  const { openChat } = useCourseChat();
  const isMobile = useIsMobile();

  return (
    <div className={cn(
      "fixed z-50 p-4", // z-index élevé pour être au-dessus du contenu
      isMobile ? "bottom-[4.5rem] right-4" : "bottom-4 right-4" // Positionnement ajusté pour mobile (au-dessus de la barre de nav inférieure)
    )}>
      <Button
        size="lg" // Taille du bouton
        className="rounded-full h-14 w-14 shadow-lg animate-bounce-slow" // Bouton rond avec animation
        onClick={() => openChat()}
      >
        <Sparkles className="h-7 w-7" /> {/* Icône seule */}
        <span className="sr-only">Ouvrir le chat AiA</span>
      </Button>
    </div>
  );
};

export default FloatingAiAChatButton;