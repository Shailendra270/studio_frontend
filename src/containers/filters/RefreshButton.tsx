import React from "react";
import { Button } from "@/components/ui/button";

interface RefreshButtonProps {
  onClick: () => void;
  className?: string;
  text:boolean;
}

const RefreshButton: React.FC<RefreshButtonProps> = ({
  onClick,
  className = "",
  text=true,
  ...props
}) => {
  return (
    <Button
      variant="outline"
      onClick={onClick}
      className={`bg-[#252525] border-none text-white hover:bg-[#3A3B3E] h-11 px-4 ${className}`}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="mr-2"
      >
        <path
          d="M7 0C3.1339 0 0 3.1339 0 7C0 10.8661 3.1339 14 7 14C10.8661 14 14 10.8661 14 7H12.6C12.6 10.0926 10.0926 12.6 7 12.6C3.9074 12.6 1.4 10.0926 1.4 7C1.4 3.9074 3.9074 1.4 7 1.4C8.7248 1.4 10.2676 2.1798 11.2945 3.4055L9.8 4.9H14V0.7L12.2871 2.4122C11.004 0.9352 9.1112 0 7 0Z"
          fill="currentColor"
        />
      </svg>
      {text ? "Refresh":""}
    </Button>
  );
};

export default RefreshButton;
