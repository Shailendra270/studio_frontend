import React, { useState, useMemo, useEffect, useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Sidebar from "../layouts/dashboard/Sidebar";
import {
    Building2, Plus, Search, Users, TrendingUp, ShieldOff, CheckCircle2,
    MoreVertical, Pencil, Ban, Trash2, ChevronLeft, ChevronRight, X, Eye
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import CreateOrganizationModal, { OrgFormData } from "../layouts/organizations/CreateOrganizationModal";
import { toast } from "sonner";
import type { Organization } from "../api/organizationsApi";
import {
    getOrganizations,
    createOrganization,
    updateOrganization,
    getOrgLogoUploadUrl,
    deleteOrganization as deleteOrganizationApi,
    restoreOrganization as restoreOrganizationApi,
} from "../api/organizationsApi";
import { uploadFileToPresignedUrl } from "../api/assetApi";
import DeleteConfirmationModal from "../components/modals/DeleteConfirmationModal";

// ─── Stat Card ────────────────────────────────────────────────────────────────

const StatCard: React.FC<{
    label: string;
    value: number | string;
    icon: React.ReactNode;
    subtext?: string;
    delay?: number;
}> = ({ label, value, subtext, delay = 0, icon }) => (
        <div
            className="relative rounded-2xl p-5 overflow-hidden group cursor-default transition-transform hover:-translate-y-0.5"
            style={{
                background: "#1A1B1D",
                border: "1px solid #252525",
                animation: `statFadeIn 0.5s ease ${delay}ms both`,
            }}
        >
        {/* Glow */}
        <div
            className="absolute top-0 right-0 w-28 h-28 rounded-full opacity-10 blur-2xl transition-opacity group-hover:opacity-20"
            style={{ background: "linear-gradient(135deg, #00EEFF, #0051FF)", transform: "translate(30%, -30%)" }}
        />
        <div className="flex items-start justify-between">
            <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">{label}</p>
                <p className="text-3xl font-bold text-white font-montserrat" style={{ letterSpacing: "-0.02em" }}>
                    {typeof value === "number" ? value.toLocaleString() : value}
                </p>
                {subtext && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
            </div>
            <div
                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #00EEFF 0%, #0051FF 100%)", color: "#FFFFFF" }}
            >
                {icon}
            </div>
        </div>
    </div>
);

// ─── Status Badge ─────────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: Organization["status"]; deletedAt?: string | null }> = ({ status, deletedAt }) => {
    const colorClasses =
        status === "Active"
            ? "bg-green-500/10 text-green-400 border-green-500/30"
            : status === "Deleted"
            ? "bg-gray-500/10 text-gray-300 border-gray-500/30"
            : "bg-red-500/10 text-red-400 border-red-500/30";

    const dotClasses =
        status === "Active"
            ? "bg-green-400 animate-pulse"
            : status === "Deleted"
            ? "bg-gray-400"
            : "bg-red-400";

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${colorClasses}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${dotClasses}`} />
            {status}
        </span>
    );
};

// ─── Action Menu (portal so dropdown is never covered by row hover/stacking) ───

const ActionMenu: React.FC<{
    org: Organization;
    onView: () => void;
    onEdit: () => void;
    onToggleStatus: () => void;
    onDelete: () => void;
    onRestore: () => void;
}> = ({ org, onView, onEdit, onToggleStatus, onDelete, onRestore }) => {
    const [open, setOpen] = useState(false);
    const [position, setPosition] = useState<{ top?: number; bottom?: number; left: number } | null>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    useLayoutEffect(() => {
        if (!open || !buttonRef.current) {
            if (!open) setPosition(null);
            return;
        }
        const rect = buttonRef.current.getBoundingClientRect();
        const menuHeight = 220;
        const spaceBelow = window.innerHeight - rect.bottom;
        const openAbove = spaceBelow < menuHeight && rect.top > spaceBelow;
        setPosition({
            left: rect.right - 192,
            ...(openAbove ? { bottom: window.innerHeight - rect.top + 4 } : { top: rect.bottom + 4 }),
        });
    }, [open]);

    React.useEffect(() => {
        if (!open) return;
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement | null;
            if (!target?.closest?.("[data-org-action-menu]")) setOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [open]);

    const menuContent = open && position && (
        <div
            className="fixed w-48 border rounded-xl shadow-2xl py-1 overflow-hidden bg-[#1E1E20] border-[#2A2A2A]"
            style={{ left: position.left, ...(position.top != null ? { top: position.top } : { bottom: position.bottom }), zIndex: 9999 }}
            data-org-action-menu
        >
            {[
                // Only show "View Details" for non-deleted orgs
                ...(org.isDeleted
                    ? []
                    : [{ icon: <Eye className="w-4 h-4 text-gray-300" />, label: "View Details", fn: onView }]),
                ...(org.isDeleted
                    ? [
                        {
                            icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
                            label: "Restore",
                            fn: onRestore,
                        },
                    ]
                    : [
                        { icon: <Pencil className="w-4 h-4 text-[#00EEFF]" />, label: "Edit", fn: onEdit },
                        {
                            icon: <Ban className={`w-4 h-4 ${org.status === "Active" ? "text-amber-400" : "text-emerald-400"}`} />,
                            label: org.status === "Active" ? "Suspend" : "Activate",
                            fn: onToggleStatus,
                        },
                        { icon: <Trash2 className="w-4 h-4 text-red-400" />, label: "Delete", fn: onDelete },
                    ]),
            ].map((item) => (
                <button
                    key={item.label}
                    onClick={() => { item.fn(); setOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-[#252525] hover:text-white transition-colors text-left"
                >
                    {item.icon}
                    {item.label}
                </button>
            ))}
        </div>
    );

    return (
        <div className="relative inline-block" data-org-action-menu>
            <button
                ref={buttonRef}
                onClick={(e) => { e.stopPropagation(); setOpen((prev) => !prev); }}
                className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-[#252525] transition-all"
            >
                <MoreVertical className="w-4 h-4" />
            </button>
            {menuContent && createPortal(menuContent, document.body)}
        </div>
    );
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stringToColor(): string {
    // Use the primary Studio brand cyan so org avatars match the global theme
    return "#00EEFF";
}

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const ITEMS_PER_PAGE = 8;

const OrganizationsPage: React.FC = () => {
    const navigate = useNavigate();
    const [orgs, setOrgs] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Suspended" | "SoftDeleted">("All");
    const [currentPage, setCurrentPage] = useState(1);
    const [createModal, setCreateModal] = useState(false);
    const [editOrg, setEditOrg] = useState<Organization | null>(null);
    const [confirmingDeleteOrg, setConfirmingDeleteOrg] = useState<Organization | null>(null);
    const [confirmingStatusOrg, setConfirmingStatusOrg] = useState<Organization | null>(null);
    const [confirmingRestoreOrg, setConfirmingRestoreOrg] = useState<Organization | null>(null);

    const fetchOrgs = async () => {
        setLoading(true);
        try {
            const apiStatusFilter =
                statusFilter === "SoftDeleted"
                    ? "softDeleted"
                    : undefined;

            const { organizations } = await getOrganizations({
                page: 1,
                limit: 500,
                ...(apiStatusFilter ? { statusFilter: apiStatusFilter } : {}),
            });
            setOrgs(organizations);
        } catch (e: any) {
            toast.error(e?.message || "Failed to load organizations");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrgs();
    }, [statusFilter]);

    const totalOrgs = orgs.length;
    const activeOrgs = orgs.filter((o) => o.status === "Active").length;
    const suspendedOrgs = orgs.filter((o) => o.status === "Suspended").length;
    const totalUsers = orgs.reduce((sum, o) => sum + o.usersCount, 0);

    const filtered = useMemo(() => {
        return orgs.filter((o) => {
            const matchSearch = o.name.toLowerCase().includes(search.toLowerCase()) ||
                o.contactEmail.toLowerCase().includes(search.toLowerCase());
            const matchStatus =
                statusFilter === "All"
                    ? true
                    : statusFilter === "SoftDeleted"
                    ? o.isDeleted === true
                    : o.status === statusFilter;
            return matchSearch && matchStatus;
        });
    }, [orgs, search, statusFilter]);

    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const paged = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const handleCreate = async (data: OrgFormData, logoFile?: File | null) => {
        try {
            const newOrg = await createOrganization({
                name: data.name,
                contactEmail: data.contactEmail,
                contactPhone: data.contactPhone,
                status: data.status,
                // Always create an organization-level admin user for the new org
                createAdminAccount: true,
                email: data.contactEmail,
                password: data.password,
                confirmPassword: data.confirmPassword,
            });

            if (logoFile) {
                try {
                    const { presignedUrl, logoUrl } = await getOrgLogoUploadUrl(newOrg.id, logoFile.name, logoFile.type);
                    await uploadFileToPresignedUrl(presignedUrl, logoFile);
                    const updated = await updateOrganization(newOrg.id, { logoUrl });
                    setOrgs([updated, ...orgs]);
                } catch (e: any) {
                    toast.error(e?.message || "Logo upload failed");
                    setOrgs([newOrg, ...orgs]);
                }
            } else {
                setOrgs([newOrg, ...orgs]);
            }

            toast.success(`Organization "${data.name}" created successfully`);
        } catch (e: any) {
            // Let the modal show field-level errors based on this message
            throw new Error(e?.message || "Failed to create organization");
        }
    };

    const handleEdit = async (data: OrgFormData, logoFile?: File | null) => {
        if (!editOrg) return;
        try {
            let updated = await updateOrganization(editOrg.id, {
                name: data.name,
                contactEmail: data.contactEmail,
                contactPhone: data.contactPhone,
                status: data.status,
            });
            if (logoFile) {
                const { presignedUrl, logoUrl } = await getOrgLogoUploadUrl(editOrg.id, logoFile.name, logoFile.type);
                await uploadFileToPresignedUrl(presignedUrl, logoFile);
                updated = await updateOrganization(editOrg.id, { logoUrl });
            }
            setOrgs(orgs.map((o) => (o.id === editOrg.id ? updated : o)));
            setEditOrg(null);
            toast.success("Organization updated");
        } catch (e: any) {
            toast.error(e?.message || "Failed to update organization");
        }
    };

    const handleToggleStatus = async (id: string) => {
        const org = orgs.find((o) => o.id === id);
        if (!org || org.isDeleted) return;
        const newStatus = org.status === "Active" ? "Suspended" : "Active";
        try {
            const updated = await updateOrganization(id, { status: newStatus });
            setOrgs(orgs.map((o) => (o.id === id ? updated : o)));
            toast.success(`${org.name} ${org.status === "Active" ? "suspended" : "activated"}`);
        } catch (e: any) {
            toast.error(e?.message || "Failed to update status");
        } finally {
            setConfirmingStatusOrg(null);
        }
    };

    const handleDelete = async (id: string) => {
        const org = orgs.find((o) => o.id === id);
        if (!org) return;
        try {
            await deleteOrganizationApi(id);
            setOrgs(orgs.filter((o) => o.id !== id));
            toast.success(`${org.name} deleted`);
        } catch (e: any) {
            toast.error(e?.message || "Failed to delete organization");
        } finally {
            setConfirmingDeleteOrg(null);
        }
    };

    const handleRestore = async (id: string) => {
        const org = orgs.find((o) => o.id === id);
        if (!org) return;
        try {
            const updated = await restoreOrganizationApi(id);
            setOrgs(orgs.map((o) => (o.id === id ? updated : o)));
            // After restore, move back to "All" view so it's visible as Active
            setStatusFilter("All");
            toast.success(`"${org.name}" has been restored and set to Active`);
        } catch (e: any) {
            toast.error(e?.message || "Failed to restore organization");
        } finally {
            setConfirmingRestoreOrg(null);
        }
    };

    return (
        <div className="flex h-screen bg-[#18191B] text-white overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Page Header */}
                <div className="px-6 py-5 border-b border-[#222224] flex items-center justify-between flex-shrink-0">
                    <div>
                        <h1 className="text-2xl font-bold text-white font-montserrat">Organizations</h1>
                        <p className="text-sm text-gray-500 mt-0.5">Manage all organizations on the Studio platform</p>
                    </div>
                    <button
                        onClick={() => setCreateModal(true)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]"
                        style={{ background: "linear-gradient(135deg, #00EEFF, #0051FF)" }}
                    >
                        <Plus className="w-4 h-4" />
                        Add Organization
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                    {/* Stats */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard label="Total Organizations" value={totalOrgs} icon={<Building2 className="w-5 h-5" />} subtext="All time" delay={0} />
                        <StatCard label="Active" value={activeOrgs} icon={<CheckCircle2 className="w-5 h-5" />} subtext={`${Math.round((activeOrgs / Math.max(totalOrgs, 1)) * 100)}% of total`} delay={80} />
                        <StatCard label="Suspended" value={suspendedOrgs} icon={<ShieldOff className="w-5 h-5" />} subtext="Access restricted" delay={160} />
                        <StatCard label="Total Users" value={totalUsers} icon={<Users className="w-5 h-5" />} subtext="Across all orgs" delay={240} />
                    </div>

                    {/* Search & Filters */}
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative flex-1 min-w-[240px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                                placeholder="Search organizations..."
                                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#111113] border border-[#2A2A2A] text-white text-sm placeholder-gray-600 outline-none focus:border-[#00EEFF] transition-all"
                            />
                            {search && (
                                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        <div className="flex gap-1 p-1 rounded-xl bg-[#1E1E20] border border-[#252525]">
                            {(["All", "Active", "Suspended", "SoftDeleted"] as const).map((s) => (
                                <button
                                    key={s}
                                    onClick={() => { setStatusFilter(s); setCurrentPage(1); }}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${statusFilter === s ? "bg-[#252525] text-white" : "text-gray-500 hover:text-white"}`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>

                        <span className="text-sm text-gray-500 ml-auto">{filtered.length} organization{filtered.length !== 1 ? "s" : ""}</span>
                    </div>

                    {/* Table — fixed layout + same column count when loading so layout never jumps */}
                    <div className="rounded-2xl border border-[#252525] overflow-visible w-full">
                        <div className="overflow-x-auto w-full">
                            <table className="w-full min-w-[900px]" style={{ tableLayout: "fixed", width: "100%" }}>
                                <colgroup>
                                    <col style={{ width: "24%" }} />
                                    <col style={{ width: "20%" }} />
                                    <col style={{ width: "10%" }} />
                                    <col style={{ width: "12%" }} />
                                    <col style={{ width: "12%" }} />
                                    <col style={{ width: "12%" }} />
                                    <col style={{ width: "10%" }} />
                                </colgroup>
                                <thead>
                                    <tr className="border-b border-[#252525] bg-[#111113]">
                                        <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ width: "24%" }}>Organization</th>
                                        <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ width: "20%" }}>Contact</th>
                                        <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ width: "10%" }}>Users</th>
                                        <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ width: "12%" }}>Streams</th>
                                        <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ width: "12%" }}>Status</th>
                                        <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ width: "12%" }}>Created</th>
                                        <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={{ width: "10%" }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td className="px-5 py-16 text-center" colSpan={7}>
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="w-8 h-8 border-2 border-[#00EEFF]/30 border-t-[#00EEFF] rounded-full animate-spin" />
                                                    <p className="text-gray-500">Loading organizations...</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : paged.length === 0 ? (
                                        <tr>
                                            <td className="px-5 py-16 text-center" colSpan={7}>
                                                <div className="flex flex-col items-center gap-3">
                                                    <Building2 className="w-10 h-10 text-gray-700" />
                                                    <p className="text-gray-500">No organizations found</p>
                                                    <button onClick={() => { setSearch(""); setStatusFilter("All"); }} className="text-xs hover:underline" style={{ color: "#00EEFF" }}>
                                                        Clear filters
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        paged.map((org, i) => (
                                            <tr
                                                key={org.id}
                                                className="relative border-b border-[#1E1E1E] hover:bg-[#1E1E20] transition-colors cursor-pointer group"
                                                style={{ animation: `rowFadeIn 0.3s ease ${i * 40}ms both` }}
                                                onClick={() => navigate(`/organizations/${org.id}`)}
                                            >
                                                <td className="px-5 py-4 min-w-0">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div
                                                            className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                                                            style={{ background: `linear-gradient(135deg, ${stringToColor()}, #0051FF)` }}
                                                        >
                                                            {org.name.charAt(0)}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-sm font-semibold text-white group-hover:text-[#00EEFF] transition-colors truncate" title={org.name}>{org.name}</p>
                                                            <p className="text-xs text-gray-500 truncate" title={org.id}>{org.id}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <p className="text-sm text-gray-300 truncate" title={org.contactEmail}>{org.contactEmail}</p>
                                                    {org.contactPhone && <p className="text-xs text-gray-600 mt-0.5 truncate" title={org.contactPhone}>{org.contactPhone}</p>}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-1.5 text-sm text-gray-300">
                                                        <Users className="w-3.5 h-3.5 text-gray-600" />
                                                        {org.usersCount}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-1.5 text-sm text-gray-300">
                                                        <TrendingUp className="w-3.5 h-3.5 text-gray-600" />
                                                        {(org.streamsCount ?? 0).toLocaleString()}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <StatusBadge status={org.status} deletedAt={org.deletedAt ?? null} />
                                                </td>
                                                <td className="px-5 py-4"><p className="text-sm text-gray-400">{formatDate(org.createdAt)}</p></td>
                                                <td className="px-5 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                                                    <ActionMenu
                                                        org={org}
                                                        onView={() => !org.isDeleted && navigate(`/organizations/${org.id}`)}
                                                        onEdit={() => !org.isDeleted && setEditOrg(org)}
                                                        onToggleStatus={() => !org.isDeleted && setConfirmingStatusOrg(org)}
                                                        onDelete={() => setConfirmingDeleteOrg(org)}
                                                        onRestore={() => org.isDeleted && setConfirmingRestoreOrg(org)}
                                                    />
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between px-5 py-3.5 bg-[#111113] border-t border-[#252525]">
                                <p className="text-sm text-gray-500">
                                    Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
                                </p>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#252525] disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    {Array.from({ length: Math.min(totalPages, 5) }, (_, idx) => idx + 1).map((p) => (
                                        <button
                                            key={p}
                                            onClick={() => setCurrentPage(p)}
                                            className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${currentPage === p ? "text-white" : "text-gray-500 hover:text-white hover:bg-[#252525]"}`}
                                            style={currentPage === p ? { background: "linear-gradient(135deg, #00EEFF, #0051FF)" } : undefined}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                    <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#252525] disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <CreateOrganizationModal open={createModal} onClose={() => setCreateModal(false)} onSubmit={handleCreate} />
            {editOrg && (
                <CreateOrganizationModal open={!!editOrg} onClose={() => setEditOrg(null)} onSubmit={handleEdit} initialData={editOrg} mode="edit" />
            )}

            {/* Delete confirmation */}
            <DeleteConfirmationModal
                isOpen={!!confirmingDeleteOrg}
                onClose={() => setConfirmingDeleteOrg(null)}
                onDelete={() => confirmingDeleteOrg && handleDelete(confirmingDeleteOrg.id)}
                itemName={confirmingDeleteOrg?.name}
                title="Delete organization?"
                description={
                    confirmingDeleteOrg
                        ? `Are you sure you want to permanently delete "${confirmingDeleteOrg.name}"? This action cannot be undone.`
                        : undefined
                }
                confirmLabel="Yes, delete"
            />

            {/* Restore confirmation */}
            <DeleteConfirmationModal
                isOpen={!!confirmingRestoreOrg}
                onClose={() => setConfirmingRestoreOrg(null)}
                onDelete={() => confirmingRestoreOrg && handleRestore(confirmingRestoreOrg.id)}
                itemName={confirmingRestoreOrg?.name}
                title="Restore organization?"
                description={
                    confirmingRestoreOrg
                        ? `Are you sure you want to restore "${confirmingRestoreOrg.name}"? The organization will be set to Active and its users will be able to log in again.`
                        : undefined
                }
                confirmLabel="Yes, restore"
            />

            {/* Suspend / Activate confirmation */}
            <DeleteConfirmationModal
                isOpen={!!confirmingStatusOrg}
                onClose={() => setConfirmingStatusOrg(null)}
                onDelete={() => confirmingStatusOrg && !confirmingStatusOrg.isDeleted && handleToggleStatus(confirmingStatusOrg.id)}
                itemName={confirmingStatusOrg?.name}
                title={
                    confirmingStatusOrg?.status === "Active"
                        ? "Suspend organization?"
                        : "Activate organization?"
                }
                description={
                    confirmingStatusOrg
                        ? confirmingStatusOrg.status === "Active"
                            ? `Do you want to suspend "${confirmingStatusOrg.name}"? Users in this org may lose access.`
                            : `Do you want to activate "${confirmingStatusOrg.name}" and restore access?`
                        : undefined
                }
                confirmLabel={
                    confirmingStatusOrg?.status === "Active"
                        ? "Yes, suspend"
                        : "Yes, activate"
                }
            />

            <style>{`
        @keyframes statFadeIn { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
        @keyframes rowFadeIn { from { opacity:0; transform:translateX(-8px) } to { opacity:1; transform:translateX(0) } }
      `}</style>
        </div>
    );
};

export default OrganizationsPage;
