"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
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
import { ColumnDef } from "@/lib/types";

interface ComboboxCellProps {
  column: ColumnDef;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function ComboboxCell({
  column,
  value,
  onChange,
  placeholder,
}: ComboboxCellProps) {
  const [open, setOpen] = React.useState(false);
  const [customValue, setCustomValue] = React.useState("");
  const options = column.options || [];
  const selectedOption = options.find((o) => o.value === value);
  const isCustomValue = value && !selectedOption;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        data-slot="popover-trigger"
        className={cn(
          "inline-flex items-center gap-2 whitespace-nowrap rounded-md transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 px-4 py-2 has-[>svg]:px-3 w-full justify-between text-sm h-9 bg-input border-border font-normal"
        )}
      >
        <span
          className={cn(
            "truncate",
            !value && "text-muted-foreground",
            isCustomValue && "italic"
          )}
        >
          {selectedOption?.label || value || placeholder || column.name}
        </span>
        <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-[--anchor-width] p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Type or select..."
            value={customValue}
            onValueChange={setCustomValue}
            onKeyDown={(e) => {
              if (e.key === "Enter" && customValue) {
                const match = options.find(
                  (o) =>
                    o.value === customValue ||
                    o.label.toLowerCase() === customValue.toLowerCase()
                );
                if (match) {
                  onChange(match.value);
                } else {
                  onChange(customValue);
                }
                setCustomValue("");
                setOpen(false);
              }
            }}
          />
          <CommandList>
            <CommandEmpty>
              <div className="p-3 text-sm text-muted-foreground">
                <p className="mb-2">No preset matches.</p>
                <p>
                  Press <kbd className="rounded border bg-muted px-1.5 py-0.5 text-xs font-medium">Enter</kbd> to use your typed value.
                </p>
              </div>
            </CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  keywords={[option.label]}
                  onSelect={(currentValue) => {
                    onChange(currentValue === value ? "" : currentValue);
                    setCustomValue("");
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
