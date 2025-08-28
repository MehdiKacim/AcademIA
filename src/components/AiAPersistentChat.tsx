import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button, MotionButton } from "@/components/ui/button"; // Import MotionButton
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send, X, User as UserIcon, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCourseChat } from "@/contexts/CourseChatContext";
import { useRole } from "@/contexts/RoleContext";
import { motion, AnimatePresence } from 'framer-motion';

interface AiAMessage {
  id: number;
  sender: 'user' | 'aia';
  text: string;
}

const AiAPersistentChat = () => {
  const { currentCourseTitle, currentModuleTitle, isChatOpen, openChat, closeChat, initialChatMessage, setInitialChatMessage } = useCourseChat();
  const { currentUserProfile } = useRole();
  const [aiaMessages, setAiaMessages] = useState<AiAMessage[]>([]);
  const [aiaInput, setAiaInput] = useState('');
  const aiaMessagesEndRef = useRef<HTMLDivElement>(null);
  const aiaMessageIdCounter = useRef(0);
  const aiaInputRef = useRef<HTMLInputElement>(null);
  const [isCollapsed, setIsCollapsed] = useState(true);

  // Initialize chat with a welcome message when opened
  useEffect(() => {
    if (isChatOpen && aiaMessages.length === 0) {
      aiaMessageIdCounter.current += 1;
      setAiaMessages([
        { id: aiaMessageIdCounter.current, sender: 'aia', text: "Bonjour ! Je suis AiA, votre tuteur personnel. Comment puis-je vous aider aujourd'hui ?" },
      ]);
      setIsCollapsed(false); // Expand when chat is opened
    }
  }, [isChatOpen, aiaMessages.length]);

  // Handle initial message from context
  useEffect(() => {
    if (isChatOpen && initialChatMessage) {
      setAiaInput(initialChatMessage);
      setInitialChatMessage(null);
      setIsCollapsed(false); // Ensure it's expanded if an initial message is set
    }
  }, [isChatOpen, initialChatMessage, setInitialChatMessage]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isChatOpen && !isCollapsed) {
      const timer = setTimeout(() => {
        aiaMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [aiaMessages, isChatOpen, isCollapsed]);

  const handleSendAiaMessage = () => {
    if (aiaInput.trim()) {
      const contextParts = [];
      if (currentCourseTitle) {
        contextParts.push(`Cours "${currentCourseTitle}"`);
      }
      if (currentModuleTitle) {
        contextParts.push(`Module "${currentModuleTitle}"`);
      }
      const contextPrefix = contextParts.length > 0 ? `(Contexte: ${contextParts.join(', ')}) ` : '';

      aiaMessageIdCounter.current += 1;
      const userMessageId = aiaMessageIdCounter.current;
      const newMessage: AiAMessage = { id: userMessageId, sender: 'user', text: contextPrefix + aiaInput.trim() };
      setAiaMessages((prevMessages) => [...prevMessages, newMessage]);
      setAiaInput('');

      // Simulate AiA response
      setTimeout(() => {
        aiaMessageIdCounter.current += 1;
        const aiaResponse: AiAMessage = {
          id: aiaMessageIdCounter.current,
          sender: 'aia',
          text: `Je comprends que vous avez dit : "${newMessage.text}". Je suis en train de traiter votre demande.`,
        };
        setAiaMessages((prevMessages) => [...prevMessages, aiaResponse]);
      }, 1000);
    }
  };

  const handleAiaKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendAiaMessage();
    }
  };

  const handleCloseChat = () => {
    closeChat();
    setAiaMessages([]); // Clear messages on close
    setIsCollapsed(true); // Ensure it's collapsed when closed
  };

  const handleToggleCollapse = () => {
    setIsCollapsed(prev => !prev);
  };

  if (!currentUserProfile) {
    return null; // Only show for logged-in users
  }

  return (
    <AnimatePresence>
      {isChatOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "fixed top-[68px] right-4 z-[998] w-80 bg-card border border-border rounded-lg shadow-xl flex flex-col overflow-hidden rounded-android-tile backdrop-blur-lg bg-background/80",
            isCollapsed ? "h-14" : "h-[calc(100vh-120px)] max-h-[500px]"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-border flex-shrink-0">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">AiA Chat</h3>
            </div>
            <div className="flex items-center gap-1">
              <MotionButton variant="ghost" size="icon" onClick={handleToggleCollapse} className="h-8 w-8" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                <span className="sr-only">{isCollapsed ? 'Déplier' : 'Replier'}</span>
              </MotionButton>
              <MotionButton variant="ghost" size="icon" onClick={handleCloseChat} className="h-8 w-8" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <X className="h-4 w-4" aria-label="Fermer le chat AiA" />
                <span className="sr-only">Fermer</span>
              </MotionButton>
            </div>
          </div>

          {/* Chat Content (visible only when not collapsed) */}
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-grow flex flex-col overflow-hidden"
            >
              <div className="flex-grow flex flex-col overflow-hidden p-3">
                {(currentCourseTitle || currentModuleTitle) && (
                  <div className="flex gap-2 flex-wrap pb-3 shrink-0">
                    {currentCourseTitle && (
                      <MotionButton
                        variant="outline"
                        size="sm"
                        onClick={() => setAiaInput(prev => prev + ` @${currentCourseTitle}`)}
                        className="whitespace-nowrap text-xs rounded-android-tile"
                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      >
                        @{currentCourseTitle.length > 10 ? currentCourseTitle.substring(0, 10) + '...' : currentCourseTitle}
                      </MotionButton>
                    )}
                    {currentModuleTitle && (
                      <MotionButton
                        variant="outline"
                        size="sm"
                        onClick={() => setAiaInput(prev => prev + ` @${currentModuleTitle}`)}
                        className="whitespace-nowrap text-xs rounded-android-tile"
                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      >
                        @{currentModuleTitle.length > 10 ? currentModuleTitle.substring(0, 10) + '...' : currentModuleTitle}
                      </MotionButton>
                    )}
                  </div>
                )}
                <ScrollArea className="flex-grow border rounded-md p-3 bg-muted/20 rounded-android-tile">
                  <div className="flex flex-col gap-3">
                    {aiaMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={cn(
                          "flex items-start gap-2",
                          msg.sender === 'user' ? "justify-end" : "justify-start"
                        )}
                      >
                        {msg.sender === 'aia' && (
                          <div className="flex-shrink-0 p-1.5 rounded-full bg-primary text-primary-foreground">
                            <Bot className="h-4 w-4" />
                          </div>
                        )}
                        <div
                          className={cn(
                            "max-w-[80%] p-2 rounded-lg text-sm",
                            msg.sender === 'user'
                              ? "bg-primary text-primary-foreground rounded-br-none"
                              : "bg-muted text-muted-foreground rounded-bl-none"
                          )}
                        >
                          {msg.text}
                        </div>
                        {msg.sender === 'user' && (
                          <div className="flex-shrink-0 p-1.5 rounded-full bg-secondary text-secondary-foreground">
                            <UserIcon className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                    ))}
                    <div ref={aiaMessagesEndRef} />
                  </div>
                </ScrollArea>
              </div>
              <div className="flex flex-col gap-2 p-3 border-t border-border shrink-0">
                <div className="flex gap-2">
                  <Input
                    ref={aiaInputRef}
                    placeholder="Écrivez votre message à AiA..."
                    value={aiaInput}
                    onChange={(e) => setAiaInput(e.target.value)}
                    onKeyPress={handleAiaKeyPress}
                    className="flex-grow rounded-android-tile"
                  />
                  <MotionButton onClick={handleSendAiaMessage} disabled={!aiaInput.trim()} className="rounded-android-tile" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Send className="h-5 w-5" />
                    <span className="sr-only">Envoyer</span>
                  </MotionButton>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AiAPersistentChat;