import React, { useState, useEffect } from "react";
import { X, Shield, Zap } from "lucide-react";
import RolePermissionMatrix, {
    PermissionMap,
    emptyPermissions,
    PRESET_PERMISSIONS,
} from "./RolePermissionMatrix";

interface CreateEditRoleModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (name: string, permissions: PermissionMap) => void;
    initialName?: string;
    initialPermissions?: PermissionMap;
    mode?: "create" | "edit";
}

const CreateEditRoleModal: React.FC<CreateEditRoleModalProps> = ({
    open,
    onClose,
    onSubmit,
    initialName = "",
    initialPermissions,
    mode = "create",
}) => {
    const [name, setName] = useState(initialName);
    const [permissions, setPermissions] = useState<PermissionMap>(
        initialPermissions || emptyPermissions()
    );
    const [nameError, setNameError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            setName(initialName);
            setPermissions(initialPermissions || emptyPermissions());
            setSelectedPreset(null);
        }
    }, [open, initialName, initialPermissions]);

    const applyPreset = (presetName: string) => {
        setSelectedPreset(presetName);
        setPermissions(PRESET_PERMISSIONS[presetName]);
        if (!name.trim()) setName(presetName);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) { setNameError("Role name is required"); return; }
        setSubmitting(true);
        await new Promise((r) => setTimeout(r, 800));
        onSubmit(name.trim(), permissions);
        setSubmitting(false);
        onClose();
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <div
                className="relative w-full max-w-3xl max-h-[90vh] flex flex-col"
                style={{ animation: "slideUp 0.25s cubic-bezier(.22,1,.36,1)" }}
            >
                <div className="rounded-2xl p-px flex flex-col max-h-[90vh]" style={{ background: "linear-gradient(135deg, #00EEFF33, #0051FF33)" }}>
                    <div className="rounded-2xl bg-[#18191B] overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="relative px-6 py-5 border-b border-[#252525] flex-shrink-0">
                            <div className="absolute inset-0 opacity-5" style={{ background: "linear-gradient(135deg, #00EEFF, #0051FF)" }} />
                            <div className="relative flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #00EEFF22, #0051FF44)" }}>
                                    <Shield className="w-5 h-5 text-[#00EEFF]" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-white font-montserrat">
                                        {mode === "create" ? "Create Custom Role" : "Edit Role"}
                                    </h2>
                                    <p className="text-xs text-gray-400">Define module permissions for this role</p>
                                </div>
                                <button onClick={onClose} className="ml-auto p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#252525] transition-all">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Body - scrollable */}
                        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                                {/* Role Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                                        Role Name <span className="text-[#00EEFF]">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => { setName(e.target.value); setNameError(""); }}
                                        placeholder="e.g. Content Manager"
                                        className={`w-full px-4 py-2.5 rounded-lg bg-[#111113] border text-white text-sm placeholder-gray-600 outline-none transition-all focus:border-[#00EEFF44] focus:ring-1 focus:ring-[#00EEFF22] ${nameError ? "border-red-500" : "border-[#2A2A2A]"}`}
                                    />
                                    {nameError && <p className="text-xs text-red-400 mt-1">{nameError}</p>}
                                </div>

                                {/* Preset Templates */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Start from a preset</label>
                                    <div className="flex flex-wrap gap-2">
                                        {Object.keys(PRESET_PERMISSIONS).map((preset) => {
                                            const isActive = selectedPreset === preset;
                                            return (
                                                <div
                                                    key={preset}
                                                    className="rounded-lg"
                                                    style={isActive ? { padding: "1px", background: "linear-gradient(135deg, #00EEFF, #0051FF)" } : {}}
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={() => applyPreset(preset)}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${isActive
                                                            ? "bg-[#1A1B1D] text-white"
                                                            : "border border-[#2A2A2A] text-gray-400 hover:text-white hover:border-[#3A3A3A]"
                                                            }`}
                                                    >
                                                        {preset}
                                                    </button>
                                                </div>
                                            );
                                        })}
                                        <button
                                            type="button"
                                            onClick={() => { setPermissions(emptyPermissions()); setSelectedPreset(null); }}
                                            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border border-[#2A2A2A] text-gray-400 hover:text-white hover:border-[#3A3A3A]"
                                        >
                                            Clear All
                                        </button>
                                    </div>
                                </div>

                                {/* Permission Matrix */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Module Permissions</label>
                                    <RolePermissionMatrix
                                        permissions={permissions}
                                        editable
                                        onChange={setPermissions}
                                    />
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="flex gap-3 px-6 py-4 border-t border-[#252525] flex-shrink-0">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 py-2.5 rounded-lg border border-[#2A2A2A] text-gray-300 text-sm font-medium hover:bg-[#252525] transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60 transition-all"
                                    style={{ background: "linear-gradient(135deg, #00EEFF, #0051FF)" }}
                                >
                                    {submitting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Zap className="w-4 h-4" />}
                                    {submitting ? "Saving..." : mode === "create" ? "Create Role" : "Save Changes"}
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

export default CreateEditRoleModal;
