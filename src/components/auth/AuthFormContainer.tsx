import React, { ReactNode } from 'react';
import ZentagLogo from './ZentagLogo';

interface AuthFormContainerProps {
  children: ReactNode;
  subtitle?: string;
}

const AuthFormContainer: React.FC<AuthFormContainerProps> = ({ 
  children, 
  subtitle = "Welcome to Studio AI Creative platform" 
}) => {
  return (
    <div className="w-full mx-auto max-w-[580px] lg:max-w-[580px] xl:max-w-[500px] h-auto bg-[#0C0C0C] rounded-[50px] p-6 sm:p-8 lg:p-10 xl:p-12 flex flex-col flex-shrink-0">
      <ZentagLogo />
      
      {/* Welcome text */}
      <p className="text-white text-center text-sm lg:text-base font-medium mb-6 sm:mb-8 lg:mb-10 xl:mb-8 leading-relaxed">
        {subtitle}
      </p>

      {/* Form content */}
      {children}
    </div>
  );
};

export default AuthFormContainer;