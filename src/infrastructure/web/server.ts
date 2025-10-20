// Infrastructure - Server Entry Point
import dotenv from 'dotenv';
import { createServer } from 'http';
import { ExpressApp } from './ExpressApp';
import { UserRoutes } from './routes/UserRoutes';
import { GameRoutes } from './routes/GameRoutes';
import { TicketRoutes } from './routes/TicketRoutes';
import { AuthRoutes } from './routes/AuthRoutes';
import { AdminRoutes } from './routes/AdminRoutes';
import { PrizeRoutes } from './routes/PrizeRoutes';
import { PublicSystemSettingsRoutes } from './routes/PublicSystemSettingsRoutes';
import { UserController } from './controllers/UserController';
import { GameController } from './controllers/GameController';
import { TicketController } from './controllers/TicketController';
import { AuthController } from './controllers/AuthController';
import { AdminController } from './controllers/AdminController';
import { PrizeController } from './controllers/PrizeController';
import { SystemSettingsController } from './controllers/SystemSettingsController';
import { AuthMiddleware } from './middleware/AuthMiddleware';
import { RepositoryFactory, RepositoryType } from '../services/RepositoryFactory';
import { RedisService } from '../services/RedisService';
import { JWTService } from '../services/JWTService';
import { PasswordHashService } from '../services/PasswordHashService';
import { WebSocketChatService } from '../services/WebSocketChatService';
import {
  CreateUserUseCase,
  GetUserUseCase,
  GetAllUsersUseCase,
  UpdateUserUseCase,
  DeleteUserUseCase,
  UpdateUserPointUseCase,
  UpdateUserProfileUseCase
} from '../../application/usecases/UserUseCases';
import {
  LoginUseCase,
  LogoutUseCase,
  VerifyTokenUseCase,
  RegisterUseCase
} from '../../application/usecases/AuthUseCases';
import { TicketUseCases } from '../../application/usecases/TicketUseCases';
import { PrizeUseCases } from '../../application/usecases/PrizeUseCases';
import { ChatUseCases } from '../../application/usecases/ChatUseCases';
import {
  AdminDashboardUseCase,
  ManageUsersUseCase,
  ManageGamesUseCase
} from '../../application/usecases/AdminUseCases';
import { GameUseCases } from '../../application/usecases/GameUseCases';
import { SystemSettingsUseCases } from '../../application/usecases/SystemSettingsUseCases';

// Load environment variables
dotenv.config();

class Server {
  private expressApp!: ExpressApp;
  private redisService: RedisService;
  private webSocketChatService!: WebSocketChatService;
  private chatUseCases!: ChatUseCases;
  private verifyTokenUseCase!: VerifyTokenUseCase;
  private port: number;

  constructor() {
    this.port = parseInt(process.env.PORT || '3001', 10);
    this.redisService = new RedisService();
  }

