import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../layouts/dashboard/Sidebar";
import {
    ArrowLeft, Building2, Users, Shield, Settings, UserPlus,
    Plus, Edit2, TrendingUp, Zap, Video, Star, Check,
    Clock, Mail, Phone, Calendar, Pencil, Ban, Trash2, X
} from "lucide-react";
import type { Organization, OrgMember, OrgRole } from "../api/organizationsApi";
import {
    getOrganization,
    getOrganizationOverview,
    updateOrganization,
    getOrgLogoUploadUrl,
    deleteOrganization,
    getMembers,
    addMember,
    updateMember,
    removeMember,
    getRoles,
    createRole,
    updateRole,
    deleteRole,
} from "../api/organizationsApi";
import AddUserModal from "../layouts/organizations/AddUserModal";
import CreateEditRoleModal from "../layouts/organizations/CreateEditRoleModal";
import RolePermissionMatrix, { type PermissionMap } from "../layouts/organizations/RolePermissionMatrix";
import { toast } from "sonner";
import { uploadFileToPresignedUrl } from "../api/assetApi";
import DeleteConfirmationModal from "../components/modals/DeleteConfirmationModal";

// UI type for table row (derived from OrgMember)
interface OrgUserRow {
    id: string;
    name: string;
    email: string;
    role: string;
    roleId?: string;
    status: "Active" | "Inactive";
    lastLogin: string;
    avatar?: string;
}

// ─── Mini Stat Card ───────────────────────────────────────────────────────────

