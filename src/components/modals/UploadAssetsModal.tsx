import React, { useState, useRef, useCallback, useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  uploadAssetComplete,
  getPresignedUrl,
  validateUrl,
  getDuration,
  uploadFileToPresignedUrl,
  uploadBumper,
  uploadGraphic,
  uploadOverlay
} from "@/api/assetApi";
import { toast } from "sonner";

export type AssetType = "bumper" | "graphic" | "overlay";

type FormDataState = {
  name: string;
  url: string;
  sport: string;
  competition: string;
  delay?: string;
};

interface UploadAssetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  assetType: AssetType;
  onUpload: (data: any) => void;
  userId: string;
  folderId: string;
}

const UploadAssetsModal: React.FC<UploadAssetsModalProps> = ({
  isOpen,
  onClose,
  assetType,
  onUpload,
  userId,
  folderId,
}) => {

  const [activeTab, setActiveTab] = useState<AssetType>(assetType);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [formData, setFormData] = useState<FormDataState>({
    name: "",
    url: "",
    sport: "",
    competition: "",
    delay: "",
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isUploading, setIsUploading] = useState(false);
  const [isUrlValid, setIsUrlValid] = useState(false);
  const [isValidatingUrl, setIsValidatingUrl] = useState(false);
  const [hasValidationAttempted, setHasValidationAttempted] = useState(false);
  const [presignedUrl, setPresignedUrl] = useState<string>("");
  const [publicUrl, setPublicUrl] = useState<string>("");
  const [uploadEnabled, setUploadEnabled] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update activeTab whenever assetType prop changes
  useEffect(() => {
    setActiveTab(assetType);
  }, [assetType]);

  // File validation rules based on asset type
  const getValidationRules = (type: AssetType) => {
    const rules = {
      bumper: {
        maxSize: 100 * 1024 * 1024, // 100MB
        allowedTypes: ['video/mp4', 'application/octet-stream'],
        allowedExtensions: ['.mp4'],
      },
      graphic: {
        maxSize: 100 * 1024 * 1024, // 100MB
        allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'application/octet-stream'],
        allowedExtensions: ['.jpg', '.jpeg', '.png'],
      },
      overlay: {
        maxSize: 100 * 1024 * 1024, // 100MB
        allowedTypes: ['video/quicktime', 'video/mov', 'application/octet-stream'],
        allowedExtensions: ['.mov', '.quicktime'],
      },
    };
    return rules[type];
  };

  const validateFile = (file: File) => {
    const rules = getValidationRules(activeTab);
    const errors: string[] = [];

    // Check file size
    if (file.size > rules.maxSize) {
      errors.push(`File must not be larger than 100 MB.`);
    }

    // Check file type
    const isValidType = rules.allowedTypes.includes(file.type) ||
      rules.allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext));

    if (!isValidType) {
      let allowedFormats = '';
      if (activeTab === 'bumper') {
        allowedFormats = 'mp4, octet-stream';
      } else if (activeTab === 'graphic') {
        allowedFormats = 'jpg, jpeg, png, octet-stream';
      } else if (activeTab === 'overlay') {
        allowedFormats = 'quicktime, mov';
      }
      errors.push(`Only allows files in the ${allowedFormats} format.`);
    }

    return errors;
  };

  const handleFileSelect = async (file: File) => {
    const validationErrors = validateFile(file);

    if (validationErrors.length > 0) {
      setErrors({ file: validationErrors.join(' ') });
      return;
    }

    setSelectedFile(file);
    setFormData(prev => ({ ...prev, name: file.name.replace(/\.[^/.]+$/, "") }));
    setErrors(prev => ({ ...prev, file: '' }));

    // Reset validation states
    setIsUrlValid(false);
    setUploadEnabled(false);
    setHasValidationAttempted(false);
    setPresignedUrl("");
    setPublicUrl("");

    // For bumpers and overlays, generate presigned URL and validate
    if (activeTab === 'bumper' || activeTab === 'overlay') {
      await handlePresignedUrlGeneration(file);
    } else if (activeTab === 'graphic') {
      // For graphics, generate presigned URL but skip validation
      await handleGraphicPresignedUrlGeneration(file);
    } else {
      // For other asset types, enable upload immediately
      setUploadEnabled(true);
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  }, [activeTab]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleGraphicPresignedUrlGeneration = async (file: File) => {
    try {
      setIsValidatingUrl(true);

      // Generate presigned URL for graphics (no validation needed)
      const presignedResponse = await getPresignedUrl({
        userId,
        fileName: file.name,
        contentType: file.type
      });

      if (!presignedResponse.success) {
        throw new Error(presignedResponse.message || 'Failed to generate presigned URL');
      }

      const { presignedUrl: newPresignedUrl, s3Url: newPublicUrl } = presignedResponse;
      setPresignedUrl(newPresignedUrl);
      setPublicUrl(newPublicUrl);

      // For graphics, enable upload immediately (no validation required)
      setUploadEnabled(true);
      toast.success('File ready for upload!');
    } catch (error: any) {
      console.error('Presigned URL generation error:', error);
      toast.error(error.message || 'Failed to generate presigned URL');
      setUploadEnabled(false);
    } finally {
      setIsValidatingUrl(false);
    }
  };

  const handlePresignedUrlGeneration = async (file: File) => {
    try {
      setIsValidatingUrl(true);

      // Step 1: Generate presigned URL
      const presignedResponse = await getPresignedUrl({
        userId,
        fileName: file.name,
        contentType: file.type
      });
      if (!presignedResponse?.success) {
        throw new Error(presignedResponse.message);
      }

      const { presignedUrl: newPresignedUrl, s3Url: newPublicUrl } = presignedResponse;
      setPresignedUrl(newPresignedUrl);
      setPublicUrl(newPublicUrl);

      // Step 2: Validate the presigned URL
      setHasValidationAttempted(true);
      const validateResponse = await validateUrl({ url: newPublicUrl });

      if (validateResponse?.success) {
        setIsUrlValid(true);
        setUploadEnabled(true);
        toast.success('URL validated successfully. You can now upload the asset.');
      } else {
        setIsUrlValid(false);
        setUploadEnabled(false);
        toast.error('URL validation failed. Please try again.');
      }
    } catch (error: any) {
      console.error('Presigned URL generation/validation error:', error);
      toast.error(error.message || 'Failed to generate or validate URL');
      setIsUrlValid(false);
      setUploadEnabled(false);
    } finally {
      setIsValidatingUrl(false);
    }
  };

  const handleSubmit = async () => {
    const newErrors: { [key: string]: string } = {};

    if (!selectedFile && !formData.url) {
      newErrors.file = 'Please select a file or enter a URL';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Asset name is required';
    }

    // URL upload is not supported yet, only file upload
    if (formData.url && !selectedFile) {
      newErrors.file = 'URL upload is not supported yet. Please select a file.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (!selectedFile) {
      setErrors({ file: 'Please select a file' });
      return;
    }

    // For bumpers and overlays, check if upload is enabled after validation
    if ((activeTab === 'bumper' || activeTab === 'overlay') && !uploadEnabled) {
      toast.error('Please wait for URL validation to complete before uploading.');
      return;
    }

    // For graphics, check if presigned URL is available
    if (activeTab === 'graphic' && (!presignedUrl || !publicUrl)) {
      toast.error('Please wait for file processing to complete before uploading.');
      return;
    }

    setIsUploading(true);

    // Show initial notification
    toast.info('File uploading has been initiated');
    onClose();
    try {
      if (activeTab === 'bumper' || activeTab === 'overlay') {
        // Custom workflow for video assets
        await handleVideoAssetUpload();
      } else if (activeTab === 'graphic') {
        // Graphics workflow using pre-generated presigned URL
        // Step 1: Upload file to presigned URL (already generated when file was selected)
        const uploadSuccess = await uploadFileToPresignedUrl(presignedUrl, selectedFile);
        console.log({ uploadSuccess });
        if (!uploadSuccess) {
          throw new Error('Failed to upload file to storage');
        }

        // Step 2: Create graphic record using uploadGraphic API with simplified payload
        const result = await uploadGraphic({
          url: publicUrl,
          userId,
          title: formData.name,
          sport: formData.sport || undefined,
          competition: formData.competition || undefined,
          contentType: selectedFile.type,
        });
        if (result?.success) {
          toast.success(`${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} uploaded successfully!`);
          onUpload(true);
          handleClose();
        } else {
          toast.error(result.message || 'Upload failed');
        }
      } else {
        // Fallback for other asset types
        throw new Error(`Unsupported asset type: ${activeTab}`);
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleVideoAssetUpload = async () => {
    if (!selectedFile || !presignedUrl) {
      throw new Error('Missing file or presigned URL');
    }

    // Step 1: Upload file to presigned URL
    const uploadSuccess = await uploadFileToPresignedUrl(presignedUrl, selectedFile);
    if (!uploadSuccess) {
      throw new Error('Failed to upload file to storage');
    }

    // Step 2: Get duration and aspect ratio for video assets
    let duration: number | undefined;
    let aspectRatio: string | undefined;
    try {
      const durationResponse = await getDuration({ url: publicUrl });
      if (durationResponse?.status) {
        duration = (durationResponse as any)?.duration ?? (durationResponse as any)?.data?.duration;
        aspectRatio = (durationResponse as any)?.aspect_ratio || undefined;
      }
    } catch (error) {
      console.warn('Failed to get video duration:', error);
    }

    const assetData: any = {
      userId,
      title: formData.name,
      sport: formData.sport || undefined,
      competition: formData.competition || undefined,
      url: publicUrl,
      contentType: selectedFile.type,
      duration: duration,
      aspectRatio: aspectRatio,
    };
    // if (activeTab === 'bumper' && aspectRatio) {
    //   assetData.aspectRatio = aspectRatio;
    // }

    let uploadResponse;
    if (activeTab === 'bumper') {
      uploadResponse = await uploadBumper(assetData);
    } else {
      // include aspect ratio for overlays too if available
      if (aspectRatio) assetData.aspect_ratio = aspectRatio;
      if (formData.delay) {
        const delayNum = Number(formData.delay);
        if (!Number.isNaN(delayNum)) assetData.delay = delayNum;
      }
      uploadResponse = await uploadOverlay(assetData);
    }

    if (uploadResponse?.success) {
      toast.success(`${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} uploaded successfully!`);
      onUpload(true);
      handleClose();
    } else {
      throw new Error(uploadResponse.message || 'Upload failed');
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setFormData({ name: "", url: "", sport: "", competition: "", delay: "" });
    setErrors({});
    setDragActive(false);
    setIsValidatingUrl(false);
    setIsUrlValid(false);
    setHasValidationAttempted(false);
    setPresignedUrl("");
    setPublicUrl("");
    setUploadEnabled(false);
    onClose();
  };

  const sportOptions = [
    { value: "football", label: "Football" },
    { value: "basketball", label: "Basketball" },
    { value: "soccer", label: "Soccer" },
    { value: "baseball", label: "Baseball" },
    { value: "tennis", label: "Tennis" },
    { value: "hockey", label: "Hockey" },
  ];

  const competitionOptions = [
    { value: "uefa-champions-league", label: "UEFA Champions League" },
    { value: "premier-league", label: "Premier League" },
    { value: "nba", label: "NBA" },
    { value: "nfl", label: "NFL" },
    { value: "world-cup", label: "World Cup" },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-90 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-[550px] max-h-[795px] mx-4 bg-black border-2 border-[#373737] overflow-hidden"
        style={{
          borderRadius: "50px",
          height: "min(795px, 90vh)",
        }}
      >
        {/* Header */}
        <div className="relative flex items-center justify-center p-8 pb-6">
          <h2 className="text-2xl font-medium text-white">Upload asset</h2>
          <button
            onClick={handleClose}
            className="absolute right-8 text-white hover:text-gray-300 transition-colors p-1"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M0.000147593 13.9131L13.9131 0.000630463L16 2.0875L2.08709 16L0.000147593 13.9131Z"
                fill="currentColor"
              />
              <path
                d="M15.9999 13.9125L2.08694 0L0 2.08687L13.9129 15.9994L15.9999 13.9125Z"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-8 pb-8 overflow-y-auto max-h-[calc(100%-120px)]">
          {/* Tabs */}
          <div className="flex justify-center mb-8">
            <div className="flex bg-transparent rounded-xl overflow-hidden">
              <button
                onClick={() => {
                  setActiveTab("bumper");
                  // Reset validation states when switching tabs
                  setSelectedFile(null);
                  setIsUrlValid(false);
                  setUploadEnabled(false);
                  setHasValidationAttempted(false);
                  setPresignedUrl("");
                  setPublicUrl("");
                  setIsValidatingUrl(false);
                }}
                className={`px-6 py-3 text-base font-medium transition-colors rounded-xl border ${activeTab === "bumper"
                  ? "border-white text-white bg-transparent"
                  : "border-[#252525] text-white bg-transparent"
                  }`}
              >
                Bumper
              </button>
              <button
                onClick={() => {
                  setActiveTab("graphic");
                  // Reset validation states when switching tabs
                  setSelectedFile(null);
                  setIsUrlValid(false);
                  setUploadEnabled(false);
                  setHasValidationAttempted(false);
                  setPresignedUrl("");
                  setPublicUrl("");
                  setIsValidatingUrl(false);
                }}
                className={`px-6 py-3 text-base font-medium transition-colors rounded-xl border ${activeTab === "graphic"
                  ? "border-white text-white bg-transparent"
                  : "border-[#252525] text-white bg-transparent"
                  }`}
              >
                Graphic
              </button>
              <button
                onClick={() => {
                  setActiveTab("overlay");
                  // Reset validation states when switching tabs
                  setSelectedFile(null);
                  setIsUrlValid(false);
                  setUploadEnabled(false);
                  setHasValidationAttempted(false);
                  setPresignedUrl("");
                  setPublicUrl("");
                  setIsValidatingUrl(false);
                }}
                className={`px-6 py-3 text-base font-medium transition-colors rounded-xl border ${activeTab === "overlay"
                  ? "border-white text-white bg-transparent"
                  : "border-[#252525] text-white bg-transparent"
                  }`}
              >
                Overlay
              </button>
            </div>
          </div>

          {/* Upload Area */}
          <div className="mb-8">
            {/* Drag & Drop Area */}
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${dragActive || selectedFile
                ? "border-[#00BBFF] bg-[#00BBFF]/5"
                : "border-[#252525]"
                }`}
              style={{ height: "265px" }}
              onDragEnter={handleDragIn}
              onDragLeave={handleDragOut}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center justify-center h-full">
                {selectedFile ? (
                  <div className="text-center">
                    <div className="w-16 h-16 bg-[#00BBFF] rounded-xl flex items-center justify-center mb-4 mx-auto">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="white" strokeWidth="2" />
                        <polyline points="14,2 14,8 20,8" stroke="white" strokeWidth="2" />
                      </svg>
                    </div>
                    <p className="text-white text-sm font-medium">{selectedFile.name}</p>
                    <p className="text-gray-400 text-xs mt-1">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>

                    {/* Validation Status for Bumpers and Overlays */}
                    {(activeTab === 'bumper' || activeTab === 'overlay') && hasValidationAttempted && (
                      <div className="mt-3">
                        {isValidatingUrl ? (
                          <div className="flex items-center justify-center gap-2 text-yellow-400">
                            <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-xs">Validating URL...</span>
                          </div>
                        ) : isUrlValid ? (
                          <div className="flex items-center justify-center gap-2 text-green-400">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                              <path d="M13.5 4.5L6 12L2.5 8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <span className="text-xs">URL validated - Ready to upload</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2 text-red-400">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                              <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <span className="text-xs">URL validation failed</span>
                          </div>
                        )}
                      </div>
                    )}

                    <button
                      onClick={() => {
                        setSelectedFile(null);
                        setIsUrlValid(false);
                        setUploadEnabled(false);
                        setHasValidationAttempted(false);
                        setPresignedUrl("");
                        setPublicUrl("");
                      }}
                      className="bg-[#1B1B1B] border-2 border-[#00BBFF] text-white px-6 py-3 rounded-2xl hover:bg-[#252525] transition-colors font-semibold mt-4"
                    >
                      Replace file
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="mb-4 flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="14" viewBox="0 0 16 14" fill="none">
                        <path d="M14 1.55556H1.55556V12.4444L8.78267 5.21578C8.92852 5.06997 9.12632 4.98806 9.33256 4.98806C9.53879 4.98806 9.73659 5.06997 9.88245 5.21578L14 9.34111V1.55556ZM0 0.772333C0.00142337 0.568072 0.0831447 0.372569 0.22751 0.228058C0.371875 0.0835473 0.567296 0.00162917 0.771556 0H14.784C15.2102 0 15.5556 0.346111 15.5556 0.772333V13.2277C15.5541 13.4319 15.4724 13.6274 15.328 13.7719C15.1837 13.9165 14.9883 13.9984 14.784 14H0.771556C0.566855 13.9998 0.370609 13.9183 0.225936 13.7735C0.0812638 13.6287 -1.03798e-07 13.4324 0 13.2277V0.772333ZM4.66667 6.22222C4.25411 6.22222 3.85845 6.05833 3.56672 5.76661C3.275 5.47489 3.11111 5.07923 3.11111 4.66667C3.11111 4.25411 3.275 3.85845 3.56672 3.56672C3.85845 3.275 4.25411 3.11111 4.66667 3.11111C5.07923 3.11111 5.47489 3.275 5.76661 3.56672C6.05833 3.85845 6.22222 4.25411 6.22222 4.66667C6.22222 5.07923 6.05833 5.47489 5.76661 5.76661C5.47489 6.05833 5.07923 6.22222 4.66667 6.22222Z" fill="url(#paint0_linear_2908_6696)" />
                        <defs>
                          <linearGradient id="paint0_linear_2908_6696" x1="21.2333" y1="7.08304" x2="6.15109" y2="-3.86012" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#00BBFF" />
                            <stop offset="1" stopColor="#0051FF" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <p className="text-white text-sm font-medium">Drag & drop here</p>
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-[#1B1B1B] border-2 border-[#00BBFF] text-white px-6 py-3 rounded-2xl hover:bg-[#252525] transition-colors font-semibold mb-4"
                    >
                      Select file to upload
                    </button>

                    <div className="text-white text-sm font-medium mb-4">or</div>

                    {/* URL Input inside dotted box */}
                    <div className="w-full max-w-md">
                      <Input
                        type="url"
                        value={formData.url}
                        onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                        placeholder="Enter URL"
                        className="bg-[#252525] border-none text-white placeholder:text-[#707070] h-12 text-base rounded-xl w-full"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {errors.file && (
              <p className="text-red-400 text-sm mt-2">{errors.file}</p>
            )}

            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileInputChange}
              className="hidden"
              accept={(() => {
                if (activeTab === 'bumper') return '.mp4';
                if (activeTab === 'graphic') return '.jpg,.jpeg,.png';
                if (activeTab === 'overlay') return '.mov,.quicktime';
                return '';
              })()}
            />
          </div>

          {/* Form Fields */}
          <div className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Name
              </label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter asset name"
                className="bg-[#252525] border-none text-white placeholder:text-[#707070] h-12 text-base rounded-xl"
              />
              {errors.name && (
                <p className="text-red-400 text-sm mt-1">{errors.name}</p>
              )}
            </div>
{/* 
            {activeTab === 'overlay' && (
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Delay (seconds)
                </label>
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={formData.delay ?? ""}
                  onChange={(e) => {
                    const raw = (e.target.value || '').replace(/\D/g, '').slice(0, 3);
                    setFormData(prev => ({ ...prev, delay: raw }));
                  }}
                  placeholder="0-999"
                  className="bg-[#252525] border-none text-white placeholder:text-[#707070] h-12 text-base rounded-xl"
                />
                <p className="text-[#707070] text-xs mt-1">Only numbers up to 3 digits allowed</p>
              </div>
            )} */}

            {/* Sport (Optional) */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Sport (optional)
              </label>
              <Select
                value={formData.sport}
                onValueChange={(value) => setFormData(prev => ({ ...prev, sport: value }))}
              >
                <SelectTrigger className="bg-[#252525] border-none text-white h-12 text-base rounded-xl">
                  <SelectValue placeholder="Select sport" className="text-[#707070]" />
                </SelectTrigger>
                <SelectContent className="bg-[#252525] border-[#373737] rounded-xl">
                  {sportOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value} className="text-white">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Competition (Optional) */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Competition (optional)
              </label>
              <Select
                value={formData.competition}
                onValueChange={(value) => setFormData(prev => ({ ...prev, competition: value }))}
              >
                <SelectTrigger className="bg-[#252525] border-none text-white h-12 text-base rounded-xl">
                  <SelectValue placeholder="UEFA Champions League" className="text-[#707070]" />
                </SelectTrigger>
                <SelectContent className="bg-[#252525] border-[#373737] rounded-xl">
                  {competitionOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value} className="text-white">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-5 pt-8">
            <Button
              onClick={handleClose}
              className="flex-1 bg-[#1B1B1B] text-white hover:bg-[#252525] h-12 text-sm font-medium rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isUploading || !uploadEnabled || isValidatingUrl}
              className="flex-1 bg-gradient-to-r from-[#00BBFF] to-[#0051FF] text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed h-12 text-sm font-medium rounded-xl"
            >
              {isUploading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Uploading...
                </div>
              ) : isValidatingUrl ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Validating...
                </div>
              ) : (
                'Upload asset'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadAssetsModal;
