import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import CloudIcon from "../../assets/svg/Sidebar_Icons/CloudIcon.svg";
import CloudIconFilled from "../../assets/svg/Sidebar_Icons/CloudIconFilled.svg";
import HighlightsIcon from "../../assets/svg/Sidebar_Icons/HighlightsIcon.svg";
import HighlightsIconFilled from "../../assets/svg/Sidebar_Icons/HighlightsIconFilled.svg";
import PublishedIconFilled from "../../assets/svg/Sidebar_Icons/PublishedIconFilled.svg";
import SettingsIcon from "../../assets/svg/Sidebar_Icons/SettingsIcon.svg";
import SettingsIconFilled from "../../assets/svg/Sidebar_Icons/SettingsIconFilled.svg";
import { sidebarItems, profileMenuItems } from "../../constants/DashboardPage";
import SVGIcon from "@/components/common/SVGIcon";
import AI_Icon from "../../assets/svg/AI_Icon.svg";
import { Home, Settings, LogOut, Folder, Building2, BarChart3 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../store";
import { clearAllUserData, logoutUser } from "../../store/slices/authSlice";
import { usePermissions } from "../../hooks/usePermissions";
import { toast } from "sonner";


// Helper function to get icon component
const getIconComponent = (iconType: string, isActive: boolean = false) => {
  switch (iconType) {
    case 'home':
      return isActive ?
        (props: any) => <Home {...props} fill="currentColor" /> :
        Home;
    case 'highlights':
      return (props: any) => <SVGIcon src={isActive ? HighlightsIconFilled : HighlightsIcon} className="w-[25px] h-[25px]" {...props} />;
    case 'published':
      return (props: any) => <SVGIcon src={isActive ? PublishedIconFilled : CloudIcon} className="w-[25px] h-[25px]" {...props} />;
    case 'assets':
      return isActive ?
        (props: any) => <Folder {...props} fill="currentColor" /> :
        Folder;
    case 'organizations':
      return isActive ?
        (props: any) => <Building2 {...props} fill="currentColor" /> :
        Building2;
    case 'monitoring':
      return isActive ?
        (props: any) => <BarChart3 {...props} fill="currentColor" /> :
        BarChart3;
    case 'settings':
      return (props: any) => <SVGIcon src={isActive ? SettingsIconFilled : SettingsIcon} className="w-[25px] h-[25px]" {...props} />;
    default:
      return Home;
  }
}

// Helper function to get user initials
const getUserInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
};

// Helper function to format user role
const formatRole = (role: string): string => {
  return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
};