const MiniStat: React.FC<{ label: string; value: string | number; icon: React.ReactNode; subtext?: string }> = ({ label, value, icon, subtext }) => (
    <div
        className="relative rounded-xl p-5 overflow-hidden group cursor-default transition-transform hover:-translate-y-0.5"
        style={{ background: "#1A1B1D", border: "1px solid #252525" }}
    >
        {/* Subtle glow */}
        <div
            className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-10 blur-2xl transition-opacity group-hover:opacity-20"
            style={{ background: "linear-gradient(135deg, #00EEFF, #0051FF)", transform: "translate(30%, -30%)" }}
        />
        <div className="flex items-start justify-between">
            <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">{label}</p>
                <p className="text-3xl font-bold text-white" style={{ letterSpacing: "-0.02em" }}>
                    {typeof value === "number" ? value.toLocaleString() : value}
                </p>
                {subtext && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
            </div>
            <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #00EEFF 0%, #0051FF 100%)", color: "#FFFFFF" }}
            >
                {icon}
            </div>
        </div>
    </div>
);

// ─── Activity Line Chart (dynamic from API) ─────────────────────────────────────

function buildLinePath(data: number[], W: number, H: number, padL: number, padR: number, padT: number, padB: number) {
    const cW = W - padL - padR;
    const cH = H - padT - padB;
    const max = Math.max(...data, 1);
    const pts = data.map((v, i) => ({
        x: padL + (data.length <= 1 ? 0 : (i / (data.length - 1)) * cW),
        y: padT + cH - (v / max) * cH,
    }));
    let d = pts.length ? `M ${pts[0].x} ${pts[0].y}` : '';
    for (let i = 1; i < pts.length; i++) {
        const cp1x = pts[i - 1].x + (pts[i].x - pts[i - 1].x) * 0.4;
        const cp1y = pts[i - 1].y;
        const cp2x = pts[i].x - (pts[i].x - pts[i - 1].x) * 0.4;
        const cp2y = pts[i].y;
        d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${pts[i].x} ${pts[i].y}`;
    }
    return { path: d, pts, cH, cW, max };
}

const ActivityChart: React.FC<{ activity: { date: string; label: string; count: number }[] }> = ({ activity }) => {
    const W = 500, H = 160;
    const padL = 28, padR = 8, padT = 12, padB = 30;
    const counts = activity.length ? activity.map((a) => a.count) : [0];
    const labels = activity.map((a) => a.label);
    const { path, pts, cH, max } = buildLinePath(counts, W, H, padL, padR, padT, padB);
    const gridPcts = [0, 0.25, 0.5, 0.75, 1];
    const first = pts[0], last = pts[pts.length - 1];
    const areaPath = pts.length ? `${path} L ${last.x} ${padT + cH} L ${first.x} ${padT + cH} Z` : '';

    const trendPct = counts.length >= 2 && counts[0] > 0
        ? Math.round(((counts[counts.length - 1] - counts[0]) / counts[0]) * 100)
        : 0;

    return (
        <div className="p-5 rounded-xl bg-[#1A1B1D] border border-[#252525] flex flex-col h-full w-full">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <p className="text-sm font-semibold text-white">Activity</p>
                    <p className="text-xs text-gray-500">Last 15 days</p>
                </div>
                <span className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg bg-[#252525] text-gray-300">
                    <TrendingUp className="w-3 h-3" style={{ color: "#00EEFF" }} />
                    {trendPct >= 0 ? '+' : ''}{trendPct}%
                </span>
            </div>
            <div className="flex-1 min-h-0 w-full">
                <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full">
                    <defs>
                        <linearGradient id="lineGradH" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#00EEFF" />
                            <stop offset="100%" stopColor="#0051FF" />
                        </linearGradient>
                        <linearGradient id="areaGradV" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#00EEFF" stopOpacity="0.18" />
                            <stop offset="100%" stopColor="#0051FF" stopOpacity="0.01" />
                        </linearGradient>
                    </defs>
                    {gridPcts.map((pct, i) => {
                        const y = padT + cH - pct * cH;
                        return (
                            <g key={i}>
                                <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="#252525" strokeWidth="1" />
                                <text x={padL - 4} y={y + 3.5} textAnchor="end" fontSize="8" fill="#4B5563">
                                    {Math.round(pct * max)}
                                </text>
                            </g>
                        );
                    })}
                    <path d={areaPath} fill="url(#areaGradV)" />
                    <path d={path} fill="none" stroke="url(#lineGradH)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    {pts.map((pt, i) => {
                        if (i % 3 !== 0 && i !== pts.length - 1) return null;
                        return <circle key={i} cx={pt.x} cy={pt.y} r="3" fill="#00EEFF" opacity="0.85" />;
                    })}
                    {pts.map((pt, i) => {
                        if (i % 3 !== 0) return null;
                        return (
                            <text key={i} x={pt.x} y={H - 6} textAnchor="middle" fontSize="7.5" fill="#4B5563">
                                {labels[i] ?? ''}
                            </text>
                        );
                    })}
                </svg>
            </div>
        </div>
    );
};

// ─── Status Badge ─────────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: "Active" | "Suspended" | "Inactive" }> = ({ status }) => {
    const styles = {
        Active: "bg-green-500/10 text-green-400 border-green-500/30",
        Suspended: "bg-red-500/10 text-red-400 border-red-500/30",
        Inactive: "bg-gray-500/10 text-gray-400 border-gray-500/30",
    };
    const dots = { Active: "bg-green-400 animate-pulse", Suspended: "bg-red-400", Inactive: "bg-gray-500" };
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${styles[status]}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${dots[status]}`} />
            {status}
        </span>
    );
};

// ─── Tabs ─────────────────────────────────────────────────────────────────────

type Tab = "overview" | "users" | "roles" | "settings";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "overview", label: "Overview", icon: TrendingUp },
    { id: "users", label: "Users", icon: Users },
    { id: "roles", label: "Roles & Permissions", icon: Shield },
    { id: "settings", label: "Settings", icon: Settings },
];

// ─── Overview Tab ─────────────────────────────────────────────────────────────


