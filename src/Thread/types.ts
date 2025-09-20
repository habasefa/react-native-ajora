import { IMessage } from "../types";

export interface ThreadItem {
  id: string;
  title: string;
  lastMessage?: IMessage;
  timestamp?: Date;
}

export interface ThreadProps {
  threads: ThreadItem[];
  isOpen: boolean;
  onClose: () => void;
  onThreadSelect: (thread: ThreadItem) => void;
  onNewThread: () => void;
  containerStyle?: any;
  renderEmpty?: () => React.ReactElement;
}