const Sidebar: React.FC = () => {
  const [showProfilePopover, setShowProfilePopover] = useState(false);
  const profilePopoverRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();

  // Get user data from Redux
  const { user, isLoading } = useAppSelector((state) => state.auth);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profilePopoverRef.current &&
        !profilePopoverRef.current.contains(event.target as Node)
      ) {
        setShowProfilePopover(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    // Clear dashboard & media library state immediately so new login never sees old user's data
    sessionStorage.removeItem('dashboard_restore');
    sessionStorage.removeItem('media_library_state');
    sessionStorage.removeItem('navigating_away_from_dashboard');
    sessionStorage.removeItem('authError');

    try {
      // First, logout user via API
      await dispatch(logoutUser()).unwrap();
      // Then clear all user data including assets
      await dispatch(clearAllUserData()).unwrap();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error: any) {
      // Even if logout API fails, still clear all user data
      await dispatch(clearAllUserData()).unwrap();
      toast.error(error.message || 'Logout failed');
      // Force navigation even if logout API fails
      navigate('/login');
    }
    setShowProfilePopover(false);
  };

  // Fallback values if user data is not available
  const displayName = user?.name || 'User';
  const displayEmail = user?.email || 'user@Studio.ai';
  const displayRole = user?.role ? formatRole(user.role) : 'User';
  const userInitials = getUserInitials(displayName);
  const avatarUrl = user?.photo || user?.avatar;

  const orgLogoUrl = (user as { defaultOrganization?: { logoUrl?: string } } | null)?.defaultOrganization?.logoUrl;
  const { canView } = usePermissions();

  // Superadmin sees only Monitoring and Orgs; others see permission-based items
  const visibleSidebarItems = user?.role === "superadmin"
    ? sidebarItems.filter((item) => (item as { superadminOnly?: boolean }).superadminOnly === true)
    : sidebarItems.filter((item) => {
        if ('superadminOnly' in item && item.superadminOnly) return false;
        const module = 'permissionModule' in item ? item.permissionModule : null;
        return module ? canView(module) : true;
      });

  return (
    <div className="w-20 bg-[#000] flex flex-col h-full">
      {/* Logo: org logo when user has an org with logo, else system logo */}
      <div className="flex justify-center pt-5 pb-8">
        {orgLogoUrl ? (
          <img src={orgLogoUrl} alt="Organization" className="w-10 h-10 object-contain" />
        ) : (
          <SVGIcon src={AI_Icon} />
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-6">
        {visibleSidebarItems.map((item, index) => {
          const isActive = location.pathname === item.path ||
            (item.path === "/dashboard" && location.pathname === "/");
          const IconComponent = getIconComponent(item.iconType, isActive);
          return (
            <div
              key={index}
              className="flex flex-col items-center cursor-pointer group"
              onClick={() => {
                if (item.path !== "/dashboard") {
                  sessionStorage.setItem("navigating_away_from_dashboard", "1");
                  sessionStorage.removeItem("media_library_state");
                }
                navigate(item.path);
              }}
            >
              <div
                className={`p-3 rounded-lg transition-all duration-200 ${isActive
                    ? "shadow-[0_0_16px_rgba(0,238,255,0.25)]"
                    : "hover:bg-[#252525] hover:scale-105"
                  }`}
                style={isActive ? { background: "linear-gradient(135deg, #00EEFF 0%, #0051FF 100%)" } : undefined}
              >
                <IconComponent className="w-6 h-6 text-white" />
              </div>
              <span
                className={`text-xs mt-2 text-center transition-colors font-medium ${isActive ? "bg-clip-text" : "text-white"}`}
                style={isActive ? { backgroundImage: "linear-gradient(135deg, #00EEFF 0%, #0051FF 100%)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" } : undefined}
              >
                {item.label}
              </span>
            </div>
          );
        })}
      </nav>

      {/* User Profile */}
      <div
        className="p-4 flex flex-col items-center relative"
        ref={profilePopoverRef}
      >
        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex flex-col items-center gap-2 text-white hover:bg-[#252525] p-2 rounded-lg transition-colors disabled:opacity-50"
          disabled={isLoading}
        >
          {/* <button
          onClick={() => setShowProfilePopover(!showProfilePopover)}
          className="w-12 h-12 bg-gradient-to-r from-[#00BBFF] to-[#0051FF] rounded-full flex items-center justify-center mb-2 hover:bg-[#0F9488] transition-colors overflow-hidden"
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            <span className="text-white text-lg font-medium">
              {userInitials}
            </span>
          )}
        </button> */}
          {/* <span className="text-white text-xs text-center truncate w-full">
          {displayName}
        </span>
        <span className="text-gray-400 text-xs text-center">
          {displayRole}
        </span> */}
          <svg xmlns="http://www.w3.org/2000/svg" width="21" height="22" viewBox="0 0 21 22" fill="none">
            <path d="M3.3 17.6H5.5V19.8H18.7V2.2H5.5V4.4H3.3V1.1C3.3 0.808262 3.41589 0.528472 3.62218 0.322183C3.82847 0.115892 4.10826 0 4.4 0H19.8C20.0917 0 20.3715 0.115892 20.5778 0.322183C20.7841 0.528472 20.9 0.808262 20.9 1.1V20.9C20.9 21.1917 20.7841 21.4715 20.5778 21.6778C20.3715 21.8841 20.0917 22 19.8 22H4.4C4.10826 22 3.82847 21.8841 3.62218 21.6778C3.41589 21.4715 3.3 21.1917 3.3 20.9V17.6ZM5.5 9.9H13.2V12.1H5.5V15.4L0 11L5.5 6.6V9.9Z" fill="white" />
          </svg>
          <span className="text-white text-xs font-medium">
            {isLoading ? 'Logging out...' : 'Logout'}
          </span>
        </button>

        {/* Profile Popover */}
        {/* {showProfilePopover && (
          <div className="absolute bottom-0 left-full w-64 bg-[#2A2A2A] border border-[#373737] rounded-lg shadow-lg z-50">
            <div className="py-2">
              
              {profileMenuItems.map((item, index) => (
                <button
                  key={index}
                  className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-[#373737] transition-colors text-left"
                  onClick={() => {
                    console.log(`${item.label} clicked`);
                    setShowProfilePopover(false);
                  }}
                >
                  <item.icon className="w-5 h-5 text-gray-400" />
                  <span className="text-sm">{item.label}</span>
                </button>
              ))}

              
              <div className="border-t border-[#373737] my-2"></div>

             
              <div className="px-4 py-3 border-b border-[#373737]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-[#00BBFF] to-[#0051FF] rounded-full flex items-center justify-center overflow-hidden">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={displayName}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <span className="text-white text-sm font-medium">
                        {userInitials}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm font-medium truncate">
                      {displayName}
                    </div>
                    <div className="text-gray-400 text-xs truncate">
                      {displayEmail}
                    </div>
                    {user && (
                      <div className="text-gray-500 text-xs">
                        ID: {user.userId}
                      </div>
                    )}
                  </div>
                </div>
              </div>

             
              <button
                className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-[#373737] transition-colors text-left disabled:opacity-50"
                onClick={handleLogout}
                disabled={isLoading}
              >
                <LogOut className="w-5 h-5 text-gray-400" />
                <span className="text-sm">
                  {isLoading ? 'Logging out...' : 'Logout'}
                </span>
              </button>
            </div>
          </div>
        )} */}
      </div>
    </div>
  );
};

export default Sidebar;
