import React from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import NotesSection from "@/components/NotesSection";
import { PopoverContentProps } from '@radix-ui/react-popover';

interface NotesPopoverProps {
  noteKey: string;
  title: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  refreshKey: number;
  children: React.ReactNode; // Le déclencheur de la popover
  side?: PopoverContentProps['side']; // Add side prop
  align?: PopoverContentProps['align']; // Add align prop
}

const NotesPopover = ({ noteKey, title, isOpen, onOpenChange, refreshKey, children, side = "right", align = "start" }: NotesPopoverProps) => {
  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" side={side} align={align}> {/* Pass side and align */}
        <NotesSection noteKey={noteKey} title={title} refreshKey={refreshKey} />
      </PopoverContent>
    </Popover>
  );
};

export default NotesPopover;