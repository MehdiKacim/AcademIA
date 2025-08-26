import React, { useState, useEffect, useRef } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronDown, Check, Info } from "lucide-react"; // Info as default icon
import { cn } from "@/lib/utils";

interface SearchableDropdownOption {
  id: string;
  label: string;
  icon_name?: string; // Changed to icon_name to match NavItem
  level?: number; // For hierarchical display
  isNew?: boolean; // For "New" tag
}

interface SearchableDropdownProps {
  value: string | null;
  onValueChange: (value: string | null) => void;
  options: SearchableDropdownOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
  disabled?: boolean;
  iconMap: { [key: string]: React.ElementType }; // Pass the map from parent
}

const SearchableDropdown = ({
  value,
  onValueChange,
  options,
  placeholder = "Sélectionner une option...",
  searchPlaceholder = "Rechercher...",
  emptyMessage = "Aucune option trouvée.",
  className,
  triggerClassName,
  contentClassName,
  disabled,
  iconMap,
}: SearchableDropdownProps) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const selectedOption = options.find(option => option.id === value);

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", triggerClassName)}
          disabled={disabled}
        >
          {selectedOption ? (
            <div className="flex items-center gap-2">
              {selectedOption.icon_name && iconMap[selectedOption.icon_name] && React.createElement(iconMap[selectedOption.icon_name], { className: "h-4 w-4" })}
              {selectedOption.level && selectedOption.level > 0 && <span>{Array(selectedOption.level).fill('—').join('')}</span>}
              <span>{selectedOption.label}</span>
              {selectedOption.isNew && <span className="font-bold text-primary">(Nouveau)</span>}
            </div>
          ) : (
            placeholder
          )}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn("w-[var(--radix-popover-trigger-width)] p-0", contentClassName)}>
        <Input
          placeholder={searchPlaceholder}
          className="h-9 w-full border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <ScrollArea className="h-40">
          <div className="p-1">
            {filteredOptions.length === 0 ? (
              <div className="py-2 text-center text-sm text-muted-foreground">
                {emptyMessage}
              </div>
            ) : (
              filteredOptions.map(option => {
                const IconComponentToRender: React.ElementType = (option.icon_name && typeof option.icon_name === 'string' && iconMap[option.icon_name]) ? iconMap[option.icon_name] : Info;
                return (
                  <div
                    key={option.id}
                    className={cn(
                      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                      value === option.id && "bg-accent text-accent-foreground"
                    )}
                    onClick={() => {
                      onValueChange(option.id);
                      setOpen(false);
                      setSearchTerm('');
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === option.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex items-center gap-2">
                      {option.level && option.level > 0 && <span>{Array(option.level).fill('—').join('')}</span>}
                      {option.icon_name && <IconComponentToRender className="h-4 w-4" />}
                      <span>{option.label}</span>
                      {option.isNew && <span className="font-bold text-primary ml-1">(Nouveau)</span>}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default SearchableDropdown;