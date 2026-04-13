import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogOverlay,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  audioOptions,
  awsRegions,
  bitRateModes,
  fileTypes,
  fpsModes,
  mediaLiveInput,
  mediaStaticInput,
  mediaLiveTemplateOption,
  mediaLiveTemplateRegions,
  streamingType,
} from "@/config/template";
import {
  multiAudioOptions,
} from "@/constants/phase";
import { X } from "lucide-react";

interface VideoTemplateValues {
  name: string;
  width: number | "";
  height: number | "";
  bitrate: number | "";
  bitrateMode: string;
  fps: number | "";
  fpsMode?: string | "";
  region: string;
  liveRegion?: string;
  streamingType: string;
  fileType: string;
  inputType: string;
  templatePreset: string;
  audioCodec: string;
  multiAudio: string;
  maxrate: number | "";
  buffersize: number | "";
  segmentDuration: number | "";
  playlistSize: number | "";
  audioBitrate: string;
  srtMode?: string;
  srtPassphrase?: string;
  srtLatency?: number | "";
  srtPeerLatency?: number | "";
  srtRecvBuffer?: number | "";
  srtSendBuffer?: number | "";
  srtPacketDrop?: number | "";
  srtPacketLatency?: number | "";
}

interface VideoTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (values: VideoTemplateValues) => void;
  initialValues?: Partial<VideoTemplateValues>;
}

const validationSchema = Yup.object({
  name: Yup.string().trim().required("Template name is required"),
  width: Yup.number().typeError("Width must be a number").min(160).max(7680).required("Width is required"),
  height: Yup.number().typeError("Height must be a number").min(90).max(4320).required("Height is required"),
  bitrate: Yup.number().typeError("Bitrate must be a number").min(100).max(50000).required("Bitrate is required"),
  bitrateMode: Yup.string().required("Bitrate mode is required"),
  fps: Yup.number().typeError("FPS must be a number").min(10).max(60).required("FPS is required"),
  fpsMode: Yup.string().required("FPS mode is required"),
  region: Yup.string().required("Region is required"),
  liveRegion: Yup.string().nullable(),
  streamingType: Yup.string().required("Streaming type is required"),
  fileType: Yup.string().required("File type is required"),
  inputType: Yup.string().required("Input type is required"),
  templatePreset: Yup.string().required("Template preset is required"),
  audioCodec: Yup.string().required("Audio codec is required"),
  multiAudio: Yup.string().required("Multi-audio option is required"),
  maxrate: Yup.number().typeError("Maxrate must be a number").min(100).max(100000),
  buffersize: Yup.number().typeError("Bufsize must be a number").min(100).max(100000),
  segmentDuration: Yup.number().typeError("Segment duration must be a number").min(1).max(30),
  playlistSize: Yup.number().typeError("Playlist size must be a number").min(1).max(50),
  audioBitrate: Yup.string().matches(/^[0-9]+k$/i, "Audio bitrate must be in '128k' format"),
  srtMode: Yup.string().oneOf(["caller", "listener"]).nullable(),
  srtPassphrase: Yup.string().nullable(),
  srtLatency: Yup.number().typeError("SRT latency must be a number").nullable(),
  srtPeerLatency: Yup.number().typeError("SRT peer latency must be a number").nullable(),
  srtRecvBuffer: Yup.number().typeError("SRT receive buffer must be a number").nullable(),
  srtSendBuffer: Yup.number().typeError("SRT send buffer must be a number").nullable(),
  srtPacketDrop: Yup.number().typeError("SRT packet drop must be a number").nullable(),
  srtPacketLatency: Yup.number().typeError("SRT packet latency must be a number").nullable(),
});

