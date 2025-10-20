// Infrastructure Service - WebSocket Chat Service
import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { ChatUseCases } from '../../application/usecases/ChatUseCases';
import { VerifyTokenUseCase } from '../../application/usecases/AuthUseCases';
import { UserRole } from '../../domain/entities/User';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  username?: string;
  isAdmin?: boolean;
}

export class WebSocketChatService {
  private io: SocketIOServer;
  private connectedUsers: Map<string, AuthenticatedSocket> = new Map();

  constructor(
    httpServer: HttpServer,
    private chatUseCases: ChatUseCases,
    private verifyTokenUseCase: VerifyTokenUseCase
  ) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
      }
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`New socket connection: ${socket.id}`);

      // 處理用戶認證
      socket.on('authenticate', async (data?: { token?: string }) => {
        try {
          let user = null;
          let token = data?.token;
          
          // 如果沒有提供 token，嘗試從 cookie 中讀取
          if (!token) {
            const cookies = socket.handshake.headers.cookie;
            if (cookies) {
              const cookieMatch = cookies.match(/authToken=([^;]+)/);
              if (cookieMatch) {
                token = cookieMatch[1];
              }
            }
          }
          
          if (token) {
            try {
              const verifyResult = await this.verifyTokenUseCase.execute(token);
              if (verifyResult.success) {
                user = verifyResult.user;
              }
            } catch (error) {
              console.log('Token verification failed, allowing anonymous access');
            }
          }

          if (user) {
            socket.userId = user.id;
            socket.username = user.name;
            socket.isAdmin = user.role === UserRole.ADMIN;
            
            // 加入全域聊天室
            socket.join('global_chat');
            this.connectedUsers.set(socket.id, socket);

            // 發送認證成功消息
            socket.emit('authenticated', {
              success: true,
              user: {
                id: user.id,
                username: user.name,
                role: user.role
              }
            });

            // 載入歷史訊息
            const messages = await this.chatUseCases.getRecentMessages(50);
            socket.emit('message_history', messages);

            // 通知其他用戶有新用戶加入
            socket.to('global_chat').emit('user_joined', {
              username: user.name,
              message: `${user.name} 加入了聊天室`
            });

            console.log(`User ${user.name} authenticated and joined global chat`);
          } else {
            // 匿名用戶
            socket.join('global_chat');
            socket.emit('authenticated', {
              success: true,
              user: null,
              message: '以訪客身份加入聊天室'
            });

            // 載入歷史訊息
            const messages = await this.chatUseCases.getRecentMessages(50);
            socket.emit('message_history', messages);
          }

        } catch (error) {
          console.error('Authentication error:', error);
          socket.emit('auth_error', {
            success: false,
            message: '認證失敗'
          });
        }
      });

      // 處理發送訊息
      socket.on('send_message', async (data: { message: string }) => {
        try {
          if (!socket.userId || !socket.username) {
            socket.emit('error', { message: '請先登入才能發送訊息' });
            return;
          }

          if (!data.message || !data.message.trim()) {
            socket.emit('error', { message: '訊息內容不能為空' });
            return;
          }

          // 使用 ChatUseCases 發送訊息
          const messageType = socket.isAdmin ? 'admin' : 'normal';
          const chatMessage = await this.chatUseCases.sendMessage(
            socket.userId,
            socket.username,
            data.message,
            messageType
          );

          // 廣播訊息給全域聊天室內的所有用戶
          this.io.to('global_chat').emit('new_message', chatMessage);

        } catch (error) {
          console.error('Send message error:', error);
          socket.emit('error', {
            message: error instanceof Error ? error.message : '發送訊息失敗'
          });
        }
      });

      // 處理刪除訊息（僅管理員）
      socket.on('delete_message', async (data: { messageId: string }) => {
        try {
          if (!socket.isAdmin) {
            socket.emit('error', { message: '只有管理員才能刪除訊息' });
            return;
          }

          const deleted = await this.chatUseCases.deleteMessage(
            data.messageId,
            socket.userId!,
            socket.isAdmin
          );

          if (deleted) {
            // 通知全域聊天室內所有用戶訊息已被刪除
            this.io.to('global_chat').emit('message_deleted', {
              messageId: data.messageId
            });
          }

        } catch (error) {
          console.error('Delete message error:', error);
          socket.emit('error', {
            message: error instanceof Error ? error.message : '刪除訊息失敗'
          });
        }
      });

      // 處理清空聊天室（僅管理員）
      socket.on('clear_chat', async () => {
        try {
          if (!socket.isAdmin) {
            socket.emit('error', { message: '只有管理員才能清空聊天室' });
            return;
          }

          await this.chatUseCases.clearChat(socket.userId!, socket.isAdmin);

          // 通知全域聊天室內所有用戶聊天室已被清空
          this.io.to('global_chat').emit('chat_cleared');

        } catch (error) {
          console.error('Clear chat error:', error);
          socket.emit('error', {
            message: error instanceof Error ? error.message : '清空聊天室失敗'
          });
        }
      });

      // 處理離開聊天室
      socket.on('leave_chat', () => {
        socket.leave('global_chat');
        console.log(`User left global chat: ${socket.username || socket.id}`);
      });

      // 處理斷開連接
      socket.on('disconnect', () => {
        if (socket.userId && socket.username) {
          // 通知其他用戶該用戶已離開
          socket.to('global_chat').emit('user_left', {
            username: socket.username,
            message: `${socket.username} 離開了聊天室`
          });
        }

        this.connectedUsers.delete(socket.id);
        console.log(`Socket disconnected: ${socket.id}`);
      });
    });
  }

  // 發送系統訊息到全域聊天室
  async sendSystemMessage(message: string): Promise<void> {
    try {
      const systemMessage = await this.chatUseCases.sendSystemMessage(message);
      this.io.to('global_chat').emit('new_message', systemMessage);
    } catch (error) {
      console.error('Send system message error:', error);
    }
  }

  // 獲取線上用戶數量
  getOnlineUsersCount(): number {
    const room = this.io.sockets.adapter.rooms.get('global_chat');
    return room ? room.size : 0;
  }

  // 獲取 Socket.IO 實例（供其他服務使用）
  getIO(): SocketIOServer {
    return this.io;
  }
}
