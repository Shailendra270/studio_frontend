import React, { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { SearchableSelect } from "@/components/ui/searchable-select"
import SportsDropdown from "@/components/common/SportsDropdown"
import { Button } from "@/components/ui/button"
import { useAppSelector } from "@/store"
import { selectUser } from "@/store/slices/authSlice"
import { getTemplatesByUser } from "@/api/templatesApi"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogOverlay } from "@/components/ui/dialog"
import { X } from "lucide-react"

interface Props {
  isOpen: boolean
  onClose: () => void
  onSave: (values: any) => void
  initialValues?: any
}

const StreamTemplateModal: React.FC<Props> = ({ isOpen, onClose, onSave, initialValues }) => {
  const user = useAppSelector(selectUser)
  const [name, setName] = useState(initialValues?.name || "")
  const [category, setCategory] = useState(initialValues?.category || "")
  const [videoTemplate, setVideoTemplate] = useState(initialValues?.videoTemplate || "")
  const [analysisServer, setAnalysisServer] = useState(initialValues?.analysisServer || "")
  const [recordingServer, setRecordingServer] = useState(initialValues?.recordingServer || "")
  const [storage, setStorage] = useState(initialValues?.storage || "")
  const [videoOptions, setVideoOptions] = useState<{ label: string; value: string }[]>([])

  useEffect(() => {
    setName(initialValues?.name || "")
    setCategory(initialValues?.category || "")
    setVideoTemplate(
      (() => {
        const v = initialValues?.videoTemplate ?? initialValues?.videoTemplateId
        if (!v) return ""
        if (typeof v === "string") return v
        if (typeof v === "object") {
          const id = (v as any)?._id ?? (v as any)?.id
          return id ? String(id) : ""
        }
        return String(v)
      })()
    )
    setAnalysisServer(initialValues?.analysisServer || "")
    setRecordingServer(initialValues?.recordingServer || "")
    setStorage(initialValues?.storage || "")
  }, [initialValues])

  useEffect(() => {
    if (!isOpen) {
      setName("")
      setCategory("")
      setVideoTemplate("")
      setAnalysisServer("")
      setRecordingServer("")
      setStorage("")
    }
  }, [isOpen])

  useEffect(() => {
    const load = async () => {
      if (!user?.userId) return
      try {
        const res = await getTemplatesByUser(user.userId, { limit: 100 })
        if (res?.success) setVideoOptions(res.data.map((t: any) => ({ label: t.name, value: t._id })))
      } catch { }
    }
    load()
  }, [user?.userId])

  const title = initialValues?.name ? "Edit Template" : "Add Template";

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogOverlay className="bg-black bg-opacity-90" />
      <DialogContent onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()} className="sm:max-w-[720px] bg-black border border-[#434343] rounded-[24px]">
        <DialogHeader>
          <DialogTitle className="text-white text-[20px] font-bold">{title}</DialogTitle>
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
        <div className="space-y-6">
          <div>
            <label className="text-white text-sm font-medium block mb-2">Template Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter template name" className="bg-[#252525] border-[#252525] text-white h-[42px]" />
          </div>
          <div>
            <SportsDropdown mode="field" label="Category" value={category} onChange={(v) => setCategory(String(v))} />
          </div>
          <div>
            <label className="text-white text-sm font-medium block mb-2">Video template</label>
            <SearchableSelect options={videoOptions} value={videoTemplate} searchable={true} onChange={(v) => setVideoTemplate(String(v))} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-white text-sm font-medium block mb-2">Analysis Server</label>
              <SearchableSelect options={[{ label: 'Default', value: 'default' },{ label: 'Ai server', value: 'ai_server' }]} value={analysisServer} searchable={false} onChange={(v) => setAnalysisServer(String(v))} />
            </div>
            <div>
              <label className="text-white text-sm font-medium block mb-2">Recording Server</label>
              <SearchableSelect options={[{ label: 'Default', value: 'default' },{ label: 'Ai server', value: 'ai_server' }]} value={recordingServer} searchable={false} onChange={(v) => setRecordingServer(String(v))} />
            </div>
            <div>
              <label className="text-white text-sm font-medium block mb-2">Storage</label>
              <SearchableSelect options={[{ label: 'S3', value: 's3' }, { label: 'GCS', value: 'gcs' }, { label: 'Azure Blob', value: 'azure_blob' }]} value={storage} searchable={false} onChange={(v) => setStorage(String(v))} />
            </div>
          </div>
          <DialogFooter className="flex items-center justify-end gap-3">
            <Button variant="outline" className="bg-[#1B1B1B] border-[#00BBFF] text-white" onClick={onClose}>Cancel</Button>
            <Button className="bg-gradient-to-r from-[#00BBFF] to-[#0051FF] text-white" onClick={() => onSave({ name, category, videoTemplate, analysisServer, recordingServer, storage })}>{initialValues?.name ? "Save Changes" : "Add Template"}</Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default StreamTemplateModal
