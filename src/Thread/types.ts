import { IMessage } from "../types";

export interface ThreadItem {
  id: string;
  title: string;
  lastMessage?: IMessage;
  created_at?: string;
  updated_at?: string;
}

export interface ThreadProps {
  isOpen: boolean;
  onClose: () => void;
  onThreadSelect: (thread: ThreadItem) => void;
  onNewThread: () => void;
  containerStyle?: any;
  renderEmpty?: () => React.ReactElement;
}
