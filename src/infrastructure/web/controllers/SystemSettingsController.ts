// Infrastructure - System Settings Controller
import { Request, Response } from 'express';
import { SystemSettingsUseCases } from '../../../application/usecases/SystemSettingsUseCases';
import { SYSTEM_SETTINGS_KEYS } from '../../../domain/entities/SystemSettings';

export class SystemSettingsController {
  constructor(private systemSettingsUseCases: SystemSettingsUseCases) {}

  // 获取所有系统设置
  getAllSettings = async (req: Request, res: Response): Promise<void> => {
    try {
      const settings = await this.systemSettingsUseCases.getAllSettings();
      res.json({
        success: true,
        data: settings
      });
    } catch (error) {
      console.error('Error getting all system settings:', error);
      res.status(500).json({
        success: false,
        message: '获取系统设置失败'
      });
    }
  };

  // 获取直播设置
  getLiveStreamSettings = async (req: Request, res: Response): Promise<void> => {
    try {
      const settings = await this.systemSettingsUseCases.getLiveStreamSettings();
      res.json({
        success: true,
        data: settings
      });
    } catch (error) {
      console.error('Error getting live stream settings:', error);
      res.status(500).json({
        success: false,
        message: '获取直播设置失败'
      });
    }
  };

  // 设置直播设置
  setLiveStreamSettings = async (req: Request, res: Response): Promise<void> => {
    try {
      const { url, isEnabled, title, description } = req.body;

      if (!url || typeof isEnabled !== 'boolean') {
        res.status(400).json({
          success: false,
          message: 'URL和启用状态是必填项'
        });
        return;
      }

      // 验证URL格式
      try {
        new URL(url);
      } catch {
        res.status(400).json({
          success: false,
          message: '请输入有效的URL'
        });
        return;
      }

      await this.systemSettingsUseCases.setLiveStreamSettings({
        url,
        isEnabled,
        title,
        description
      });

      res.json({
        success: true,
        message: '直播设置更新成功'
      });
    } catch (error) {
      console.error('Error setting live stream settings:', error);
      res.status(500).json({
        success: false,
        message: '设置直播设置失败'
      });
    }
  };

  // 获取单个设置
  getSetting = async (req: Request, res: Response): Promise<void> => {
    try {
      const { key } = req.params;
      
      if (!Object.values(SYSTEM_SETTINGS_KEYS).includes(key as any)) {
        res.status(400).json({
          success: false,
          message: '无效的设置键'
        });
        return;
      }

      const setting = await this.systemSettingsUseCases.getSetting(key as any);
      res.json({
        success: true,
        data: setting
      });
    } catch (error) {
      console.error('Error getting system setting:', error);
      res.status(500).json({
        success: false,
        message: '获取设置失败'
      });
    }
  };

  // 设置单个设置
  setSetting = async (req: Request, res: Response): Promise<void> => {
    try {
      const { key } = req.params;
      const { value, description } = req.body;

      if (!Object.values(SYSTEM_SETTINGS_KEYS).includes(key as any)) {
        res.status(400).json({
          success: false,
          message: '无效的设置键'
        });
        return;
      }

      if (value === undefined || value === null) {
        res.status(400).json({
          success: false,
          message: '设置值不能为空'
        });
        return;
      }

      await this.systemSettingsUseCases.setSetting(key as any, String(value), description);
      res.json({
        success: true,
        message: '设置更新成功'
      });
    } catch (error) {
      console.error('Error setting system setting:', error);
      res.status(500).json({
        success: false,
        message: '更新设置失败'
      });
    }
  };
}
