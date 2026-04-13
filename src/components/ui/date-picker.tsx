import { DatePicker as AntdDatePicker } from "antd";
import { Dayjs } from "dayjs";
import React, { useCallback } from "react";
import { cn } from "../lib/utils";
import { Label } from "@/components/ui/label";
import { Calendar } from "lucide-react";

// Import Ant Design styles
import "antd/dist/reset.css";

interface DatePickerProps {
  label?: string;
  placeholder?: string;
  value?: Dayjs | null;
  defaultValue?: Dayjs | null;
  disabled?: boolean;
  required?: boolean;
  showToday?: boolean;
  className?: string;
  datePickerClassName?: string;
  labelClassName?: string;
  format?: string;
  error?: string;
  onChange?: (date: Dayjs | null, dateString: string | string[]) => void;
}

export function DatePicker({
  label,
  placeholder = "Select date",
  value,
  defaultValue,
  disabled = false,
  required = false,
  showToday = false,
  className = "",
  datePickerClassName = "",
  labelClassName = "",
  format = "DD.MM.YY",
  error,
  onChange,
  ...props
}: DatePickerProps) {
  const handleChange = useCallback(
    (date: Dayjs | null, dateString: string | string[]) => {
      if (onChange) {
        onChange(date, dateString);
      }
    },
    [onChange],
  );

  return (
    <div className={cn("space-y-2", className)}>
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
        <AntdDatePicker
          value={value}
          defaultValue={defaultValue}
          onChange={handleChange}
          placeholder={placeholder}
          showToday={showToday}
          disabled={disabled}
          format={format}
          className={cn(
            "w-full bg-[#252525] border border-[#252525] text-white rounded-lg h-[42px] px-3",
            "hover:bg-[#373737] transition-colors",
            "[&_.ant-picker-input]:bg-transparent [&_.ant-picker-input]:text-white",
            "[&_.ant-picker-suffix]:text-white",
            disabled && "opacity-50 cursor-not-allowed",
            error && "border-red-500",
            datePickerClassName,
          )}
          classNames={{ popup: { root: "dark-date-picker" } }}
          suffixIcon={<Calendar className="w-4 h-4 text-white" />}
          {...props}
        />
      </div>

      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}

      <style>{`
        .dark-date-picker .ant-picker-dropdown {
          background: #2a2a2a !important;
          border: 1px solid #373737 !important;
          border-radius: 8px !important;
        }

        .dark-date-picker .ant-picker-panel {
          background: #2a2a2a !important;
          border: none !important;
        }

        .dark-date-picker .ant-picker-header {
          border-bottom: 1px solid #373737 !important;
        }

        .dark-date-picker .ant-picker-header-view button {
          color: white !important;
        }

        .dark-date-picker .ant-picker-prev-icon,
        .dark-date-picker .ant-picker-next-icon,
        .dark-date-picker .ant-picker-super-prev-icon,
        .dark-date-picker .ant-picker-super-next-icon {
          color: white !important;
        }

        .dark-date-picker .ant-picker-content th {
          color: #9ca3af !important;
        }

        .dark-date-picker .ant-picker-cell {
          color: white !important;
        }

        .dark-date-picker .ant-picker-cell:hover .ant-picker-cell-inner {
          background: #373737 !important;
        }

        .dark-date-picker .ant-picker-cell-selected .ant-picker-cell-inner {
          background: #00bbff !important;
          color: white !important;
        }

        .dark-date-picker .ant-picker-cell-today .ant-picker-cell-inner {
          border-color: #00bbff !important;
        }

        .dark-date-picker
          .ant-picker-cell-in-view.ant-picker-cell-range-start
          .ant-picker-cell-inner,
        .dark-date-picker
          .ant-picker-cell-in-view.ant-picker-cell-range-end
          .ant-picker-cell-inner {
          background: #00bbff !important;
        }

        .dark-date-picker .ant-picker-cell-disabled .ant-picker-cell-inner {
          color: #6b7280 !important;
        }

        .dark-date-picker .ant-picker-footer {
          border-top: 1px solid #373737 !important;
          background: #2a2a2a !important;
        }

        .dark-date-picker .ant-picker-footer a {
          color: #00bbff !important;
        }

        .dark-date-picker .ant-picker-footer a:hover {
          color: #0099cc !important;
        }

        /* Style the input field */
        .ant-picker {
          background: #252525 !important;
          border-color: #252525 !important;
          color: white !important;
        }

        .ant-picker:hover {
          background: #373737 !important;
          border-color: #373737 !important;
        }

        .ant-picker-focused {
          border-color: #00bbff !important;
          box-shadow: 0 0 0 2px rgba(0, 187, 255, 0.2) !important;
        }

        .ant-picker-input input {
          background: transparent !important;
          color: white !important;
        }

        .ant-picker-input input::placeholder {
          color: #9ca3af !important;
        }

        .ant-picker-suffix {
          color: white !important;
        }

        .ant-picker-clear {
          background: #373737 !important;
          color: white !important;
        }

        .ant-picker-disabled {
          background: #1f1f1f !important;
          border-color: #2a2a2a !important;
          color: #6b7280 !important;
        }
      `}</style>
    </div>
  );
}
