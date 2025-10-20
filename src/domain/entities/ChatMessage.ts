// Domain Entity - Chat Message
export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  message: string;
  timestamp: Date;
  type: 'normal' | 'system' | 'admin';
}

export class ChatMessageEntity implements ChatMessage {
  public readonly id: string;
  public readonly userId: string;
  public readonly username: string;
  public readonly message: string;
  public readonly timestamp: Date;
  public readonly type: 'normal' | 'system' | 'admin';

  constructor(
    id: string,
    userId: string,
    username: string,
    message: string,
    timestamp: Date = new Date(),
    type: 'normal' | 'system' | 'admin' = 'normal'
  ) {
    this.id = id;
    this.userId = userId;
    this.username = username;
    this.message = message;
    this.timestamp = timestamp;
    this.type = type;
  }

  static create(
    userId: string,
    username: string,
    message: string,
    type: 'normal' | 'system' | 'admin' = 'normal'
  ): ChatMessageEntity {
    const id = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return new ChatMessageEntity(id, userId, username, message, new Date(), type);
  }
}
