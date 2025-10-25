// API configuration for frontend
// 優先使用 REACT_APP_BACKEND_API_URL，若無則使用 REACT_APP_API_URL，最後才使用預設值
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_BACKEND_API_URL || process.env.REACT_APP_API_URL || 'http://localhost:3001',
  SOCKET_URL: process.env.REACT_APP_BACKEND_API_URL || process.env.REACT_APP_SERVER_URL || 'http://localhost:3001'
};

// Helper function to make API calls with absolute URLs
export const apiCall = async (endpoint: string, options: RequestInit = {}): Promise<Response> => {
  const url = endpoint.startsWith('http') ? endpoint : `${API_CONFIG.BASE_URL}${endpoint}`;
  
  return fetch(url, {
    credentials: 'include',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
};
