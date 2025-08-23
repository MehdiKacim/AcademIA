import React from 'react';
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react"; // Icône de baguette magique
import { useCourseChat } from "@/contexts/CourseChatContext";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface FloatingAiAChatButtonProps {
  isVisible: boolean; // Nouvelle prop pour contrôler la visibilité
}

const FloatingAiAChatButton = ({ isVisible }: FloatingAiAChatButtonProps) => {
  const { openChat } = useCourseChat();
  const isMobile = useIsMobile();

  return (
    <div className={cn(
      "fixed z-50 p-4 transition-all duration-300 ease-in-out", // Ajout des transitions
      isMobile ? "bottom-[4.5rem] right-4" : "bottom-4 right-4",
      isVisible ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-12 pointer-events-none" // Styles de visibilité
    )}>
      <Button
        size="lg"
        className="rounded-full h-14 w-14 shadow-lg animate-bounce-slow"
        onClick={() => openChat()}
      >
        <Sparkles className="h-7 w-7" />
        <span className="sr-only">Ouvrir le chat AiA</span>
      </Button>
    </div>
  );
};

export default FloatingAiAChatButton;