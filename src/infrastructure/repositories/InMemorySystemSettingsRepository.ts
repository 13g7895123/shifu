// Infrastructure - In-Memory System Settings Repository (fallback)
import { SystemSettings, SystemSettingsKey } from '../../domain/entities/SystemSettings';
import { SystemSettingsRepository } from '../../domain/repositories/SystemSettingsRepository';

export class InMemorySystemSettingsRepository implements SystemSettingsRepository {
  private settings: Map<SystemSettingsKey, SystemSettings> = new Map();

  async get(key: SystemSettingsKey): Promise<SystemSettings | null> {
    return this.settings.get(key) || null;
  }

  async set(key: SystemSettingsKey, value: string, description?: string): Promise<void> {
    const now = new Date();
    const existing = this.settings.get(key);
    
    const setting: SystemSettings = {
      key,
      value,
      description,
      createdAt: existing?.createdAt || now,
      updatedAt: now
    };

    this.settings.set(key, setting);
  }

  async getAll(): Promise<SystemSettings[]> {
    return Array.from(this.settings.values());
  }

  async delete(key: SystemSettingsKey): Promise<boolean> {
    return this.settings.delete(key);
  }

  async exists(key: SystemSettingsKey): Promise<boolean> {
    return this.settings.has(key);
  }
}