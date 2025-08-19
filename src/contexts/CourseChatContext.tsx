import React, { createContext, useContext, useState, ReactNode } from 'react';

interface CourseChatContextType {
  currentCourseId: string | null;
  currentCourseTitle: string | null;
  currentModuleTitle: string | null; // Nouveau: titre du module actuel
  setCourseContext: (id: string | null, title: string | null) => void;
  setModuleContext: (title: string | null) => void; // Nouveau: fonction pour définir le module
  isChatOpen: boolean;
  openChat: (initialMessage?: string) => void;
  closeChat: () => void;
  initialChatMessage: string | null;
  setInitialChatMessage: (message: string | null) => void;
}

const CourseChatContext = createContext<CourseChatContextType | undefined>(undefined);

export const CourseChatProvider = ({ children }: { children: ReactNode }) => {
  const [currentCourseId, setCurrentCourseId] = useState<string | null>(null);
  const [currentCourseTitle, setCurrentCourseTitle] = useState<string | null>(null);
  const [currentModuleTitle, setCurrentModuleTitle] = useState<string | null>(null); // État pour le module

  const setCourseContext = (id: string | null, title: string | null) => {
    setCurrentCourseId(id);
    setCurrentCourseTitle(title);
    if (id === null) { // Si le cours est effacé, effacer aussi le module
      setCurrentModuleTitle(null);
    }
  };

  const setModuleContext = (title: string | null) => {
    setCurrentModuleTitle(title);
  };

  const openChat = (message?: string) => {
    if (message) {
      setInitialChatMessage(message);
    } else {
      setInitialChatMessage(null); // Clear previous message if no new one is provided
    }
    setIsChatOpen(true);
  };

  const closeChat = () => {
    setIsChatOpen(false);
    setInitialChatMessage(null); // Clear message when closing
  };

  return (
    <CourseChatContext.Provider value={{
      currentCourseId,
      currentCourseTitle,
      currentModuleTitle, // Ajout au contexte
      setCourseContext,
      setModuleContext, // Ajout au contexte
      isChatOpen,
      openChat,
      closeChat,
      initialChatMessage,
      setInitialChatMessage
    }}>
      {children}
    </CourseChatContext.Provider>
  );
};

export const useCourseChat = () => {
  const context = useContext(CourseChatContext);
  if (context === undefined) {
    throw new Error('useCourseChat must be used within a CourseChatProvider');
  }
  return context;
};