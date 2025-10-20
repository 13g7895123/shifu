// Application - System Settings Use Cases
import { SystemSettings, SystemSettingsKey, SYSTEM_SETTINGS_KEYS, LiveStreamSettings } from '../../domain/entities/SystemSettings';
import { SystemSettingsRepository } from '../../domain/repositories/SystemSettingsRepository';

export class SystemSettingsUseCases {
  constructor(private systemSettingsRepository: SystemSettingsRepository) {}

  async getSetting(key: SystemSettingsKey): Promise<SystemSettings | null> {
    return await this.systemSettingsRepository.get(key);
  }

  async setSetting(key: SystemSettingsKey, value: string, description?: string): Promise<void> {
    await this.systemSettingsRepository.set(key, value, description);
  }

  async getAllSettings(): Promise<SystemSettings[]> {
    return await this.systemSettingsRepository.getAll();
  }

  async deleteSetting(key: SystemSettingsKey): Promise<boolean> {
    return await this.systemSettingsRepository.delete(key);
  }

  async getLiveStreamSettings(): Promise<LiveStreamSettings> {
    const [urlSetting, enabledSetting, titleSetting, descSetting] = await Promise.all([
      this.getSetting(SYSTEM_SETTINGS_KEYS.LIVE_STREAM_URL),
      this.getSetting(SYSTEM_SETTINGS_KEYS.LIVE_STREAM_ENABLED),
      this.getSetting(SYSTEM_SETTINGS_KEYS.LIVE_STREAM_TITLE),
      this.getSetting(SYSTEM_SETTINGS_KEYS.LIVE_STREAM_DESCRIPTION)
    ]);

    return {
      url: urlSetting?.value || 'https://www.youtube.com/embed/IuEEEhSgTbs?si=AnexDTswpSpcSyqk',
      isEnabled: enabledSetting?.value === 'true',
      title: titleSetting?.value,
      description: descSetting?.value
    };
  }

  async setLiveStreamSettings(settings: LiveStreamSettings): Promise<void> {
    const promises = [
      this.setSetting(SYSTEM_SETTINGS_KEYS.LIVE_STREAM_URL, settings.url, '直播URL'),
      this.setSetting(SYSTEM_SETTINGS_KEYS.LIVE_STREAM_ENABLED, settings.isEnabled.toString(), '是否啟用直播')
    ];

    if (settings.title) {
      promises.push(this.setSetting(SYSTEM_SETTINGS_KEYS.LIVE_STREAM_TITLE, settings.title, '直播標題'));
    }

    if (settings.description) {
      promises.push(this.setSetting(SYSTEM_SETTINGS_KEYS.LIVE_STREAM_DESCRIPTION, settings.description, '直播描述'));
    }

    await Promise.all(promises);
  }
}
