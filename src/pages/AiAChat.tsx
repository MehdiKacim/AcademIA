import React, { useState, useRef, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: number;
  sender: 'user' | 'aia';
  text: string;
}

const AiAChat = () => {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, sender: 'aia', text: "Bonjour ! Je suis AiA, votre tuteur personnel. Comment puis-je vous aider aujourd'hui ?" },
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = () => {
    if (input.trim()) {
      const newMessage: Message = { id: messages.length + 1, sender: 'user', text: input.trim() };
      setMessages((prevMessages) => [...prevMessages, newMessage]);
      setInput('');

      // Simulate AiA's response
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
    <div className="flex flex-col h-full">
      <h1 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan">
        Discuter avec AiA
      </h1>
      <Card className="flex-grow flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" /> AiA, votre tuteur intelligent
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col p-4">
          <ScrollArea className="flex-grow h-[calc(100vh-350px)] p-4 border rounded-md mb-4">
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
        </CardContent>
      </Card>
    </div>
  );
};

export default AiAChat;