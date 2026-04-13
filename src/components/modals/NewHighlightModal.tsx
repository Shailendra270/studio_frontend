import React, { useState, useEffect } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { X, Sparkles } from "lucide-react";
import { Button } from "../ui/button";
import {
  NewHighlightFormData,
  NewHighlightModalProps,
  AspectRatioOption,
} from "../../types/highlight";
import { useAppSelector } from "@/store";
import { selectCompletedClips } from "@/store/slices/clipsSlice";
import { toast } from "sonner";

const validationSchema = Yup.object({
  title: Yup.string()
    .trim()
    .min(2, "Title must be at least 2 characters")
    .max(150, "Title must be at most 150 characters")
    .required("Title is required"),
  aspectRatio: Yup.string().required("Aspect ratio is required"),
});

const GRADIENT_BORDER = "linear-gradient(135deg, #00EEFF33, #0051FF33)";
const GRADIENT_BG = "linear-gradient(135deg, #00EEFF 0%, #0051FF 100%)";

const NewHighlightModal: React.FC<NewHighlightModalProps> = ({
  isOpen,
  onClose,
  selectedClips,
  onCreateHighlight,
}) => {
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  const aspectRatioOptions: AspectRatioOption[] = [
    { id: "16:9", label: "16 : 9", dimensions: "16:9" },
    { id: "9:16", label: "9 : 16", dimensions: "9:16" },
    { id: "9:18", label: "9 : 18", dimensions: "9:18" },
    { id: "3:4", label: "3 : 4", dimensions: "3:4" },
    { id: "1:1", label: "1 : 1", dimensions: "1:1" },
    { id: "4:3", label: "4 : 3", dimensions: "4:3" },
    { id: "4:5", label: "4 : 5", dimensions: "4:5" },
  ];

  const initialValues: NewHighlightFormData = {
    title: "",
    aspectRatio: "",
  };

  const completedClips = useAppSelector(selectCompletedClips) as any[];
  const selectedClipsSet = new Set(selectedClips || []);
  const selectedClipsData = (completedClips || []).filter(
    (c: any) => selectedClipsSet.has(c._id) || selectedClipsSet.has(c.id)
  );
  const clipRatiosSet = new Set(
    selectedClipsData
      .map((c: any) => String(c?.aspectRatio || "").replace(/\s+/g, "").toLowerCase())
      .filter((r: string) => r)
  );
  const non16Set = new Set(
    selectedClipsData
      .map((c: any) => String(c?.aspectRatio || "").replace(/\s+/g, ""))
      .filter((r: string) => r && r !== "16:9")
  );

  const isSelectableAspect = (target: string) => {
    if (non16Set.size === 0) return true;
    if (non16Set.size === 1) {
      const only = Array.from(non16Set)[0];
      return target === only;
    }
    return false;
  };

  // Show warning when selected aspect ratio is not in any clip (clips will be resized / center-cropped)
  const selectedRatioNormalized = selectedAspectRatio ? selectedAspectRatio.replace(/\s+/g, "").toLowerCase() : "";
  const hasNoClipsInSelectedRatio =
    selectedRatioNormalized &&
    selectedClipsData.length > 0 &&
    !clipRatiosSet.has(selectedRatioNormalized);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !submitting && !redirecting) {
      onClose();
    }
  };

  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting && !redirecting) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscapeKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose, submitting, redirecting]);

  const handleAspectRatioChange = (ratioId: string, setFieldValue: any) => {
    if (!isSelectableAspect(ratioId)) {
      toast.info("Some clips cannot be converted into the selected aspect ratio.");
      return;
    }
    setSelectedAspectRatio(ratioId);
    setFieldValue("aspectRatio", ratioId);
  };

  const renderAspectRatioIcon = (dimensions: string) => {
    const [width, height] = dimensions.split(":").map(Number);
    const aspectRatio = width / height;
    let iconWidth, iconHeight;
    if (aspectRatio > 1) {
      iconWidth = 24;
      iconHeight = 24 / aspectRatio;
    } else {
      iconHeight = 24;
      iconWidth = 24 * aspectRatio;
    }
    return (
      <div
        className="border border-white/80 rounded-sm shrink-0"
        style={{
          width: `${iconWidth}px`,
          height: `${iconHeight}px`,
          minWidth: `${iconWidth}px`,
          minHeight: `${iconHeight}px`,
        }}
      />
    );
  };

  const handleSubmit = async (values: NewHighlightFormData) => {
    setSubmitting(true);
    try {
      const result = onCreateHighlight(values);
      const promise = result as Promise<void> | undefined;
      if (promise && typeof promise.then === "function") {
        await promise;
      } else {
        onClose();
        setSubmitting(false);
        return;
      }
      setRedirecting(true);
      await new Promise((r) => setTimeout(r, 1800));
      onClose();
    } catch {
      // Parent shows toast
    } finally {
      setSubmitting(false);
      setRedirecting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleOverlayClick}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleOverlayClick} />
      <div
        className="relative w-full max-w-[550px] max-h-[95vh] flex flex-col rounded-2xl p-px"
        style={{ background: GRADIENT_BORDER, animation: "slideUp 0.25s cubic-bezier(.22,1,.36,1)" }}
      >
        <div className="rounded-2xl bg-[#18191B] overflow-hidden flex flex-col flex-1 min-h-0">
          {/* Header — same as AddUserModal */}
          <div className="relative px-6 py-4 border-b border-[#252525] shrink-0">
            <div className="absolute inset-0 opacity-5 rounded-t-2xl" style={{ background: GRADIENT_BG }} />
            <div className="relative flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: GRADIENT_BG }}>
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-white font-montserrat leading-snug">Create new highlight</h2>
                <p className="text-xs text-gray-400 mt-0">Choose title and aspect ratio</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={submitting || redirecting}
                className="ml-auto p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#252525] transition-all disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Loading overlay */}
          {(submitting || redirecting) && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 rounded-2xl bg-[#18191B]/95 backdrop-blur-sm">
              <div className="w-12 h-12 rounded-xl border-2 border-transparent animate-spin" style={{ borderTopColor: "#00EEFF", borderRightColor: "#0051FF" }} />
              <p className="text-sm font-medium text-white">
                {redirecting ? "Yoho, you're ready! Redirecting to editor…" : "Creating highlight…"}
              </p>
            </div>
          )}

          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ values, setFieldValue, errors, touched, isValid }) => (
              <Form className="flex flex-col flex-1 min-h-0">
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <Field
                      name="title"
                      type="text"
                      placeholder="Enter highlight title"
                      className={`w-full pl-4 pr-4 py-2.5 rounded-lg bg-[#111113] border text-white text-sm placeholder-gray-600 outline-none transition-all focus:border-[#00EEFF] focus:ring-0 ${
                        errors.title && touched.title ? "border-red-500" : "border-[#2A2A2A]"
                      }`}
                    />
                    <ErrorMessage name="title" component="div" className="text-red-500 text-xs mt-1" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Aspect ratio <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-4 gap-3">
                      {aspectRatioOptions.map((ratio) => {
                        const selectable = isSelectableAspect(ratio.id.replace(/\s+/g, ""));
                        const selected = selectedAspectRatio === ratio.id;
                        const ratioNotInClips = selected && hasNoClipsInSelectedRatio;
                        return (
                          <div
                            key={ratio.id}
                            className="rounded-xl transition-all cursor-pointer"
                            style={
                              selected
                                ? { padding: "1px", background: ratioNotInClips ? "linear-gradient(135deg, #FF7A7A, #CC5555)" : GRADIENT_BG }
                                : {}
                            }
                            onClick={() => selectable && handleAspectRatioChange(ratio.id, setFieldValue)}
                            title={selectable ? undefined : "Some clips cannot be converted into the selected aspect ratio."}
                          >
                            <div
                              className={`flex items-center justify-center gap-2 h-11 rounded-[11px] transition-colors ${
                                selected
                                  ? "bg-[#18191B]"
                                  : selectable
                                  ? "border border-[#252525] hover:border-[#00EEFF]/50 bg-[#111113]"
                                  : "border border-[#252525] opacity-50 cursor-not-allowed bg-[#111113]"
                              } ${ratioNotInClips ? "ring-1 ring-red-500/80" : ""}`}
                            >
                              {renderAspectRatioIcon(ratio.dimensions)}
                              <span className="text-sm font-medium text-white">{ratio.label}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {hasNoClipsInSelectedRatio && (
                      <div className="mt-2 rounded-xl p-3 border border-red-500/50 bg-red-500/10">
                        <p className="text-sm text-red-400">
                          Clips are not in sync with the highlight aspect ratio ({selectedAspectRatio}). They will be resized (center-crop) when you create the highlight.
                        </p>
                      </div>
                    )}
                    <ErrorMessage name="aspectRatio" component="div" className="text-red-500 text-xs mt-1" />
                  </div>
                </div>

                <div className="shrink-0 flex items-center justify-center gap-4 px-6 py-5 border-t border-[#252525]">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={submitting || redirecting}
                    className="rounded-xl h-10 px-5 text-sm font-medium border min-w-[120px] bg-transparent text-white hover:bg-[#252525] border-[#00EEFF]/50 hover:border-[#00EEFF]"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={!isValid || !values.title.trim() || !values.aspectRatio || submitting || redirecting}
                    className="rounded-xl h-10 px-5 text-sm font-medium min-w-[120px] text-white border-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={
                      isValid && values.title.trim() && values.aspectRatio && !submitting && !redirecting
                        ? { background: GRADIENT_BG }
                        : { background: "#373737", color: "#707070" }
                    }
                  >
                    Create
                  </Button>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </div>
      <style>{`@keyframes slideUp { from { opacity:0; transform:translateY(20px) scale(0.97) } to { opacity:1; transform:translateY(0) scale(1) } }`}</style>
    </div>
  );
};

export default NewHighlightModal;
