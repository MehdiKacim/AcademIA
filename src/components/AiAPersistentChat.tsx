import React, { useState, useRef, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User as UserIcon, MessageCircleMore } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

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
  const [isOpen, setIsOpen] = useState(false); // État pour contrôler la visibilité de la Sheet

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) { // Ne défile que si la Sheet est ouverte
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = () => {
    if (input.trim()) {
      const newMessage: Message = { id: messages.length + 1, sender: 'user', text: input.trim() };
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

  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            variant="default"
            size="icon"
            className="fixed bottom-4 right-4 rounded-full h-14 w-14 shadow-lg z-50"
            aria-label="Ouvrir le chat AiA"
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
          <div className="flex-grow flex flex-col py-4">
            <ScrollArea className="flex-grow h-[calc(100vh-200px)] p-4 border rounded-md mb-4">
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
        </SheetContent>
      </Sheet>
    </>
  );
};

export default AiAPersistentChat;