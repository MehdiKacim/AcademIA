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
      "fixed z-50 p-4", // Augmentation du z-index à z-50
      isMobile ? "bottom-[4.5rem] right-4" : "bottom-4 right-4" // Positionnement ajusté pour mobile (4.5rem = 72px)
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