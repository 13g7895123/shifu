// Infrastructure - Public System Settings Routes
import { Router } from 'express';
import { SystemSettingsController } from '../controllers/SystemSettingsController';

export class PublicSystemSettingsRoutes {
  private router: Router;

  constructor(private systemSettingsController: SystemSettingsController) {
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // 公开API - 无需认证
    this.router.get('/live-stream', this.systemSettingsController.getLiveStreamSettings);
  }

  getRouter(): Router {
    return this.router;
  }
}
