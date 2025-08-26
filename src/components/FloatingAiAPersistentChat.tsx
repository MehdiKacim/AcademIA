import React from 'react';
import { Button } from "@/components/ui/button";
import { Bot } from "lucide-react";
import { useCourseChat } from "@/contexts/CourseChatContext";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface FloatingAiAChatButtonProps {
  isVisible: boolean;
}

const FloatingAiAPersistentChat = ({ isVisible }: FloatingAiAChatButtonProps) => {
  const { openChat } = useCourseChat();
  const isMobile = useIsMobile();

  return (
    <div className={cn(
      "fixed z-50 p-4 transition-all duration-300 ease-in-out",
      isMobile ? "bottom-4 right-4" : "bottom-4 right-4", // Adjusted for no bottom nav
      isVisible ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-12 pointer-events-none"
    )}>
      <Button
        size="lg"
        className="rounded-full h-14 w-14 shadow-lg animate-bounce-slow bg-primary/80 backdrop-blur-lg border border-primary/50 hover:bg-primary/90" // Added blur and adjusted background
        onClick={() => openChat()}
      >
        <Bot className="h-7 w-7 text-primary-foreground" /> {/* Adjusted text color for contrast */}
        <span className="sr-only">Ouvrir le chat AiA</span>
      </Button>
    </div>
  );
};

export default FloatingAiAPersistentChat;