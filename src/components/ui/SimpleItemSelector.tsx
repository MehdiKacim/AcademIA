import React, { useState, useMemo } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Check, ChevronDown, XCircle, Info, Search as SearchIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SimpleItemSelectorProps {
  id: string;
  options: { id: string; label: string; icon_name?: string; description?: string; isNew?: boolean; level?: number; typeLabel?: string }[];
  value: string | null | undefined;
  onValueChange: (value: string | null) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  placeholder?: string;
  emptyMessage?: string;
  iconMap?: { [key: string]: React.ElementType };
  disabled?: boolean;
  className?: string;
  popoverContentClassName?: string;
}

const SimpleItemSelector = ({
  id,
  options,
  value,
  onValueChange,
  searchQuery,
  onSearchQueryChange,
  placeholder = "Sélectionner un élément...",
  emptyMessage = "Aucun élément trouvé.",
  iconMap = {},
  disabled = false,
  className,
  popoverContentClassName,
}: SimpleItemSelectorProps) => {
  const [open, setOpen] = useState(false);

  const selectedOption = useMemo(() => options.find((option) => option.id === value), [options, value]);
  const SelectedIconComponent = selectedOption?.icon_name ? (iconMap[selectedOption.icon_name] || Info) : Info;

  const handleClearSelection = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening the popover
    onValueChange(null);
    setOpen(false);
    onSearchQueryChange('');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between rounded-android-tile h-10 px-3 py-2 text-base",
            "transition-all duration-200 ease-in-out",
            value ? "text-foreground" : "text-muted-foreground",
            className
          )}
          disabled={disabled}
          // Removed whileHover and whileTap from here as they are not directly on the CommandItem
        >
          <div className="flex items-center gap-2 flex-grow overflow-hidden">
            {value && SelectedIconComponent && <SelectedIconComponent className="h-5 w-5 text-primary flex-shrink-0" />}
            <span className="truncate">
              {value ? selectedOption?.label : placeholder}
            </span>
          </div>
          {value && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClearSelection}
              className="h-6 w-6 p-0 ml-2 flex-shrink-0 text-muted-foreground hover:text-destructive"
              aria-label="Effacer la sélection"
            >
              <XCircle className="h-4 w-4" />
            </Button>
          )}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn(
        "w-[var(--radix-popover-trigger-width)] p-0 rounded-android-tile z-[9999] backdrop-blur-lg bg-background/80",
        popoverContentClassName
      )}>
        <Command className="rounded-android-tile">
          <CommandInput
            placeholder="Rechercher..."
            value={searchQuery}
            onValueChange={onSearchQueryChange}
            className="h-12 text-base px-4 rounded-t-android-tile border-b border-border focus:ring-0 focus:ring-offset-0"
          />
          <CommandList className="max-h-60 overflow-y-auto">
            <CommandEmpty className="py-4 text-center text-muted-foreground">{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const OptionIcon = option.icon_name ? (iconMap[option.icon_name] || Info) : Info;
                const isSelected = value === option.id;
                return (
                  <CommandItem
                    key={option.id}
                    value={option.label}
                    onSelect={() => {
                      onValueChange(option.id === value ? null : option.id);
                      setOpen(false);
                      onSearchQueryChange(''); // Clear search after selection
                    }}
                    className={cn(
                      "flex items-center gap-2 p-3 cursor-pointer hover:bg-accent hover:text-accent-foreground",
                      isSelected ? "bg-accent text-accent-foreground font-semibold" : "text-foreground",
                      "transition-colors duration-150 ease-in-out",
                      "pointer-events-auto" // Explicitly ensure pointer events are enabled
                    )}
                    tabIndex={0} // Ensure it's focusable for keyboard navigation and clicks
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        isSelected ? "opacity-100 text-primary" : "opacity-0"
                      )}
                    />
                    <OptionIcon className="h-5 w-5 text-primary" />
                    <div className="flex flex-col items-start flex-grow">
                      <span className="font-medium">{option.label}</span>
                      {option.description && <span className="text-xs text-muted-foreground">{option.description}</span>}
                    </div>
                    {option.isNew && (
                      <span className="ml-auto text-xs text-primary-foreground bg-primary rounded-full px-2 py-0.5">Nouveau</span>
                    )}
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