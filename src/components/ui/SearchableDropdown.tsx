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

interface SearchableDropdownOption {
  id: string;
  label: string;
  icon_name?: string;
  level?: number; // For indentation if needed
  isNew?: boolean; // For distinguishing new generic items
  typeLabel?: string; // For displaying type
}

interface SearchableDropdownProps {
  options: SearchableDropdownOption[];
  value: string | null;
  onValueChange: (value: string | null) => void;
  placeholder?: string;
  emptyMessage?: string;
  iconMap: { [key: string]: React.ElementType };
  disabled?: boolean;
}

const SearchableDropdown = React.forwardRef<HTMLButtonElement, SearchableDropdownProps>(
  ({ options, value, onValueChange, placeholder, emptyMessage, iconMap, disabled }, ref) => {
    const [open, setOpen] = React.useState(false);
    const [searchTerm, setSearchTerm] = React.useState("");

    const selectedOption = options.find((option) => option.id === value);

    const filteredOptions = React.useMemo(() => {
      if (!searchTerm) return options;
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      return options.filter(option =>
        option.label.toLowerCase().includes(lowerCaseSearchTerm) ||
        option.id.toLowerCase().includes(lowerCaseSearchTerm)
      );
    }, [options, searchTerm]);

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between rounded-android-tile"
            ref={ref}
            disabled={disabled}
          >
            {selectedOption ? (
              <div className="flex items-center gap-2">
                {selectedOption.icon_name && React.createElement(iconMap[selectedOption.icon_name], { className: "h-4 w-4" })}
                {selectedOption.label}
              </div>
            ) : (
              placeholder
            )}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-android-tile z-[9999]"> {/* Added z-[9999] here */}
          <Command>
            <CommandInput
              placeholder="Rechercher..."
              value={searchTerm}
              onValueChange={setSearchTerm}
            />
            <CommandList>
              <CommandEmpty>{emptyMessage || "Aucun élément trouvé."}</CommandEmpty>
              <CommandGroup>
                {filteredOptions.map((option) => {
                  const IconComponent = option.icon_name ? (iconMap[option.icon_name] || Info) : Info;
                  return (
                    <CommandItem
                      key={option.id}
                      value={option.label} // Use label for search matching
                      onSelect={() => {
                        onValueChange(option.id === value ? null : option.id);
                        setOpen(false);
                        setSearchTerm(""); // Clear search term on selection
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === option.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex items-center gap-2">
                        {React.createElement(IconComponent, { className: "h-4 w-4" })}
                        <span>{option.label}</span>
                        {option.typeLabel && <span className="text-xs text-muted-foreground">({option.typeLabel})</span>}
                        {option.isNew && <span className="ml-2 italic text-xs text-muted-foreground">(Nouveau)</span>}
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
  }
);

SearchableDropdown.displayName = "SearchableDropdown";

export default SearchableDropdown;