// Infrastructure - Authentication Controllers
import { Request, Response } from 'express';
import { LoginUseCase, LogoutUseCase, VerifyTokenUseCase, RegisterUseCase } from '../../../application/usecases/AuthUseCases';

export class AuthController {
  constructor(
    private loginUseCase: LoginUseCase,
    private logoutUseCase: LogoutUseCase,
    private verifyTokenUseCase: VerifyTokenUseCase,
    private registerUseCase: RegisterUseCase
  ) {}

  // 處理註冊
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, password, phone, address } = req.body;
      
      console.log('Register attempt:', email);
      console.log('Request body:', req.body);

      const result = await this.registerUseCase.execute({
        name,
        email,
        password,
        phone,
        address
      });

      if (!result.success) {
        res.status(400).json({
          success: false,
          message: result.message
        });
        return;
      }

      // 設定 JWT Cookie
      res.cookie('authToken', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000, // 24 小時
        sameSite: 'lax'
      });

      res.json({
        success: true,
        message: '註冊成功',
        user: {
          id: result.user!.id,
          name: result.user!.name,
          email: result.user!.email,
          role: result.user!.role || 'player',
          point: result.user!.point,
          createdAt: result.user!.createdAt
        }
      });

    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({
        success: false,
        message: '註冊過程發生錯誤，請稍後再試'
      });
    }
  }

  // 處理登入
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, username } = req.body;
      
      // 支持email或username登入
      const loginIdentifier = email || username;
      console.log('Login attempt:', loginIdentifier);
      console.log('Request body:', req.body);
      
      if (!loginIdentifier || !password) {
        res.status(400).json({
          success: false,
          message: '請輸入帳號（電子郵件或用戶名）和密碼'
        });
        return;
      }

      // 使用email欄位傳遞登入識別符
      const result = await this.loginUseCase.execute({ 
        email: loginIdentifier, 
        password 
      });

      if (!result.success) {
        res.status(400).json({
          success: false,
          message: result.message
        });
        return;
      }

      // 設定 JWT Cookie
      res.cookie('authToken', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000, // 24 小時
        sameSite: 'lax'
      });

      res.json({
        success: true,
        message: '登入成功',
        user: {
          id: result.user!.id,
          name: result.user!.name,
          email: result.user!.email,
          role: result.user!.role || 'player',
          point: result.user!.point,
          createdAt: result.user!.createdAt
        }
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: '登入過程發生錯誤，請稍後再試'
      });
    }
  }

  // 處理登出
  async logout(req: Request, res: Response): Promise<void> {
    try {
      const token = req.cookies?.authToken;

      if (token) {
        await this.logoutUseCase.execute(token);
      }

      // 清除 Cookie
      res.clearCookie('authToken');
      
      res.json({
        success: true,
        message: '登出成功'
      });

    } catch (error) {
      console.error('登出錯誤:', error);
      res.clearCookie('authToken');
      res.status(500).json({
        success: false,
        message: '登出過程發生錯誤'
      });
    }
  }

  // API - 驗證 Token
  async verifyToken(req: Request, res: Response): Promise<void> {
    try {
      const token = req.cookies?.authToken || req.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        res.status(401).json({ 
          success: false, 
          message: '未提供認證 token' 
        });
        return;
      }

      const result = await this.verifyTokenUseCase.execute(token);

      if (!result.success) {
        res.status(401).json({
          success: false,
          message: result.message
        });
        return;
      }

      res.json({
        success: true,
        user: {
          id: result.user!.id,
          username: result.user!.name,
          email: result.user!.email,
          role: result.user!.role || 'user',
          createdAt: result.user!.createdAt
        }
      });

    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: '認證驗證失敗' 
      });
    }
  }

  // API - 獲取當前用戶信息
  async me(req: Request, res: Response): Promise<void> {
    try {
      const token = req.cookies?.authToken || req.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        res.status(401).json({ 
          success: false, 
          message: '未登入' 
        });
        return;
      }

      const result = await this.verifyTokenUseCase.execute(token);

      if (!result.success) {
        res.status(401).json({
          success: false,
          message: '認證失效'
        });
        return;
      }

      res.json({
        success: true,
        user: {
          id: result.user!.id,
          name: result.user!.name,
          email: result.user!.email,
          role: result.user!.role || 'player',
          point: result.user!.point,
          createdAt: result.user!.createdAt
        }
      });

    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: '獲取用戶信息失敗' 
      });
    }
  }
}
