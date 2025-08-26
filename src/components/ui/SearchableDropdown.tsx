import * as React from "react";
import { Check, ChevronDown } from "lucide-react";

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
import { ScrollArea } from "@/components/ui/scroll-area";

interface SearchableDropdownOption {
  id: string;
  label: string;
  icon_name?: string;
  level?: number; // For hierarchical display if needed
  isNew?: boolean; // To indicate if it's a new generic item
}

interface SearchableDropdownProps {
  options: SearchableDropdownOption[];
  value: string | null;
  onValueChange: (value: string | null) => void;
  placeholder?: string;
  emptyMessage?: string;
  iconMap?: { [key: string]: React.ElementType };
  className?: string;
  popoverContentClassName?: string;
  disabled?: boolean; // New: Add disabled prop
}

const SearchableDropdown = React.forwardRef<
  HTMLButtonElement,
  SearchableDropdownProps
>(
  (
    {
      options,
      value,
      onValueChange,
      placeholder = "Sélectionner...",
      emptyMessage = "Aucun élément trouvé.",
      iconMap = {},
      className,
      popoverContentClassName,
      disabled = false, // Default to false
    },
    ref
  ) => {
    const [open, setOpen] = React.useState(false);
    const [searchValue, setSearchValue] = React.useState("");

    const selectedOption = options.find((option) => option.id === value);

    const filteredOptions = React.useMemo(() => {
      if (!searchValue) return options;
      const lowerCaseSearch = searchValue.toLowerCase();
      return options.filter(
        (option) => option.label.toLowerCase().includes(lowerCaseSearch)
      );
    }, [options, searchValue]);

    const handleSelect = (currentValue: string) => {
      onValueChange(currentValue === value ? null : currentValue);
      setOpen(false);
      setSearchValue(""); // Clear search after selection
    };

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn("w-full justify-between rounded-android-tile", className)}
            disabled={disabled} // Apply disabled prop here
          >
            <div className="flex items-center gap-2 overflow-hidden">
              {selectedOption?.icon_name && iconMap[selectedOption.icon_name] && (
                React.createElement(iconMap[selectedOption.icon_name], { className: "h-4 w-4 shrink-0" })
              )}
              <span className="truncate">
                {selectedOption ? selectedOption.label : placeholder}
              </span>
            </div>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className={cn("w-[var(--radix-popover-trigger-width)] p-0 rounded-android-tile", popoverContentClassName)}>
          <Command>
            <CommandInput
              placeholder="Rechercher..."
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList>
              <CommandEmpty>{emptyMessage}</CommandEmpty>
              <ScrollArea className="h-40">
                <CommandGroup>
                  {filteredOptions.map((option) => (
                    <CommandItem
                      key={option.id}
                      value={option.label} // Use label for search matching
                      onSelect={() => handleSelect(option.id)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === option.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {option.icon_name && iconMap[option.icon_name] && (
                        React.createElement(iconMap[option.icon_name], { className: "mr-2 h-4 w-4" })
                      )}
                      <span>{option.label}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </ScrollArea>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  }
);

SearchableDropdown.displayName = "SearchableDropdown";

export default SearchableDropdown;