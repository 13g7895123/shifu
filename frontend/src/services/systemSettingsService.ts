// System Settings API Service
import { apiCall } from './apiConfig';

export interface LiveStreamSettings {
  url: string;
  isEnabled: boolean;
  title?: string;
  description?: string;
}

export interface SystemSetting {
  key: string;
  value: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const systemSettingsAPI = {
  // 获取直播设置（公开API，不需要管理员权限）
  async getLiveStreamSettingsPublic(): Promise<LiveStreamSettings> {
    const response = await apiCall('/api/settings/live-stream');
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || '获取直播设置失败');
    }
    
    return data.data;
  },

  // 获取所有系统设置
  async getAllSettings(): Promise<SystemSetting[]> {
    const response = await apiCall('/api/admin/api/settings');
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || '获取系统设置失败');
    }
    
    return data.data;
  },

  // 获取直播设置
  async getLiveStreamSettings(): Promise<LiveStreamSettings> {
    const response = await apiCall('/api/admin/api/settings/live-stream');
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || '获取直播设置失败');
    }
    
    return data.data;
  },

  // 设置直播设置
  async setLiveStreamSettings(settings: LiveStreamSettings): Promise<void> {
    const response = await apiCall('/api/admin/api/settings/live-stream', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(settings)
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || '设置直播设置失败');
    }
  },

  // 获取单个设置
  async getSetting(key: string): Promise<SystemSetting | null> {
    const response = await apiCall(`/api/admin/api/settings/${key}`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || '获取设置失败');
    }
    
    return data.data;
  },

  // 设置单个设置
  async setSetting(key: string, value: string, description?: string): Promise<void> {
    const response = await apiCall(`/api/admin/api/settings/${key}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ value, description })
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || '设置失败');
    }
  }
};
