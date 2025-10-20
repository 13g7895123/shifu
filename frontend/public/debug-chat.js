// 聊天室調試工具
console.log('=== 聊天室調試工具載入 ===');

// 保存原始的 console.log
const originalLog = console.log;

// 創建一個帶時間戳的日誌函數
const debugLog = (message, ...args) => {
  const timestamp = new Date().toLocaleTimeString();
  originalLog(`[${timestamp}] ${message}`, ...args);
};

// 替換 console.log
console.log = debugLog;

// 監控 Socket.IO 連接
if (window.io) {
  const originalIo = window.io;
  window.io = function(...args) {
    debugLog('Socket.IO: Creating connection with args:', args);
    const socket = originalIo(...args);
    
    // 監控所有事件
    const originalOn = socket.on;
    socket.on = function(event, handler) {
      debugLog(`Socket.IO: Registering listener for event: ${event}`);
      return originalOn.call(this, event, function(...eventArgs) {
        debugLog(`Socket.IO: Received event: ${event}`, eventArgs);
        return handler(...eventArgs);
      });
    };

    const originalEmit = socket.emit;
    socket.emit = function(event, ...data) {
      debugLog(`Socket.IO: Emitting event: ${event}`, data);
      return originalEmit.call(this, event, ...data);
    };

    return socket;
  };
}

debugLog('聊天室調試工具已載入，所有 Socket.IO 事件將被記錄');
