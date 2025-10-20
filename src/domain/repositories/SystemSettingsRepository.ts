// Domain - System Settings Repository Interface
import { SystemSettings, SystemSettingsKey } from '../entities/SystemSettings';

export interface SystemSettingsRepository {
  get(key: SystemSettingsKey): Promise<SystemSettings | null>;
  set(key: SystemSettingsKey, value: string, description?: string): Promise<void>;
  getAll(): Promise<SystemSettings[]>;
  delete(key: SystemSettingsKey): Promise<boolean>;
  exists(key: SystemSettingsKey): Promise<boolean>;
}
