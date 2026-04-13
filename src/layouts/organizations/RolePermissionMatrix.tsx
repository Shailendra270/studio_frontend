import React from "react";
import { Check } from "lucide-react";

export const MODULES = [
    "Dashboard",
    "Streams / Live",
    "Clips",
    "Highlights",
    "Folders",
    "Published",
    "Assets",
    "Tags",
    "Templates",
    "Settings",
    "Teams",
    "Competitions",
    "Users",
    "Roles & Permissions",
] as const;

export type Module = (typeof MODULES)[number];
export type Action = "view" | "create" | "edit" | "delete";
export const ACTIONS: Action[] = ["view", "create", "edit", "delete"];

// Module that only supports view
const VIEW_ONLY_MODULES: Module[] = ["Dashboard"];

export type PermissionMap = Record<Module, Record<Action, boolean>>;

export const emptyPermissions = (): PermissionMap =>
    Object.fromEntries(
        MODULES.map((mod) => [
            mod,
            Object.fromEntries(ACTIONS.map((a) => [a, false])) as Record<Action, boolean>,
        ])
    ) as PermissionMap;

export const PRESET_PERMISSIONS: Record<string, PermissionMap> = {
    "Org Admin": (() => {
        const p = emptyPermissions();
        MODULES.forEach((m) => {
            p[m].view = true;
            if (!VIEW_ONLY_MODULES.includes(m)) { p[m].create = true; p[m].edit = true; p[m].delete = true; }
        });
        return p;
    })(),
    "Manager": (() => {
        const p = emptyPermissions();
        MODULES.forEach((m) => {
            p[m].view = true;
            if (
                !VIEW_ONLY_MODULES.includes(m) &&
                m !== "Users" &&
                m !== "Roles & Permissions"
            ) {
                p[m].create = true;
                p[m].edit = true;
                p[m].delete = true;
            }
        });
        return p;
    })(),
    "Editor": (() => {
        const p = emptyPermissions();
        const editorModules: Module[] = ["Streams / Live", "Clips", "Highlights", "Folders", "Published", "Assets", "Tags", "Templates"];
        MODULES.forEach((m) => {
            p[m].view = true;
            if (editorModules.includes(m)) { p[m].create = true; p[m].edit = true; }
        });
        return p;
    })(),
    "Viewer": (() => {
        const p = emptyPermissions();
        MODULES.forEach((m) => { p[m].view = true; });
        return p;
    })(),
};

interface RolePermissionMatrixProps {
    permissions: PermissionMap;
    editable?: boolean;
    onChange?: (permissions: PermissionMap) => void;
}

const RolePermissionMatrix: React.FC<RolePermissionMatrixProps> = ({
    permissions,
    editable = false,
    onChange,
}) => {
    const toggle = (mod: Module, action: Action) => {
        if (!editable || !onChange) return;
        if (VIEW_ONLY_MODULES.includes(mod) && action !== "view") return;
        const currentModulePerms = permissions[mod] || ({} as Record<Action, boolean>);
        const base = {
            view: currentModulePerms.view ?? false,
            create: currentModulePerms.create ?? false,
            edit: currentModulePerms.edit ?? false,
            delete: currentModulePerms.delete ?? false,
        };

        if (action === "view") {
            const newView = !base.view;
            const next = {
                ...base,
                view: newView,
                // When view is turned off, force all other actions off too
                create: newView ? base.create : false,
                edit: newView ? base.edit : false,
                delete: newView ? base.delete : false,
            };
            onChange({
                ...permissions,
                [mod]: next,
            });
            return;
        }

        // For create/edit/delete: if enabling, ensure view is also enabled
        const newValue = !base[action];
        const next = {
            ...base,
            [action]: newValue,
            view: newValue ? true : base.view,
        };

        onChange({
            ...permissions,
            [mod]: next,
        });
    };

    const toggleAll = (action: Action) => {
        if (!editable || !onChange) return;
        const allChecked = MODULES.every((m) => (permissions[m]?.[action] ?? false));
        const updated = { ...permissions };
        MODULES.forEach((m) => {
            if (VIEW_ONLY_MODULES.includes(m) && action !== "view") return;
            const currentModulePerms = updated[m] || ({} as Record<Action, boolean>);
            const base = {
                view: currentModulePerms.view ?? false,
                create: currentModulePerms.create ?? false,
                edit: currentModulePerms.edit ?? false,
                delete: currentModulePerms.delete ?? false,
            };

            if (action === "view") {
                const newView = !allChecked;
                updated[m] = {
                    ...base,
                    view: newView,
                    // When turning view off for all, also clear other actions
                    create: newView ? base.create : false,
                    edit: newView ? base.edit : false,
                    delete: newView ? base.delete : false,
                };
            } else {
                const newValue = !allChecked;
                updated[m] = {
                    ...base,
                    [action]: newValue,
                    // Enabling any non-view action across modules forces view = true
                    view: newValue ? true : base.view,
                };
            }
        });
        onChange(updated);
    };

    return (
        <div className="overflow-x-auto rounded-xl border border-[#252525]">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-[#252525]">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider bg-[#111113] w-48">
                            Module
                        </th>
                        {ACTIONS.map((action) => (
                            <th
                                key={action}
                                className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider bg-[#111113] min-w-[80px]"
                            >
                                <div className="flex flex-col items-center gap-1.5">
                                    <span>{action}</span>
                                    {editable && (
                                        <button
                                            type="button"
                                            onClick={() => toggleAll(action)}
                                            className="text-[9px] text-[#00EEFF]/60 hover:text-[#00EEFF] transition-colors font-normal"
                                        >
                                            All
                                        </button>
                                    )}
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {MODULES.map((mod, i) => (
                        <tr
                            key={mod}
                            className={`border-b border-[#1E1E1E] transition-colors ${editable ? "hover:bg-[#1E1E20]" : ""} ${i % 2 === 0 ? "bg-[#18191B]" : "bg-[#141416]"}`}
                        >
                            <td className="px-4 py-3 font-medium text-gray-200 text-sm">{mod}</td>
                            {ACTIONS.map((action) => {
                                const isViewOnly = VIEW_ONLY_MODULES.includes(mod) && action !== "view";
                                const modulePerms = permissions[mod] || ({} as Record<Action, boolean>);
                                const checked = modulePerms[action] ?? false;
                                const hasView = modulePerms.view ?? false;
                                const disabled = !editable || isViewOnly || (!hasView && action !== "view");
                                return (
                                    <td key={action} className="px-4 py-3 text-center">
                                        <div
                                            className="inline-flex mx-auto rounded"
                                            style={checked && !isViewOnly
                                                ? { padding: "1px", background: "linear-gradient(135deg, #00EEFF, #0051FF)" }
                                                : {}}
                                        >
                                            <button
                                                type="button"
                                                onClick={() => toggle(mod, action)}
                                                disabled={disabled}
                                                className={`w-5 h-5 rounded flex items-center justify-center transition-all duration-150 ${disabled ? "opacity-20 cursor-not-allowed" : editable ? "cursor-pointer" : "cursor-default"
                                                    }`}
                                                style={checked && !isViewOnly
                                                    ? { background: "#111113" }
                                                    : { border: "1px solid #2A2A2A", background: "#111113" }
                                                }
                                            >
                                                {checked && !isViewOnly && (
                                                    <Check className="w-3 h-3" style={{ color: "#00EEFF" }} strokeWidth={2.5} />
                                                )}
                                            </button>
                                        </div>
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default RolePermissionMatrix;
