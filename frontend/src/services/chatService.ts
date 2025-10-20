// Frontend Service - Chat WebSocket Service
import { io, Socket } from 'socket.io-client';
import { ChatMessage, ChatUser } from '../types/chat';
import { API_CONFIG } from './apiConfig';

export class ChatService {
  private socket: Socket | null = null;
  private token: string = '';
  private isAuthenticated: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 3;

  // Event listeners
  private onMessageCallbacks: ((message: ChatMessage) => void)[] = [];
  private onHistoryCallbacks: ((messages: ChatMessage[]) => void)[] = [];
  private onAuthenticatedCallbacks: ((user: ChatUser | null) => void)[] = [];
  private onErrorCallbacks: ((error: string) => void)[] = [];
  private onConnectedCallbacks: (() => void)[] = [];
  private onDisconnectedCallbacks: (() => void)[] = [];

  private connect(): void {
    console.log('ChatService: Creating new socket connection...');
    
    // Clean up existing socket
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
    }

    // 直接連接到後端服務器
    const serverUrl = API_CONFIG.SOCKET_URL;
    console.log('ChatService: Connecting to', serverUrl);
    
    this.socket = io(serverUrl, {
      autoConnect: false,
      withCredentials: true,
      transports: ['websocket', 'polling'], // 允許回退到 polling
      timeout: 10000,
      reconnection: false, // Disable auto-reconnection, we'll handle it manually
      forceNew: true
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    console.log('ChatService: Setting up event listeners');

    this.socket.on('connect', () => {
      console.log('ChatService: Connected to chat server, socket ID:', this.socket?.id);
      this.onConnectedCallbacks.forEach(callback => callback());
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log('Disconnected from chat server:', reason);
      this.isAuthenticated = false;
      this.onDisconnectedCallbacks.forEach(callback => callback());
      
      // Auto-reconnect if it wasn't intentional and we haven't exceeded max attempts
      if (reason !== 'io client disconnect' && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        setTimeout(() => {
          this.joinChat();
        }, 2000);
      }
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('Connection error:', error);
      this.onErrorCallbacks.forEach(callback => callback('連接失敗：' + error.message));
    });

    this.socket.on('reconnect', (attemptNumber: number) => {
      console.log('Reconnected to chat server after', attemptNumber, 'attempts');
      this.onConnectedCallbacks.forEach(callback => callback());
    });

    this.socket.on('reconnect_error', (error: Error) => {
      console.error('Reconnection error:', error);
    });

    this.socket.on('authenticated', (data: { success: boolean; user?: ChatUser; message?: string }) => {
      console.log('ChatService: Received authenticated event', data);
      if (data.success) {
        console.log('Chat authentication successful', data.user);
        this.isAuthenticated = true;
        this.reconnectAttempts = 0; // Reset attempts on successful auth
        this.onAuthenticatedCallbacks.forEach(callback => callback(data.user || null));
      } else {
        console.error('Chat authentication failed:', data.message);
        this.isAuthenticated = false;
        this.onErrorCallbacks.forEach(callback => callback(data.message || '認證失敗'));
      }
    });

    this.socket.on('message_history', (messages: ChatMessage[]) => {
      console.log('ChatService: Received chat history:', messages.length, 'messages');
      // Convert timestamp strings to Date objects
      const processedMessages = messages.map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }));
      this.onHistoryCallbacks.forEach(callback => callback(processedMessages));
    });

    this.socket.on('new_message', (message: ChatMessage) => {
      // Convert timestamp string to Date object
      const processedMessage = {
        ...message,
        timestamp: new Date(message.timestamp)
      };
      this.onMessageCallbacks.forEach(callback => callback(processedMessage));
    });

    this.socket.on('message_deleted', (data: { messageId: string }) => {
      // Handle message deletion if needed
      console.log('Message deleted:', data.messageId);
    });

    this.socket.on('chat_cleared', () => {
      // Handle chat clear
      console.log('Chat cleared by admin');
      this.onHistoryCallbacks.forEach(callback => callback([]));
    });

    this.socket.on('error', (error: { message: string }) => {
      console.error('Chat error:', error.message);
      this.onErrorCallbacks.forEach(callback => callback(error.message));
    });

    this.socket.on('user_joined', (data: { username: string; message: string }) => {
      console.log('User joined:', data.username);
    });

    this.socket.on('user_left', (data: { username: string; message: string }) => {
      console.log('User left:', data.username);
    });

    // Add catch-all event listener for debugging
    this.socket.onAny((event: string, ...args: any[]) => {
      console.log('ChatService: Received event:', event, args);
    });
  }

  // Public methods
  async joinChat(): Promise<void> {
    console.log('ChatService: Joining global chat');
    console.log('ChatService: Current state:', {
      socketConnected: this.socket?.connected || false,
      isAuthenticated: this.isAuthenticated,
      socketExists: !!this.socket
    });
    
    // Always reset authentication state when joining chat
    this.isAuthenticated = false;

    // Always create a fresh connection to avoid stale state
    console.log('ChatService: Creating fresh connection');
    this.connect();

    // Start connection
    console.log('ChatService: Starting connection...');
    this.socket!.connect();

    // Wait for connection
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        console.error('ChatService: Connection timeout');
        reject(new Error('連接超時'));
      }, 8000);

      const onConnect = () => {
        console.log('ChatService: Socket connected!');
        clearTimeout(timeout);
        this.socket!.off('connect_error', onError);
        resolve();
      };

      const onError = (error: Error) => {
        console.error('ChatService: Connection error:', error);
        clearTimeout(timeout);
        this.socket!.off('connect', onConnect);
        reject(error);
      };

      if (this.socket!.connected) {
        console.log('ChatService: Already connected');
        clearTimeout(timeout);
        resolve();
      } else {
        this.socket!.once('connect', onConnect);
        this.socket!.once('connect_error', onError);
      }
    });

    console.log('ChatService: Connected! Authenticating...');
    
    // Check if we have cookies
    console.log('ChatService: Current cookies:', document.cookie);
    
    // Send authentication for global chat
    this.socket!.emit('authenticate');
    
    // Wait for authentication response
    let authCompleted = false;
    
    const authPromise = new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (!authCompleted) {
          reject(new Error('認證超時'));
        }
      }, 5000);

      const onAuth = (data: { success: boolean; user?: ChatUser; message?: string }) => {
        console.log('ChatService: Got auth response in joinChat:', data);
        authCompleted = true;
        clearTimeout(timeout);
        if (data.success) {
          this.isAuthenticated = true;
          resolve();
        } else {
          reject(new Error(data.message || '認證失敗'));
        }
      };

      // Listen for auth response
      this.socket!.once('authenticated', onAuth);
    });

    await authPromise;
    console.log('ChatService: Authentication completed successfully');
  }

  sendMessage(message: string): void {
    if (!this.socket || !this.socket.connected) {
      this.onErrorCallbacks.forEach(callback => callback('未連接到聊天服務器'));
      return;
    }

    this.socket.emit('send_message', {
      message: message.trim()
    });
  }

  deleteMessage(messageId: string): void {
    if (!this.socket || !this.socket.connected) return;

    this.socket.emit('delete_message', {
      messageId
    });
  }

  clearChat(): void {
    if (!this.socket || !this.socket.connected) return;

    this.socket.emit('clear_chat');
  }

  leaveChat(): void {
    if (!this.socket) return;

    console.log('ChatService: Leaving chat');
    
    this.socket.emit('leave_chat');
  }

  disconnect(): void {
    if (this.socket) {
      // 離開聊天室
      this.leaveChat();
      
      // 移除所有事件監聽器
      this.socket.removeAllListeners();
      
      // 關閉連接
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Force reconnection - useful when authentication fails
  forceReconnect(): void {
    console.log('ChatService: Force reconnect requested');
    
    // Reset state
    this.isAuthenticated = false;
    this.reconnectAttempts = 0;
    
    // Disconnect current connection
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Event subscription methods
  onMessage(callback: (message: ChatMessage) => void): () => void {
    this.onMessageCallbacks.push(callback);
    return () => {
      const index = this.onMessageCallbacks.indexOf(callback);
      if (index > -1) {
        this.onMessageCallbacks.splice(index, 1);
      }
    };
  }

  onHistory(callback: (messages: ChatMessage[]) => void): () => void {
    this.onHistoryCallbacks.push(callback);
    return () => {
      const index = this.onHistoryCallbacks.indexOf(callback);
      if (index > -1) {
        this.onHistoryCallbacks.splice(index, 1);
      }
    };
  }

  onAuthenticated(callback: (user: ChatUser | null) => void): () => void {
    this.onAuthenticatedCallbacks.push(callback);
    return () => {
      const index = this.onAuthenticatedCallbacks.indexOf(callback);
      if (index > -1) {
        this.onAuthenticatedCallbacks.splice(index, 1);
      }
    };
  }

  onError(callback: (error: string) => void): () => void {
    this.onErrorCallbacks.push(callback);
    return () => {
      const index = this.onErrorCallbacks.indexOf(callback);
      if (index > -1) {
        this.onErrorCallbacks.splice(index, 1);
      }
    };
  }

  onConnected(callback: () => void): () => void {
    this.onConnectedCallbacks.push(callback);
    return () => {
      const index = this.onConnectedCallbacks.indexOf(callback);
      if (index > -1) {
        this.onConnectedCallbacks.splice(index, 1);
      }
    };
  }

  onDisconnected(callback: () => void): () => void {
    this.onDisconnectedCallbacks.push(callback);
    return () => {
      const index = this.onDisconnectedCallbacks.indexOf(callback);
      if (index > -1) {
        this.onDisconnectedCallbacks.splice(index, 1);
      }
    };
  }

  // Getters
  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

// Export singleton instance
export const chatService = new ChatService();
