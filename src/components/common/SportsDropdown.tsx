import React, { useState, useRef, useEffect } from "react";
import SVGIcon from "@/components/common/SVGIcon";
import moreChevron from "@/assets/svg/more-chevron.svg";

export interface SportsDropdownOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface SportsDropdownProps {
  mode?: "dropdown" | "field";
  label?: string;
  icon?: React.ReactNode;
  options?: SportsDropdownOption[];
  value?: string | string[];
  onChange?: (value: string | string[]) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
  searchable?: boolean;
  multiple?: boolean;
  buttonLabel?: string;
  touched?: boolean;
  disabled?: boolean;
}

// Helper to get all sports options from SVGs
function getAllSportsOptions(): SportsDropdownOption[] {
  // @ts-ignore: Vite/webpack will replace import.meta.glob at build time
  const svgModules = import.meta.glob('@/assets/svg/Zentag_full_white_sport_icons/*.svg', { eager: true });
  return Object.entries(svgModules)
    .map(([path, mod]) => {
      if (!mod || typeof mod !== 'object' || !('default' in mod)) return null;
      const fileName = path.split('/').pop()?.replace('.svg', '') || '';
      const label = fileName
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
      const src = (mod as { default: string }).default || '';
      return {
        value: fileName,
        label,
        icon: <SVGIcon src={src} className="w-5 h-5" />,
      };
    })
    .filter(Boolean) as SportsDropdownOption[];
}

// Helper to get sport icon by name
function getSportIcon(sportName: string): React.ReactNode {
  const normalizedName = sportName.toLowerCase().replace(/\s+/g, '_');
  // Return a default icon for now - we'll handle dynamic imports differently
  return <div className="w-5 h-5 bg-gradient-to-r from-[#00BBFF] to-[#0051FF] rounded" />;
}

// --- Dynamic SVG mapping utility ---
function getSportIconPath(sportName: string): string | null {
  // @ts-ignore: Vite/webpack will replace import.meta.glob at build time
  const svgModules = import.meta.glob('@/assets/svg/Zentag_full_white_sport_icons/*.svg', { eager: true });

  // Normalize sport name for matching
  const normalizedName = sportName.toLowerCase().replace(/\s+/g, '_');

  // Find matching SVG file
  for (const [path, mod] of Object.entries(svgModules)) {
    if (!mod || typeof mod !== 'object' || !('default' in mod)) continue;

    const fileName = path.split('/').pop()?.replace('.svg', '') || '';
    if (fileName === normalizedName) {
      return (mod as { default: string }).default;
    }
  }

  return null;
}

function normalizeSportOption(opt: any): SportsDropdownOption | null {
  // Accepts {name, icon}, {label, value, icon}, or just a string
  if (!opt) return null;

  if (typeof opt === 'string') {
    const iconPath = getSportIconPath(opt);
    return {
      value: opt.toLowerCase().replace(/\s+/g, '_'),
      label: opt.charAt(0).toUpperCase() + opt.slice(1),
      icon: iconPath ? <SVGIcon src={iconPath} className="w-5 h-5" /> : undefined,
    };
  }

  // If shape is {name, icon}
  if ('name' in opt) {
    const iconPath = opt.icon || getSportIconPath(opt.name);
    return {
      value: String(opt.name).toLowerCase().replace(/\s+/g, '_'),
      label: opt.name,
      icon: iconPath ? <SVGIcon src={iconPath} className="w-5 h-5" /> : undefined,
    };
  }

  // If shape is {label, value, icon}
  if ('label' in opt && 'value' in opt) {
    const iconPath = opt.icon || getSportIconPath(opt.label);
    return {
      value: String(opt.value),
      label: String(opt.label),
      icon: iconPath ? <SVGIcon src={iconPath} className="w-5 h-5" /> : undefined,
    };
  }

  return null;
}

