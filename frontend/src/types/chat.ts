// Frontend Types - Chat
export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  message: string;
  timestamp: Date;
  type: 'normal' | 'system' | 'admin';
}

export interface ChatUser {
  id: string;
  username: string;
  role: 'player' | 'admin';
}

export interface ChatState {
  messages: ChatMessage[];
  isConnected: boolean;
  isAuthenticated: boolean;
  currentUser: ChatUser | null;
  onlineCount: number;
}
