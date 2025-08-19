import React, { useState, useRef, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User as UserIcon, MessageCircleMore, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { useCourseChat } from "@/contexts/CourseChatContext"; // New import

interface Message {
  id: number;
  sender: 'user' | 'aia';
  text: string;
}

const AiAPersistentChat = () => {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, sender: 'aia', text: "Bonjour ! Je suis AiA, votre tuteur personnel. Comment puis-je vous aider aujourd'hui ?" },
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Use context for chat open state and initial message
  const { currentCourseTitle, currentModuleTitle, isChatOpen, openChat, closeChat, initialChatMessage, setInitialChatMessage } = useCourseChat();

  const isMobile = useIsMobile();

  // Sync internal isOpen state with context's isChatOpen
  useEffect(() => {
    if (isChatOpen) {
      // If chat is opened via context and there's an initial message, set it
      if (initialChatMessage) {
        setInput(initialChatMessage);
        setInitialChatMessage(null); // Clear the initial message after setting it
      }
      scrollToBottom();
    }
  }, [isChatOpen, initialChatMessage, setInitialChatMessage]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (input.trim()) {
      // Build context prefix
      const contextParts = [];
      if (currentCourseTitle) {
        contextParts.push(`Cours "${currentCourseTitle}"`);
      }
      if (currentModuleTitle) {
        contextParts.push(`Module "${currentModuleTitle}"`);
      }
      const contextPrefix = contextParts.length > 0 ? `(Contexte: ${contextParts.join(', ')}) ` : '';

      const newMessage: Message = { id: messages.length + 1, sender: 'user', text: contextPrefix + input.trim() };
      setMessages((prevMessages) => [...prevMessages, newMessage]);
      setInput('');

      // Simuler la réponse d'AiA
      setTimeout(() => {
        const aiaResponse: Message = {
          id: messages.length + 2,
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

  const handleToggleChat = () => {
    if (isChatOpen) {
      closeChat();
    } else {
      openChat();
    }
  };

  // Contenu commun du chat (messages + input)
  const chatContent = (
    <div className="flex-grow flex flex-col py-4">
      <ScrollArea className="flex-grow p-4 border rounded-md mb-4">
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
      <div className="flex gap-2 flex-wrap"> {/* Added flex-wrap for small screens */}
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
  );

  if (isMobile) {
    return (
      <Sheet open={isChatOpen} onOpenChange={openChat}> {/* Use isChatOpen from context */}
        <SheetTrigger asChild>
          <Button
            variant="default"
            size="icon"
            className="fixed bottom-4 right-4 rounded-full h-14 w-14 shadow-lg z-50"
            aria-label="Ouvrir le chat AiA"
            onClick={() => openChat()} // Use openChat from context
          >
            <MessageCircleMore className="h-7 w-7" />
          </Button>
        </SheetTrigger>
        <SheetContent className="flex flex-col w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Bot className="h-6 w-6 text-primary" /> Discuter avec AiA
            </SheetTitle>
          </SheetHeader>
          {chatContent}
        </SheetContent>
      </Sheet>
    );
  }

  // Version Desktop (panneau flottant non bloquant)
  return (
    <>
      <Button
        variant="default"
        size="icon"
        className="fixed bottom-4 right-4 rounded-full h-14 w-14 shadow-lg z-50"
        aria-label="Ouvrir le chat AiA"
        onClick={handleToggleChat} // Use internal toggle
      >
        <MessageCircleMore className="h-7 w-7" />
      </Button>

      {isChatOpen && (
        <div className="fixed bottom-20 right-4 w-80 h-[450px] bg-card border border-border rounded-lg shadow-xl flex flex-col z-50 animate-in slide-in-from-bottom-4 fade-in-0 duration-300">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              <Bot className="h-5 w-5 text-primary" /> Discuter avec AiA
            </h3>
            <Button variant="ghost" size="icon" onClick={closeChat} className="h-8 w-8"> {/* Use closeChat from context */}
              <X className="h-4 w-4" />
              <span className="sr-only">Fermer le chat</span>
            </Button>
          </div>
          {chatContent}
        </div>
      )}
    </>
  );
};

export default AiAPersistentChat;