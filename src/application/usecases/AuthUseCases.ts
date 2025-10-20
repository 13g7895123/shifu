// Application - Authentication Use Cases
import { User, UserEntity, UserRole } from '../../domain/entities/User';
import { UserRepository } from '../../domain/repositories/UserRepository';
import { JWTService } from '../../infrastructure/services/JWTService';
import { PasswordHashService } from '../../infrastructure/services/PasswordHashService';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone: string;
  address: string;
}

export interface RegisterResponse {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
}

export interface LoginResponse {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
}

export class RegisterUseCase {
  constructor(
    private userRepository: UserRepository,
    private jwtService: JWTService,
    private passwordHashService: PasswordHashService
  ) {}

  async execute(registerRequest: RegisterRequest): Promise<RegisterResponse> {
    try {
      const { name, email, password, phone, address } = registerRequest;

      // 驗證輸入
      if (!name || !email || !password || !phone || !address) {
        return {
          success: false,
          message: '所有欄位都是必填的'
        };
      }

      // 驗證 email 格式
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return {
          success: false,
          message: '請輸入有效的電子郵件地址'
        };
      }

      // 檢查是否已經註冊過
      const existingUser = await this.userRepository.findByEmail(email);
      if (existingUser) {
        return {
          success: false,
          message: '此電子郵件已被註冊，請使用其他電子郵件'
        };
      }

      // 驗證密碼強度
      const isPasswordValid = await this.passwordHashService.isValidPassword(password);
      if (!isPasswordValid) {
        const requirements = this.passwordHashService.getPasswordRequirements();
        return {
          success: false,
          message: `密碼不符合要求：${requirements.join('、')}`
        };
      }

      // 雜湊密碼
      const hashedPassword = await this.passwordHashService.hashPassword(password);

      // 創建新用戶（預設為玩家角色）
      const newUser = UserEntity.create(name, email, hashedPassword, phone, address, UserRole.PLAYER);
      const savedUser = await this.userRepository.save(newUser);

      // 生成 JWT Token
      const token = this.jwtService.generateToken(savedUser);

      return {
        success: true,
        user: savedUser,
        token: token,
        message: '註冊成功，歡迎加入！'
      };

    } catch (error) {
      console.error('註冊用例執行失敗:', error);
      return {
        success: false,
        message: '註冊過程發生錯誤，請稍後再試'
      };
    }
  }
}

export class LoginUseCase {
  constructor(
    private userRepository: UserRepository,
    private jwtService: JWTService,
    private passwordHashService: PasswordHashService
  ) {}

  async execute(loginRequest: LoginRequest): Promise<LoginResponse> {
    try {
      const { email, password } = loginRequest;

      // 驗證輸入
      if (!email || !password) {
        return {
          success: false,
          message: '請輸入電子郵件和密碼'
        };
      }

      // 查找使用者
      const user = await this.userRepository.findByEmail(email);
      if (!user) {
        return {
          success: false,
          message: '電子郵件或密碼錯誤'
        };
      }

      // 驗證密碼
      const isPasswordValid = await this.passwordHashService.comparePassword(password, user.password);
      if (!isPasswordValid) {
        return {
          success: false,
          message: '電子郵件或密碼錯誤'
        };
      }

      // 生成 JWT Token
      const token = this.jwtService.generateToken(user);

      return {
        success: true,
        user: user,
        token: token,
        message: '登入成功'
      };

    } catch (error) {
      console.error('登入用例執行失敗:', error);
      return {
        success: false,
        message: '登入過程發生錯誤，請稍後再試'
      };
    }
  }
}

export class LogoutUseCase {
  constructor(private jwtService: JWTService) {}

  async execute(token: string): Promise<{ success: boolean; message: string }> {
    try {
      // 驗證 token 是否有效
      const payload = this.jwtService.verifyToken(token);
      if (!payload) {
        return {
          success: false,
          message: '無效的認證 token'
        };
      }

      // 在真實應用中，這裡可能會將 token 加入黑名單
      // 目前簡單返回成功
      return {
        success: true,
        message: '登出成功'
      };

    } catch (error) {
      console.error('登出用例執行失敗:', error);
      return {
        success: false,
        message: '登出過程發生錯誤'
      };
    }
  }
}

export class VerifyTokenUseCase {
  constructor(
    private jwtService: JWTService,
    private userRepository: UserRepository
  ) {}

  async execute(token: string): Promise<{ success: boolean; user?: User; message?: string }> {
    try {
      // 驗證 token
      const payload = this.jwtService.verifyToken(token);
      if (!payload) {
        return {
          success: false,
          message: '無效的認證 token'
        };
      }

      // 查找使用者確認還存在
      const user = await this.userRepository.findById(payload.userId);
      if (!user) {
        return {
          success: false,
          message: '使用者不存在'
        };
      }

      return {
        success: true,
        user: user
      };

    } catch (error) {
      console.error('Token 驗證失敗:', error);
      return {
        success: false,
        message: 'Token 驗證失敗'
      };
    }
  }
}
