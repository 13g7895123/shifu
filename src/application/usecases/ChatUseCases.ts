// Application Use Cases - Chat
import { ChatRepository } from '../../domain/repositories/ChatRepository';
import { ChatMessageEntity } from '../../domain/entities/ChatMessage';

export class ChatUseCases {
  constructor(private chatRepository: ChatRepository) {}

  async sendMessage(
    userId: string,
    username: string,
    message: string,
    type: 'normal' | 'system' | 'admin' = 'normal'
  ): Promise<ChatMessageEntity> {
    // 驗證訊息內容
    if (!message.trim()) {
      throw new Error('訊息內容不能為空');
    }

    if (message.length > 500) {
      throw new Error('訊息長度不能超過500字符');
    }

    // 簡單的內容過濾
    const cleanMessage = this.sanitizeMessage(message);

    // 創建訊息實體
    const chatMessage = ChatMessageEntity.create(
      userId,
      username,
      cleanMessage,
      type
    );

    // 保存訊息
    await this.chatRepository.saveMessage(chatMessage);

    return chatMessage;
  }

  async getRecentMessages(limit: number = 50): Promise<ChatMessageEntity[]> {
    return await this.chatRepository.getRecentMessages(limit);
  }

  async deleteMessage(messageId: string, requestUserId: string, isAdmin: boolean = false): Promise<boolean> {
    if (!isAdmin) {
      throw new Error('只有管理員才能刪除訊息');
    }

    return await this.chatRepository.deleteMessage(messageId);
  }

  async clearChat(requestUserId: string, isAdmin: boolean = false): Promise<void> {
    if (!isAdmin) {
      throw new Error('只有管理員才能清空聊天室');
    }

    await this.chatRepository.clearMessages();
  }

  async sendSystemMessage(message: string): Promise<ChatMessageEntity> {
    return await this.sendMessage('system', '系統', message, 'system');
  }

  async sendAdminMessage(
    adminId: string,
    adminUsername: string,
    message: string
  ): Promise<ChatMessageEntity> {
    return await this.sendMessage(adminId, `[管理員] ${adminUsername}`, message, 'admin');
  }

  private sanitizeMessage(message: string): string {
    // 移除潛在的危險字符和 HTML 標籤
    return message
      .trim()
      .replace(/<[^>]*>/g, '') // 移除 HTML 標籤
      .replace(/[<>&"']/g, (match) => {
        const htmlEntities: { [key: string]: string } = {
          '<': '&lt;',
          '>': '&gt;',
          '&': '&amp;',
          '"': '&quot;',
          "'": '&#x27;'
        };
        return htmlEntities[match] || match;
      });
  }
}
