import React, { createContext, useContext, useState, ReactNode } from 'react';

interface CourseChatContextType {
  currentCourseId: string | null;
  currentCourseTitle: string | null;
  currentModuleTitle: string | null;
  setCourseContext: (id: string | null, title: string | null) => void;
  setModuleContext: (title: string | null) => void;
  isChatOpen: boolean; // Renamed back to isChatOpen
  openChat: (initialMessage?: string) => void; // Renamed back to openChat
  closeChat: () => void; // Renamed back to closeChat
  initialChatMessage: string | null;
  setInitialChatMessage: (message: string | null) => void;
}

const CourseChatContext = createContext<CourseChatContextType | undefined>(undefined);

export const CourseChatProvider = ({ children }: { children: ReactNode }) => {
  const [currentCourseId, setCurrentCourseId] = useState<string | null>(null);
  const [currentCourseTitle, setCurrentCourseTitle] = useState<string | null>(null);
  const [currentModuleTitle, setCurrentModuleTitle] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false); // Renamed back
  const [initialChatMessage, setInitialChatMessage] = useState<string | null>(null);

  const setCourseContext = (id: string | null, title: string | null) => {
    setCurrentCourseId(id);
    setCurrentCourseTitle(title);
    if (id === null) {
      setCurrentModuleTitle(null);
    }
  };

  const setModuleContext = (title: string | null) => {
    setCurrentModuleTitle(title);
  };

  const openChat = (message?: string) => { // Renamed back
    if (message) {
      setInitialChatMessage(message);
    } else {
      setInitialChatMessage(null);
    }
    setIsChatOpen(true);
  };

  const closeChat = () => { // Renamed back
    setIsChatOpen(false);
    setInitialChatMessage(null);
  };

  return (
    <CourseChatContext.Provider value={{
      currentCourseId,
      currentCourseTitle,
      currentModuleTitle,
      setCourseContext,
      setModuleContext,
      isChatOpen,
      openChat,
      closeChat,
      initialChatMessage,
      setInitialChatMessage,
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