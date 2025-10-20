// Infrastructure Repository - In-Memory Chat Repository
import { ChatRepository } from '../../domain/repositories/ChatRepository';
import { ChatMessageEntity } from '../../domain/entities/ChatMessage';

export class InMemoryChatRepository implements ChatRepository {
  private messages: ChatMessageEntity[] = [];
  private readonly maxMessages = 1000; // 最多保存1000條訊息

  async saveMessage(message: ChatMessageEntity): Promise<void> {
    // 添加新訊息
    this.messages.push(message);
    
    // 如果超過限制，移除最舊的訊息
    if (this.messages.length > this.maxMessages) {
      this.messages.shift();
    }
  }

  async getRecentMessages(count: number = 50): Promise<ChatMessageEntity[]> {
    return this.messages.slice(-count); // 返回最近的訊息
  }

  async deleteMessage(messageId: string): Promise<boolean> {
    const index = this.messages.findIndex(msg => msg.id === messageId);
    if (index !== -1) {
      this.messages.splice(index, 1);
      return true;
    }
    return false;
  }

  async clearMessages(): Promise<void> {
    this.messages = [];
  }

  // 輔助方法：獲取訊息數量統計
  getMessageCount(): number {
    return this.messages.length;
  }
}