  private async setupDependencies(): Promise<void> {
    // 從環境變數決定使用哪種 repository 類型
    const repositoryType: RepositoryType = (process.env.REPOSITORY_TYPE as RepositoryType) || 'memory';
    
    // 初始化 Repository Factory
    await RepositoryFactory.initialize(repositoryType, this.redisService);
    
    // Infrastructure layer - 使用 Factory 獲取 repositories
    const userRepository = RepositoryFactory.getUserRepository();
    const gameRepository = RepositoryFactory.getGameRepository();
    const ticketRepository = RepositoryFactory.getTicketRepository();
    const prizeRepository = RepositoryFactory.getPrizeRepository();
    const chatRepository = RepositoryFactory.getChatRepository();
    const systemSettingsRepository = RepositoryFactory.getSystemSettingsRepository();
    const jwtService = new JWTService();
    const passwordHashService = new PasswordHashService();
    
    console.log(`🔧 使用 ${repositoryType.toUpperCase()} repositories`);

    // Application layer (Use Cases)
    const createUserUseCase = new CreateUserUseCase(userRepository, passwordHashService);
    const getUserUseCase = new GetUserUseCase(userRepository);
    const getAllUsersUseCase = new GetAllUsersUseCase(userRepository);
    const updateUserUseCase = new UpdateUserUseCase(userRepository);
    const deleteUserUseCase = new DeleteUserUseCase(userRepository);

    // Game Use Cases
    const gameUseCases = new GameUseCases(gameRepository, this.redisService, prizeRepository, userRepository, ticketRepository);

    // Ticket Use Cases
    const ticketUseCases = new TicketUseCases(ticketRepository, userRepository, gameRepository);

    // Prize Use Cases
    const prizeUseCases = new PrizeUseCases(prizeRepository, ticketRepository, userRepository, gameRepository);

    // Chat Use Cases
    const chatUseCases = new ChatUseCases(chatRepository);

    // Authentication Use Cases
    const loginUseCase = new LoginUseCase(userRepository, jwtService, passwordHashService);
    const logoutUseCase = new LogoutUseCase(jwtService);
    const verifyTokenUseCase = new VerifyTokenUseCase(jwtService, userRepository);
    const registerUseCase = new RegisterUseCase(userRepository, jwtService, passwordHashService);

    // Admin Use Cases
    const adminDashboardUseCase = new AdminDashboardUseCase(userRepository);
    const manageUsersUseCase = new ManageUsersUseCase(userRepository);
    const manageGamesUseCase = new ManageGamesUseCase(gameRepository, ticketRepository, userRepository, this.redisService, gameUseCases);

    // System Settings Use Cases
    const systemSettingsUseCases = new SystemSettingsUseCases(systemSettingsRepository);

    // Infrastructure layer (Controllers & Routes)
    const updateUserPointUseCase = new UpdateUserPointUseCase(userRepository);
    const updateUserProfileUseCase = new UpdateUserProfileUseCase(userRepository);

    const userController = new UserController(
      createUserUseCase,
      getUserUseCase,
      getAllUsersUseCase,
      updateUserUseCase,
      deleteUserUseCase,
      updateUserPointUseCase,
      updateUserProfileUseCase
    );

    const gameController = new GameController(gameUseCases);

    const ticketController = new TicketController(ticketUseCases);

    const prizeController = new PrizeController(prizeUseCases);

    const authController = new AuthController(
      loginUseCase,
      logoutUseCase,
      verifyTokenUseCase,
      registerUseCase
    );

    const adminController = new AdminController(
      adminDashboardUseCase,
      manageUsersUseCase,
      manageGamesUseCase
    );

    const systemSettingsController = new SystemSettingsController(systemSettingsUseCases);

    // Middleware
    const authMiddleware = new AuthMiddleware(verifyTokenUseCase);

    // Routes
    const userRoutes = new UserRoutes(userController);
    const gameRoutes = new GameRoutes(gameController);
    const ticketRoutes = new TicketRoutes(ticketController);
    const prizeRoutes = new PrizeRoutes(prizeController, authMiddleware);
    const authRoutes = new AuthRoutes(authController, authMiddleware);
    const adminRoutes = new AdminRoutes(adminController, authMiddleware, prizeController, systemSettingsController);
    const publicSystemSettingsRoutes = new PublicSystemSettingsRoutes(systemSettingsController);

    this.expressApp = new ExpressApp(userRoutes, gameRoutes, ticketRoutes, authRoutes, adminRoutes, prizeRoutes, publicSystemSettingsRoutes, authMiddleware);

    // Store use cases for WebSocket service
    this.chatUseCases = chatUseCases;
    this.verifyTokenUseCase = verifyTokenUseCase;
  }

  async start(): Promise<void> {
    try {
      // Connect to Redis (optional - app will work without it)
      try {
        await this.redisService.connect();
        console.log('✅ Redis connected successfully');
      } catch (error) {
        console.warn('⚠️  Redis connection failed, continuing without Redis:', error);
      }

      // Setup dependencies (including repositories)
      await this.setupDependencies();

      // Create HTTP server
      const app = this.expressApp.getApp();
      const httpServer = createServer(app);

      // Initialize WebSocket Chat Service
      this.webSocketChatService = new WebSocketChatService(httpServer, this.chatUseCases, this.verifyTokenUseCase);

      // Start server
      httpServer.listen(this.port, () => {
        console.log(`🚀 Server running on http://localhost:${this.port}`);
        console.log(`📊 Health check: http://localhost:${this.port}/health`);
        console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`💬 WebSocket Chat service initialized`);
      });

      // Graceful shutdown
      this.setupGracefulShutdown();

    } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }

  private setupGracefulShutdown(): void {
    const gracefulShutdown = async (signal: string): Promise<void> => {
      console.log(`\n📴 Received ${signal}. Starting graceful shutdown...`);
      
      try {
        await RepositoryFactory.cleanup();
        console.log('✅ Repository Factory cleaned up');
      } catch (error) {
        console.error('❌ Error cleaning up Repository Factory:', error);
      }
      
      try {
        await this.redisService.disconnect();
        console.log('✅ Redis disconnected');
      } catch (error) {
        console.error('❌ Error disconnecting Redis:', error);
      }

      console.log('✅ Graceful shutdown completed');
      process.exit(0);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  }
}

// Start the server
const server = new Server();
server.start().catch((error) => {
  console.error('❌ Unhandled error during server startup:', error);
  process.exit(1);
});
