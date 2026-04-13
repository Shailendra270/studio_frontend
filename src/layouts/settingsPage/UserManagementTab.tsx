import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Users, Shield, UserPlus, Clock, Trash2, Edit2, Check } from "lucide-react";
import { useAppSelector } from "@/store";
import { selectUser } from "@/store/slices/authSlice";
import { usePermissions } from "@/hooks/usePermissions";
import {
  getMembers,
  addMember,
  removeMember,
  updateMember,
  getRoles,
  createRole,
  updateRole,
  type OrgRole,
} from "@/api/organizationsApi";
import AddUserModal from "@/layouts/organizations/AddUserModal";
import CreateEditRoleModal from "@/layouts/organizations/CreateEditRoleModal";
import RolePermissionMatrix, { type PermissionMap } from "@/layouts/organizations/RolePermissionMatrix";
import { toast } from "sonner";
import DeleteConfirmationModal from "@/components/modals/DeleteConfirmationModal";

interface OrgUserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  roleId?: string;
  status: "Active" | "Inactive";
  lastLogin: string;
  avatar?: string;
  isSoftDeletedUser?: boolean;
}

const StatusBadge: React.FC<{ status: "Active" | "Suspended" | "Inactive" }> = ({ status }) => {
  const styles: Record<string, string> = {
    Active: "bg-green-500/10 text-green-400 border-green-500/30",
    Suspended: "bg-red-500/10 text-red-400 border-red-500/30",
    Inactive: "bg-gray-500/10 text-gray-400 border-gray-500/30",
  };
  const dots: Record<string, string> = {
    Active: "bg-green-400 animate-pulse",
    Suspended: "bg-red-400",
    Inactive: "bg-gray-500",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${styles[status]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dots[status]}`} />
      {status}
    </span>
  );
};

type InnerTab = "users" | "roles";

const UserManagementTab: React.FC = () => {
  const user = useAppSelector(selectUser) as (ReturnType<typeof selectUser> & {
    defaultOrganization?: { id?: string; _id?: string };
  }) | null;
  const orgId = user?.defaultOrganization?._id || user?.defaultOrganization?.id;
  const { canView, canCreate, canEdit, canDelete } = usePermissions();

  const [activeTab, setActiveTab] = useState<InnerTab>("users");
  const [roles, setRoles] = useState<OrgRole[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);

  const canViewUsers = canView("Users");
  const canViewRoles = canView("Roles & Permissions");

  const canCreateUsers = canCreate("Users");
  const canEditUsers = canEdit("Users");
  const canDeleteUsers = canDelete("Users");

  const canCreateRoles = canCreate("Roles & Permissions");
  const canEditRoles = canEdit("Roles & Permissions");

  const effectiveTab: InnerTab | null = useMemo(() => {
    if (activeTab === "users" && canViewUsers) return "users";
    if (activeTab === "roles" && canViewRoles) return "roles";
    if (canViewUsers) return "users";
    if (canViewRoles) return "roles";
    return null;
  }, [activeTab, canViewUsers, canViewRoles]);

  const fetchRoles = useCallback(async () => {
    if (!orgId || !canViewRoles) return;
    setRolesLoading(true);
    try {
      const list = await getRoles(String(orgId));
      setRoles(list);
    } catch (e: any) {
      toast.error(e?.message || "Failed to load roles");
      setRoles([]);
    } finally {
      setRolesLoading(false);
    }
  }, [orgId, canViewRoles]);

  useEffect(() => {
    if (orgId && canViewRoles) {
      fetchRoles();
    }
  }, [orgId, canViewRoles, fetchRoles]);

  if (!orgId) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-sm text-gray-400">
          Your account is not linked to an organization. User management is only available within an organization.
        </p>
      </div>
    );
  }

  if (!effectiveTab) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-sm text-gray-400">
          You don&apos;t have permission to view users or roles. Contact your organization admin.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white font-montserrat">User management</h2>
          <p className="text-xs text-gray-500 mt-1">
            Manage organization users, access levels, and role-based permissions.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#111113] border border-[#252525] text-xs text-gray-400">
          <Shield className="w-3.5 h-3.5 text-[#00EEFF]" />
          <span>Org-scoped access control</span>
        </div>
      </div>

      <div className="flex items-center gap-2 border-b border-[#252525] pb-2">
        {canViewUsers && (
          <div
            className="rounded-lg"
            style={
              effectiveTab === "users"
                ? { padding: "1px", background: "linear-gradient(135deg, #00EEFF, #0051FF)" }
                : {}
            }
          >
            <button
              type="button"
              onClick={() => setActiveTab("users")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                effectiveTab === "users"
                  ? "bg-[#1A1B1D] text-white"
                  : "text-gray-500 hover:text-white hover:bg-[#1E1E20]"
              }`}
            >
              <Users className="w-4 h-4" />
              Users
            </button>
          </div>
        )}
        {canViewRoles && (
          <div
            className="rounded-lg"
            style={
              effectiveTab === "roles"
                ? { padding: "1px", background: "linear-gradient(135deg, #00EEFF, #0051FF)" }
                : {}
            }
          >
            <button
              type="button"
              onClick={() => setActiveTab("roles")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                effectiveTab === "roles"
                  ? "bg-[#1A1B1D] text-white"
                  : "text-gray-500 hover:text-white hover:bg-[#1E1E20]"
              }`}
            >
              <Shield className="w-4 h-4" />
              Roles &amp; Permissions
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0">
        {effectiveTab === "users" && (
          <UsersInnerTab
            orgId={String(orgId)}
            roles={roles}
            canCreate={canCreateUsers}
            canEdit={canEditUsers}
            canDelete={canDeleteUsers}
            onMembersChange={fetchRoles}
          />
        )}
        {effectiveTab === "roles" && (
          <RolesInnerTab
            orgId={String(orgId)}
            loading={rolesLoading}
            roles={roles}
            canCreate={canCreateRoles}
            canEdit={canEditRoles}
            onRolesChange={setRoles}
          />
        )}
      </div>
    </div>
  );
};

const UsersInnerTab: React.FC<{
  orgId: string;
  roles: OrgRole[];
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onMembersChange: () => void;
}> = ({ orgId, roles, canCreate, canEdit, canDelete, onMembersChange }) => {
  const [members, setMembers] = useState<OrgUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [addModal, setAddModal] = useState(false);
  const [editMember, setEditMember] = useState<OrgUserRow | null>(null);
  const [editRoleId, setEditRoleId] = useState("");
  const [editStatus, setEditStatus] = useState<"Active" | "Inactive">("Active");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editConfirmPassword, setEditConfirmPassword] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [confirmingDeleteUser, setConfirmingDeleteUser] = useState<OrgUserRow | null>(null);
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Inactive" | "SoftDeleted">("All");

  useEffect(() => {
    if (editMember) {
      setEditRoleId(editMember.roleId ?? roles[0]?.id ?? "");
      setEditStatus(editMember.status);
      setEditEmail(editMember.email ?? "");
      setEditPassword("");
      setEditConfirmPassword("");
    }
  }, [editMember, roles]);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getMembers(orgId);
      setMembers(
        list.map((m) => ({
          id: m.id,
          name: m.user?.name ?? "—",
          email: m.user?.email ?? "—",
          role: m.role ?? "—",
          roleId: m.roleId,
          status: m.status,
          lastLogin: m.lastLogin ?? "Never",
          avatar: m.user?.avatar,
          isSoftDeletedUser: (m as any).isSoftDeletedUser === true,
        }))
      );
    } catch (e: any) {
      toast.error(e?.message || "Failed to load members");
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const orgAdminCount = useMemo(
    () => members.filter((m) => m.role === "Org Admin").length,
    [members]
  );

  const filtered = useMemo(
    () =>
      members.filter((u) => {
        const matchesSearch = [u.name, u.email].some((value) =>
          value.toLowerCase().includes(search.toLowerCase())
        );

        const matchesStatus =
          statusFilter === "All"
            ? true
            : statusFilter === "SoftDeleted"
            ? u.isSoftDeletedUser
            : !u.isSoftDeletedUser && u.status === statusFilter;

        return matchesSearch && matchesStatus;
      }),
    [members, search, statusFilter]
  );

  const handleRemove = async (user: OrgUserRow) => {
    if (!canDelete) return;
    try {
      await removeMember(orgId, user.id);
      setMembers((prev) => prev.filter((m) => m.id !== user.id));
      onMembersChange();
      toast.success(`${user.name} removed`);
    } catch (e: any) {
      toast.error(e?.message || "Failed to remove member");
    } finally {
      setConfirmingDeleteUser(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-xs">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..."
            className="w-full pl-4 pr-4 py-2 rounded-xl bg-[#1E1E20] border border-[#252525] text-white text-sm placeholder-gray-600 outline-none focus:border-[#00EEFF44]"
          />
        </div>
        {canCreate && (
          <button
            onClick={() => setAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white ml-3"
            style={{ background: "linear-gradient(135deg, #00EEFF, #0051FF)" }}
          >
            <UserPlus className="w-4 h-4" />
            Add User
          </button>
        )}
      </div>

      <div className="rounded-xl border border-[#252525] overflow-hidden w-full">
        <table className="w-full min-w-[640px]" style={{ tableLayout: "fixed", width: "100%" }}>
          <colgroup>
            <col style={{ width: "35%" }} />
            <col style={{ width: "18%" }} />
            <col style={{ width: "15%" }} />
            <col style={{ width: "22%" }} />
            <col style={{ width: "10%" }} />
          </colgroup>
          <thead>
            <tr className="border-b border-[#252525] bg-[#111113]">
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ width: "35%" }}>
                User
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ width: "18%" }}>
                Role
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ width: "15%" }}>
                Status
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ width: "22%" }}>
                Last Active
              </th>
              <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ width: "10%" }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-5 py-12 text-center text-gray-500" colSpan={5}>
                  Loading members...
                </td>
              </tr>
            ) : (
              filtered.map((user, i) => (
                <tr
                  key={user.id}
                  className="border-b border-[#1E1E1E] hover:bg-[#1E1E20] transition-colors"
                  style={{ animation: `rowFadeIn 0.3s ease ${i * 40}ms both` }}
                >
                  <td className="px-5 py-3.5 min-w-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                        style={{ background: "linear-gradient(135deg, #00EEFF, #0051FF)" }}
                      >
                        {user.name.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-white truncate" title={user.name}>
                          {user.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate" title={user.email}>
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="px-2.5 py-1 rounded-lg bg-[#252525] text-xs font-medium text-gray-300">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={user.status} />
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <Clock className="w-3 h-3" />
                      {user.lastLogin}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {canEdit && !(user.role === "Org Admin" && orgAdminCount <= 1) && (
                        <button
                          onClick={() => setEditMember(user)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#252525] transition-all"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-[#00EEFF]" />
                        </button>
                      )}
                      {canDelete && !(user.role === "Org Admin" && orgAdminCount <= 1) && (
                        <button
                          onClick={() => setConfirmingDeleteUser(user)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {canCreate && (
        <AddUserModal
          open={addModal}
          onClose={() => setAddModal(false)}
          availableRoles={roles.map((r) => ({ id: r.id, name: r.name }))}
          onSubmit={async (data) => {
            try {
              await addMember(orgId, {
                fullName: data.fullName,
                email: data.email,
                roleId: data.roleId,
                sendInvite: data.sendInvite,
                password: data.password,
                confirmPassword: data.confirmPassword,
              });
              fetchMembers();
              onMembersChange();
              toast.success(`${data.fullName} added successfully`);
              setAddModal(false);
            } catch (e: any) {
              toast.error(e?.message || "Failed to add user");
            }
          }}
        />
      )}

      {editMember && canEdit && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setEditMember(null)}
        >
          <div
            className="relative w-full max-w-md rounded-2xl bg-[#18191B] border border-[#252525] p-6 shadow-xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-white">Edit member</h3>
              <button
                onClick={() => setEditMember(null)}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#252525] transition-all"
              >
                <span className="sr-only">Close</span>×
              </button>
            </div>
            <p className="text-sm text-gray-400 mb-4">{editMember.name}</p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Email</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#111113] border border-[#2A2A2A] text-white text-sm placeholder-gray-600 outline-none focus:border-[#00EEFF]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Role</label>
                <select
                  value={editRoleId}
                  onChange={(e) => setEditRoleId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#111113] border border-[#2A2A2A] text-white text-sm outline-none focus:border-[#00EEFF]"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Status</label>
                <div className="flex gap-2">
                  {(["Active", "Inactive"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setEditStatus(s)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                        editStatus === s
                          ? "bg-[#00EEFF]/20 text-[#00EEFF] border border-[#00EEFF]/50"
                          : "bg-[#111113] border border-[#2A2A2A] text-gray-400 hover:text-white"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="pt-2 border-t border-[#252525]">
                <p className="text-xs font-medium text-gray-400 mb-2">Set new password (optional)</p>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="New password (min 6 characters)"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#111113] border border-[#2A2A2A] text-white text-sm placeholder-gray-600 outline-none focus:border-[#00EEFF] mb-2"
                />
                <input
                  type="password"
                  value={editConfirmPassword}
                  onChange={(e) => setEditConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#111113] border border-[#2A2A2A] text-white text-sm placeholder-gray-600 outline-none focus:border-[#00EEFF]"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setEditMember(null)}
                className="flex-1 py-2.5 rounded-lg border border-[#2A2A2A] text-gray-300 text-sm font-medium hover:bg-[#252525]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={editSaving}
                onClick={async () => {
                  if (!editRoleId) return;
                  if (!editEmail.trim()) {
                    toast.error("Email is required");
                    return;
                  }
                  if (editPassword || editConfirmPassword) {
                    if (editPassword.length < 6) {
                      toast.error("Password must be at least 6 characters");
                      return;
                    }
                    if (editPassword !== editConfirmPassword) {
                      toast.error("Passwords do not match");
                      return;
                    }
                  }
                  setEditSaving(true);
                  try {
                    const payload: {
                      roleId: string;
                      status: "Active" | "Inactive";
                      email: string;
                      password?: string;
                      confirmPassword?: string;
                    } = {
                      roleId: editRoleId,
                      status: editStatus,
                      email: editEmail.trim(),
                    };
                    if (editPassword) {
                      payload.password = editPassword;
                      payload.confirmPassword = editConfirmPassword;
                    }
                    await updateMember(orgId, editMember.id, payload);
                    fetchMembers();
                    onMembersChange();
                    setEditMember(null);
                    toast.success("Member updated");
                  } catch (e: any) {
                    toast.error(e?.message || "Failed to update member");
                  } finally {
                    setEditSaving(false);
                  }
                }}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #00EEFF, #0051FF)" }}
              >
                {editSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm user delete */}
      <DeleteConfirmationModal
        isOpen={!!confirmingDeleteUser}
        onClose={() => setConfirmingDeleteUser(null)}
        onDelete={() => confirmingDeleteUser && handleRemove(confirmingDeleteUser)}
        title="Remove user from organization?"
        description={
          confirmingDeleteUser
            ? `Are you sure you want to remove "${confirmingDeleteUser.name}" from this organization?`
            : undefined
        }
        confirmLabel="Yes, remove"
      />

      <style>{`@keyframes rowFadeIn { from { opacity:0; transform:translateX(-8px) } to { opacity:1; transform:translateX(0) } }`}</style>
    </div>
  );
};

const RolesInnerTab: React.FC<{
  orgId: string;
  loading: boolean;
  roles: OrgRole[];
  canCreate: boolean;
  canEdit: boolean;
  onRolesChange: (roles: OrgRole[]) => void;
}> = ({ orgId, loading, roles, canCreate, canEdit, onRolesChange }) => {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [createModal, setCreateModal] = useState(false);
  const [editRole, setEditRole] = useState<OrgRole | null>(null);
  const [tempPermissions, setTempPermissions] = useState<PermissionMap | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (selectedRole) {
      const role = roles.find((r) => r.id === selectedRole);
      if (role) {
        setTempPermissions(role.permissions as PermissionMap);
      }
    } else {
      setTempPermissions(null);
    }
  }, [selectedRole, roles]);

  const handleSavePermissions = async () => {
    if (!selectedRole || !tempPermissions || !canEdit) return;
    setSaving(true);
    try {
      const updated = await updateRole(orgId, selectedRole, { permissions: tempPermissions });
      onRolesChange(roles.map((r) => (r.id === selectedRole ? updated : r)));
      toast.success("Permissions updated");
    } catch (e: any) {
      toast.error(e?.message || "Failed to update permissions");
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = useMemo(() => {
    if (!selectedRole || !tempPermissions) return false;
    const original = roles.find((r) => r.id === selectedRole)?.permissions;
    if (!original) return false;
    return JSON.stringify(original) !== JSON.stringify(tempPermissions);
  }, [selectedRole, tempPermissions, roles]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-[#00EEFF]/30 border-t-[#00EEFF] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div className="lg:col-span-1 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-300">Roles ({roles.length})</p>
          {canCreate && (
            <button
              onClick={() => setCreateModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
              style={{ background: "linear-gradient(135deg, #00EEFF, #0051FF)" }}
            >
              <Users className="w-3.5 h-3.5" />
              New Role
            </button>
          )}
        </div>

        {roles.map((role) => {
          const isSelected = selectedRole === role.id;
          return (
            <div
              key={role.id}
              className="rounded-xl"
              style={isSelected ? { padding: "1px", background: "linear-gradient(135deg, #00EEFF, #0051FF)" } : {}}
            >
              <button
                onClick={() => setSelectedRole(isSelected ? null : role.id)}
                className={`w-full p-3.5 rounded-xl border text-left transition-all ${
                  isSelected ? "border-transparent bg-[#1A1B1D]" : "border-[#252525] bg-[#1A1B1D] hover:border-[#333]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-[#252525]">
                      <Shield className="w-3.5 h-3.5 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{role.name}</p>
                      <p className="text-xs text-gray-500">
                        {role.usersCount} user{role.usersCount !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {role.isSystem && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#252525] text-gray-600 font-medium">
                        System
                      </span>
                    )}
                    {!role.isSystem && canEdit && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditRole(role);
                        }}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-[#252525] transition-all"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </button>
            </div>
          );
        })}
      </div>

      <div className="lg:col-span-2">
        {selectedRole && tempPermissions ? (
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-3 border-b border-[#252525] pb-3">
              <p className="text-sm font-semibold text-gray-300">
                {roles.find((r) => r.id === selectedRole)?.name} — Permissions
              </p>
              {hasChanges && canEdit && (
                <button
                  onClick={handleSavePermissions}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, #00EEFF, #0051FF)" }}
                >
                  {saving ? (
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
              <RolePermissionMatrix permissions={tempPermissions} editable={canEdit} onChange={setTempPermissions} />
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center gap-4 py-20 text-center">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: "#111113", border: "1px solid #252525" }}
            >
              <Shield className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-400">No role selected</p>
              <p className="text-xs text-gray-600 mt-1">Pick a role from the left to view permissions</p>
            </div>
          </div>
        )}
      </div>

      <CreateEditRoleModal
        open={createModal && canCreate}
        onClose={() => setCreateModal(false)}
        onSubmit={async (name, perms) => {
          if (!canCreate) return;
          try {
            const created = await createRole(orgId, { name, permissions: perms });
            onRolesChange([...roles, created]);
            setCreateModal(false);
            toast.success(`Role "${name}" created`);
          } catch (e: any) {
            toast.error(e?.message || "Failed to create role");
          }
        }}
      />
      {editRole && canEdit && (
        <CreateEditRoleModal
          open={!!editRole}
          onClose={() => setEditRole(null)}
          onSubmit={async (name, perms) => {
            try {
              const updated = await updateRole(orgId, editRole.id, { name, permissions: perms });
              onRolesChange(roles.map((r) => (r.id === editRole.id ? updated : r)));
              setEditRole(null);
              toast.success(`Role "${name}" updated`);
            } catch (e: any) {
              toast.error(e?.message || "Failed to update role");
            }
          }}
          initialName={editRole.name}
          initialPermissions={editRole.permissions as PermissionMap}
          mode="edit"
        />
      )}
    </div>
  );
};

export default UserManagementTab;

