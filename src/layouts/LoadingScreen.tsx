import React from "react";
import SVGIcon from "@/components/common/SVGIcon";
import zentagAIIcon from "@/assets/svg/zentagAI_Icon.svg";
import ZentagLogo from "@/components/auth/ZentagLogo";

interface LoadingScreenProps {
  className?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ className = "" }) => {
  return (
    <div
      className={`fixed inset-0 flex flex-col items-center justify-center min-h-screen ${className}`}
      style={{ backgroundColor: "#18191B" }}
    >
      {/* Logo with subtle pulse animation */}
      <div className="flex flex-col items-center space-y-6 animate-pulse">
        <div className="w-auto h-auto max-w-xs sm:max-w-sm md:max-w-md">
          <ZentagLogo className="w-full h-auto" />
        </div>

        {/* Loading text */}
        <div className="text-center">
          <p className="text-white text-sm font-medium tracking-wide">
            Loading, please wait...
          </p>
        </div>
      </div>

      {/* Subtle loading dots animation */}
      <div className="flex space-x-1 mt-8">
        <div
          className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
          style={{ animationDelay: "0ms" }}
        ></div>
        <div
          className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
          style={{ animationDelay: "150ms" }}
        ></div>
        <div
          className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
          style={{ animationDelay: "300ms" }}
        ></div>
      </div>
    </div>
  );
};

export default LoadingScreen;