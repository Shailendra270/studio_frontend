import React, { useState, useEffect, useRef } from "react";
import { X, Building2, Mail, Phone, Eye, EyeOff, ImagePlus } from "lucide-react";

interface CreateOrganizationModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: OrgFormData, logoFile?: File | null) => Promise<void>;
  initialData?: Partial<OrgFormData>;
  mode?: "create" | "edit";
}

export interface OrgFormData {
  name: string;
  contactEmail: string;
  contactPhone: string;
  status: "Active" | "Suspended";
  logoUrl?: string | null;
  createAdminAccount?: boolean;
  password?: string;
  confirmPassword?: string;
}


const CreateOrganizationModal: React.FC<CreateOrganizationModalProps> = ({
  open,
  onClose,
  onSubmit,
  initialData,
  mode = "create",
}) => {
  const [form, setForm] = useState<OrgFormData>({
    name: "",
    contactEmail: "",
    contactPhone: "",
    status: "Active",
    createAdminAccount: false,
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof OrgFormData, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [visible, setVisible] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setVisible(true);
      if (initialData) setForm((prev) => ({ ...prev, ...initialData }));
    } else {
      setVisible(false);
    }
  }, [open, initialData]);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof OrgFormData, string>> = {};
    if (!form.name.trim()) {
      newErrors.name = "Organization name is required";
    } else {
      if (form.name.length > 15) {
        newErrors.name = "Organization name must be at most 15 characters";
      } else if (!/^[A-Za-z0-9\s]+$/.test(form.name)) {
        newErrors.name = "Organization name can only contain letters, numbers and spaces";
      }
    }

    if (!form.contactEmail.trim()) newErrors.contactEmail = "Contact email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail))
      newErrors.contactEmail = "Enter a valid email address";

    if (form.contactPhone.trim()) {
      if (!/^[0-9]{9,15}$/.test(form.contactPhone.trim())) {
        newErrors.contactPhone = "Contact phone must be 9 to 15 digits";
      }
    }

    // Password is mandatory, must be at least 6 chars, and match confirm password
    if (!form.password) {
      newErrors.password = "Password is required";
    } else if (form.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    if (!form.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    }
    if (
      form.password &&
      form.confirmPassword &&
      form.password !== form.confirmPassword
    ) {
      newErrors.confirmPassword = "Passwords do not match";
      // Only override existing password error if there isn't a more specific one
      if (!newErrors.password) {
        newErrors.password = "Passwords do not match";
      }
    }

    setErrors(newErrors);
    setFormError(null);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const dataToSubmit = { ...form };
      if (dataToSubmit.logoUrl) delete dataToSubmit.logoUrl;
      await onSubmit(dataToSubmit as OrgFormData, logoFile || undefined);
      handleClose();
    } catch (err: any) {
      const message = err?.message || "Failed to create organization";
      const lower = message.toLowerCase();

      setFormError(null);

      if (lower.includes("password")) {
        setErrors((prev) => ({
          ...prev,
          password: message,
          confirmPassword: message.includes("match") ? message : prev.confirmPassword,
        }));
      } else if (lower.includes("email")) {
        // Includes both standard uniqueness and soft-delete grace-period messages
        setErrors((prev) => ({
          ...prev,
          contactEmail: message,
        }));
      } else if (lower.includes("organization") && lower.includes("name")) {
        setErrors((prev) => ({
          ...prev,
          name: message,
        }));
      } else {
        setFormError(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setForm({
      name: "",
      contactEmail: "",
      contactPhone: "",
      status: "Active",
      createAdminAccount: false,
      password: "",
      confirmPassword: "",
    });
    setLogoFile(null);
    setLogoPreview(null);
    setErrors({});
    setFormError(null);
    onClose();
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };
  const clearLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    if (logoInputRef.current) logoInputRef.current.value = "";
  };

  if (!open && !visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ animation: open ? "fadeIn 0.2s ease" : "fadeOut 0.2s ease" }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg"
        style={{ animation: open ? "slideUp 0.25s cubic-bezier(.22,1,.36,1)" : undefined }}
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
              <div className="relative flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #00EEFF 0%, #0051FF 100%)" }}
                >
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white font-montserrat leading-snug mt-3 mb-0">
                    {mode === "create" ? "Create Organization" : "Edit Organization"}
                  </h2>
                  <p className="text-xs text-gray-400 mt-0">
                    {mode === "create"
                      ? "Set up a new organization on the platform"
                      : "Update organization details"}
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  className="ml-auto p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#252525] transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              {formError && (
                <div className="mb-1 rounded-md border border-red-500/60 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                  {formError}
                </div>
              )}
              {/* Org Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Organization Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => {
                      const rawValue = e.target.value;
                      const cleaned = rawValue.replace(/[^A-Za-z0-9\s]/g, "");
                      const limited = cleaned.slice(0, 15);
                      setForm({ ...form, name: limited });
                      setErrors({ ...errors, name: undefined });
                    }}
                    placeholder="e.g. Acme Sports"
                    className={`w-full pl-9 pr-4 py-2.5 rounded-lg bg-[#111113] border text-white text-sm placeholder-gray-600 outline-none transition-all focus:border-[#00EEFF] focus:ring-0 ${errors.name ? "border-red-500" : "border-[#2A2A2A]"}`}
                  />
                </div>
                {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
              </div>

              {/* Contact Email */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Contact Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="email"
                    value={form.contactEmail}
                    onChange={(e) => { setForm({ ...form, contactEmail: e.target.value }); setErrors({ ...errors, contactEmail: undefined }); }}
                    placeholder="admin@acmesports.com"
                    className={`w-full pl-9 pr-4 py-2.5 rounded-lg bg-[#111113] border text-white text-sm placeholder-gray-600 outline-none transition-all focus:border-[#00EEFF] focus:ring-0 ${errors.contactEmail ? "border-red-500" : "border-[#2A2A2A]"}`}
                  />
                </div>
                {errors.contactEmail && <p className="text-xs text-red-400 mt-1">{errors.contactEmail}</p>}
              </div>

              {/* Contact Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Contact Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    value={form.contactPhone}
                    onChange={(e) => {
                      const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 15);
                      setForm({ ...form, contactPhone: digitsOnly });
                      setErrors({ ...errors, contactPhone: undefined });
                    }}
                    placeholder="e.g. 123456789"
                    className={`w-full pl-9 pr-4 py-2.5 rounded-lg bg-[#111113] border text-white text-sm placeholder-gray-600 outline-none transition-all focus:border-[#00EEFF] focus:ring-0 ${errors.contactPhone ? "border-red-500" : "border-[#2A2A2A]"}`}
                  />
                </div>
                {errors.contactPhone && <p className="text-xs text-red-400 mt-1">{errors.contactPhone}</p>}
              </div>

              {/* Organization Logo (optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Organization Logo (optional)</label>
                <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-xl bg-[#111113] border border-[#2A2A2A] flex items-center justify-center overflow-hidden flex-shrink-0">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo preview" className="w-full h-full object-contain" />
                    ) : (initialData?.logoUrl && mode === "edit") ? (
                      <img src={initialData.logoUrl} alt="Current logo" className="w-full h-full object-contain" />
                    ) : (
                      <ImagePlus className="w-6 h-6 text-gray-500" />
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <button type="button" onClick={() => logoInputRef.current?.click()} className="text-sm text-[#00EEFF] hover:underline">
                      {logoPreview || (initialData?.logoUrl && mode === "edit") ? "Change" : "Upload"} logo
                    </button>
                    {(logoPreview || logoFile) && <button type="button" onClick={clearLogo} className="text-xs text-gray-500 hover:text-gray-300">Remove</button>}
                  </div>
                </div>
              </div>

              {/* Status (only editable in edit mode) */}
              {mode === "edit" && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Status</label>
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
              )}

              {/* Admin password */}
              <div className="pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                      New Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={form.password || ""}
                        onChange={(e) => {
                          setForm({ ...form, password: e.target.value });
                          setErrors({ ...errors, password: undefined });
                        }}
                        placeholder="Enter password"
                        className={`w-full px-3.5 pr-10 py-2.5 rounded-lg bg-[#111113] border text-white text-sm placeholder-gray-600 outline-none transition-all focus:border-[#00EEFF] focus:ring-0 ${errors.password ? "border-red-500" : "border-[#2A2A2A]"}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-300"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-xs text-red-400 mt-1">{errors.password}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                      Confirm Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={form.confirmPassword || ""}
                        onChange={(e) => {
                          setForm({ ...form, confirmPassword: e.target.value });
                          setErrors({ ...errors, confirmPassword: undefined });
                        }}
                        placeholder="Re-enter password"
                        className={`w-full px-3.5 pr-10 py-2.5 rounded-lg bg-[#111113] border text-white text-sm placeholder-gray-600 outline-none transition-all focus:border-[#00EEFF] focus:ring-0 ${errors.confirmPassword ? "border-red-500" : "border-[#2A2A2A]"}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((v) => !v)}
                        className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-300"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.confirmPassword && <p className="text-xs text-red-400 mt-1">{errors.confirmPassword}</p>}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
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
                  {submitting ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : null}
                  {submitting ? "Creating..." : mode === "create" ? "Create Organization" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes fadeOut { from { opacity: 1 } to { opacity: 0 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px) scale(0.97) } to { opacity: 1; transform: translateY(0) scale(1) } }
      `}</style>
    </div>
  );
};

export default CreateOrganizationModal;
