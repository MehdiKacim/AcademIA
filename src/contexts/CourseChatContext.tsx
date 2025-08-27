import React, { createContext, useContext, useState, ReactNode } from 'react';

interface CourseChatContextType {
  currentCourseId: string | null;
  currentCourseTitle: string | null;
  currentModuleTitle: string | null;
  setCourseContext: (id: string | null, title: string | null) => void;
  setModuleContext: (title: string | null) => void;
  isTopBarOverlayOpen: boolean; // Renamed from isChatOpen
  openTopBarOverlay: (mode: 'search' | 'aia', initialMessage?: string) => void; // Renamed from openChat, added mode
  closeTopBarOverlay: () => void; // Renamed from closeChat
  initialChatMessage: string | null;
  setInitialChatMessage: (message: string | null) => void;
  activeOverlayTab: 'search' | 'aia'; // New: to control which tab is active
}

const CourseChatContext = createContext<CourseChatContextType | undefined>(undefined);

export const CourseChatProvider = ({ children }: { children: ReactNode }) => {
  const [currentCourseId, setCurrentCourseId] = useState<string | null>(null);
  const [currentCourseTitle, setCurrentCourseTitle] = useState<string | null>(null);
  const [currentModuleTitle, setCurrentModuleTitle] = useState<string | null>(null);
  const [isTopBarOverlayOpen, setIsTopBarOverlayOpen] = useState(false);
  const [initialChatMessage, setInitialChatMessage] = useState<string | null>(null);
  const [activeOverlayTab, setActiveOverlayTab] = useState<'search' | 'aia'>('search'); // Default to search

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

  const openTopBarOverlay = (mode: 'search' | 'aia', message?: string) => {
    setActiveOverlayTab(mode);
    if (message) {
      setInitialChatMessage(message);
    } else {
      setInitialChatMessage(null);
    }
    setIsTopBarOverlayOpen(true);
  };

  const closeTopBarOverlay = () => {
    setIsTopBarOverlayOpen(false);
    setInitialChatMessage(null);
  };

  return (
    <CourseChatContext.Provider value={{
      currentCourseId,
      currentCourseTitle,
      currentModuleTitle,
      setCourseContext,
      setModuleContext,
      isTopBarOverlayOpen,
      openTopBarOverlay,
      closeTopBarOverlay,
      initialChatMessage,
      setInitialChatMessage,
      activeOverlayTab,
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