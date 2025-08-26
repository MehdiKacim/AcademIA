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
  level?: number; // For indentation in hierarchical lists
  isNew?: boolean; // To indicate if it's a new generic item to be configured
}

interface SearchableDropdownProps {
  value: string | null;
  onValueChange: (value: string | null) => void;
  options: SearchableDropdownOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
  popoverContentClassName?: string; // Allow custom class for PopoverContent
  iconMap?: { [key: string]: React.ElementType }; // Map icon_name to Lucide React components
  align?: "start" | "center" | "end";
  sideOffset?: number;
}

const SearchableDropdown = React.forwardRef<
  HTMLButtonElement,
  SearchableDropdownProps
>(
  (
    {
      value,
      onValueChange,
      options,
      placeholder = "Sélectionner une option...",
      searchPlaceholder = "Rechercher...",
      emptyMessage = "Aucune option trouvée.",
      className,
      popoverContentClassName,
      iconMap = {},
      align = "center",
      sideOffset = 4,
      ...props
    },
    ref,
  ) => {
    const [open, setOpen] = React.useState(false);

    const selectedOption = options.find((option) => option.id === value);

    const IconComponent = selectedOption?.icon_name
      ? iconMap[selectedOption.icon_name]
      : undefined;

    const IconComponentToRender = (iconName?: string) => {
      if (!iconName) return null;
      const Component = iconMap[iconName];
      return Component ? <Component className="h-4 w-4" /> : null;
    };

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
              {IconComponent && <IconComponent className="h-4 w-4" />}
              {selectedOption ? (
                <span className="truncate">{selectedOption.label}</span>
              ) : (
                <span className="text-muted-foreground">{placeholder}</span>
              )}
            </div>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className={cn(
            "z-50 rounded-md border text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 backdrop-blur-lg bg-background/80 w-[var(--radix-popover-trigger-width)] p-0",
            popoverContentClassName,
            "min-w-[200px]"
          )}
          align={align}
          sideOffset={sideOffset}
        >
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList>
              <ScrollArea className="h-40">
                {options.length === 0 ? (
                  <CommandEmpty className="py-2 text-center text-muted-foreground">
                    {emptyMessage}
                  </CommandEmpty>
                ) : (
                  <CommandGroup>
                    {options.map((option) => {
                      return (
                        <CommandItem
                          key={option.id}
                          value={option.label}
                          onSelect={() => {
                            console.log(`[SearchableDropdown] Clicked option: ${option.label} (ID: ${option.id})`);
                            onValueChange(option.id === value ? null : option.id);
                            setOpen(false);
                          }}
                          style={{ paddingLeft: `${(option.level || 0) * 16 + 8}px`, pointerEvents: 'auto' }} // Added pointerEvents: 'auto'
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              value === option.id ? "opacity-100" : "opacity-0",
                            )}
                          />
                          <div className="flex items-center gap-2">
                            {IconComponentToRender(option.icon_name)}
                            <span>{option.label}</span>
                            {option.isNew && (
                              <span className="font-bold text-primary ml-1">
                                (Nouveau)
                              </span>
                            )}
                          </div>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                )}
              </ScrollArea>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  },
);

SearchableDropdown.displayName = "SearchableDropdown";

export default SearchableDropdown;