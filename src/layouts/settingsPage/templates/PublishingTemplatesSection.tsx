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

const PublishingTemplatesSection: React.FC<Props> = (props) => (
  <VideoTemplatesSection
    title="Publishing Templates"
    Description="Facebook, Instagram, TikTok, YouTube etc."
    columnDefs={[
      { label: 'Templates', render: (t) => t.name },
      { label: 'Social media accounts', render: (t) => Array.isArray(t.accounts) && t.accounts.length ? t.accounts.join(', ') : '-' },
      { label: 'Created At', render: (t) => t.createdAt ? new Date(t.createdAt).toLocaleString() : '-' },
    ]}
    {...props}
  />
)
export default PublishingTemplatesSection
