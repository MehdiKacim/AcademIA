import React, { useState, useMemo, useCallback } from 'react';
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
import { cn } from "@/lib/utils";
import { Check, ChevronDown, Loader2, Search as SearchIcon } from "lucide-react"; // Import SearchIcon
import { ScrollArea } from '@/components/ui/scroll-area';

interface SearchableDropdownOption {
  id: string;
  label: string;
  icon_name?: string;
  level?: number; // For indentation in hierarchical menus
  isNew?: boolean; // To indicate if it's a new generic item not yet configured
}

interface SearchableDropdownProps {
  options: SearchableDropdownOption[];
  value: string | null;
  onValueChange: (value: string | null) => void;
  placeholder?: string;
  emptyMessage?: string;
  className?: string;
  popoverContentClassName?: string;
  isLoading?: boolean;
  iconMap?: { [key: string]: React.ElementType }; // Map for Lucide icons
}

const SearchableDropdown = ({
  options,
  value,
  onValueChange,
  placeholder = "Sélectionner...",
  emptyMessage = "Aucun élément trouvé.",
  className,
  popoverContentClassName,
  isLoading = false,
  iconMap = {},
}: SearchableDropdownProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selectedOption = useMemo(() => {
    return options.find((option) => option.id === value);
  }, [options, value]);

  const filteredOptions = useMemo(() => {
    if (!search) return options;
    const lowerCaseSearch = search.toLowerCase();
    return options.filter(option =>
      option.label.toLowerCase().includes(lowerCaseSearch)
    );
  }, [options, search]);

  const renderOption = useCallback((option: SearchableDropdownOption) => {
    const IconComponent = option.icon_name ? iconMap[option.icon_name] : null;
    return (
      <div className="flex items-center gap-2">
        {option.level !== undefined && option.level > 0 && (
          <span style={{ marginLeft: `${option.level * 16}px` }} className="inline-block"></span>
        )}
        {IconComponent && <IconComponent className="h-4 w-4" />}
        <span>{option.label}</span>
        {option.isNew && <span className="ml-2 text-xs text-muted-foreground">(Nouveau)</span>}
      </div>
    );
  }, [iconMap]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          <React.Fragment> {/* Wrap all children of Button */}
            {value ? (
              <div className="flex items-center gap-2">
                {selectedOption?.icon_name && React.createElement(iconMap[selectedOption.icon_name], { className: "h-4 w-4" })}
                <span>{selectedOption?.label}</span>
              </div>
            ) : (
              <span>{placeholder}</span>
            )}
            {isLoading ? (
              <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin opacity-50" />
            ) : (
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            )}
          </React.Fragment>
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn("w-[var(--radix-popover-trigger-width)] p-0", popoverContentClassName)}>
        <Command>
          <CommandInput
            placeholder="Rechercher..."
            value={search}
            onValueChange={setSearch}
            icon={SearchIcon} // Use SearchIcon here
          />
          <CommandList>
            {isLoading ? (
              <CommandEmpty className="py-2 text-center text-muted-foreground flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> <span>Chargement...</span>
              </CommandEmpty>
            ) : (
              <>
                {filteredOptions.length === 0 && <CommandEmpty>{emptyMessage}</CommandEmpty>}
                <ScrollArea className="h-40">
                  <CommandGroup>
                    {filteredOptions.map((option) => (
                      <CommandItem
                        key={option.id}
                        value={option.label}
                        onSelect={() => {
                          onValueChange(option.id === value ? null : option.id);
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            value === option.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {renderOption(option)}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </ScrollArea>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default SearchableDropdown;