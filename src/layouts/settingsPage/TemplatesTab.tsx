import React, { useEffect, useState } from "react";
import { 
  Video, 
  Radio, 
  RotateCcw, 
  Send, 
  Type,
  Search,
  ChevronDown,
  Edit,
  Trash2,
  MoreHorizontal
} from "lucide-react";
import VideoTemplateModal from "@/components/modals/SettingPageModals/TemplatesModals/VideoTemplateModal";
import { getTemplatesByUser, createTemplate as apiCreateTemplate, updateTemplate as apiUpdateTemplate, deleteTemplate as apiDeleteTemplate, getTemplateById } from "@/api/templatesApi";
import { useAppSelector } from "@/store";
import { selectUser } from "@/store/slices/authSlice";
import { toast } from "sonner";
import DeleteConfirmationModal from "@/components/modals/DeleteConfirmationModal";
import VideoTemplatesSection from "./templates/VideoTemplatesSection";
import StreamTemplatesSection from "./templates/StreamTemplatesSection";
import TransformTemplatesSection from "./templates/TransformTemplatesSection";
import PublishingTemplatesSection from "./templates/PublishingTemplatesSection";
import NamingTemplatesSection from "./templates/NamingTemplatesSection";
import StreamTemplateModal from "@/components/modals/SettingPageModals/TemplatesModals/StreamTemplateModal";
import { getPreStreamTemplatesByUser, createPreStreamTemplate, getPreStreamTemplateById, updatePreStreamTemplate, deletePreStreamTemplate } from "@/api/prestreamTemplatesApi";
import { usePermissions } from "@/hooks/usePermissions";

interface TemplateNavigationItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

interface VideoTemplate {
  id: string;
  name: string;
  description?: string;
}

const templateNavigation: TemplateNavigationItem[] = [
  { id: "video", label: "Video Template", icon: Video },
  { id: "stream", label: "Stream Template", icon: Radio },
  { id: "transform", label: "Video Transform Templates", icon: RotateCcw },
  { id: "publishing", label: "Publishing Templates", icon: Send },
  { id: "naming", label: "Clip Naming Templates", icon: Type },
];

const emptyTemplates: VideoTemplate[] = [];

