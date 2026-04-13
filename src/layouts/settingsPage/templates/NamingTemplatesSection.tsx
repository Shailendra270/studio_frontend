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

const NamingTemplatesSection: React.FC<Props> = (props) => (
  <VideoTemplatesSection
    title="Clip Naming Templates"
    Description="Different templates for how the clip naming are defined"
    columnDefs={[
      { label: 'Templates', render: (t) => t.name },
      { label: 'Format', render: (t) => t.format || '-' },
      { label: 'Status', render: (t) => t.status || '-' },
    ]}
    {...props}
  />
)
export default NamingTemplatesSection
