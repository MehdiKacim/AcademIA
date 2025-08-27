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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface SearchableDropdownOption {
  id: string;
  label: string;
  icon_name?: string; // For Lucide icons
  level?: number; // For indentation if needed
  isNew?: boolean; // To distinguish new generic items
  typeLabel?: string; // To display item type
}

interface SearchableDropdownProps {
  options: SearchableDropdownOption[];
  value: string | null;
  onValueChange: (value: string | null) => void;
  placeholder?: string;
  emptyMessage?: string;
  iconMap?: { [key: string]: React.ElementType }; // Map icon_name to actual component
  disabled?: boolean;
  popoverContentClassName?: string; // Allow custom class for popover content
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
      placeholder = "Select an option...",
      emptyMessage = "No options found.",
      iconMap = {},
      disabled = false,
      popoverContentClassName,
    },
    ref,
  ) => {
    const [open, setOpen] = React.useState(false);
    const [searchValue, setSearchValue] = React.useState("");

    const selectedOption = options.find((option) => option.id === value);

    const handleSelect = (currentValue: string) => {
      if (currentValue === value) {
        // If the clicked item is already selected, just close the popover.
        setOpen(false);
      } else {
        // Otherwise, select the new item.
        onValueChange(currentValue);
        setOpen(false);
        setSearchValue(""); // Clear search after selection
      }
    };

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
                {selectedOption.icon_name && iconMap[selectedOption.icon_name] && (
                  React.createElement(iconMap[selectedOption.icon_name], { className: "h-4 w-4" })
                )}
                {selectedOption.label}
              </div>
            ) : (
              placeholder
            )}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className={cn("w-[var(--radix-popover-trigger-width)] p-0 z-[9999]", popoverContentClassName)}>
          <Command>
            <CommandInput
              placeholder="Search..."
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList>
              <CommandEmpty>{emptyMessage}</CommandEmpty>
              <CommandGroup>
                {options.map((option) => {
                  const OptionIcon = option.icon_name ? (iconMap[option.icon_name] || Info) : null;
                  return (
                    <CommandItem
                      key={option.id}
                      value={option.label} // Search by label
                      onSelect={() => handleSelect(option.id)}
                      className="pointer-events-auto" // Ensure it's clickable
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === option.id ? "opacity-100" : "opacity-0",
                        )}
                      />
                      <div className="flex items-center gap-2">
                        {OptionIcon && React.createElement(OptionIcon, { className: "h-4 w-4" })}
                        {option.label}
                        {option.typeLabel && <span className="text-xs text-muted-foreground ml-1">({option.typeLabel})</span>}
                        {option.isNew && <span className="text-xs italic text-muted-foreground ml-1">(Nouveau)</span>}
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
  },
);
SearchableDropdown.displayName = "SearchableDropdown";

export default SearchableDropdown;