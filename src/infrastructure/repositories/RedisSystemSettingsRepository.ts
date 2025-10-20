// Infrastructure - Redis System Settings Repository
import { SystemSettings, SystemSettingsKey } from '../../domain/entities/SystemSettings';
import { SystemSettingsRepository } from '../../domain/repositories/SystemSettingsRepository';
import { RedisService } from '../services/RedisService';

export class RedisSystemSettingsRepository implements SystemSettingsRepository {
  private keyPrefix = 'system_settings:';

  constructor(private redisService: RedisService) {}

  async get(key: SystemSettingsKey): Promise<SystemSettings | null> {
    try {
      const redisKey = this.getRedisKey(key);
      const value = await this.redisService.get(redisKey);
      
      if (value === null) {
        return null;
      }

      const data = JSON.parse(value);
      return {
        key,
        value: data.value,
        description: data.description,
        createdAt: data.createdAt ? new Date(data.createdAt) : undefined,
        updatedAt: data.updatedAt ? new Date(data.updatedAt) : undefined
      };
    } catch (error) {
      console.error('Error getting system setting:', error);
      return null;
    }
  }

  async set(key: SystemSettingsKey, value: string, description?: string): Promise<void> {
    try {
      const redisKey = this.getRedisKey(key);
      const now = new Date().toISOString();
      
      const data = {
        value,
        description,
        createdAt: now,
        updatedAt: now
      };

      await this.redisService.set(redisKey, JSON.stringify(data));
    } catch (error) {
      console.error('Error setting system setting:', error);
      throw error;
    }
  }

  async getAll(): Promise<SystemSettings[]> {
    try {
      // Redis doesn't support pattern matching in the basic get method
      // We'll need to use the Redis client directly for this
      const client = this.redisService.getClient();
      const pattern = `${this.keyPrefix}*`;
      const keys = await client.keys(pattern);
      
      const settings: SystemSettings[] = [];
      
      for (const redisKey of keys) {
        const value = await this.redisService.get(redisKey);
        if (value) {
          const data = JSON.parse(value);
          const key = redisKey.replace(this.keyPrefix, '') as SystemSettingsKey;
          
          settings.push({
            key,
            value: data.value,
            description: data.description,
            createdAt: data.createdAt ? new Date(data.createdAt) : undefined,
            updatedAt: data.updatedAt ? new Date(data.updatedAt) : undefined
          });
        }
      }
      
      return settings;
    } catch (error) {
      console.error('Error getting all system settings:', error);
      return [];
    }
  }

  async delete(key: SystemSettingsKey): Promise<boolean> {
    try {
      const redisKey = this.getRedisKey(key);
      return await this.redisService.del(redisKey);
    } catch (error) {
      console.error('Error deleting system setting:', error);
      return false;
    }
  }

  async exists(key: SystemSettingsKey): Promise<boolean> {
    try {
      const redisKey = this.getRedisKey(key);
      return await this.redisService.exists(redisKey);
    } catch (error) {
      console.error('Error checking system setting existence:', error);
      return false;
    }
  }

  private getRedisKey(key: SystemSettingsKey): string {
    return `${this.keyPrefix}${key}`;
  }
}