const VideoTemplateModal: React.FC<VideoTemplateModalProps> = ({ isOpen, onClose, onSave, initialValues }) => {
  const formik = useFormik<VideoTemplateValues>({
    enableReinitialize: true,
    initialValues: {
      name: initialValues?.name || "",
      width: initialValues?.width ?? "",
      height: initialValues?.height ?? "",
      bitrate: initialValues?.bitrate ?? 3500,
      bitrateMode: initialValues?.bitrateMode || bitRateModes[0].value,
      fps: initialValues?.fps ?? 50,
      fpsMode: initialValues?.fpsMode || fpsModes[0].value,
      region: initialValues?.region || awsRegions[0].value,
      liveRegion: (initialValues as any)?.liveRegion || mediaLiveTemplateRegions[0].value,
      streamingType: initialValues?.streamingType || streamingType[0].value,
      fileType: initialValues?.fileType || fileTypes[0].value,
      inputType: initialValues?.inputType || mediaLiveInput[0].value,
      templatePreset: initialValues?.templatePreset || mediaLiveTemplateOption[0].value,
      audioCodec: initialValues?.audioCodec || audioOptions[0].value,
      multiAudio: initialValues?.multiAudio || multiAudioOptions[0].value,
      maxrate: (initialValues as any)?.maxrate ?? 6000,
      buffersize: (initialValues as any)?.buffersize ?? 12000,
      segmentDuration: (initialValues as any)?.segmentDuration ?? 4,
      playlistSize: (initialValues as any)?.playlistSize ?? 6,
      audioBitrate: (initialValues as any)?.audioBitrate ?? "128k",
      srtMode: (initialValues as any)?.srtMode ?? "caller",
      srtPassphrase: (initialValues as any)?.srtPassphrase ?? "",
      srtLatency: (initialValues as any)?.srtLatency ?? 200,
      srtPeerLatency: (initialValues as any)?.srtPeerLatency ?? 200,
      srtRecvBuffer: (initialValues as any)?.srtRecvBuffer ?? 41943040,
      srtSendBuffer: (initialValues as any)?.srtSendBuffer ?? 41943040,
      srtPacketDrop: (initialValues as any)?.srtPacketDrop ?? 1,
      srtPacketLatency: (initialValues as any)?.srtPacketLatency ?? 200,
    },
    validationSchema,
    onSubmit: (values) => {
      onSave(values);
      formik.resetForm();
      onClose();
    },
  });

  const title = initialValues?.name ? "Edit Template" : "Add Template";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogOverlay className="bg-black bg-opacity-90" />
      <DialogContent onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()} className="sm:max-w-[1000px] max-h-[85vh] overflow-y-auto bg-black rounded-[24px] border-2 border-[#373737] p-0">
        <DialogHeader className="px-6 pt-6 pb-4 relative">
          <DialogTitle className="text-white text-xl font-semibold">{title}</DialogTitle>
          {/* Close button */}
          {/* <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="absolute right-4 top-4 inline-flex items-center justify-center h-9 w-9 text-white"
          >
            <X size={24} />
          </button> */}
        </DialogHeader>

        <form onSubmit={formik.handleSubmit} className="px-8 pb-8 space-y-6">
          {/* Basic */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-3">
              <Label htmlFor="name" className="text-white text-sm font-medium block mb-2">Template name</Label>
              <Input id="name" name="name" value={formik.values.name} onChange={formik.handleChange} placeholder="e.g., My 1080p preset" className="bg-[#252525] border-[#252525] text-white placeholder-gray-400 rounded-lg h-[42px]" />
              {formik.errors.name && formik.touched.name && (
                <div className="text-red-500 text-xs mt-1">{formik.errors.name}</div>
              )}
            </div>
          </div>

          {/* Dimensions */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="width" className="text-white text-sm font-medium block mb-2">Width</Label>
              <Input id="width" name="width" value={String(formik.values.width)} onChange={formik.handleChange} placeholder="1920" className="bg-[#252525] border-[#252525] text-white placeholder-gray-400 rounded-lg h-[42px]" />
              {formik.errors.width && formik.touched.width && (
                <div className="text-red-500 text-xs mt-1">{formik.errors.width as string}</div>
              )}
            </div>
            <div>
              <Label htmlFor="height" className="text-white text-sm font-medium block mb-2">Height</Label>
              <Input id="height" name="height" value={String(formik.values.height)} onChange={formik.handleChange} placeholder="1080" className="bg-[#252525] border-[#252525] text-white placeholder-gray-400 rounded-lg h-[42px]" />
              {formik.errors.height && formik.touched.height && (
                <div className="text-red-500 text-xs mt-1">{formik.errors.height as string}</div>
              )}
            </div>
            <div>
              <Label className="text-white text-sm font-medium block mb-2">Preset</Label>
              <SearchableSelect options={mediaLiveTemplateOption} value={formik.values.templatePreset} searchable={false} onChange={(v) => formik.setFieldValue("templatePreset", v)} />
            </div>
          </div>

          {/* Encoding */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="bitrate" className="text-white text-sm font-medium block mb-2">Bitrate (kbps)</Label>
              <Input id="bitrate" name="bitrate" value={String(formik.values.bitrate)} onChange={formik.handleChange} placeholder="3500" className="bg-[#252525] border-[#252525] text-white placeholder-gray-400 rounded-lg h-[42px]" />
              {formik.errors.bitrate && formik.touched.bitrate && (
                <div className="text-red-500 text-xs mt-1">{formik.errors.bitrate as string}</div>
              )}
            </div>
            <div>
              <Label className="text-white text-sm font-medium block mb-2">Bitrate mode</Label>
              <SearchableSelect options={bitRateModes} value={formik.values.bitrateMode} searchable={false} onChange={(v) => formik.setFieldValue("bitrateMode", v)} />
            </div>
            <div>
              <Label className="text-white text-sm font-medium block mb-2">FPS</Label>
              <Input id="fps" name="fps" value={String(formik.values.fps)} onChange={(e) => formik.setFieldValue("fps", Number(e.target.value))} placeholder="50" className="bg-[#252525] border-[#252525] text-white placeholder-gray-400 rounded-lg h-[42px]" />
              {formik.errors.fps && formik.touched.fps && (
                <div className="text-red-500 text-xs mt-1">{formik.errors.fps as string}</div>
              )}
            </div>
            <div>
              <Label className="text-white text-sm font-medium block mb-2">FPS Mode</Label>
              <SearchableSelect options={fpsModes} value={formik.values.fpsMode} searchable={false} onChange={(v) => formik.setFieldValue("fpsMode", v)} />
            </div>
            <div>
              <Label className="text-white text-sm font-medium block mb-2">Maxrate (kbps)</Label>
              <Input id="maxrate" name="maxrate" value={String(formik.values.maxrate)} onChange={formik.handleChange} placeholder="6000" className="bg-[#252525] border-[#252525] text-white placeholder-gray-400 rounded-lg h-[42px]" />
            </div>
            <div>
              <Label className="text-white text-sm font-medium block mb-2">Buffer size (kbps)</Label>
              <Input id="buffersize" name="buffersize" value={String(formik.values.buffersize)} onChange={formik.handleChange} placeholder="12000" className="bg-[#252525] border-[#252525] text-white placeholder-gray-400 rounded-lg h-[42px]" />
            </div>
          </div>

          {/* IO */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-white text-sm font-medium block mb-2">Streaming type</Label>
              <SearchableSelect options={streamingType} value={formik.values.streamingType} searchable={false} onChange={(v) => formik.setFieldValue("streamingType", v)} />
            </div>
            <div>
              <Label className="text-white text-sm font-medium block mb-2">File type</Label>
              <SearchableSelect options={fileTypes} value={formik.values.fileType} searchable={false} onChange={(v) => formik.setFieldValue("fileType", v)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-white text-sm font-medium block mb-2">Multi-audio</Label>
              <SearchableSelect options={multiAudioOptions} value={formik.values.multiAudio} searchable={false} onChange={(v) => formik.setFieldValue("multiAudio", v)} />
            </div>
            <div>
              <Label className="text-white text-sm font-medium block mb-2">Audio codec</Label>
              <SearchableSelect options={audioOptions} value={formik.values.audioCodec} searchable={false} onChange={(v) => formik.setFieldValue("audioCodec", v)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-white text-sm font-medium block mb-2">Input type</Label>
              <SearchableSelect options={[...mediaLiveInput, ...mediaStaticInput]} value={formik.values.inputType} searchable={true} onChange={(v) => formik.setFieldValue("inputType", v)} />
            </div>
            <div>
              <Label className="text-white text-sm font-medium block mb-2">Audio bitrate</Label>
              <Input id="audioBitrate" name="audioBitrate" value={formik.values.audioBitrate} onChange={formik.handleChange} placeholder="128k" className="bg-[#252525] border-[#252525] text-white placeholder-gray-400 rounded-lg h-[42px]" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-white text-sm font-medium block mb-2">Live regions</Label>
              <SearchableSelect options={mediaLiveTemplateRegions} value={formik.values.liveRegion || ''} searchable={true} onChange={(v) => formik.setFieldValue("liveRegion", v)} />
            </div>
          </div>

          {/* SRT settings (visible for srt_pull/srt_push) */}
          {(formik.values.inputType === 'srt_pull' || formik.values.inputType === 'srt_push') && (
            <div className="space-y-4">
              <h3 className="text-white text-sm font-bold">SRT settings</h3>
              <div className="grid grid-cols-3 gap-4">
                {/* <div>
                  <Label className="text-white text-sm font-medium block mb-2">Region</Label>
                  <SearchableSelect options={awsRegions} value={formik.values.region} searchable={true} onChange={(v) => formik.setFieldValue("region", v)} />
                </div> */}
                <div>
                  <Label className="text-white text-sm font-medium block mb-2">SRT mode</Label>
                  <SearchableSelect options={[{ label: 'caller', value: 'caller' }, { label: 'listener', value: 'listener' }]} value={formik.values.srtMode || 'caller'} searchable={false} onChange={(v) => formik.setFieldValue('srtMode', v)} />
                </div>
                <div>
                  <Label className="text-white text-sm font-medium block mb-2">SRT passphrase</Label>
                  <Input id="srtPassphrase" name="srtPassphrase" value={formik.values.srtPassphrase || ''} onChange={formik.handleChange} placeholder="••••••••" className="bg-[#252525] border-[#252525] text-white placeholder-gray-400 rounded-lg h-[42px]" />
                </div>
                <div>
                  <Label className="text-white text-sm font-medium block mb-2">SRT latency (ms)</Label>
                  <Input id="srtLatency" name="srtLatency" value={String(formik.values.srtLatency || '')} onChange={formik.handleChange} placeholder="200" className="bg-[#252525] border-[#252525] text-white placeholder-gray-400 rounded-lg h-[42px]" />
                </div>
                <div>
                  <Label className="text-white text-sm font-medium block mb-2">SRT peer latency (ms)</Label>
                  <Input id="srtPeerLatency" name="srtPeerLatency" value={String(formik.values.srtPeerLatency || '')} onChange={formik.handleChange} placeholder="200" className="bg-[#252525] border-[#252525] text-white placeholder-gray-400 rounded-lg h-[42px]" />
                </div>
                <div>
                  <Label className="text-white text-sm font-medium block mb-2">SRT receive buffer (bytes)</Label>
                  <Input id="srtRecvBuffer" name="srtRecvBuffer" value={String(formik.values.srtRecvBuffer || '')} onChange={formik.handleChange} placeholder="41943040" className="bg-[#252525] border-[#252525] text-white placeholder-gray-400 rounded-lg h-[42px]" />
                </div>
                <div>
                  <Label className="text-white text-sm font-medium block mb-2">SRT send buffer (bytes)</Label>
                  <Input id="srtSendBuffer" name="srtSendBuffer" value={String(formik.values.srtSendBuffer || '')} onChange={formik.handleChange} placeholder="41943040" className="bg-[#252525] border-[#252525] text-white placeholder-gray-400 rounded-lg h-[42px]" />
                </div>
                <div>
                  <Label className="text-white text-sm font-medium block mb-2">SRT packet drop</Label>
                  <Input id="srtPacketDrop" name="srtPacketDrop" value={String(formik.values.srtPacketDrop || '')} onChange={formik.handleChange} placeholder="1" className="bg-[#252525] border-[#252525] text-white placeholder-gray-400 rounded-lg h-[42px]" />
                </div>
                <div>
                  <Label className="text-white text-sm font-medium block mb-2">SRT packet latency (ms)</Label>
                  <Input id="srtPacketLatency" name="srtPacketLatency" value={String(formik.values.srtPacketLatency || '')} onChange={formik.handleChange} placeholder="200" className="bg-[#252525] border-[#252525] text-white placeholder-gray-400 rounded-lg h-[42px]" />
                </div>
                {/* HLS/Audio settings */}
                <div>
                  <Label className="text-white text-sm font-medium block mb-2">Segment duration (s)</Label>
                  <Input id="segmentDuration" name="segmentDuration" value={String(formik.values.segmentDuration)} onChange={formik.handleChange} placeholder="4" className="bg-[#252525] border-[#252525] text-white placeholder-gray-400 rounded-lg h-[42px]" />
                </div>
                <div>
                  <Label className="text-white text-sm font-medium block mb-2">Playlist size</Label>
                  <Input id="playlistSize" name="playlistSize" value={String(formik.values.playlistSize)} onChange={formik.handleChange} placeholder="6" className="bg-[#252525] border-[#252525] text-white placeholder-gray-400 rounded-lg h-[42px]" />
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="bg-black rounded-xl text-white px-6 py-2 h-10 text-sm font-medium hover:bg-gray-800 transition-colors">Cancel</button>
            <button type="submit" className="bg-gradient-to-r from-[#00BBFF] to-[#0051FF] rounded-xl text-white px-6 py-2 h-10 text-sm font-medium hover:opacity-90 transition-opacity">{initialValues?.name ? "Save Changes" : "Add Template"}</button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default VideoTemplateModal;
