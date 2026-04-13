import SocialIcons from './SocialIcons';
import { Link } from 'react-router-dom';

const AuthFooter = () => {
  return (
    <div className="absolute bottom-6 lg:bottom-8 left-0 right-0 px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
      <div className="relative w-full">
        {/* Copyright text - positioned per Figma (left:1010px on 1920px = ~52.6%) */}
        <div className="text-white text-sm lg:text-base font-medium text-center lg:text-left order-2 lg:order-1 lg:absolute lg:left-[52.6%] lg:transform lg:-translate-x">
          ©2025 Studio AI. All rights reserved
        </div>

        {/* Social icons positioned above and center-right - matching Figma left:1366px (71.1%) top:799px */}
        <div className="flex justify-center lg:justify-end order-1 lg:order-2 lg:absolute lg:left-[73.1%] lg:-top-20">
          <SocialIcons />
        </div>

        {/* Links positioned at bottom right - matching Figma left:1578px */}
        <div className="relative z-20 flex flex-col sm:flex-row gap-2 sm:gap-3 lg:gap-4 text-white text-sm lg:text-base text-center sm:text-left justify-center lg:justify-end order-3 lg:order-3 lg:absolute lg:right-0">
          <Link
            to="/terms-of-service"
            className="underline hover:text-[#00BBFF] transition-colors"
          >
            Terms of service
          </Link>
          <Link
            to="/privacy-policy"
            className="underline hover:text-[#00BBFF] transition-colors"
          >
            Privacy policy
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AuthFooter;