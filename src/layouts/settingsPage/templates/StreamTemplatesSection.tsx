import React from "react"
import VideoTemplatesSection, { VideoTemplateItem } from "./VideoTemplatesSection"

interface Props {
  templates: VideoTemplateItem[]
  searchQuery: string
  onSearchChange: (q: string) => void
  currentPage: number
  totalPages: number
  onPrevPage: () => void
  onNextPage: () => void
  onAdd: () => void
  onEdit: (t: VideoTemplateItem) => void
  onDelete: (t: VideoTemplateItem) => void
}

const StreamTemplatesSection: React.FC<Props> = (props) => (
  <VideoTemplatesSection
    title="Stream Template"
    Description="Category, Server, Storage, Preferences etc."
    columnDefs={[
      { label: 'Template', render: (t) => t.name },
      { label: 'Category', render: (t) => t.category || '-' },
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
      },
    ]}
    {...props}
  />
)
export default StreamTemplatesSection
