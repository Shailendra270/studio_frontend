import React from "react";

export interface GradientRailSliderProps {
  label?: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
  railWidth?: number;
  height?: number;
  pillWidth?: number;
  className?: string;
  labelMinWidth?: number;
}

const GradientRailSlider: React.FC<GradientRailSliderProps> = ({
  label,
  min,
  max,
  step = 1,
  value,
  onChange,
  formatValue = (v) => String(v),
  railWidth = 300,
  height = 40,
  pillWidth = 48,
  className = "",
  labelMinWidth = 50,
}) => {
  const positionPercent = (value - min) / (max - min);
  const leftCalc = `calc(${positionPercent * 100}% - ${pillWidth / 2}px)`;

  return (
    <div className={`flex items-center gap-3`} style={{ height }}>
      {label && (
        <span
          className="text-white font-bold text-xs font-montserrat whitespace-nowrap mr-2"
          style={{ minWidth: labelMinWidth }}
        >
          {label}
        </span>
      )}

      <div className="relative" style={{ width: railWidth, height }}>
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 rounded-full bg-white" />

        <div
          className="absolute"
          style={{
            left: leftCalc,
            top: 10,
            width: pillWidth,
            height: 24,
            zIndex: 2,
            pointerEvents: "none",
          }}
        >
          <div
            className="flex items-center justify-center font-bold text-white text-sm"
            style={{
              width: pillWidth,
              height: 24,
              borderRadius: 6,
              background:
                "linear-gradient(315deg,#00EEFF -21.71%,#0051FF 118.09%)",
              fontFamily:
                "Montserrat, -apple-system, Roboto, Helvetica, sans-serif",
              fontSize: 14,
              lineHeight: "24px",
              textAlign: "center",
            }}
          >
            {formatValue(value)}
          </div>
        </div>

        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="absolute left-0 top-0 w-full h-full opacity-0 cursor-pointer z-10"
          style={{ touchAction: "pan-x" }}
        />
      </div>
    </div>
  );
};

export default GradientRailSlider;