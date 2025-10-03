export interface Thread {
  id: string;
  title: string;
  createdAt?: string;
  updatedAt?: string;
  // Legacy support for old field names
  created_at?: string;
  updated_at?: string;
}

export interface ThreadProps {
  isOpen: boolean;
  onClose: () => void;
  onThreadSelect: (thread: Thread) => void;
  onNewThread: () => void;
  containerStyle?: any;
  renderEmpty?: () => React.ReactElement;
}
