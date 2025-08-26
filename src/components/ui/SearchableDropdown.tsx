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
import { ScrollArea } from "./scroll-area";

interface SearchableDropdownOption {
  id: string;
  label: string;
  icon_name?: string;
  level: number; // For indentation in display
  isNew: boolean; // To indicate if it's a new generic item to be configured
}

interface SearchableDropdownProps {
  options: SearchableDropdownOption[];
  value: string | null;
  onValueChange: (value: string | null) => void;
  placeholder?: string;
  emptyMessage?: string;
  iconMap: { [key: string]: React.ElementType };
  className?: string;
  popoverContentClassName?: string;
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
      placeholder = "Sélectionner une option...",
      emptyMessage = "Aucune option trouvée.",
      iconMap,
      className,
      popoverContentClassName,
      ...props
    },
    ref,
  ) => {
    const [open, setOpen] = React.useState(false);
    const [searchValue, setSearchValue] = React.useState("");

    const selectedOption = options.find((option) => option.id === value);

    const filteredOptions = React.useMemo(() => {
      if (!searchValue) return options;
      const lowerCaseSearch = searchValue.toLowerCase();
      return options.filter((option) =>
        option.label.toLowerCase().includes(lowerCaseSearch),
      );
    }, [options, searchValue]);

    const IconComponent = selectedOption?.icon_name
      ? iconMap[selectedOption.icon_name]
      : null;

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn("w-full justify-between", className)}
            {...props}
          >
            <div className="flex items-center gap-2">
              {IconComponent && (
                <IconComponent className="h-4 w-4 shrink-0 opacity-50" />
              )}
              {selectedOption ? selectedOption.label : placeholder}
            </div>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className={cn(
            "w-[var(--radix-popover-trigger-width)] p-0 z-[999]",
            popoverContentClassName,
          )}
        >
          <Command className="z-50 backdrop-blur-lg bg-background/80">
            <CommandInput
              placeholder="Rechercher une option..."
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList className="max-h-[300px] overflow-y-auto overflow-x-hidden">
              <CommandEmpty>{emptyMessage}</CommandEmpty>
              <CommandGroup>
                <ScrollArea className="h-40">
                  {filteredOptions.map((option) => {
                    const OptionIcon = option.icon_name
                      ? iconMap[option.icon_name]
                      : null;
                    return (
                      <CommandItem
                        key={option.id}
                        value={option.label}
                        onSelect={() => {
                          onValueChange(option.id === value ? null : option.id);
                          setOpen(false);
                          setSearchValue(""); // Clear search after selection
                        }}
                        className="relative flex cursor-default items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50" // Removed select-none
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            value === option.id ? "opacity-100" : "opacity-0",
                          )}
                        />
                        <div className="flex items-center">
                          {OptionIcon && (
                            <OptionIcon className="mr-2 h-4 w-4" />
                          )}
                          {option.label}
                        </div>
                      </CommandItem>
                    );
                  })}
                </ScrollArea>
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