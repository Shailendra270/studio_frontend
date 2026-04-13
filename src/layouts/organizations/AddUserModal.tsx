import React, { useState, useEffect } from "react";
import { X, UserPlus, Mail, User, Eye, EyeOff } from "lucide-react";

interface Role {
    id: string;
    name: string;
}

interface AddUserModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: UserFormData) => void;
    availableRoles: Role[];
}

export interface UserFormData {
    fullName: string;
    email: string;
    roleId: string;
    sendInvite: boolean;
    password?: string;
    confirmPassword?: string;
}

const AddUserModal: React.FC<AddUserModalProps> = ({ open, onClose, onSubmit, availableRoles }) => {
    const [form, setForm] = useState<UserFormData>({
        fullName: "",
        email: "",
        roleId: availableRoles[0]?.id || "",
        sendInvite: false,
        password: "",
        confirmPassword: "",
    });
    const [errors, setErrors] = useState<Partial<Record<keyof UserFormData, string>>>({});
    const [submitting, setSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        if (open && availableRoles.length > 0) {
            setForm((f) => ({ ...f, roleId: availableRoles[0].id }));
        }
    }, [open, availableRoles]);

    const validate = () => {
        const e: typeof errors = {};
        if (!form.fullName.trim()) e.fullName = "Full name is required";
        if (!form.email.trim()) e.email = "Email is required";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email";
        if (!form.roleId) e.roleId = "Select a role";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setSubmitting(true);
        await new Promise((r) => setTimeout(r, 800));
        onSubmit(form);
        setSubmitting(false);
        handleClose();
    };

    const handleClose = () => {
        setForm({
            fullName: "",
            email: "",
            roleId: availableRoles[0]?.id || "",
            sendInvite: false,
            password: "",
            confirmPassword: "",
        });
        setErrors({});
        onClose();
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} />
            <div
                className="relative w-full max-w-md"
                style={{ animation: "slideUp 0.25s cubic-bezier(.22,1,.36,1)" }}
            >
                <div className="rounded-2xl p-px" style={{ background: "linear-gradient(135deg, #00EEFF33, #0051FF33)" }}>
                    <div className="rounded-2xl bg-[#18191B] overflow-hidden">
                        {/* Header */}
                        <div className="relative px-6 py-4 border-b border-[#252525]">
                            <div className="absolute inset-0 opacity-5" style={{ background: "linear-gradient(135deg, #00EEFF, #0051FF)" }} />
                            <div className="relative flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #00EEFF 0%, #0051FF 100%)" }}>
                                    <UserPlus className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-white font-montserrat leading-snug mt-3 mb-1">Add User</h2>
                                    <p className="text-xs text-gray-400 mt-0">Invite a user to this organization</p>
                                </div>
                                <button onClick={handleClose} className="ml-auto p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#252525] transition-all">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                            {/* Full Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                                    Full Name <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                    <input
                                        type="text"
                                        value={form.fullName}
                                        onChange={(e) => { setForm({ ...form, fullName: e.target.value }); setErrors({ ...errors, fullName: undefined }); }}
                                        placeholder="John Doe"
                                        className={`w-full pl-9 pr-4 py-2.5 rounded-lg bg-[#111113] border text-white text-sm placeholder-gray-600 outline-none transition-all focus:border-[#00EEFF] focus:ring-0 ${errors.fullName ? "border-red-500" : "border-[#2A2A2A]"}`}
                                    />
                                </div>
                                {errors.fullName && <p className="text-xs text-red-400 mt-1">{errors.fullName}</p>}
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                                    Email <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                    <input
                                        type="email"
                                        value={form.email}
                                        onChange={(e) => { setForm({ ...form, email: e.target.value }); setErrors({ ...errors, email: undefined }); }}
                                        placeholder="john@company.com"
                                        className={`w-full pl-9 pr-4 py-2.5 rounded-lg bg-[#111113] border text-white text-sm placeholder-gray-600 outline-none transition-all focus:border-[#00EEFF] focus:ring-0 ${errors.email ? "border-red-500" : "border-[#2A2A2A]"}`}
                                    />
                                </div>
                                {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email}</p>}
                            </div>

                            {/* Role */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                                    Role <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={form.roleId}
                                    onChange={(e) => { setForm({ ...form, roleId: e.target.value }); setErrors({ ...errors, roleId: undefined }); }}
                                    className={`w-full pl-3 pr-9 py-2.5 rounded-lg bg-[#111113] border text-white text-sm outline-none cursor-pointer transition-all focus:border-[#00EEFF] ${errors.roleId ? "border-red-500" : "border-[#2A2A2A]"}`}
                                >
                                    {availableRoles.map((r) => (
                                        <option key={r.id} value={r.id}>{r.name}</option>
                                    ))}
                                </select>
                                {errors.roleId && <p className="text-xs text-red-400 mt-1">{errors.roleId}</p>}
                            </div>

                            {/* Password fields */}
                            <div className="space-y-3">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1.5">
                                            New Password
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                value={form.password || ""}
                                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                                placeholder="Enter password"
                                                className="w-full px-3.5 pr-10 py-2.5 rounded-lg bg-[#111113] border border-[#2A2A2A] text-white text-sm placeholder-gray-600 outline-none transition-all focus:border-[#00EEFF] focus:ring-0"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword((v) => !v)}
                                                className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-300"
                                            >
                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1.5">
                                            Confirm Password
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showConfirmPassword ? "text" : "password"}
                                                value={form.confirmPassword || ""}
                                                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                                                placeholder="Re-enter password"
                                                className="w-full px-3.5 pr-10 py-2.5 rounded-lg bg-[#111113] border border-[#2A2A2A] text-white text-sm placeholder-gray-600 outline-none transition-all focus:border-[#00EEFF] focus:ring-0"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword((v) => !v)}
                                                className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-300"
                                            >
                                                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-1">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="flex-1 py-2.5 rounded-lg border border-[#2A2A2A] text-gray-300 text-sm font-medium hover:bg-[#252525] transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                                    style={{ background: "linear-gradient(135deg, #00EEFF, #0051FF)" }}
                                >
                            {submitting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                                    {submitting ? "Adding..." : "Add User"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            <style>{`@keyframes slideUp { from { opacity:0; transform:translateY(20px) scale(0.97) } to { opacity:1; transform:translateY(0) scale(1) } }`}</style>
        </div>
    );
};

export default AddUserModal;