const SportsDropdown: React.FC<SportsDropdownProps> = ({
  mode = "dropdown",
  label,
  icon,
  options,
  value,
  onChange,
  error,
  required,
  placeholder = "Select sport",
  className = "",
  searchable = true,
  multiple = false,
  buttonLabel = "Sports",
  touched,
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const btnRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Normalize and filter options
  const normalizedOptions: SportsDropdownOption[] = (options && options.length > 0
    ? options.map(normalizeSportOption)
    : getAllSportsOptions()
  ).filter(Boolean) as SportsDropdownOption[];

  // Filter options by search (guard against missing label)
  const filteredOptions = normalizedOptions.filter(opt =>
    (opt.label || '').toLowerCase().includes(search.toLowerCase())
  );

  // Handle multi-select values
  const selectedValues = Array.isArray(value) ? value : value ? [value] : [];
  const selectedOptions = normalizedOptions.filter(opt => selectedValues.includes(opt.value));

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        listRef.current &&
        !listRef.current.contains(event.target as Node) &&
        btnRef.current &&
        !btnRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleOptionClick = (optionValue: string) => {
    if (disabled) return;
    if (multiple) {
      const newValues = selectedValues.includes(optionValue)
        ? selectedValues.filter(v => v !== optionValue)
        : [...selectedValues, optionValue];
      if (onChange) onChange(newValues);
    } else {
      if (onChange) onChange(optionValue);
      setOpen(false);
    }
  };

  // Dropdown mode (button style)
  if (mode === "dropdown") {
    return (
      <div className={`relative flex items-center ${className}`} style={{ height: "40px" }}>
        <button
          ref={btnRef}
          disabled={disabled}
          onClick={() => !disabled && setOpen((o) => !o)}
          className={`flex items-center gap-1 text-white bg-transparent border-none outline-none px-2 py-1 text-lg font-medium ${disabled ? "opacity-50 cursor-not-allowed" : "hover:text-gray-300"}`}
          style={{ minWidth: 64, alignItems: "center", height: "32px", paddingTop:0 }}
        >
          <span className="flex items-center mb-2 text-base">{buttonLabel}</span>
          <span
            className={`ml-1 mb-2 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            style={{ display: "inline-block", verticalAlign: "middle" }}
          >
            <SVGIcon src={moreChevron} className="w-4 h-4" />
          </span>
        </button>
        {open && (
          <div
            ref={listRef}
            className="absolute top-full left-0 mt-1 w-64 bg-[#252525] border border-[#373737] rounded-xl shadow-lg z-50"
          >
            {searchable && (
              <div className="p-2 border-b border-[#373737]">
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search sports..."
                  className="w-full px-3 py-2 rounded bg-[#373737] text-white placeholder-gray-400 border-none outline-none"
                  autoFocus
                />
              </div>
            )}
            <div className="max-h-80 overflow-y-auto p-2 flex flex-col gap-1">
              {filteredOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleOptionClick(opt.value)}
                  className={`flex items-center gap-3 px-3 py-2 text-white hover:bg-[#434343] rounded transition-colors text-left ${selectedValues.includes(opt.value) ? "bg-[#434343]" : ""
                    }`}
                >
                  <div className="w-5 h-5 flex-shrink-0">{opt.icon}</div>
                  <span className="text-base flex-1">{opt.label}</span>
                  {selectedValues.includes(opt.value) && (
                    <div className="w-4 h-4 bg-gradient-to-r from-[#00BBFF] to-[#0051FF] rounded flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded" />
                    </div>
                  )}
                </button>
              ))}
              {filteredOptions.length === 0 && (
                <div className="text-gray-400 text-center py-4">No sports found</div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Field mode (form field style)
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-white text-sm font-medium mb-2">
          {/* {icon && <span className="inline-block align-middle mr-2">{icon}</span>} */}
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <button
          ref={btnRef}
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setOpen((o) => !o)}
          className={`w-full flex items-center justify-between bg-[#252525] border border-[#0BF] text-white rounded-lg h-[42px] px-3 transition-colors text-left ${disabled ? "opacity-60 cursor-not-allowed" : "hover:bg-[#373737]"} ${error && touched ? "border-red-500" : ""}`}
        >
          <span className="flex items-center gap-2">
            {selectedOptions.length > 0 ? (
              <>
                {selectedOptions[0].icon}
                <span>{selectedOptions[0].label}</span>
                {selectedOptions.length > 1 && (
                  <span className="text-gray-400 text-sm">+{selectedOptions.length - 1} more</span>
                )}
              </>
            ) : (
              <span className="text-gray-400">{icon && <span className="inline-block align-middle mr-2 mb-0.5">{icon}</span>}
                {placeholder}</span>
            )}
          </span>
          <SVGIcon src={moreChevron} className={`w-4 h-4 ml-2 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </button>
        {open && (
          <div
            ref={listRef}
            className="absolute top-full left-0 mt-1 w-full bg-[#252525] border border-[#373737] rounded-xl shadow-lg z-50"
          >
            {searchable && (
              <div className="p-2 border-b border-[#373737]">
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search sports..."
                  className="w-full px-3 py-2 rounded bg-[#373737] text-white placeholder-gray-400 border-none outline-none"
                  autoFocus
                />
              </div>
            )}
            <div className="max-h-80 overflow-y-auto p-2 flex flex-col gap-1">
              {filteredOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleOptionClick(opt.value)}
                  className={`flex items-center gap-3 px-3 py-2 text-white hover:bg-[#434343] rounded transition-colors text-left ${selectedValues.includes(opt.value) ? "bg-[#434343]" : ""
                    }`}
                >
                  <div className="w-5 h-5 flex-shrink-0">{opt.icon}</div>
                  <span className="text-base flex-1">{opt.label}</span>
                  {selectedValues.includes(opt.value) && (
                    <div className="w-4 h-4 bg-gradient-to-r from-[#00BBFF] to-[#0051FF] rounded flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded" />
                    </div>
                  )}
                </button>
              ))}
              {filteredOptions.length === 0 && (
                <div className="text-gray-400 text-center py-4">No sports found</div>
              )}
            </div>
          </div>
        )}
      </div>
      {error && touched && (
        <div className="text-red-500 text-sm mt-1">{error}</div>
      )}
    </div>
  );
};

export default SportsDropdown; 
