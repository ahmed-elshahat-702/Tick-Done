"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandInput,
  CommandEmpty,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "./scroll-area";
import { cn } from "@/lib/utils";

type Option = {
  label: string;
  value: string;
};

interface MultiSelectProps {
  options: Option[];
  selected: Option[];
  onChange: (selected: Option[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select options...",
  className,
  disabled,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);

  const toggleOption = (option: Option) => {
    const exists = selected.some((item) => item.value === option.value);
    const updated = exists
      ? selected.filter((item) => item.value !== option.value)
      : [...selected, option];

    onChange(updated);
  };

  const removeOption = (value: string) => {
    onChange(selected.filter((item) => item.value !== value));
  };

  return (
    <div className={cn("w-full", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between text-left whitespace-normal break-words"
            disabled={disabled}
          >
            <span className="break-words break-all line-clamp-1">
              {selected.length > 0
                ? selected.map((s) => s.label).join(", ")
                : placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="max-w-full">
          <Command className="max-w-full">
            <CommandInput placeholder="Search..." />
            <CommandEmpty>No options found.</CommandEmpty>
            <ScrollArea className="max-h-48">
              <CommandGroup>
                {options.map((option) => {
                  const isSelected = selected.some(
                    (item) => item.value === option.value
                  );
                  return (
                    <CommandItem
                      key={option.value}
                      onSelect={() => toggleOption(option)}
                      className="cursor-pointer break-words whitespace-normal"
                    >
                      <div className="flex w-full items-center justify-between break-all whitespace-normal">
                        <span className="break-all">{option.label}</span>
                        {isSelected && (
                          <Check className="ml-2 h-4 w-4 text-primary shrink-0" />
                        )}
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </ScrollArea>
          </Command>
        </PopoverContent>
      </Popover>

      <div className="mt-2 flex flex-wrap gap-2">
        {selected.map((item) => (
          <Badge
            key={item.value}
            variant="secondary"
            className="flex items-center gap-1 max-w-full break-words whitespace-normal px-2 py-1"
          >
            <span className="break-all">{item.label}</span>
            <button
              type="button"
              onClick={() => removeOption(item.value)}
              className="ml-1 text-sm hover:text-destructive"
              disabled={disabled}
            >
              ×
            </button>
          </Badge>
        ))}
      </div>
    </div>
  );
}
