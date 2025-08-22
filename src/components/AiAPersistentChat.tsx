import React, { useState, useRef, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User as UserIcon, X, Minus, Maximize } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useCourseChat } from "@/contexts/CourseChatContext";

interface Message {
  id: number;
  sender: 'user' | 'aia';
  text: string;
}

const AiAPersistentChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isMinimized, setIsMinimized] = useState(false); // Internal state for minimization
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const messageIdCounter = useRef(0); 
  
  const { currentCourseTitle, currentModuleTitle, isChatOpen, closeChat, initialChatMessage, setInitialChatMessage } = useCourseChat();

  const isMobile = useIsMobile();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (messages.length === 0) {
      messageIdCounter.current += 1;
      setMessages([
        { id: messageIdCounter.current, sender: 'aia', text: "Bonjour ! Je suis AiA, votre tuteur personnel. Comment puis-je vous aider aujourd'hui ?" },
      ]);
    }
  }, []);

  // Ensure chat is maximized when opened from the floating button
  useEffect(() => {
    if (isChatOpen) {
      setIsMinimized(false); // Always open in maximized state
      if (initialChatMessage) {
        setInput(initialChatMessage);
        setInitialChatMessage(null);
      }
      const timer = setTimeout(() => {
        scrollToBottom();
      }, 100); 
      return () => clearTimeout(timer);
    }
  }, [isChatOpen, initialChatMessage, setInitialChatMessage]);

  useEffect(() => {
    if (!isMinimized) {
      const timer = setTimeout(() => {
        scrollToBottom();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [messages, isMinimized]);

  const handleSendMessage = () => {
    if (input.trim()) {
      const contextParts = [];
      if (currentCourseTitle) {
        contextParts.push(`Cours "${currentCourseTitle}"`);
      }
      if (currentModuleTitle) {
        contextParts.push(`Module "${currentModuleTitle}"`);
      }
      const contextPrefix = contextParts.length > 0 ? `(Contexte: ${contextParts.join(', ')}) ` : '';

      messageIdCounter.current += 1;
      const userMessageId = messageIdCounter.current;
      const newMessage: Message = { id: userMessageId, sender: 'user', text: contextPrefix + input.trim() };
      setMessages((prevMessages) => [...prevMessages, newMessage]);
      setInput('');

      setTimeout(() => {
        messageIdCounter.current += 1;
        const aiaResponse: Message = {
          id: aiaMessageId,
          sender: 'aia',
          text: `Je comprends que vous avez dit : "${newMessage.text}". Je suis en train de traiter votre demande.`,
        };
        setMessages((prevMessages) => [...prevMessages, aiaResponse]);
      }, 1000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  if (!isChatOpen) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed bg-card border border-primary/20 shadow-lg shadow-primary/10 flex flex-col z-[1000] transition-all duration-300 ease-in-out",
        isMinimized
          ? "bottom-4 right-4 h-14 w-14 rounded-full cursor-pointer" // Minimized state: small button
          : isMobile
            ? "bottom-20 right-4 w-[calc(100%-2rem)] h-[60vh] rounded-lg" // Maximized mobile
            : "bottom-4 right-4 w-[400px] h-[500px] rounded-lg" // Maximized desktop
      )}
      onClick={isMinimized ? () => setIsMinimized(false) : undefined} // Click to maximize when minimized
    >
      {isMinimized ? (
        <div className="flex items-center justify-center h-full w-full">
          <Bot className="h-7 w-7 text-primary" />
          <span className="sr-only">Ouvrir le chat AiA</span>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              <Bot className="h-6 w-6 text-primary" /> AiA
            </h3>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" onClick={() => setIsMinimized(true)}>
                <Minus className="h-4 w-4" />
                <span className="sr-only">Minimiser</span>
              </Button>
              <Button variant="ghost" size="icon" onClick={closeChat}>
                <X className="h-4 w-4" />
                <span className="sr-only">Fermer le chat</span>
              </Button>
            </div>
          </div>

          <div className="flex-grow flex flex-col overflow-hidden">
            {(currentCourseTitle || currentModuleTitle) && (
              <div className="flex gap-2 flex-wrap p-4 pb-0 shrink-0">
                {currentCourseTitle && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setInput(prev => prev + ` @${currentCourseTitle}`)}
                    className="whitespace-nowrap text-xs"
                  >
                    @{currentCourseTitle.length > 10 ? currentCourseTitle.substring(0, 10) + '...' : currentCourseTitle}
                  </Button>
                )}
                {currentModuleTitle && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setInput(prev => prev + ` @${currentModuleTitle}`)}
                    className="whitespace-nowrap text-xs"
                  >
                    @{currentModuleTitle.length > 10 ? currentModuleTitle.substring(0, 10) + '...' : currentModuleTitle}
                  </Button>
                )}
              </div>
            )}
            <ScrollArea className="flex-grow border rounded-md p-4">
              <div className="flex flex-col gap-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex items-start gap-3",
                      msg.sender === 'user' ? "justify-end" : "justify-start"
                    )}
                  >
                    {msg.sender === 'aia' && (
                      <div className="flex-shrink-0 p-2 rounded-full bg-primary text-primary-foreground">
                        <Bot className="h-4 w-4" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[70%] p-3 rounded-lg",
                        msg.sender === 'user'
                          ? "bg-primary text-primary-foreground rounded-br-none"
                          : "bg-muted text-muted-foreground rounded-bl-none"
                      )}
                    >
                      {msg.text}
                    </div>
                    {msg.sender === 'user' && (
                      <div className="flex-shrink-0 p-2 rounded-full bg-secondary text-secondary-foreground">
                        <UserIcon className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
            <div className="flex flex-col gap-2 p-4 pt-0 shrink-0">
              <div className="flex gap-2">
                <Input
                  placeholder="Écrivez votre message à AiA..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-grow"
                />
                <Button onClick={handleSendMessage} disabled={!input.trim()}>
                  <Send className="h-5 w-5" />
                  <span className="sr-only">Envoyer</span>
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AiAPersistentChat;