const OverviewTab: React.FC<{ org: Organization }> = ({ org }) => {
    const [overview, setOverview] = useState<{
        usersCount: number;
        streamsCount: number;
        highlightsCount: number;
        publishedCount: number;
        publishRate: number;
        activity: { date: string; label: string; count: number }[];
    } | null>(null);
    const [overviewLoading, setOverviewLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        setOverviewLoading(true);
        getOrganizationOverview(org.id)
            .then((data) => { if (!cancelled) setOverview(data); })
            .catch(() => { if (!cancelled) setOverview(null); })
            .finally(() => { if (!cancelled) setOverviewLoading(false); });
        return () => { cancelled = true; };
    }, [org.id]);

    const createdLabel = org.createdAt ? new Date(org.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
    const usersCount = overview?.usersCount ?? org.usersCount ?? 0;
    const streamsCount = overview?.streamsCount ?? org.streamsCount ?? 0;
    const highlightsCount = overview?.highlightsCount ?? org.highlightsCount ?? 0;
    const publishedCount = overview?.publishedCount ?? 0;
    const publishRate = overview?.publishRate ?? 0;
    const activity = overview?.activity ?? [];

    return (
    <div className="space-y-5">
        {/* Stats — from overview API (dynamic) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MiniStat label="Users" value={usersCount} icon={<Users className="w-5 h-5" />} subtext="In this org" />
            <MiniStat label="Streams" value={streamsCount} icon={<Video className="w-5 h-5" />} subtext="All time" />
            <MiniStat label="Highlights" value={highlightsCount} icon={<Star className="w-5 h-5" />} subtext="Generated clips" />
            <MiniStat label="Published" value={publishedCount} icon={<Zap className="w-5 h-5" />} subtext={`${publishRate}% publish rate`} />
        </div>

        {/* Activity (from API) + Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ height: 340 }}>
            <div className="lg:col-span-2 flex w-full">
                {overviewLoading ? (
                    <div className="p-5 rounded-xl bg-[#1A1B1D] border border-[#252525] flex items-center justify-center w-full">
                        <p className="text-gray-500">Loading activity...</p>
                    </div>
                ) : (
                    <ActivityChart activity={activity} />
                )}
            </div>
            <div className="p-5 rounded-xl bg-[#1A1B1D] border border-[#252525] space-y-4 h-full overflow-y-auto">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Organization Info</p>
                {[
                    { icon: <Mail className="w-3.5 h-3.5" />, label: "Email", value: org.contactEmail },
                    { icon: <Phone className="w-3.5 h-3.5" />, label: "Phone", value: org.contactPhone || "—" },
                    { icon: <Calendar className="w-3.5 h-3.5" />, label: "Created", value: createdLabel },
                ].map((item) => (
                    <div key={item.label}>
                        <p className="text-xs mb-0.5 flex items-center gap-1.5 text-gray-500">
                            <span className="text-gray-600">{item.icon}</span>
                            {item.label}
                        </p>
                        <p className="text-sm text-gray-200 break-all pl-5">{item.value}</p>
                    </div>
                ))}

                <div className="pt-2 border-t border-[#252525] space-y-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Quick Stats</p>
                    {[
                        { label: "Avg clips / stream", value: streamsCount > 0 ? Math.round(highlightsCount / streamsCount) : 0 },
                        { label: "Publish rate", value: `${publishRate}%` },
                        { label: "Active users", value: `${usersCount} / ${usersCount}` },
                    ].map(s => (
                        <div key={s.label} className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">{s.label}</span>
                            <span className="text-xs font-semibold text-gray-300">{s.value}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
    );
};

// ─── Users Tab ────────────────────────────────────────────────────────────────

const UsersTab: React.FC<{ orgId: string; roles: OrgRole[]; onMembersChange: () => void }> = ({ orgId, roles, onMembersChange }) => {
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
            setMembers(list.map((m) => ({
                id: m.id,
                name: m.user?.name ?? "—",
                email: m.user?.email ?? "—",
                role: m.role ?? "—",
                roleId: m.roleId,
                status: m.status,
                lastLogin: m.lastLogin ?? "Never",
                avatar: m.user?.avatar,
            })));
        } catch (e: any) {
            toast.error(e?.message || "Failed to load members");
        } finally {
            setLoading(false);
        }
    }, [orgId]);

    useEffect(() => {
        fetchMembers();
    }, [fetchMembers]);

    const filtered = useMemo(() =>
        members.filter((u) =>
            u.name.toLowerCase().includes(search.toLowerCase()) ||
            u.email.toLowerCase().includes(search.toLowerCase())
        ), [members, search]);

    const orgAdminCount = useMemo(
        () => members.filter((m) => m.role === "Org Admin").length,
        [members]
    );

    const handleRemove = async (user: OrgUserRow) => {
        if (user.role === "Org Admin" && orgAdminCount <= 1) {
            toast.error("At least one Org Admin is required for the organization.");
            return;
        }
        try {
            await removeMember(orgId, user.id);
            setMembers((prev) => prev.filter((m) => m.id !== user.id));
            onMembersChange();
            toast.success(`${user.name} removed`);
        } catch (e: any) {
            toast.error(e?.message || "Failed to remove member");
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
                <button
                    onClick={() => setAddModal(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white ml-3"
                    style={{ background: "linear-gradient(135deg, #00EEFF, #0051FF)" }}
                >
                    <UserPlus className="w-4 h-4" />
                    Add User
                </button>
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
                            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ width: "35%" }}>User</th>
                            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ width: "18%" }}>Role</th>
                            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ width: "15%" }}>Status</th>
                            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ width: "22%" }}>Last Active</th>
                            <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ width: "10%" }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td className="px-5 py-12 text-center text-gray-500" colSpan={5}>Loading members...</td>
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
                                                <p className="text-sm font-medium text-white truncate" title={user.name}>{user.name}</p>
                                                <p className="text-xs text-gray-500 truncate" title={user.email}>{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <span className="px-2.5 py-1 rounded-lg bg-[#252525] text-xs font-medium text-gray-300">{user.role}</span>
                                    </td>
                                    <td className="px-5 py-3.5"><StatusBadge status={user.status} /></td>
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                            <Clock className="w-3 h-3" />
                                            {user.lastLogin}
                                        </div>
                                    </td>
                                    <td className="px-5 py-3.5 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            {!(user.role === "Org Admin" && orgAdminCount <= 1) && (
                                                <button
                                                    onClick={() => setEditMember(user)}
                                                    className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#252525] transition-all"
                                                >
                                                    <Edit2 className="w-3.5 h-3.5 text-[#00EEFF]" />
                                                </button>
                                            )}
                                            {!(user.role === "Org Admin" && orgAdminCount <= 1) && (
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

            {/* Edit Member modal */}
            {editMember && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setEditMember(null)}>
                    <div
                        className="relative w-full max-w-md rounded-2xl bg-[#18191B] border border-[#252525] p-6 shadow-xl max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-lg font-semibold text-white">Edit member</h3>
                            <button onClick={() => setEditMember(null)} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#252525] transition-all">
                                <X className="w-5 h-5" />
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
                                        <option key={r.id} value={r.id}>{r.name}</option>
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
                                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${editStatus === s ? "bg-[#00EEFF]/20 text-[#00EEFF] border border-[#00EEFF]/50" : "bg-[#111113] border border-[#2A2A2A] text-gray-400 hover:text-white"}`}
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
                                        const payload: { roleId: string; status: "Active" | "Inactive"; email: string; password?: string; confirmPassword?: string } = {
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

            <style>{`@keyframes rowFadeIn { from { opacity:0; transform:translateX(-8px) } to { opacity:1; transform:translateX(0) } }`}</style>
        </div>
    );
};

// ─── Roles Tab ────────────────────────────────────────────────────────────────

const RolesTab: React.FC<{ orgId: string }> = ({ orgId }) => {
    const [roles, setRoles] = useState<OrgRole[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRole, setSelectedRole] = useState<string | null>(null);
    const [createModal, setCreateModal] = useState(false);
    const [editRole, setEditRole] = useState<OrgRole | null>(null);
    const [tempPermissions, setTempPermissions] = useState<PermissionMap | null>(null);
    const [saving, setSaving] = useState(false);

    const fetchRoles = useCallback(async () => {
        setLoading(true);
        try {
            const list = await getRoles(orgId);
            setRoles(list);
        } catch (e: any) {
            toast.error(e?.message || "Failed to load roles");
        } finally {
            setLoading(false);
        }
    }, [orgId]);

    useEffect(() => {
        fetchRoles();
    }, [fetchRoles]);

    React.useEffect(() => {
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
        if (!selectedRole || !tempPermissions) return;
        setSaving(true);
        try {
            await updateRole(orgId, selectedRole, { permissions: tempPermissions });
            setRoles((prev) => prev.map((r) => r.id === selectedRole ? { ...r, permissions: tempPermissions } : r));
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
            {/* Roles List */}
            <div className="lg:col-span-1 space-y-3">
                <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-300">Roles ({roles.length})</p>
                    <button
                        onClick={() => setCreateModal(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                        style={{ background: "linear-gradient(135deg, #00EEFF, #0051FF)" }}
                    >
                        <Plus className="w-3.5 h-3.5" />
                        New Role
                    </button>
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
                                className={`w-full p-3.5 rounded-xl border text-left transition-all ${isSelected
                                    ? "border-transparent bg-[#1A1B1D]"
                                    : "border-[#252525] bg-[#1A1B1D] hover:border-[#333]"
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-[#252525]">
                                            <Shield className="w-3.5 h-3.5 text-gray-500" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-white">{role.name}</p>
                                            <p className="text-xs text-gray-500">{role.usersCount} user{role.usersCount !== 1 ? "s" : ""}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {role.isSystem && (
                                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#252525] text-gray-600 font-medium">System</span>
                                        )}
                                        {!role.isSystem && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setEditRole(role); }}
                                                className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-[#252525] transition-all"
                                            >
                                                <Pencil className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Permission Matrix */}
            <div className="lg:col-span-2">
                {selectedRole && tempPermissions ? (
                    <div className="flex flex-col h-full">
                        <div className="flex items-center justify-between mb-3 border-b border-[#252525] pb-3">
                            <p className="text-sm font-semibold text-gray-300">
                                {roles.find((r) => r.id === selectedRole)?.name} — Permissions
                            </p>
                            {hasChanges && (
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
                            <RolePermissionMatrix
                                permissions={tempPermissions}
                                editable={true}
                                onChange={setTempPermissions}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center gap-4 py-20 text-center">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "#111113", border: "1px solid #252525" }}>
                            <Shield className="w-6 h-6 text-gray-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-400">No role selected</p>
                            <p className="text-xs text-gray-600 mt-1">Pick a role from the left to view permissions</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Create/Edit Modals */}
            <CreateEditRoleModal
                open={createModal}
                onClose={() => setCreateModal(false)}
                onSubmit={async (name, perms) => {
                    try {
                        const created = await createRole(orgId, { name, permissions: perms });
                        setRoles((prev) => [...prev, created]);
                        setCreateModal(false);
                        toast.success(`Role "${name}" created`);
                    } catch (e: any) {
                        toast.error(e?.message || "Failed to create role");
                    }
                }}
            />
            {editRole && (
                <CreateEditRoleModal
                    open={!!editRole}
                    onClose={() => setEditRole(null)}
                    onSubmit={async (name, perms) => {
                        try {
                            const updated = await updateRole(orgId, editRole.id, { name, permissions: perms });
                            setRoles((prev) => prev.map((r) => r.id === editRole.id ? updated : r));
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

// ─── Settings Tab ─────────────────────────────────────────────────────────────

const SettingsTab: React.FC<{
    org: Organization;
    onUpdate: (updated: Organization) => void;
    onDelete: () => void;
}> = ({ org, onUpdate, onDelete }) => {
    const [form, setForm] = useState({
        name: org.name,
        contactEmail: org.contactEmail,
        contactPhone: org.contactPhone || "",
        status: org.status,
    });
    const [saving, setSaving] = useState(false);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const logoInputRef = React.useRef<HTMLInputElement>(null);
    const [confirmingSuspend, setConfirmingSuspend] = useState(false);
    const [confirmingDelete, setConfirmingDelete] = useState(false);

    React.useEffect(() => {
        setForm({ name: org.name, contactEmail: org.contactEmail, contactPhone: org.contactPhone || "", status: org.status });
    }, [org.id, org.name, org.contactEmail, org.contactPhone, org.status]);

    const handleSave = async () => {
        setSaving(true);
        try {
            let updated = await updateOrganization(org.id, form);
            if (logoFile) {
                const { presignedUrl, logoUrl } = await getOrgLogoUploadUrl(org.id, logoFile.name, logoFile.type);
                await uploadFileToPresignedUrl(presignedUrl, logoFile);
                updated = await updateOrganization(org.id, { logoUrl });
                setLogoFile(null);
                if (logoInputRef.current) logoInputRef.current.value = "";
            }
            onUpdate(updated);
            toast.success("Organization settings saved");
        } catch (e: any) {
            toast.error(e?.message || "Failed to save");
        } finally {
            setSaving(false);
        }
    };

    const handleSuspend = async () => {
        try {
            const newStatus = org.status === "Active" ? "Suspended" : "Active";
            const updated = await updateOrganization(org.id, { status: newStatus });
            onUpdate(updated);
            setForm((f) => ({ ...f, status: newStatus }));
            toast.success(org.status === "Active" ? "Organization suspended" : "Organization activated");
        } catch (e: any) {
            toast.error(e?.message || "Failed to update status");
        }
    };

    const handleDelete = async () => {
        try {
            await deleteOrganization(org.id);
            toast.success("Organization deleted");
            onDelete();
        } catch (e: any) {
            toast.error(e?.message || "Failed to delete");
        } finally {
            setConfirmingDelete(false);
        }
    };

    return (
        <div className="w-full space-y-5">
            <div className="p-5 rounded-xl bg-[#1A1B1D] border border-[#252525] space-y-4">
                <p className="text-sm font-semibold text-gray-300 border-b border-[#252525] pb-3">General Information</p>

                {/* Organization Logo (optional) */}
                <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Organization Logo (optional)</label>
                    <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} />
                    <div className="flex items-center gap-3">
                        <div className="w-16 h-16 rounded-xl bg-[#111113] border border-[#2A2A2A] flex items-center justify-center overflow-hidden flex-shrink-0">
                            {logoFile ? (
                                <img src={URL.createObjectURL(logoFile)} alt="New logo" className="w-full h-full object-contain" />
                            ) : org.logoUrl ? (
                                <img src={org.logoUrl} alt="Org logo" className="w-full h-full object-contain" />
                            ) : (
                                <Building2 className="w-6 h-6 text-gray-500" />
                            )}
                        </div>
                        <button type="button" onClick={() => logoInputRef.current?.click()} className="text-sm text-[#00EEFF] hover:underline">
                            {org.logoUrl || logoFile ? "Change" : "Upload"} logo
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                        { label: "Organization Name", key: "name", placeholder: "Organization name" },
                        { label: "Contact Email", key: "contactEmail", placeholder: "admin@org.com" },
                        { label: "Contact Phone", key: "contactPhone", placeholder: "+1 234 567 8900" },
                    ].map((field) => (
                        <div key={field.key} className={field.key === "name" ? "sm:col-span-2" : ""}>
                            <label className="block text-xs font-medium text-gray-400 mb-1.5">{field.label}</label>
                            <input
                                value={(form as any)[field.key]}
                                onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                                placeholder={field.placeholder}
                                className="w-full px-3.5 py-2.5 rounded-lg bg-[#111113] border border-[#2A2A2A] text-white text-sm placeholder-gray-600 outline-none focus:border-[#00EEFF44] transition-all"
                            />
                        </div>
                    ))}
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Status</label>
                    <div className="flex gap-2.5 mt-0.5">
                        {(["Active", "Suspended"] as const).map((s) => {
                            const isActive = form.status === s;
                            return (
                                <div
                                    key={s}
                                    className="flex-1 rounded-lg"
                                    style={isActive ? { padding: "1px", background: "linear-gradient(135deg, #00EEFF, #0051FF)" } : {}}
                                >
                                    <button
                                        type="button"
                                        onClick={() => setForm({ ...form, status: s })}
                                        className={`w-full py-2 rounded-lg text-xs font-semibold transition-all ${isActive
                                            ? "bg-[#1A1B1D] text-white"
                                            : "bg-transparent border border-[#2A2A2A] text-gray-500 hover:text-white hover:border-[#3A3A3A]"
                                            }`}
                                    >
                                        {s}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="p-5 rounded-xl space-y-3" style={{ border: "1px solid #FF444422", background: "#FF44440A" }}>
                <p className="text-sm font-semibold pb-3" style={{ color: "#FF6666", borderBottom: "1px solid #FF444415" }}>Danger Zone</p>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-200">Suspend Organization</p>
                        <p className="text-xs text-gray-500 mt-0.5">All users will lose access immediately</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setConfirmingSuspend(true)}
                        className="px-4 py-2 rounded-lg text-sm transition-all flex items-center gap-2"
                        style={{ border: "1px solid #FF884422", color: "#FF8844", background: "transparent" }}
                        onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = "#FF88440D"}
                        onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = "transparent"}
                    >
                        <Ban className="w-4 h-4" />
                        {org.status === "Active" ? "Suspend" : "Activate"}
                    </button>
                </div>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-200">Delete Organization</p>
                        <p className="text-xs text-gray-500 mt-0.5">This action is permanent and irreversible</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setConfirmingDelete(true)}
                        className="px-4 py-2 rounded-lg text-sm transition-all flex items-center gap-2"
                        style={{ border: "1px solid #FF444430", color: "#FF4444", background: "transparent" }}
                        onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = "#FF44440D"}
                        onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = "transparent"}
                    >
                        <Trash2 className="w-4 h-4" />
                        Delete
                    </button>
                </div>
            </div>

            <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60 transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #00EEFF, #0051FF)" }}
            >
                {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Zap className="w-4 h-4" />}
                {saving ? "Saving..." : "Save Changes"}
            </button>

            {/* Confirm suspend */}
            <DeleteConfirmationModal
                isOpen={confirmingSuspend}
                onClose={() => setConfirmingSuspend(false)}
                onDelete={handleSuspend}
                title={org.status === "Active" ? "Suspend organization?" : "Activate organization?"}
                description={
                    org.status === "Active"
                        ? `Do you want to suspend "${org.name}"? Users in this org may lose access.`
                        : `Do you want to activate "${org.name}" and restore access?`
                }
                confirmLabel={org.status === "Active" ? "Yes, suspend" : "Yes, activate"}
            />

            {/* Confirm delete */}
            <DeleteConfirmationModal
                isOpen={confirmingDelete}
                onClose={() => setConfirmingDelete(false)}
                onDelete={handleDelete}
                title="Delete organization?"
                description={`Are you sure you want to permanently delete "${org.name}"? This action cannot be undone.`}
                confirmLabel="Yes, delete"
            />
        </div>
    );
};

// ─── Main Detail Page ─────────────────────────────────────────────────────────

const OrganizationDetailPage: React.FC = () => {
    const { orgId } = useParams<{ orgId: string }>();
    const navigate = useNavigate();
    const [org, setOrg] = useState<Organization | null>(null);
    const [roles, setRoles] = useState<OrgRole[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<Tab>("overview");

    const fetchOrg = useCallback(async () => {
        if (!orgId) return;
        setLoading(true);
        try {
            const data = await getOrganization(orgId);
            setOrg(data);
        } catch (e: any) {
            toast.error(e?.message || "Organization not found");
            setOrg(null);
        } finally {
            setLoading(false);
        }
    }, [orgId]);

    const fetchRolesForTabs = useCallback(async () => {
        if (!orgId) return;
        try {
            const list = await getRoles(orgId);
            setRoles(list);
        } catch {
            setRoles([]);
        }
    }, [orgId]);

    useEffect(() => {
        fetchOrg();
    }, [fetchOrg]);

    useEffect(() => {
        if (orgId && (activeTab === "users" || activeTab === "roles")) fetchRolesForTabs();
    }, [orgId, activeTab, fetchRolesForTabs]);

    const onMembersChange = useCallback(() => {
        fetchOrg();
    }, [fetchOrg]);

    if (!orgId) {
        return (
            <div className="flex h-screen bg-[#18191B] text-white items-center justify-center">
                <p className="text-gray-500">Invalid organization</p>
            </div>
        );
    }

    if (loading && !org) {
        return (
            <div className="flex h-screen bg-[#18191B] text-white items-center justify-center">
                <div className="w-10 h-10 border-2 border-[#00EEFF]/30 border-t-[#00EEFF] rounded-full animate-spin" />
            </div>
        );
    }

    if (!org) {
        return (
            <div className="flex h-screen bg-[#18191B] text-white items-center justify-center gap-4">
                <p className="text-gray-500">Organization not found</p>
                <button onClick={() => navigate("/organizations")} className="text-[#00EEFF] hover:underline">Back to list</button>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-[#18191B] text-white overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="relative border-b border-[#222224] flex-shrink-0">
                    <div className="px-7 pt-6 pb-5">
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-5">
                            <button onClick={() => navigate("/organizations")} className="hover:text-gray-300 transition-colors flex items-center gap-1">
                                <Building2 className="w-3.5 h-3.5" />
                                Organizations
                            </button>
                            <span>/</span>
                            <span className="text-gray-300">{org.name}</span>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => navigate("/organizations")}
                                    className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#252525] transition-all"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                                <div
                                    className="w-9 h-9 rounded-xl flex items-center justify-center text-base font-bold text-white flex-shrink-0"
                                    style={{ background: "linear-gradient(135deg, #00EEFF, #0051FF)" }}
                                >
                                    {org.name.charAt(0)}
                                </div>
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-3 mt-3">
                                        <h1 className="text-2xl font-bold text-white font-montserrat tracking-tight">{org.name}</h1>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 mt-3">
                                <button
                                    onClick={() => setActiveTab("settings")}
                                    className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#252525] transition-all"
                                >
                                    <Edit2 className="w-4 h-4 text-[#00EEFF]" />
                                </button>
                                <button className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#252525] transition-all">
                                    <Ban className="w-4 h-4 text-amber-400" />
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-1 mt-4">
                            {TABS.map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                    <div
                                        key={tab.id}
                                        className="rounded-lg"
                                        style={isActive ? { padding: "1px", background: "linear-gradient(135deg, #00EEFF, #0051FF)" } : {}}
                                    >
                                        <button
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive
                                                ? "bg-[#1A1B1D] text-white"
                                                : "text-gray-500 hover:text-white hover:bg-[#1E1E20]"
                                                }`}
                                        >
                                            <Icon className="w-4 h-4" />
                                            {tab.label}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-5">
                    {activeTab === "overview" && <OverviewTab org={org} />}
                    {activeTab === "users" && <UsersTab orgId={orgId} roles={roles} onMembersChange={onMembersChange} />}
                    {activeTab === "roles" && <RolesTab orgId={orgId} />}
                    {activeTab === "settings" && (
                        <SettingsTab
                            org={org}
                            onUpdate={setOrg}
                            onDelete={() => navigate("/organizations")}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrganizationDetailPage;
