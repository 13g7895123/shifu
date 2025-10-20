// Domain Repository Interface - Chat
import { ChatMessageEntity } from '../entities/ChatMessage';

export interface ChatRepository {
  saveMessage(message: ChatMessageEntity): Promise<void>;
  getRecentMessages(count?: number): Promise<ChatMessageEntity[]>;
  deleteMessage(messageId: string): Promise<boolean>;
  clearMessages(): Promise<void>;
}
