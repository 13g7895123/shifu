// Infrastructure - SQLite Chat Repository
import { ChatRepository } from '../../domain/repositories/ChatRepository';
import { ChatMessageEntity } from '../../domain/entities/ChatMessage';
import { SqliteService } from '../services/SqliteService';

interface ChatMessageRow {
  id: string;
  user_id: string;
  username: string;
  message: string;
  timestamp: string;
  type: string;
}

export class SqliteChatRepository implements ChatRepository {
  private sqliteService: SqliteService;
  private readonly maxMessages = 1000; // 最多保存1000條訊息

  constructor() {
    this.sqliteService = SqliteService.getInstance();
  }

  private rowToMessage(row: ChatMessageRow): ChatMessageEntity {
    return new ChatMessageEntity(
      row.id,
      row.user_id,
      row.username,
      row.message,
      new Date(row.timestamp),
      row.type as 'normal' | 'system' | 'admin'
    );
  }

  async saveMessage(message: ChatMessageEntity): Promise<void> {
    try {
      await this.sqliteService.run(
        `INSERT INTO chat_messages 
         (id, user_id, username, message, timestamp, type) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          message.id,
          message.userId,
          message.username,
          message.message,
          message.timestamp.toISOString(),
          message.type
        ]
      );

      // 檢查訊息數量，超過最大值時刪除舊訊息
      await this.cleanupOldMessages();
    } catch (error) {
      console.error('❌ 保存聊天訊息失敗:', error);
      throw error;
    }
  }

  async getRecentMessages(count: number = 50): Promise<ChatMessageEntity[]> {
    try {
      const rows = await this.sqliteService.all<ChatMessageRow>(
        'SELECT * FROM chat_messages ORDER BY timestamp DESC LIMIT ?',
        [count]
      );
      
      // 將結果按時間正序排列（最舊的在前面）
      return rows
        .map(row => this.rowToMessage(row))
        .reverse();
    } catch (error) {
      console.error('❌ 獲取聊天訊息失敗:', error);
      return [];
    }
  }

  async deleteMessage(messageId: string): Promise<boolean> {
    try {
      const result = await this.sqliteService.run(
        'DELETE FROM chat_messages WHERE id = ?',
        [messageId]
      );
      return result.changes > 0;
    } catch (error) {
      console.error('❌ 刪除聊天訊息失敗:', error);
      return false;
    }
  }

  async clearMessages(): Promise<void> {
    try {
      await this.sqliteService.run('DELETE FROM chat_messages');
      console.log('✅ 所有聊天訊息已清空');
    } catch (error) {
      console.error('❌ 清空聊天訊息失敗:', error);
      throw error;
    }
  }

  // 清理舊訊息，保持訊息數量在限制內
  private async cleanupOldMessages(): Promise<void> {
    try {
      const result = await this.sqliteService.get<{ count: number }>(
        'SELECT COUNT(*) as count FROM chat_messages'
      );

      if (result && result.count > this.maxMessages) {
        const deleteCount = result.count - this.maxMessages;
        await this.sqliteService.run(
          `DELETE FROM chat_messages 
           WHERE id IN (
             SELECT id FROM chat_messages 
             ORDER BY timestamp ASC 
             LIMIT ?
           )`,
          [deleteCount]
        );
        
        console.log(`🧹 已清理 ${deleteCount} 條舊聊天訊息`);
      }
    } catch (error) {
      console.error('❌ 清理舊訊息失敗:', error);
    }
  }

  // 輔助方法：獲取訊息數量統計
  async getMessageCount(): Promise<number> {
    try {
      const result = await this.sqliteService.get<{ count: number }>(
        'SELECT COUNT(*) as count FROM chat_messages'
      );
      return result?.count || 0;
    } catch (error) {
      console.error('❌ 獲取訊息數量失敗:', error);
      return 0;
    }
  }

  // 根據用戶ID獲取訊息
  async getMessagesByUserId(userId: string, limit: number = 50): Promise<ChatMessageEntity[]> {
    try {
      const rows = await this.sqliteService.all<ChatMessageRow>(
        'SELECT * FROM chat_messages WHERE user_id = ? ORDER BY timestamp DESC LIMIT ?',
        [userId, limit]
      );
      
      return rows
        .map(row => this.rowToMessage(row))
        .reverse();
    } catch (error) {
      console.error('❌ 根據用戶ID獲取訊息失敗:', error);
      return [];
    }
  }

  // 根據訊息類型獲取訊息
  async getMessagesByType(type: 'normal' | 'system' | 'admin', limit: number = 50): Promise<ChatMessageEntity[]> {
    try {
      const rows = await this.sqliteService.all<ChatMessageRow>(
        'SELECT * FROM chat_messages WHERE type = ? ORDER BY timestamp DESC LIMIT ?',
        [type, limit]
      );
      
      return rows
        .map(row => this.rowToMessage(row))
        .reverse();
    } catch (error) {
      console.error('❌ 根據訊息類型獲取訊息失敗:', error);
      return [];
    }
  }
}
