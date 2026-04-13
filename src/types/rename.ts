export interface RenameFormData {
  title: string;
}

export interface RenameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRename: (data: RenameFormData) => void;
  itemType?: 'clip' | 'folder';
  currentTitle?: string;
}