const TemplatesTab: React.FC = () => {
  const [activeTemplate, setActiveTemplate] = useState("video");
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<VideoTemplate | null>(null);
  const [editingInitialValues, setEditingInitialValues] = useState<any | undefined>(undefined);
  const [templates, setTemplates] = useState<VideoTemplate[]>(emptyTemplates);
  const user = useAppSelector(selectUser);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<VideoTemplate | null>(null);
  const [isStreamModalOpen, setIsStreamModalOpen] = useState(false);
  const [streamTemplates, setStreamTemplates] = useState<VideoTemplate[]>(emptyTemplates);
  const [streamTotalPages, setStreamTotalPages] = useState(1);
  const [editingStreamInitialValues, setEditingStreamInitialValues] = useState<any | undefined>(undefined);
  const { canCreate, canEdit, canDelete } = usePermissions();

  useEffect(() => {
    const load = async () => {
      if (!user?.userId) return;
      try {
        if (activeTemplate === 'video') {
          const res = await getTemplatesByUser(user.userId, { search: searchQuery, page_no: currentPage, limit: 10 });
          if (res?.success) {
            setTemplates(res.data.map((t: any) => ({ id: t._id, name: t.name, description: t.templatePreset, createdAt: t.createdAt })));
            setTotalPages(res.pagination?.totalPages || 1);
          }
        } else if (activeTemplate === 'stream') {
          const res = await getPreStreamTemplatesByUser(user.userId, { search: searchQuery, page_no: currentPage, limit: 10 });
          if (res?.success) {
            setStreamTemplates(res.data.map((t: any) => ({ id: t._id, name: t.name, category: t.category, createdAt: t.createdAt })));
            setStreamTotalPages(res.pagination?.totalPages || 1);
          }
        }
      } catch (e) {
        toast.error("Failed to load templates");
      }
    };
    load();
  }, [user?.userId, searchQuery, currentPage, activeTemplate]);

  const filteredTemplates = templates;

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplates(prev => 
      prev.includes(templateId) 
        ? prev.filter(id => id !== templateId)
        : [...prev, templateId]
    );
  };

  const renderVideoTemplateContent = () => (
    <div className="space-y-6">
      {/* Header with Add Template Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-medium text-white">Video Template</h2>
        {canCreate('Templates') && (
          <button
            className="bg-gradient-to-r from-[#00BBFF] to-[#0051FF] hover:from-[#00A8E6] hover:to-[#0046E6] text-white px-6 py-2 rounded-lg font-medium transition-colors"
            onClick={() => {
              setEditingTemplate(null);
              setIsTemplateModalOpen(true);
            }}
          >
            Add Template
          </button>
        )}
      </div>

      {/* Select Template Section */}
      {/* <div className="space-y-4">
        <h3 className="text-lg font-medium text-white">Select Template</h3>
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="w-full bg-[#2A2A2A] border border-[#404040] rounded-lg px-4 py-3 text-left text-white flex items-center justify-between hover:bg-[#333333] transition-colors"
          >
            <span className="text-gray-400">Select option(s)</span>
            <ChevronDown className="w-5 h-5 text-gray-400" />
          </button>
          {showDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[#2A2A2A] border border-[#404040] rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className="px-4 py-3 hover:bg-[#333333] cursor-pointer text-white border-b border-[#404040] last:border-b-0"
                  onClick={() => {
                    handleTemplateSelect(template.id);
                    setShowDropdown(false);
                  }}
                >
                  {template.name}
                </div>
              ))}
            </div>
          )}
        </div>
      </div> */}

      {/* Search Template Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-white">Search Template</h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search templates"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full bg-[#2A2A2A] border border-[#404040] rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-[#00BBFF] focus:ring-1 focus:ring-[#00BBFF] transition-colors"
          />
        </div>
      </div>

      {/* Templates Table */}
      <div className="space-y-4">
        <div className="bg-[#1F1F1F] rounded-lg overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-[#2A2A2A] border-b border-[#404040]">
            <div className="col-span-8">
              <span className="text-gray-400 font-medium">TEMPLATE</span>
            </div>
            <div className="col-span-4 text-right">
              <span className="text-gray-400 font-medium">Actions</span>
            </div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-[#404040]">
            {filteredTemplates.map((template) => (
              <div key={template.id} className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-[#2A2A2A] transition-colors">
                <div className="col-span-8">
                  <div className="text-white font-medium">{template.name}</div>
                  {template.description && (
                    <div className="text-gray-400 text-sm mt-1">{template.description}</div>
                  )}
                </div>
                <div className="col-span-4 flex items-center justify-end gap-2">
                  {canEdit('Templates') && (
                    <button className="p-2 text-gray-400 hover:text-white hover:bg-[#404040] rounded-lg transition-colors" onClick={async () => { setEditingTemplate(template); try { const res = await getTemplateById(template.id); if (res?.success) { const doc = res.data; setEditingInitialValues({ ...doc, buffersize: doc.bufsize }); } } catch {} setIsTemplateModalOpen(true); }}>
                      <Edit className="w-4 h-4" />
                    </button>
                  )}
                  {canDelete('Templates') && (
                    <button className="p-2 text-gray-400 hover:text-red-400 hover:bg-[#404040] rounded-lg transition-colors" onClick={() => { setDeleteTarget(template); setIsDeleteOpen(true); }}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  {/* <button className="p-2 text-gray-400 hover:text-white hover:bg-[#404040] rounded-lg transition-colors">
                    <MoreHorizontal className="w-4 h-4" />
                  </button> */}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <span className="text-gray-400 text-sm">Page 1 of 2</span>
          <div className="flex items-center gap-2">
              <button className="px-3 py-1 text-gray-400 hover:text-white transition-colors" disabled={currentPage === 1} onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}>Prev</button>
              <button className="px-3 py-1 bg-gradient-to-r from-[#00BBFF] to-[#0051FF] text-white rounded">{currentPage}</button>
              <button className="px-3 py-1 text-gray-400 hover:text-white hover:bg-[#404040] rounded transition-colors" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}>Next</button>
              <div className="flex gap-2 ml-4">
              <button className="px-4 py-2 bg-[#404040] text-gray-400 rounded-lg hover:bg-[#505050] transition-colors" disabled={currentPage === 1} onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}>Previous</button>
              <button className="px-4 py-2 bg-gradient-to-r from-[#00BBFF] to-[#0051FF] hover:from-[#00A8E6] hover:to-[#0046E6] text-white rounded-lg transition-colors" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}>Next</button>
              </div>
            </div>
          </div>
        </div>
    </div>
  );

  const renderTemplateContent = () => {
    switch (activeTemplate) {
      case "video":
        return (
          <VideoTemplatesSection
            templates={filteredTemplates as any}
            searchQuery={searchQuery}
            onSearchChange={(q) => { setSearchQuery(q); setCurrentPage(1); }}
            currentPage={currentPage}
            totalPages={totalPages}
            onPrevPage={() => setCurrentPage(Math.max(1, currentPage - 1))}
            onNextPage={() => setCurrentPage(Math.min(streamTotalPages, currentPage + 1))}
            onAdd={canCreate('Templates') ? () => { setEditingTemplate(null); setIsTemplateModalOpen(true); } : undefined}
            onEdit={canEdit('Templates') ? async (template) => { setEditingTemplate(template as any); try { const res = await getTemplateById(template.id); if (res?.success) { const doc = res.data; setEditingInitialValues({ ...doc, buffersize: doc.bufsize }); } } catch {} setIsTemplateModalOpen(true); } : undefined}
            onDelete={canDelete('Templates') ? (template) => { setDeleteTarget(template as any); setIsDeleteOpen(true); } : undefined}
          />
        );
      case "stream":
        return (
          <StreamTemplatesSection
            templates={streamTemplates as any}
            searchQuery={searchQuery}
            onSearchChange={(q) => { setSearchQuery(q); setCurrentPage(1); }}
            currentPage={currentPage}
            totalPages={streamTotalPages}
            onPrevPage={() => setCurrentPage(Math.max(1, currentPage - 1))}
            onNextPage={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            onAdd={() => { setEditingTemplate(null); setEditingStreamInitialValues(undefined); setIsStreamModalOpen(true) }}
            onEdit={async (template) => { try { const res = await getPreStreamTemplateById(template.id); if (res?.success) { setEditingStreamInitialValues(res.data) } } catch {} setEditingTemplate(template); setIsStreamModalOpen(true) }}
            onDelete={async (template) => { setDeleteTarget(template); setIsDeleteOpen(true) }}
          />
        );
      case "transform":
        return (
          <TransformTemplatesSection
            templates={[]}
            searchQuery={searchQuery}
            onSearchChange={(q) => { setSearchQuery(q); setCurrentPage(1); }}
            currentPage={currentPage}
            totalPages={totalPages}
            onPrevPage={() => setCurrentPage(Math.max(1, currentPage - 1))}
            onNextPage={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            onAdd={() => toast.info('Transform templates coming soon')}
            onEdit={() => toast.info('Transform templates editing coming soon')}
            onDelete={() => toast.info('Transform templates deletion coming soon')}
          />
        );
      case "publishing":
        return (
          <PublishingTemplatesSection
            templates={[]}
            searchQuery={searchQuery}
            onSearchChange={(q) => { setSearchQuery(q); setCurrentPage(1); }}
            currentPage={currentPage}
            totalPages={totalPages}
            onPrevPage={() => setCurrentPage(Math.max(1, currentPage - 1))}
            onNextPage={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            onAdd={() => toast.info('Publishing templates coming soon')}
            onEdit={() => toast.info('Publishing templates editing coming soon')}
            onDelete={() => toast.info('Publishing templates deletion coming soon')}
          />
        );
      case "naming":
        return (
          <NamingTemplatesSection
            templates={[]}
            searchQuery={searchQuery}
            onSearchChange={(q) => { setSearchQuery(q); setCurrentPage(1); }}
            currentPage={currentPage}
            totalPages={totalPages}
            onPrevPage={() => setCurrentPage(Math.max(1, currentPage - 1))}
            onNextPage={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            onAdd={() => toast.info('Naming templates coming soon')}
            onEdit={() => toast.info('Naming templates editing coming soon')}
            onDelete={() => toast.info('Naming templates deletion coming soon')}
          />
        );
      default:
        return renderVideoTemplateContent();
    }
  };

  const handleSaveTemplate = async (values: any) => {
    if (!user?.userId) return;
    const duplicate = templates.some(t => t.name.trim().toLowerCase() === String(values.name).trim().toLowerCase()) && !editingTemplate;
    if (duplicate) { toast.error('Template name must be unique'); return; }
    const payload = { ...values, userId: user.userId };
    try {
      if (editingTemplate) {
        const up = await apiUpdateTemplate(editingTemplate.id, payload);
        if (!up?.success) throw new Error(up?.error || 'Failed to update');
        toast.success('Template updated');
      } else {
        const cr = await apiCreateTemplate(payload);
        if (!cr?.success) throw new Error(cr?.error || 'Failed to create');
        toast.success('Template created');
      }
      setIsTemplateModalOpen(false);
      setEditingTemplate(null);
      const res = await getTemplatesByUser(user.userId, { search: searchQuery, page_no: currentPage, limit: 10 });
      if (res?.success) {
        setTemplates(res.data.map((t: any) => ({ id: t._id, name: t.name, description: t.templatePreset })));
        setTotalPages(res.pagination?.totalPages || 1);
      }
    } catch (e: any) {
      toast.error(e?.message || 'Operation failed');
    }
  };

  return (
    <>
    <div className="flex h-full">
      {/* Templates Navigation Sidebar */}
      <div className="w-80 min-w-80 border-r border-[#252525] pr-6">
        <div className="space-y-2">
          {templateNavigation.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTemplate(item.id)}
                className={`w-full px-4 py-3 rounded-lg text-base font-medium transition-colors flex items-center gap-3 ${
                  activeTemplate === item.id
                    ? "bg-[#292929] text-white"
                    : "text-gray-400 hover:bg-[#252525] hover:text-white"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="truncate">{item.label}</span>
                {activeTemplate === item.id && (
                  <svg
                    className="w-2 h-3 ml-auto"
                    viewBox="0 0 7 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M6.57143 5.75L0 11.5L0 0L6.57143 5.75Z" fill="white" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 pl-6">
        {renderTemplateContent()}
      </div>
    </div>
    <VideoTemplateModal
      isOpen={isTemplateModalOpen}
      onClose={() => setIsTemplateModalOpen(false)}
      onSave={handleSaveTemplate}
      initialValues={editingTemplate ? editingInitialValues : undefined}
    />
    <DeleteConfirmationModal
      isOpen={isDeleteOpen}
      onClose={() => setIsDeleteOpen(false)}
      onDelete={async () => {
        if (!user?.userId || !deleteTarget) return;
        try {
          if (activeTemplate === 'stream') {
            const del = await deletePreStreamTemplate(deleteTarget.id as any);
            if (!del?.success) throw new Error(del?.error || 'Delete failed');
            toast.success('Stream template deleted successfully');
            setIsDeleteOpen(false);
            setDeleteTarget(null);
            const res = await getPreStreamTemplatesByUser(user.userId, { search: searchQuery, page_no: currentPage, limit: 10 });
            if (res?.success) {
              setStreamTemplates(res.data.map((t: any) => ({ id: t._id, name: t.name, category: t.category, createdAt: t.createdAt })));
              setStreamTotalPages(res.pagination?.totalPages || 1);
            }
          } else {
            const del = await apiDeleteTemplate(deleteTarget.id);
            if (!del?.success) throw new Error(del?.error || 'Delete failed');
            toast.success('Template deleted successfully');
            setIsDeleteOpen(false);
            setDeleteTarget(null);
            const res = await getTemplatesByUser(user.userId, { search: searchQuery, page_no: currentPage, limit: 10 });
            if (res?.success) {
              setTemplates(res.data.map((t: any) => ({ id: t._id, name: t.name, description: t.templatePreset })));
              setTotalPages(res.pagination?.totalPages || 1);
            }
          }
        } catch (e: any) {
          toast.error(e?.message || 'Delete failed');
        }
      }}
      itemName={deleteTarget?.name}
    />
    <StreamTemplateModal
      isOpen={isStreamModalOpen}
      onClose={() => setIsStreamModalOpen(false)}
      initialValues={editingStreamInitialValues}
      onSave={async (values) => {
        if (!user?.userId) return;
        if (!editingTemplate) {
          const duplicate = streamTemplates.some(t => t.name.trim().toLowerCase() === String(values.name).trim().toLowerCase());
          if (duplicate) { toast.error('Template name must be unique'); return; }
        }
        const payload = { ...values, userId: user.userId, createdBy: user.email, videoTemplateId: values.videoTemplate };
        try {
          if (editingTemplate) {
            const up = await updatePreStreamTemplate(editingTemplate.id, payload);
            if (!up?.success) throw new Error(up?.error || 'Failed to update');
            toast.success('Stream template updated');
          } else {
            const cr = await createPreStreamTemplate(payload);
            if (!cr?.success) throw new Error(cr?.error || 'Failed to create');
            toast.success('Stream template created');
          }
          setIsStreamModalOpen(false);
          setEditingTemplate(null);
          const res = await getPreStreamTemplatesByUser(user.userId, { search: searchQuery, page_no: currentPage, limit: 10 });
          if (res?.success) {
            setStreamTemplates(res.data.map((t: any) => ({ id: t._id, name: t.name, category: t.category, createdAt: t.createdAt })));
            setStreamTotalPages(res.pagination?.totalPages || 1);
          }
        } catch (e: any) {
          toast.error(e?.message || 'Operation failed');
        }
      }}
    />
    </>
  );
};

export default TemplatesTab;
