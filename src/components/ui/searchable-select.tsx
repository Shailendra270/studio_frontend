import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { ChevronDown, Search, X } from "lucide-react";
import { cn } from "../lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}

interface SearchableSelectProps {
  label?: string;
  placeholder?: string;
  options: SelectOption[];
  value?: string | string[];
  defaultValue?: string | string[];
  multiple?: boolean;
  searchable?: boolean;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
  labelClassName?: string;
  error?: string;
  onChange?: (value: string | string[]) => void;
  onSearch?: (searchTerm: string) => void;
}

export function SearchableSelect({
  label,
  placeholder = "Select option(s)",
  options = [],
  value,
  defaultValue,
  multiple = false,
  searchable = false,
  disabled = false,
  required = false,
  className = "",
  triggerClassName = "",
  contentClassName = "",
  labelClassName = "",
  error,
  onChange,
  onSearch,
}: SearchableSelectProps) {
  const [selectedValues, setSelectedValues] = useState<string[]>(
    multiple
      ? (value as string[]) || (defaultValue as string[]) || []
      : value || defaultValue
        ? [(value || defaultValue) as string]
        : [],
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (value !== undefined) {
      setSelectedValues(
        multiple ? (value as string[]) || [] : value ? [value as string] : [],
      );
    }
  }, [value, multiple]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;
    return options.filter((option) =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [options, searchTerm]);

  const handleOptionClick = useCallback(
    (optionValue: string) => {
      let newValues: string[];

      if (multiple) {
        if (selectedValues.includes(optionValue)) {
          newValues = selectedValues.filter((v) => v !== optionValue);
        } else {
          newValues = [...selectedValues, optionValue];
        }
      } else {
        newValues = selectedValues.includes(optionValue) ? [] : [optionValue];
        setIsOpen(false);
      }

      setSelectedValues(newValues);
      onChange?.(multiple ? newValues : newValues[0] || "");

      if (searchable) {
        setSearchTerm("");
      }
    },
    [selectedValues, multiple, onChange, searchable],
  );

  const handleRemoveValue = useCallback(
    (valueToRemove: string) => {
      const newValues = selectedValues.filter((v) => v !== valueToRemove);
      setSelectedValues(newValues);
      onChange?.(multiple ? newValues : newValues[0] || "");
    },
    [selectedValues, multiple, onChange],
  );

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newSearchTerm = e.target.value;
      setSearchTerm(newSearchTerm);
      onSearch?.(newSearchTerm);
    },
    [onSearch],
  );

  const getDisplayValue = () => {
    if (selectedValues.length === 0) {
      return "";
    }

    if (multiple) {
      return "";
    }

    const selectedOption = options.find(
      (opt) => opt.value === selectedValues[0],
    );
    return selectedOption?.label || "";
  };

  const getSelectedOptions = () => {
    return selectedValues
      .map((value) => options.find((opt) => opt.value === value))
      .filter(Boolean) as SelectOption[];
  };

  return (
    <div className={cn("space-y-2 relative", className)}>
      {label && (
        <Label
          className={cn(
            "text-white text-sm font-medium",
            required && "after:content-['*'] after:text-red-500 after:ml-1",
            labelClassName,
          )}
        >
          {label}
        </Label>
      )}

      <div className="relative">
        <button
          ref={triggerRef}
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={cn(
            "w-full bg-[#252525] border border-[#252525] text-white rounded-lg min-h-[42px] h-auto px-3 flex items-center justify-between hover:bg-[#373737] transition-colors text-left overflow-hidden",
            disabled && "opacity-50 cursor-not-allowed",
            error && "border-red-500",
            isOpen && "border-[#00BBFF]",
            triggerClassName,
          )}
        >
          <div className="flex-1 min-w-0 flex items-start gap-2">
            {multiple && selectedValues.length > 0 && (
              <div className="flex flex-wrap gap-1 w-full max-h-32 overflow-y-auto pr-2">
                {getSelectedOptions().map((option) => (
                  <span
                    key={option.value}
                    className="inline-flex items-center gap-1 bg-[#373737] text-white text-xs px-2 py-1 rounded"
                  >
                    {option.icon}
                    <span className="truncate max-w-[100px]">
                      {option.label}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveValue(option.value);
                      }}
                      className="hover:text-red-400 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            {(!multiple || selectedValues.length === 0) && (
              <span
                className={cn(
                  "block truncate",
                  !getDisplayValue() && "text-gray-400",
                )}
              >
                {getDisplayValue() || placeholder}
              </span>
            )}
          </div>
          <ChevronDown
            className={cn(
              "w-4 h-4 text-gray-400 flex-shrink-0 transition-transform",
              isOpen && "rotate-180",
            )}
          />
        </button>

        {isOpen && (
          <div
            ref={dropdownRef}
            className={cn(
              "absolute top-full left-0 right-0 mt-1 bg-[#252525] border border-[#373737] rounded-lg shadow-lg z-50",
              contentClassName,
            )}
          >
            <div className="max-h-60 overflow-y-auto">
              {searchable && (
                <div className="p-2 border-b border-[#373737]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      value={searchTerm}
                      onChange={handleSearchChange}
                      placeholder="Search options..."
                      className="pl-10 bg-[#373737] border-[#373737] text-white placeholder-gray-400 h-8"
                      autoFocus
                    />
                  </div>
                </div>
              )}

              <div className="py-1">
                {filteredOptions.length === 0 ? (
                  <div className="px-3 py-2 text-gray-400 text-sm">
                    No options found
                  </div>
                ) : (
                  filteredOptions.map((option) => {
                    const isSelected = selectedValues.includes(option.value);
                    return (
                      <div
                        key={option.value}
                        onClick={() => {
                          if (!option.disabled) {
                            handleOptionClick(option.value);
                          }
                        }}
                        className={cn(
                          "w-full px-3 py-2 text-left text-sm transition-colors flex items-center gap-2 cursor-pointer",
                          isSelected
                            ? "bg-[#00BBFF] text-white"
                            : "hover:bg-[#373737] text-white",
                          option.disabled && "opacity-50 cursor-not-allowed",
                        )}
                      >
                        {option.icon}
                        <span className="truncate">{option.label}</span>
                        {isSelected && multiple && (
                          <X className="w-4 h-4 ml-auto flex-shrink-0" />
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}
