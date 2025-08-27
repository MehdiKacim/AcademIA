import React from 'react';
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface SimpleItemSelectorOption {
  id: string;
  label: string;
  icon_name?: string;
  description?: string;
  typeLabel?: string;
  isNew?: boolean;
  level?: number; // For indentation if needed
}

interface SimpleItemSelectorProps {
  options: SimpleItemSelectorOption[];
  value: string | null;
  onValueChange: (value: string | null) => void;
  placeholder?: string;
  emptyMessage?: string;
  iconMap: { [key: string]: React.ElementType };
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  disabled?: boolean;
  className?: string;
}

const SimpleItemSelector = React.forwardRef<HTMLDivElement, SimpleItemSelectorProps>(
  ({
    options,
    value,
    onValueChange,
    placeholder = "Sélectionner un élément...",
    emptyMessage = "Aucun élément trouvé.",
    iconMap,
    searchQuery,
    onSearchQueryChange,
    disabled = false,
    className,
  }, ref) => {
    const filteredOptions = options.filter(option =>
      option.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (option.description && option.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (option.typeLabel && option.typeLabel.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
      <div ref={ref} className={cn("space-y-2", className)}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            className="pl-10 rounded-android-tile"
            disabled={disabled}
          />
        </div>
        <ScrollArea className="h-64 w-full rounded-md border bg-background rounded-android-tile">
          <div className="p-2 space-y-2">
            {filteredOptions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">{emptyMessage}</p>
            ) : (
              filteredOptions.map(option => {
                const OptionIcon = option.icon_name ? (iconMap[option.icon_name] || Info) : null;
                return (
                  <Card
                    key={option.id}
                    className={cn(
                      "cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors rounded-android-tile",
                      value === option.id && "bg-primary text-primary-foreground hover:bg-primary/90",
                      disabled && "opacity-50 cursor-not-allowed"
                    )}
                    onClick={() => !disabled && onValueChange(option.id)}
                  >
                    <CardContent className="p-3 flex items-center gap-3">
                      {OptionIcon && React.createElement(OptionIcon, { className: cn("h-5 w-5", value === option.id ? "text-primary-foreground" : "text-primary") })}
                      <div className="flex-grow">
                        <p className={cn("font-medium", value === option.id ? "text-primary-foreground" : "text-foreground")}>
                          {option.label}
                          {option.typeLabel && <span className={cn("text-xs ml-1", value === option.id ? "text-primary-foreground/80" : "text-muted-foreground")}>({option.typeLabel})</span>}
                        </p>
                        {option.description && (
                          <p className={cn("text-sm line-clamp-1", value === option.id ? "text-primary-foreground/70" : "text-muted-foreground")}>
                            {option.description}
                          </p>
                        )}
                        {option.isNew && <span className={cn("text-xs italic ml-1", value === option.id ? "text-primary-foreground/60" : "text-muted-foreground")}> (Nouveau)</span>}
                      </div>
                      {value === option.id && <Check className="h-5 w-5 text-primary-foreground" />}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </ScrollArea>
      </div>
    );
  }
);

SimpleItemSelector.displayName = "SimpleItemSelector";

export default SimpleItemSelector;