import React, { useState } from "react";
import HelpDrawer from "./HelpDrawer";

const HelpButton: React.FC = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleHelpClick = () => {
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <div className="group relative">
          <button
            onClick={handleHelpClick}
            className="w-16 h-[42px] bg-white rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors shadow-lg"
            aria-label="Help"
          >
            <svg className="w-6 h-6" viewBox="0 0 23 22" fill="none">
              <path
                d="M5.02615 18.0513L0 22V1.12821C0 0.828987 0.118864 0.542023 0.330444 0.330444C0.542023 0.118864 0.828987 0 1.12821 0H21.4359C21.7351 0 22.0221 0.118864 22.2337 0.330444C22.4452 0.542023 22.5641 0.828987 22.5641 1.12821V16.9231C22.5641 17.2223 22.4452 17.5093 22.2337 17.7208C22.0221 17.9324 21.7351 18.0513 21.4359 18.0513H5.02615ZM10.1538 12.4103V14.6667H12.4103V12.4103H10.1538ZM7.40892 6.55826L9.62246 7.00164C9.68528 6.68736 9.83605 6.39738 10.0572 6.16543C10.2784 5.93349 10.5609 5.76913 10.8719 5.69146C11.1828 5.6138 11.5094 5.62603 11.8137 5.72674C12.118 5.82744 12.3874 6.01247 12.5906 6.26031C12.7938 6.50815 12.9225 6.80859 12.9616 7.1267C13.0007 7.4448 12.9487 7.76747 12.8116 8.05717C12.6746 8.34687 12.458 8.59169 12.1872 8.76314C11.9165 8.93459 11.6026 9.02562 11.2821 9.02564H10.1538V11.2821H11.2821C12.0298 11.2818 12.7621 11.0693 13.3938 10.6692C14.0255 10.2691 14.5306 9.69781 14.8503 9.02188C15.1701 8.34596 15.2913 7.59314 15.2 6.851C15.1086 6.10886 14.8085 5.40791 14.3344 4.82968C13.8603 4.25145 13.2317 3.81973 12.5219 3.58472C11.812 3.3497 11.0501 3.32107 10.3246 3.50215C9.59909 3.68323 8.93993 4.06658 8.42378 4.60759C7.90763 5.14861 7.5557 5.82506 7.40892 6.55826Z"
                fill="url(#paint0_linear)"
              />
              <defs>
                <linearGradient id="paint0_linear" x1="30.8" y1="11.1305" x2="7.7463" y2="-4.30979" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#00BBFF"/>
                  <stop offset="1" stopColor="#0051FF"/>
                </linearGradient>
              </defs>
            </svg>
          </button>

          {/* Tooltip */}
          <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-black text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
            Help!
            <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black"></div>
          </div>
        </div>
      </div>

      <HelpDrawer isOpen={isDrawerOpen} onClose={handleCloseDrawer} />
    </>
  );
};

export default HelpButton;
