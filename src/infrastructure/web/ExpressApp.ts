// Infrastructure - Express App Configuration
import express, { Application, Request, Response, NextFunction } from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { UserRoutes } from './routes/UserRoutes';
import { GameRoutes } from './routes/GameRoutes';
import { TicketRoutes } from './routes/TicketRoutes';
import { AuthRoutes } from './routes/AuthRoutes';
import { AdminRoutes } from './routes/AdminRoutes';
import { PrizeRoutes } from './routes/PrizeRoutes';
import { PublicSystemSettingsRoutes } from './routes/PublicSystemSettingsRoutes';
import { AuthMiddleware } from './middleware/AuthMiddleware';

export class ExpressApp {
  private app: Application;

  constructor(
    private userRoutes: UserRoutes, 
    private gameRoutes: GameRoutes,
    private ticketRoutes: TicketRoutes,
    private authRoutes: AuthRoutes,
    private adminRoutes: AdminRoutes,
    private prizeRoutes: PrizeRoutes,
    private publicSystemSettingsRoutes: PublicSystemSettingsRoutes,
    private authMiddleware: AuthMiddleware
  ) {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    // Security
    this.app.use(helmet());

    // CORS - 允許前端訪問
    this.app.use(cors({
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true
    }));

    // Compression
    this.app.use(compression());

    // Logging
    this.app.use(morgan('combined'));

    // Body parsing
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Cookie parsing
    this.app.use(cookieParser());

    // Static files
    this.app.use(express.static(path.join(__dirname, '../../../public')));
  }



  private setupRoutes(): void {
    // 全域認證中介軟體 - 為所有API路由提供使用者資訊
    this.app.use('/api', this.authMiddleware.authenticate);

    // Mount authentication routes
    this.app.use('/api/auth', this.authRoutes.getRouter());

    // Mount user routes
    this.app.use('/api/users', this.userRoutes.getRouter());

    // Mount game routes
    this.app.use('/api/games', this.gameRoutes.getRouter());

    // Mount ticket routes (需要登入驗證)
    this.app.use('/api/tickets', this.authMiddleware.authenticate.bind(this.authMiddleware), this.ticketRoutes.getRouter());

    // Mount prize routes
    this.app.use('/api/prizes', this.prizeRoutes.getRouter());

    // Mount admin routes
    this.app.use('/api/admin', this.adminRoutes.getRouter());

    // Mount public system settings routes (no auth required)
    this.app.use('/api/settings', this.publicSystemSettingsRoutes.getRouter());

    // Health check
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
      });
    });
  }

  private setupErrorHandling(): void {
    // 404 handler
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({
        success: false,
        message: '找不到您要尋找的API端點',
        statusCode: 404
      });
    });

    // Global error handler
    this.app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      console.error('Unhandled error:', err);
      
      const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
      
      res.status(statusCode).json({
        success: false,
        message: process.env.NODE_ENV === 'production' 
          ? '內部伺服器錯誤' 
          : err.message,
        error: process.env.NODE_ENV === 'production' ? undefined : err.stack,
        statusCode
      });
    });
  }

  getApp(): Application {
    return this.app;
  }
}
