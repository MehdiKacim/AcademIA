import * as React from "react";
import { Check, ChevronDown, Search as SearchIcon, Info } from "lucide-react"; // Import Info icon

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command, // Keep Command for CommandItem and CommandList
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DropdownOption {
  id: string;
  label: string;
  icon_name?: string;
  level?: number; // For hierarchical display
  isNew?: boolean; // To indicate if it's a new generic item
}

interface SearchableDropdownProps {
  options: DropdownOption[];
  value: string | null;
  onValueChange: (value: string) => void;
  placeholder?: string;
  emptyMessage?: string;
  iconMap?: { [key: string]: React.ElementType };
  className?: string; // For styling the trigger
  popoverContentClassName?: string; // For styling the popover content
}

const SearchableDropdown = React.forwardRef<
  React.ElementRef<typeof PopoverTrigger>,
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
      ...props
    },
    ref,
  ) => {
    const [open, setOpen] = React.useState(false);

    const selectedOption = options.find((option) => option.id === value);

    const renderOptionLabel = (option: DropdownOption) => {
      const IconComponent = option.icon_name
        ? iconMap[option.icon_name] || Info
        : undefined;
      return (
        <div className="flex items-center">
          {option.level !== undefined && option.level > 0 && (
            <span style={{ marginLeft: `${option.level * 10}px` }}></span>
          )}
          {IconComponent && <IconComponent className="mr-2 h-4 w-4" />}
          {option.label}
          {option.isNew && (
            <span className="ml-2 text-xs text-muted-foreground italic">
              (Nouveau)
            </span>
          )}
        </div>
      );
    };

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild ref={ref} {...props}>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn("w-full justify-between", className)}
          >
            {selectedOption ? (
              renderOptionLabel(selectedOption)
            ) : (
              <span>{placeholder}</span>
            )}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className={cn("w-[var(--radix-popover-trigger-width)] p-0 z-[999]", popoverContentClassName)}>
          <Command>
            <CommandList>
              <CommandEmpty>{emptyMessage}</CommandEmpty>
              <CommandGroup>
                <ScrollArea className="h-40">
                  {options.map((option) => (
                    <CommandItem
                      key={option.id}
                      value={option.label} // Use label for search matching
                      onSelect={() => {
                        onValueChange(option.id);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === option.id ? "opacity-100" : "opacity-0",
                        )}
                      />
                      {renderOptionLabel(option)}
                    </CommandItem>
                  ))}
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