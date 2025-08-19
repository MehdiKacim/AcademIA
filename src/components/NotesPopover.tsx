import React from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import NotesSection from "@/components/NotesSection";

interface NotesPopoverProps {
  noteKey: string;
  title: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  refreshKey: number;
  children: React.ReactNode; // Le déclencheur de la popover
}

const NotesPopover = ({ noteKey, title, isOpen, onOpenChange, refreshKey, children }: NotesPopoverProps) => {
  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <NotesSection noteKey={noteKey} title={title} refreshKey={refreshKey} />
      </PopoverContent>
    </Popover>
  );
};

export default NotesPopover;