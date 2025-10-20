// Infrastructure - Authentication Middleware
import { Request, Response, NextFunction } from 'express';
import { VerifyTokenUseCase } from '../../../application/usecases/AuthUseCases';
import { UserRole } from '../../../domain/entities/User';

// 擴展 Request 介面以包含使用者資訊
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        name: string;
        email: string;
        phone: string;
        address: string;
        point: number;
        role: UserRole;
        createdAt: Date;
        updatedAt: Date;
      };
    }
  }
}

export class AuthMiddleware {
  constructor(private verifyTokenUseCase: VerifyTokenUseCase) {}

  // 驗證 JWT Token 中介軟體
  authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = req.cookies?.authToken || req.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        // 未提供 token，繼續執行但不設定使用者
        req.user = undefined;
        next();
        return;
      }

      const result = await this.verifyTokenUseCase.execute(token);

      if (result.success && result.user) {
        // Token 有效，設定使用者資訊
        req.user = result.user;
      } else {
        // Token 無效，清除 cookie
        res.clearCookie('authToken');
        req.user = undefined;
      }

      next();

    } catch (error) {
      console.error('認證中介軟體錯誤:', error);
      res.clearCookie('authToken');
      req.user = undefined;
      next();
    }
  }

  // 需要登入的路由保護中介軟體
  requireAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = req.cookies?.authToken || req.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        if (req.accepts('html')) {
          res.redirect('/login');
        } else {
          res.status(401).json({ 
            success: false, 
            message: '需要登入才能存取此資源' 
          });
        }
        return;
      }

      const result = await this.verifyTokenUseCase.execute(token);

      if (!result.success || !result.user) {
        res.clearCookie('authToken');
        
        if (req.accepts('html')) {
          res.redirect('/login');
        } else {
          res.status(401).json({ 
            success: false, 
            message: '認證已過期，請重新登入' 
          });
        }
        return;
      }

      req.user = result.user;
      next();

    } catch (error) {
      console.error('認證保護中介軟體錯誤:', error);
      res.clearCookie('authToken');
      
      if (req.accepts('html')) {
        res.redirect('/login');
      } else {
        res.status(500).json({ 
          success: false, 
          message: '認證驗證失敗' 
        });
      }
    }
  }

  // 已登入使用者重定向中介軟體（如登入頁面）
  redirectIfAuthenticated = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = req.cookies?.authToken;

      if (!token) {
        next();
        return;
      }

      const result = await this.verifyTokenUseCase.execute(token);

      if (result.success && result.user) {
        // 已登入，重定向到遊戲頁面
        res.redirect('/game');
        return;
      }

      // Token 無效，清除並繼續
      res.clearCookie('authToken');
      next();

    } catch (error) {
      console.error('重定向中介軟體錯誤:', error);
      res.clearCookie('authToken');
      next();
    }
  }
}
