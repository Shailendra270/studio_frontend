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

const TransformTemplatesSection: React.FC<Props> = (props) => (
  <VideoTemplatesSection
    title="Video Transform Templates"
    Description="Different templates for how the video transform are defined"
    columnDefs={[
      { label: 'Template', render: (t) => t.name },
      { label: 'Properties', render: (t) => t.properties || '-' },
      { label: 'Created At', render: (t) => t.createdAt ? new Date(t.createdAt).toLocaleString() : '-' },
    ]}
    {...props}
  />
)
export default TransformTemplatesSection
