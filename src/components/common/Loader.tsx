import React from 'react';
import AI_Icon from '../../assets/svg/AI_Icon.svg';
import SVGIcon from "../../components/common/SVGIcon";

interface LoaderProps {
  isVisible: boolean;
  message?: string;
}

const Loader: React.FC<LoaderProps> = ({ isVisible, message = "Creating highlight, please wait..." }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90">
  <div className="bg-black bg-opacity-90 rounded-[50px] border-2 border-[#373737] px-4 py-4 flex flex-col items-center justify-between min-w-[450px]">
    {/* AI Logo */}
    <div className="w-16 h-16 flex items-center justify-center">
      <SVGIcon src={AI_Icon} />
    </div>

    {/* Loading Message */}
    <p className="text-white text-lg font-medium text-center">{message}</p>

    {/* Loading Animation */}
    <div className="flex space-x-1">
      <div className="w-2 h-2 bg-[#00BBFF] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
      <div className="w-2 h-2 bg-[#00BBFF] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
      <div className="w-2 h-2 bg-[#00BBFF] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
    </div>
  </div>
</div>

  );
};

export default Loader;