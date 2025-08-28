import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronDown, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface SimpleItemSelectorOption {
  id: string;
  label: string;
  icon_name?: string;
  description?: string;
  level?: number; // For hierarchical display
  typeLabel?: string; // For displaying item type
  isNew?: boolean; // To indicate if it's a new generic item not yet configured for the role
}

interface SimpleItemSelectorProps {
  id: string;
  options: SimpleItemSelectorOption[];
  value: string | null;
  onValueChange: (value: string | null) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  placeholder?: string;
  emptyMessage?: string;
  iconMap: { [key: string]: React.ElementType };
  disabled?: boolean;
}

const SimpleItemSelector = React.forwardRef<HTMLButtonElement, SimpleItemSelectorProps>(
  ({
    id,
    options,
    value,
    onValueChange,
    searchQuery,
    onSearchQueryChange,
    placeholder = "Sélectionner un élément...",
    emptyMessage = "Aucun élément trouvé.",
    iconMap,
    disabled = false,
  }, ref) => {
    const [open, setOpen] = useState(false);

    const selectedOption = useMemo(
      () => options.find((option) => option.id === value),
      [options, value]
    );

    const filteredOptions = useMemo(() => {
      if (!searchQuery) return options;
      const lowerCaseQuery = searchQuery.toLowerCase();
      return options.filter(option =>
        option.label.toLowerCase().includes(lowerCaseQuery) ||
        option.description?.toLowerCase().includes(lowerCaseQuery) ||
        option.typeLabel?.toLowerCase().includes(lowerCaseQuery)
      );
    }, [options, searchQuery]);

    const handleSelect = (currentValue: string) => {
      onValueChange(currentValue === value ? null : currentValue);
      setOpen(false);
      onSearchQueryChange(''); // Clear search query on select
    };

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between rounded-android-tile"
            disabled={disabled}
            ref={ref}
          >
            {selectedOption ? (
              <div className="flex items-center gap-2">
                {selectedOption.icon_name && React.createElement(iconMap[selectedOption.icon_name] || Info, { className: "h-4 w-4" })}
                {selectedOption.label}
              </div>
            ) : (
              placeholder
            )}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className={cn("w-[var(--radix-popover-trigger-width)] p-0 rounded-android-tile z-[9999]")}>
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
                  const IconComponent = option.icon_name ? (iconMap[option.icon_name] || Info) : Info;
                  return (
                    <CommandItem
                      key={option.id}
                      value={option.label} // Use label for command search
                      onSelect={() => handleSelect(option.id)}
                      className="flex items-center gap-2"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === option.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {option.icon_name && <IconComponent className="h-4 w-4" />}
                      <span className={cn(option.level && option.level > 0 ? `ml-${option.level * 4}` : '')}>
                        {option.label}
                      </span>
                      {option.typeLabel && <span className="text-xs text-muted-foreground ml-auto">({option.typeLabel})</span>}
                      {option.isNew && <span className="text-xs text-primary ml-1">(Nouveau)</span>}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  }
);

SimpleItemSelector.displayName = "SimpleItemSelector";

export default SimpleItemSelector;