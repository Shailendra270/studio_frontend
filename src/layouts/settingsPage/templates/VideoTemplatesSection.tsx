import React from "react"
import { Search, Edit, Trash2 } from "lucide-react"

export interface VideoTemplateItem { id: string; name: string; description?: string; category?: string; createdAt?: string; properties?: string; accounts?: string[]; format?: string; status?: string; inputType?: string }

interface ColumnDef { label: string; render: (t: VideoTemplateItem) => React.ReactNode }

interface Props {
  title?: string
  Description?: string
  templates: VideoTemplateItem[]
  searchQuery: string
  onSearchChange: (q: string) => void
  currentPage: number
  totalPages: number
  onPrevPage: () => void
  onNextPage: () => void
  onAdd?: () => void
  onEdit?: (t: VideoTemplateItem) => void
  onDelete?: (t: VideoTemplateItem) => void
  columnDefs?: ColumnDef[]
}

const VideoTemplatesSection: React.FC<Props> = ({ title = "Video Template", Description = "Input type, Bitrate, FPS, Height, Width, Preferences etc.", templates, searchQuery, onSearchChange, currentPage, totalPages, onPrevPage, onNextPage, onAdd, onEdit, onDelete, columnDefs = [{ label: "Template", render: (t) => t.name },
{ label: "Input type", render: (t) => t.inputType || "-" },
{
  label: "Created At", render: (t) => t.createdAt ? `${new Date(t.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  })} / ${new Date(t.createdAt).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })}` : "-"
}] }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h2 className="text-2xl font-medium text-white mb-1">{title}</h2>
          {Description && (
            <p className="text-sm text-gray-400">{Description}</p>
          )}
        </div>
        {onAdd && (
          <button className="bg-gradient-to-r from-[#00BBFF] to-[#0051FF] hover:from-[#00A8E6] hover:to-[#0046E6] text-white px-6 py-2 rounded-lg font-medium transition-colors" onClick={onAdd}>Add Template</button>
        )}
      </div>
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-white">Search Template</h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Search templates" value={searchQuery} onChange={(e) => onSearchChange(e.target.value)} className="w-full bg-[#2A2A2A] border border-[#404040] rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-[#00BBFF] focus:ring-1 focus:ring-[#00BBFF] transition-colors" />
        </div>
      </div>
      <div className="space-y-4">
        <div className="bg-[#1F1F1F] rounded-lg overflow-hidden">
          <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-[#2A2A2A] border-b border-[#404040]">
            {columnDefs.map((c, idx) => (
              <div key={idx} className="col-span-3"><span className="text-gray-400 font-medium">{c.label}</span></div>
            ))}
            <div className="col-span-3 text-right"><span className="text-gray-400 font-medium">Actions</span></div>
          </div>
          <div className="divide-y divide-[#404040]">
            {templates.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-400">No templates found</div>
            ) : (
              templates.map((template) => (
                <div key={template.id} className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-[#2A2A2A] transition-colors">
                  {columnDefs.map((c, idx) => (
                    <div key={idx} className="col-span-3">
                      <div className="text-white font-medium">{c.render(template)}</div>
                    </div>
                  ))}
                  <div className="col-span-3 flex items-center justify-end gap-2">
                    {onEdit && (
                      <button className="p-2 text-gray-400 hover:text-white hover:bg-[#404040] rounded-lg transition-colors" onClick={() => onEdit(template)}><Edit className="w-4 h-4" /></button>
                    )}
                    {onDelete && (
                      <button className="p-2 text-gray-400 hover:text-red-400 hover:bg-[#404040] rounded-lg transition-colors" onClick={() => onDelete(template)}><Trash2 className="w-4 h-4" /></button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-400 text-sm">Page {currentPage} of {totalPages}</span>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 text-gray-400 hover:text-white transition-colors" disabled={currentPage === 1} onClick={onPrevPage}>Prev</button>
            <button className="px-3 py-1 bg-gradient-to-r from-[#00BBFF] to-[#0051FF] text-white rounded">{currentPage}</button>
            <button className="px-3 py-1 text-gray-400 hover:text-white hover:bg-[#404040] rounded transition-colors" disabled={currentPage >= totalPages} onClick={onNextPage}>Next</button>
            <div className="flex gap-2 ml-4">
              <button className="px-4 py-2 bg-[#404040] text-gray-400 rounded-lg hover:bg-[#505050] transition-colors" disabled={currentPage === 1} onClick={onPrevPage}>Previous</button>
              <button className="px-4 py-2 bg-gradient-to-r from-[#00BBFF] to-[#0051FF] hover:from-[#00A8E6] hover:to-[#0046E6] text-white rounded-lg transition-colors" disabled={currentPage >= totalPages} onClick={onNextPage}>Next</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VideoTemplatesSection
