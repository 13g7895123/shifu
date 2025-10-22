// Frontend Component - Chat Room
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { chatService } from '../services/chatService';
import { ChatMessage } from '../types/chat';
import './ChatRoom.css';

interface ChatRoomProps {
  className?: string;
}

const ChatRoom: React.FC<ChatRoomProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string>('');
  const [isMinimized, setIsMinimized] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Handle authentication retry
  const handleAuthRetry = useCallback(async () => {
    if (!user) return;
    
    setError('重新連接中...');
    setIsConnected(false);
    setIsAuthenticated(false);
    
    try {
      console.log('ChatRoom: Retrying authentication');
      await chatService.joinChat();
    } catch (error) {
      console.error('ChatRoom: Retry failed', error);
      setError('重新連接失敗，請刷新頁面');
    }
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Monitor user authentication state changes
  useEffect(() => {
    console.log('ChatRoom: User auth state changed', { 
      hasUser: !!user, 
      isConnected, 
      isAuthenticated
    });
    
    // If user logs out, clear authentication state
    if (!user && isAuthenticated) {
      console.log('ChatRoom: User logged out, clearing auth state');
      setIsAuthenticated(false);
      setError('用戶已登出');
    }
  }, [user, isConnected, isAuthenticated]);

  // Initialize chat service
  useEffect(() => {
    if (!user) {
      setError('請先登入才能使用聊天室');
      return;
    }
    
    const unsubscribeCallbacks: (() => void)[] = [];

    console.log('ChatRoom: Initializing chat', 'user:', user?.name);

    // 防止重複初始化
    let isInitializing = false;

    // Reset states for fresh connection
    setMessages([]);
    setIsConnected(false);
    setIsAuthenticated(false);
    setError('');

    // Set up event listeners
    unsubscribeCallbacks.push(
      chatService.onConnected(() => {
        console.log('ChatRoom: Connected to chat server');
        setIsConnected(true);
        setError('');
      })
    );

    unsubscribeCallbacks.push(
      chatService.onDisconnected(() => {
        console.log('ChatRoom: Disconnected from chat server');
        setIsConnected(false);
        setIsAuthenticated(false);
        setError('連接已斷開，請重試');
      })
    );

    unsubscribeCallbacks.push(
      chatService.onAuthenticated((chatUser) => {
        console.log('ChatRoom: Authenticated successfully', chatUser);
        setIsAuthenticated(true);
        setError('');
      })
    );

    unsubscribeCallbacks.push(
      chatService.onHistory((historyMessages) => {
        console.log('ChatRoom: Received chat history', historyMessages.length, 'messages');
        setMessages(historyMessages);
      })
    );

    unsubscribeCallbacks.push(
      chatService.onMessage((message) => {
        console.log('ChatRoom: New message received', message);
        setMessages(prev => [...prev, message]);
      })
    );

    unsubscribeCallbacks.push(
      chatService.onError((errorMessage) => {
        console.error('ChatRoom: Error received', errorMessage);
        setError(errorMessage);
      })
    );

    // Join game
    const initializeChat = async () => {
      if (isInitializing) {
        console.log('ChatRoom: Already initializing, skipping...');
        return;
      }
      
      isInitializing = true;
      try {
        console.log('ChatRoom: Joining chat');
        setError(''); // Clear any existing errors
        await chatService.joinChat();
        console.log('ChatRoom: Successfully joined chat');
      } catch (error) {
        console.error('ChatRoom: Failed to join chat', error);
        setError('無法連接聊天室，請重試');
      } finally {
        isInitializing = false;
      }
    };

    // Initialize with a small delay to ensure everything is ready
    const timer = setTimeout(initializeChat, 100);

    // Cleanup
    return () => {
      clearTimeout(timer);
      unsubscribeCallbacks.forEach(unsubscribe => unsubscribe());
    };
  }, [user]);

  const handleSendMessage = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentMessage.trim()) return;
    
    if (!isAuthenticated) {
      setError('請先登入才能發送訊息');
      return;
    }

    if (!isConnected) {
      setError('連接已斷開，正在重新連接...');
      handleAuthRetry();
      return;
    }

    chatService.sendMessage(currentMessage);
    setCurrentMessage('');
    inputRef.current?.focus();
  }, [currentMessage, isAuthenticated, isConnected, handleAuthRetry]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  }, [handleSendMessage]);

  const formatTime = (timestamp: Date): string => {
    return new Date(timestamp).toLocaleTimeString('zh-TW', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMessageClassName = (message: ChatMessage): string => {
    const baseClass = 'chat-message';
    
    switch (message.type) {
      case 'system':
        return `${baseClass} ${baseClass}--system`;
      case 'admin':
        return `${baseClass} ${baseClass}--admin`;
      default:
        return baseClass;
    }
  };

  const toggleMinimize = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsMinimized(!isMinimized);
  };

  return (
    <div className={`chat-room ${className} ${isMinimized ? 'chat-room--minimized' : ''}`}>
      {/* Chat Header */}
      <div className="chat-room__header">
        <div className="chat-room__title">
          <span className="chat-room__icon">💬</span>
          <span>聊天室</span>
          <span className={`chat-room__status ${isConnected ? 'chat-room__status--connected' : 'chat-room__status--disconnected'}`}>
            {isConnected 
              ? (isAuthenticated ? '已連接' : '認證中...') 
              : '連接中...'}
          </span>
        </div>
        <button 
          className="chat-room__minimize-btn"
          onClick={toggleMinimize}
          aria-label={isMinimized ? '展開聊天室' : '縮小聊天室'}
          style={{ zIndex: 9999 }}
        >
          {isMinimized ? '▲' : '▼'}
        </button>
      </div>

      {!isMinimized && (
        <>
          {/* Error Display */}
          {error && (
            <div className="chat-room__error">
              <span className="chat-room__error-icon">⚠️</span>
              <span className="flex-grow-1">{error}</span>
              {(!isAuthenticated || !isConnected) && (
                <button 
                  className="chat-room__error-retry"
                  onClick={handleAuthRetry}
                  style={{ marginRight: '8px' }}
                >
                  重試
                </button>
              )}
              <button 
                className="chat-room__error-close"
                onClick={() => setError('')}
              >
                ×
              </button>
            </div>
          )}

          {/* Messages Container */}
          <div className="chat-room__messages">
            {messages.length === 0 ? (
              <div className="chat-room__empty">
                <span className="chat-room__empty-icon">💬</span>
                <p>還沒有訊息，開始聊天吧！</p>
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className={getMessageClassName(message)}>
                  <div className="chat-message__header">
                    <span className="chat-message__username">
                      {message.username}
                      {message.type === 'admin' && (
                        <span className="chat-message__admin-badge">管理員</span>
                      )}
                    </span>
                    <span className="chat-message__time">
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                  <div className="chat-message__content">
                    {message.message}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <form className="chat-room__input-form" onSubmit={handleSendMessage}>
            <div className="chat-room__input-container">
              <input
                ref={inputRef}
                type="text"
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  !user 
                    ? "請先登入才能發送訊息"
                    : !isConnected 
                    ? "連接中..." 
                    : !isAuthenticated 
                    ? "認證中..." 
                    : "輸入訊息..."
                }
                className="chat-room__input"
                disabled={!user || !isAuthenticated || !isConnected}
                maxLength={500}
              />
              <button
                type="submit"
                className="chat-room__send-btn"
                disabled={!currentMessage.trim() || !isAuthenticated || !isConnected}
              >
                發送
              </button>
            </div>
            {!isAuthenticated && (
              <div className="chat-room__auth-hint">
                💡 登入後即可參與聊天
              </div>
            )}
          </form>
        </>
      )}
    </div>
  );
};

export default ChatRoom;
