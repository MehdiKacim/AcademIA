import React, { useState, useMemo } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, ChevronDown, Search as SearchIcon, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface SimpleItemOption {
  id: string;
  label: string;
  icon_name?: string; // Lucide icon name
  description?: string;
  level?: number; // For hierarchical display if needed
  typeLabel?: string; // For display in description
  isNew?: boolean; // To indicate if it's a new generic item not yet configured
}

interface SimpleItemSelectorProps {
  id: string;
  options: SimpleItemOption[];
  value: string | null;
  onValueChange: (value: string | null) => void;
  placeholder?: string;
  emptyMessage?: string;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  iconMap: { [key: string]: React.ElementType }; // Map for Lucide icons
  popoverContentClassName?: string;
  disabled?: boolean;
}

const SimpleItemSelector = ({
  id,
  options,
  value,
  onValueChange,
  placeholder = "Sélectionner un élément...",
  emptyMessage = "Aucun élément trouvé.",
  searchQuery,
  onSearchQueryChange,
  iconMap,
  popoverContentClassName,
  disabled = false,
}: SimpleItemSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = useMemo(() => options.find(option => option.id === value), [options, value]);

  const filteredOptions = useMemo(() => {
    if (!searchQuery) return options;
    const lowerCaseQuery = searchQuery.toLowerCase();
    return options.filter(option =>
      option.label.toLowerCase().includes(lowerCaseQuery) ||
      (option.description && option.description.toLowerCase().includes(lowerCaseQuery)) ||
      (option.typeLabel && option.typeLabel.toLowerCase().includes(lowerCaseQuery))
    );
  }, [options, searchQuery]);

  const CurrentIconComponent = selectedOption?.icon_name ? (iconMap[selectedOption.icon_name] || Info) : Info;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={isOpen}
          className="w-full justify-between rounded-android-tile"
          id={id}
          disabled={disabled}
        >
          {selectedOption ? (
            <div className="flex items-center gap-2">
              {selectedOption.icon_name && <CurrentIconComponent className="h-4 w-4" />}
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
            placeholder="Rechercher..."
            value={searchQuery}
            onValueChange={onSearchQueryChange}
          />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((option) => {
                const OptionIconComponent = option.icon_name ? (iconMap[option.icon_name] || Info) : Info;
                return (
                  <CommandItem
                    key={option.id}
                    value={option.label} // Use label for search matching
                    onSelect={() => {
                      onValueChange(option.id);
                      setIsOpen(false);
                      onSearchQueryChange(''); // Clear search after selection
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === option.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option.icon_name && <OptionIconComponent className="mr-2 h-4 w-4" />}
                    <div className="flex flex-col items-start">
                      <span>{option.label}</span>
                      {option.description && <span className="text-xs text-muted-foreground">{option.description}</span>}
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default SimpleItemSelector;