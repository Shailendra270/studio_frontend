import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import SocialProfileModal from "@/components/modals/SettingPageModals/SocialProfileModal";
import DeleteConfirmationModal from "@/components/modals/DeleteConfirmationModal";
import { socialApi } from "@/api/socialApi";
import { toast } from "sonner";
import { CircleFadingPlus } from "lucide-react";

const SocialAccountsTab: React.FC = () => {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<{ id: string; name: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await socialApi.getProfiles();
      // Map API response to UI model if needed, or use directly
      // Assuming backend returns array of profiles
      setProfiles(data.map((p: any) => ({
        id: p.profileKey, // Use profileKey as ID for all operations
        name: p.title,
        provider: p.provider || "Ayrshare",
        status: p.status || "active"
      })));
    } catch (err: any) {
      console.error("Failed to fetch profiles:", err);
      setError("Failed to load profiles");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMenu = (rowId: string) => {
    setMenuOpenId(prev => (prev === rowId ? null : rowId));
  };

  const handleAddProfile = () => {
    setEditingProfile(null);
    setIsModalOpen(true);
    setMenuOpenId(null);
  };

  const handleEdit = (id: string) => {
    const profile = profiles.find(p => p.id === id);
    if (profile) {
      setEditingProfile({ id: profile.id, name: profile.name });
      setIsModalOpen(true);
    }
    setMenuOpenId(null);
  };

  const handleDelete = (id: string, name: string) => {
    setProfileToDelete({ id, name });
    setIsDeleteModalOpen(true);
    setMenuOpenId(null);
  };

  const confirmDelete = async () => {
    if (!profileToDelete) return;
    
    const toastId = toast.loading("Deleting profile...");
    try {
      await socialApi.deleteProfile(profileToDelete.id);
      setProfiles(prev => prev.filter(p => p.id !== profileToDelete.id));
      toast.success("Profile deleted successfully", { id: toastId });
    } catch (err: any) {
      console.error("Failed to delete profile:", err);
      toast.error(err.message || "Failed to delete profile", { id: toastId });
    } finally {
      setIsDeleteModalOpen(false);
      setProfileToDelete(null);
    }
  };

  const handleLinkMedia = async (profileId: string) => {
    const toastId = toast.loading("Generating Media link...");
    try {
      const result = await socialApi.generateJWT(profileId);
      if (result && result.data?.url) {
        window.open(result?.data?.url, '_blank');
        toast.success("Social link opened in new tab", { id: toastId });
      } else {
        throw new Error("No URL returned from server");
      }
    } catch (err: any) {
      console.error("Failed to generate social link:", err);
      toast.error(err.message || "Failed to generate social link", { id: toastId });
    }
  };

  const handleModalSubmit = async (data: { profileTitle: string }) => {
    try {
      if (editingProfile) {
        // Update existing profile
        toast.loading("Updating profile...", { id: "update-profile" });
        await socialApi.updateProfile(editingProfile.id, data.profileTitle);
        setProfiles(prev => prev.map(p => 
          p.id === editingProfile.id ? { ...p, name: data.profileTitle } : p
        ));
        toast.success("Profile updated successfully", { id: "update-profile" });
      } else {
        // Add new profile
        toast.loading("Creating profile...", { id: "create-profile" });
        const newProfile = await socialApi.createProfile(data.profileTitle);
        setProfiles(prev => [{
          id: newProfile.profileKey,
          name: newProfile.title,
          provider: newProfile.provider || "Ayrshare",
          status: newProfile.status || "active"
        }, ...prev]);
        toast.success("Profile created successfully", { id: "create-profile" });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      console.error("Failed to save profile:", err);
      const action = editingProfile ? "update" : "create";
      toast.error(`Failed to ${action} profile: ${err?.error || err}`, { id: `${action}-profile` });
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-semibold text-white">Social Accounts</h2>
        <Button
          onClick={handleAddProfile}
          className="w-[200px] h-[48px] bg-[#1B1B1B] border-2 border-[#0BF] text-white text-base font-semibold rounded-[15px] hover:bg-[#252525] transition-colors"
        >
          Add New Profile
        </Button>
      </div>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      {/* Table Container */}
      <div className="bg-[#252525] rounded-xl overflow-visible border border-[#373737]">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-[#373737] text-gray-400 text-sm font-medium">
          <div className="col-span-4">Profile name</div>
          <div className="col-span-4">Provider</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-[#373737]">
          {isLoading ? (
            <div className="p-8 text-center text-gray-400">Loading profiles...</div>
          ) : profiles.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No profiles found. Create one to get started.</div>
          ) : (
            profiles.map((profile) => (
              <div
                key={profile.id}
                className="grid grid-cols-12 gap-4 px-6 py-4 items-center text-white text-sm hover:bg-[#2A2A2A] transition-colors"
              >
                <div className="col-span-4 font-semibold text-base">{profile.name}</div>
                <div className="col-span-4 font-medium">{profile.provider}</div>
                <div className="col-span-2">
                  <span className={`px-3 py-1.5 rounded text-xs font-bold tracking-wide uppercase inline-block ${
                    profile.status === 'active' 
                      ? 'bg-[#183426] text-[#22C55E]' 
                      : 'bg-gray-700 text-gray-300'
                  }`}>
                    {profile.status}
                  </span>
                </div>
                <div className="col-span-2 flex justify-end items-center gap-3 text-white">
                  {/* Add Button */}
                  <button
                    onClick={() => handleLinkMedia(profile.id)}
                    className="flex items-center justify-center text-white hover:text-gray-300 transition-colors" title="Link Media"
                  >
                    <CircleFadingPlus size={24} />
                  </button>
                  {/* Menu Button */}
                  <div className="col-span-1 flex justify-center relative">
                    <button
                      onClick={() => toggleMenu(profile.id)}
                      className="w-[30px] h-[24px] bg-black rounded-md flex items-center justify-center hover:bg-[#373737] transition-colors"
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="6" cy="12" r="2" fill="white" />
                        <circle cx="12" cy="12" r="2" fill="white" />
                        <circle cx="18" cy="12" r="2" fill="white" />
                      </svg>
                    </button>
                    {menuOpenId === profile.id && (
                      <div className="absolute right-0 top-8 bg-[#1B1B1B] border border-[#373737] rounded-md shadow-lg z-20 w-[75px]">
                        <button
                          className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-[#252525]"
                          onClick={() => handleEdit(profile.id)}
                        >
                          Edit
                        </button>
                        <button
                          className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-[#252525]"
                          onClick={() => handleDelete(profile.id, profile.name)}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <SocialProfileModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        initialData={editingProfile ? { profileTitle: editingProfile.name } : null}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onDelete={confirmDelete}
        itemName={profileToDelete?.name || "this profile"}
      />
    </div>
  );
};

export default SocialAccountsTab;
