export interface CreateHighlightFormData {
  sport: string;
  competition: string;
  event: string;
  aspectRatio: string;
}

export interface AspectRatioOption {
  id: string;
  label: string;
  dimensions: string;
}

export interface NewHighlightFormData {
  title: string;
  aspectRatio: string;
}

export interface NewHighlightModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedClips: string[];
  onCreateHighlight: (data: NewHighlightFormData) => void | Promise<void>;
}