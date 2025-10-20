// Domain - System Settings Entity
export interface SystemSettings {
  id?: string;
  key: string;
  value: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface LiveStreamSettings {
  url: string;
  isEnabled: boolean;
  title?: string;
  description?: string;
}

export const SYSTEM_SETTINGS_KEYS = {
  LIVE_STREAM_URL: 'live_stream_url',
  LIVE_STREAM_ENABLED: 'live_stream_enabled',
  LIVE_STREAM_TITLE: 'live_stream_title',
  LIVE_STREAM_DESCRIPTION: 'live_stream_description'
} as const;

export type SystemSettingsKey = typeof SYSTEM_SETTINGS_KEYS[keyof typeof SYSTEM_SETTINGS_KEYS];
