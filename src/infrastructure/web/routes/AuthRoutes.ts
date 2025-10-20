// Infrastructure - Authentication Routes
import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { AuthMiddleware } from '../middleware/AuthMiddleware';

export class AuthRoutes {
  private router: Router;

  constructor(
    private authController: AuthController,
    private authMiddleware: AuthMiddleware
  ) {
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // 註冊處理
    this.router.post('/register', 
      this.authController.register.bind(this.authController)
    );

    // 登入處理
    this.router.post('/login', 
      this.authController.login.bind(this.authController)
    );

    // 登出
    this.router.post('/logout', 
      this.authController.logout.bind(this.authController)
    );

    // API - 驗證 Token
    this.router.get('/verify', 
      this.authController.verifyToken.bind(this.authController)
    );

    // API - 獲取當前用戶信息
    this.router.get('/me', 
      this.authController.me.bind(this.authController)
    );
  }

  getRouter(): Router {
    return this.router;
  }
}
