"use client";

import * as React from "react";
import { Check, ChevronDown, Info } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface SelectOption {
  id: string;
  label: string;
  icon_name?: string;
  description?: string;
  level?: number; // For hierarchical display
  isNew?: boolean; // For distinguishing new generic items
  typeLabel?: string; // For displaying item type
}

interface SimpleItemSelectorProps {
  id: string;
  options: SelectOption[];
  value: string | null;
  onValueChange: (value: string | null) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  placeholder?: string;
  emptyMessage?: string;
  iconMap: { [key: string]: React.ElementType };
  disabled?: boolean;
  className?: string;
  popoverContentClassName?: string;
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
    disabled,
    className,
    popoverContentClassName,
  }, ref) => {
    const [open, setOpen] = React.useState(false);

    const selectedOption = React.useMemo(
      () => options.find((option) => option.id === value),
      [options, value],
    );

    const filteredOptions = React.useMemo(() => {
      if (!searchQuery) return options;
      const lowerCaseQuery = searchQuery.toLowerCase();
      return options.filter(
        (option) =>
          option.label.toLowerCase().includes(lowerCaseQuery) ||
          option.description?.toLowerCase().includes(lowerCaseQuery) ||
          option.icon_name?.toLowerCase().includes(lowerCaseQuery) ||
          option.typeLabel?.toLowerCase().includes(lowerCaseQuery)
      );
    }, [options, searchQuery]);

    const handleSelect = (currentId: string) => {
      onValueChange(currentId === value ? null : currentId);
      setOpen(false);
      onSearchQueryChange(''); // Clear search query on select
    };

    const CurrentIconComponent = selectedOption?.icon_name
      ? iconMap[selectedOption.icon_name] || Info
      : Info;

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn("w-full justify-between rounded-android-tile", className)}
            disabled={disabled}
            ref={ref}
          >
            {selectedOption ? (
              <span className="flex items-center gap-2 truncate">
                {selectedOption.icon_name && (
                  <CurrentIconComponent className="h-4 w-4" />
                )}
                {selectedOption.label}
              </span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className={cn("w-[var(--radix-popover-trigger-width)] p-0 rounded-android-tile z-[9999]", popoverContentClassName)}>
          <Command>
            <CommandInput
              placeholder={placeholder}
              value={searchQuery}
              onValueChange={onSearchQueryChange}
            />
            <CommandList>
              <CommandEmpty>{emptyMessage}</CommandEmpty>
              <CommandGroup>
                {filteredOptions.map((option) => {
                  const OptionIconComponent = option.icon_name
                    ? iconMap[option.icon_name] || Info
                    : Info;
                  return (
                    <CommandItem
                      key={option.id}
                      value={option.label}
                      onSelect={() => handleSelect(option.id)}
                      style={{ paddingLeft: `${(option.level || 0) * 16 + 8}px` }} // Indent for hierarchy
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === option.id ? "opacity-100" : "opacity-0",
                        )}
                      />
                      <OptionIconComponent className="mr-2 h-4 w-4" />
                      <span>{option.label}</span>
                      {option.description && (
                        <span className="ml-auto text-xs text-muted-foreground truncate max-w-[50%]">
                          {option.description}
                        </span>
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
  },
);

SimpleItemSelector.displayName = "SimpleItemSelector";

export default SimpleItemSelector;