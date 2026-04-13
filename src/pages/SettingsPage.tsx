import React, { useState, useEffect } from "react";
import Sidebar from "../layouts/dashboard/Sidebar";
import { usePermissions } from "@/hooks/usePermissions";
import ProfileTab from "../layouts/settingsPage/ProfileTab";
import CompetitionsTab from "../layouts/settingsPage/CompetitionsTab";
import SocialAccountsTab from "../layouts/settingsPage/SocialAccountsTab";
import TemplatesTab from "../layouts/settingsPage/TemplatesTab";
import ThirdPartyIntegrationsTab from "../layouts/settingsPage/ThirdPartyIntegrationsTab";
import WebhookTab from "../layouts/settingsPage/WebhookTab";
import StorageTab from "../layouts/settingsPage/StorageTab";
import PublishStorageTab from "../layouts/settingsPage/PublishStorageTab";
import EventsTab from "@/layouts/settingsPage/EventsTab";
import PlayersTab from "@/layouts/settingsPage/PlayersTab";
import SportsTab from "@/layouts/settingsPage/SportsTab";
import TeamsTab from "@/layouts/settingsPage/TeamsTab";
import UserManagementTab from "@/layouts/settingsPage/UserManagementTab";
import { useAppSelector } from "../store";
import { selectUser } from "../store/slices/authSlice";
import {
  UserRound,
  Trophy,
  Calendar,
  Users,
  Activity,
  LayoutTemplate,
  Plug,
  Webhook as WebhookIcon,
  HardDrive,
  UploadCloud,
} from "lucide-react";

interface SettingsNavigationItem {
  id: string;
  label: string;
  icon?: React.ElementType;
  active?: boolean;
  permissionModule?: "Settings" | "Competitions" | "Teams" | "Templates" | "Users";
}

const settingsNavigation: SettingsNavigationItem[] = [
  { id: "profile", label: "Profile", icon: UserRound, permissionModule: "Settings" },
  { id: "competitions", label: "Competitions", icon: Trophy, permissionModule: "Competitions" },
  { id: "events", label: "Events", icon: Calendar, permissionModule: "Settings" },
  { id: "players", label: "Players", icon: UserRound, permissionModule: "Settings" },
  { id: "teams", label: "Teams", icon: Users, permissionModule: "Teams" },
  { id: "sports", label: "Sports", icon: Activity, permissionModule: "Settings" },
  { id: "social-accounts", label: "Social accounts", icon: Users, permissionModule: "Settings" },
  { id: "templates", label: "Templates", icon: LayoutTemplate, permissionModule: "Templates" },
  { id: "third-party", label: "Third party integrations", icon: Plug, permissionModule: "Settings" },
  { id: "user-management", label: "User management", icon: Users, permissionModule: "Users" },
  { id: "webhook", label: "Webhook", icon: WebhookIcon, permissionModule: "Settings" },
  { id: "storage", label: "Storage", icon: HardDrive, permissionModule: "Settings" },
  { id: "publish-storage", label: "Publish storage", icon: UploadCloud, permissionModule: "Settings" },
];

const SettingsPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState("profile");
  const { canView } = usePermissions();
  const user = useAppSelector(selectUser);
  const isSuperadmin = user?.role === "superadmin";

  const visibleNavItems = settingsNavigation.filter((item) => {
    // Hide User management section for superadmin (they manage orgs externally)
    if (item.id === "user-management" && isSuperadmin) return false;
    return item.permissionModule ? canView(item.permissionModule) : true;
  });
  useEffect(() => {
    const isActiveVisible = visibleNavItems.some((item) => item.id === activeSection);
    if (!isActiveVisible && visibleNavItems.length > 0) {
      setActiveSection(visibleNavItems[0].id);
    }
  }, [visibleNavItems, activeSection]);

  const renderTabContent = () => {
    switch (activeSection) {
      case "profile":
        return <ProfileTab />;
      case "competitions":
        return <CompetitionsTab />;
      case "social-accounts":
        return <SocialAccountsTab />;
      case "events":
        return <EventsTab />;
      case "players":
        return <PlayersTab />;
        case "teams":
        return <TeamsTab />;
      case "sports":
        return <SportsTab />;
      case "templates":
        return <TemplatesTab />;
      case "third-party":
        return <ThirdPartyIntegrationsTab />;
      case "user-management":
        return <UserManagementTab />;
      case "webhook":
        return <WebhookTab />;
      case "storage":
        return <StorageTab />;
      case "publish-storage":
        return <PublishStorageTab />;
      default:
        return <ProfileTab />;
    }
  };

  return (
    <div className="flex h-screen bg-[#18191B] text-white overflow-x-auto">
      <Sidebar />
      
      <div className="flex-1 flex flex-col min-w-[900px]">
        {/* Header */}
        <div className="px-8 py-6">
          <h1 className="text-[28px] font-medium text-white font-montserrat">
            Settings
          </h1>
        </div>

        <div className="flex-1 flex h-full overflow-y-auto overflow-x-auto">
          {/* Settings Navigation Sidebar */}
          <div className="w-80 min-w-80 border-r border-[#252525] px-8 py-6">
            <div className="space-y-2">
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full px-4 py-3 rounded-lg text-base font-medium transition-colors flex items-center gap-3 ${
                      activeSection === item.id
                        ? "bg-[#292929] text-white"
                        : "text-white hover:bg-[#252525]"
                    }`}
                  >
                    {Icon && <Icon className="w-5 h-5" />}
                    <span className="truncate">{item.label}</span>
                    {activeSection === item.id && (
                      <svg
                        className="w-2 h-3 ml-auto"
                        viewBox="0 0 7 12"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M6.57143 5.75L0 11.5L0 0L6.57143 5.75Z" fill="white" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 px-8 py-6 min-w-[700px]">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
