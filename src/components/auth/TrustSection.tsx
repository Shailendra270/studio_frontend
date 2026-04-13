import React from 'react';

const TrustSection = () => {
  return (
    <>
      {/* Desktop Trust Section */}
      <div className="hidden lg:flex flex-col items-center justify-center w-full max-w-[500px] xl:max-w-[600px] 2xl:max-w-[750px]">
        {/* Gradient blur background for text */}
        <div className="relative">
          <div className="absolute inset-0 w-full h-[100px] lg:h-[120px] xl:h-[150px] 2xl:h-[172px] rounded-full opacity-40 bg-zentag-gradient blur-[93.75px]"></div>

          {/* Trust text */}
          <div className="relative z-10 text-center px-4 lg:px-6 xl:px-8 py-10 lg:py-12 xl:py-14 2xl:py-16">
            <h2 className="text-white text-lg lg:text-xl xl:text-2xl 2xl:text-3xl font-bold leading-[150%] max-w-[400px] lg:max-w-[500px] xl:max-w-[600px] mx-auto">
              Trusted by{" "}
              <span  className="bg-gradient-to-r from-blue-400 to-blue-700 bg-clip-text text-transparent">
                broadcasters
              </span>{" "}
              and{" "}
              <span  className="bg-gradient-to-r from-blue-400 to-blue-700 bg-clip-text text-transparent">
                sports clubs
              </span>{" "}
              worldwide
            </h2>
          </div>
        </div>
      </div>

      {/* Mobile Trust Section */}
      <div className="lg:hidden fixed bottom-16 sm:bottom-20 left-4 right-4">
         <div className="relative z-10 text-center px-4 lg:px-6 xl:px-8 py-10 lg:py-12 xl:py-14 2xl:py-16">
          <h2 className="text-white text-base sm:text-lg font-bold leading-[150%] max-w-[300px] sm:max-w-[400px] mx-auto">
            Trusted by{" "}
            <span  className="bg-gradient-to-r from-blue-400 to-blue-700 bg-clip-text text-transparent">
              broadcasters
            </span>{" "}
            and{" "}
            <span className="bg-gradient-to-r from-blue-400 to-blue-700 bg-clip-text text-transparent">
              sports clubs
            </span>{" "}
            worldwide
          </h2>
        </div>
      </div>
    </>
  );
};

export default TrustSection;