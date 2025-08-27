import React, { useState, useMemo } from 'react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronDown, Info, Search as SearchIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from '@/components/ui/scroll-area';

interface SimpleItemSelectorOption {
  id: string;
  label: string;
  icon_name?: string;
  description?: string;
  isNew?: boolean; // To indicate if it's a generic item not yet configured for the role
  typeLabel?: string; // For display purposes
  level?: number; // For hierarchical display
}

interface SimpleItemSelectorProps {
  id: string;
  options: SimpleItemSelectorOption[];
  value: string | null;
  onValueChange: (value: string | null) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  placeholder: string;
  emptyMessage: string;
  iconMap: { [key: string]: React.ElementType }; // Pass iconMap as prop
  popoverContentClassName?: string;
  disabled?: boolean; // Nouvelle prop pour contrôler l'état désactivé
}

const SimpleItemSelector = ({
  id,
  options,
  value,
  onValueChange,
  searchQuery,
  onSearchQueryChange,
  placeholder,
  emptyMessage,
  iconMap,
  popoverContentClassName,
  disabled = false, // Valeur par défaut à false
}: SimpleItemSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = useMemo(() => {
    return options.find((option) => option.id === value);
  }, [options, value]);

  const filteredOptions = useMemo(() => {
    const lowerCaseQuery = searchQuery.toLowerCase();
    return options.filter(option =>
      option.label.toLowerCase().includes(lowerCaseQuery) ||
      (option.description && option.description.toLowerCase().includes(lowerCaseQuery)) ||
      (option.typeLabel && option.typeLabel.toLowerCase().includes(lowerCaseQuery))
    );
  }, [options, searchQuery]);

  const renderOption = (option: SimpleItemSelectorOption) => {
    const IconComponent = option.icon_name ? (iconMap[option.icon_name] || Info) : Info; // Fallback to Info icon
    const paddingLeft = option.level ? `${option.level * 16}px` : '0px';

    return (
      <CommandItem
        key={option.id}
        value={option.id}
        onSelect={() => {
          onValueChange(option.id);
          setIsOpen(false);
          onSearchQueryChange(''); // Clear search after selection
        }}
        className="flex items-center gap-2 cursor-pointer"
        style={{ paddingLeft }}
      >
        <Check
          className={cn(
            "mr-2 h-4 w-4",
            value === option.id ? "opacity-100" : "opacity-0"
          )}
        />
        <IconComponent className="h-4 w-4 text-primary" />
        <div className="flex flex-col items-start">
          <span className="font-medium">{option.label}</span>
          {option.description && <span className="text-xs text-muted-foreground line-clamp-1">{option.description}</span>}
          {option.isNew && <span className="text-xs text-blue-500"> (Nouvel élément générique)</span>}
        </div>
      </CommandItem>
    );
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={isOpen}
          className="w-full justify-between rounded-android-tile"
          id={id}
          disabled={disabled} // Transmettre la prop disabled au bouton
        >
          {selectedOption ? (
            <div className="flex items-center gap-2">
              {selectedOption.icon_name && React.createElement(iconMap[selectedOption.icon_name] || Info, { className: "h-4 w-4 text-primary" })}
              {selectedOption.label}
            </div>
          ) : (
            placeholder
          )}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn("w-[var(--radix-popover-trigger-width)] p-0 rounded-android-tile", popoverContentClassName)}>
        <Command>
          <CommandInput
            placeholder={placeholder}
            value={searchQuery}
            onValueChange={onSearchQueryChange}
          />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <ScrollArea className="h-40">
              <CommandGroup>
                {filteredOptions.map(renderOption)}
              </CommandGroup>
            </ScrollArea>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default SimpleItemSelector;