import React from 'react';
import { ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SwipeUpIndicatorProps {
  isVisible: boolean;
}

const SwipeUpIndicator = ({ isVisible }: SwipeUpIndicatorProps) => {
  return (
    <div className={cn(
      "fixed bottom-20 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center transition-opacity duration-300 pointer-events-none",
      isVisible ? "opacity-100" : "opacity-0"
    )}>
      <ChevronUp className="h-8 w-8 text-muted-foreground animate-bounce-slow" />
      <span className="text-xs text-muted-foreground">Menu</span>
    </div>
  );
};

export default SwipeUpIndicator;