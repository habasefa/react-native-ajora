export interface Thread {
  id: string;
  title: string;
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
