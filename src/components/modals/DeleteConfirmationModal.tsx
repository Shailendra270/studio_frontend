import React from "react";
import { Button } from "../ui/button";
import { X } from "lucide-react";

interface DeleteConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    /** May return a Promise; modal waits for it before closing. */
    onDelete: () => void | Promise<void>;
    /** Main heading, e.g. "Delete organization?" or "Remove user from organization?" */
    title?: string;
    /** Optional; when not provided and itemName is set, built from itemName */
    description?: string;
    confirmLabel?: string;
    /** Name of the item being deleted; used to build title/description when those are not provided */
    itemName?: string;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
    isOpen,
    onClose,
    onDelete,
    title: titleProp,
    description: descriptionProp,
    confirmLabel,
    itemName,
}) => {
    const name = (itemName ?? "").trim();
    const title = titleProp ?? (name ? `Delete ${name}?` : "Delete?");
    const description = descriptionProp ?? (name ? `Are you sure you want to delete "${name}"? This cannot be undone.` : "Are you sure you want to perform this action? This cannot be undone.");

    // Handle overlay click to close modal
    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const [deleting, setDeleting] = React.useState(false);
    const handleDelete = async () => {
        setDeleting(true);
        try {
            const result = onDelete();
            if (result instanceof Promise) await result;
            onClose();
        } finally {
            setDeleting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={handleOverlayClick}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

            {/* Modal */}
            <div
                className="relative w-full max-w-lg"
                style={{ animation: "slideUp 0.25s cubic-bezier(.22,1,.36,1)" }}
            >
                {/* Gradient border */}
                <div
                    className="rounded-2xl p-px"
                    style={{ background: "linear-gradient(135deg, #00EEFF33, #0051FF33, #00EEFF11)" }}
                >
                    <div className="rounded-2xl bg-[#18191B] overflow-hidden">
                        {/* Header */}
                        <div className="relative px-6 py-4 border-b border-[#252525]">
                            <div
                                className="absolute inset-0 opacity-5"
                                style={{ background: "linear-gradient(135deg, #00EEFF, #0051FF)" }}
                            />
                            <div className="relative flex items-center">
                                <div className="flex-1">
                                    <h2 className="text-lg font-semibold text-white font-montserrat leading-snug mt-1 mb-0 text-center">
                                        {title}
                                    </h2>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="ml-auto p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#252525] transition-all"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="px-6 py-5 space-y-6">
                            <p className="text-sm text-gray-300 text-center">
                                {description}
                            </p>

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 py-2.5 rounded-lg border border-[#2A2A2A] text-gray-300 text-sm font-medium hover:bg-[#252525] transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:pointer-events-none"
                                    style={{ background: "linear-gradient(135deg, #00EEFF, #0051FF)" }}
                                >
                                    {deleting ? "Deleting..." : (confirmLabel || "Yes, continue")}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmationModal;
