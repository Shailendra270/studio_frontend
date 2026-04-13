import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useAppSelector } from "../../store";
import { Button } from "@/components/ui/button";

const ProfileTab: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "test.user1@Studio.ai",
    fullName: "Kate Brann",
    password: "test1.Studio.user",
  });

  // Get user data from Redux store
  const { user } = useAppSelector((state) => state.auth);

  // Use actual user data if available, otherwise use default values
  const displayEmail = user?.email || formData.email;
  const displayName = user?.name || formData.fullName;
  const avatarUrl = user?.photo || user?.avatar;

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleChangePassword = () => {
    console.log("Change password clicked");
    // Implement password change logic here
  };

  const handleChangeAvatar = () => {
    console.log("Change avatar clicked");
    // Implement avatar change logic here
  };

  return (
    <div className="max-w-2xl">
      {/* Profile Picture Section */}
      <div className="flex items-center gap-6 mb-12">
        <div className="w-[100px] h-[100px] rounded-full overflow-hidden bg-[#D9D9D9] flex items-center justify-center">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-[#D9D9D9] rounded-full"></div>
          )}
        </div>
        <button
          onClick={handleChangeAvatar}
          className="text-white text-base font-medium underline hover:no-underline transition-all"
        >
          Change avatar
        </button>
      </div>

      {/* Form Fields */}
      <div className="space-y-8">
        {/* Email Field */}
        <div>
          {/* <label className="block text-white text-sm font-medium mb-2">
            Email
          </label> */}
          <div className="w-full max-w-[500px]">
            <input
              type="email"
              hidden={true}
              value={displayEmail}
              onChange={(e) => handleInputChange("email", e.target.value)}
              className="w-full h-[50px] px-4 bg-[#252525] border-none rounded-xl text-white text-base font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00BBFF]"
              readOnly
            />
          </div>
        </div>

        {/* Full Name Field */}
        <div>
          <label className="block text-white text-sm font-medium mb-2">
            Full name
          </label>
          <div className="w-full max-w-[500px]">
            <input
              type="text"
              value={displayName}
              onChange={(e) => handleInputChange("fullName", e.target.value)}
              className="w-full h-[50px] px-4 bg-[#252525] border-none rounded-xl text-white text-base font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00BBFF]"
            />
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProfileTab;
