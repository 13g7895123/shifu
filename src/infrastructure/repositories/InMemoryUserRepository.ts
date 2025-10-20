// Infrastructure - In-Memory User Repository
import { User, UserRole } from '../../domain/entities/User';
import { UserRepository } from '../../domain/repositories/UserRepository';
import { UserEntity } from '../../domain/entities/User';
import { PasswordHashService } from '../services/PasswordHashService';

export class InMemoryUserRepository implements UserRepository {
  private users: Map<string, User> = new Map();
  private passwordHashService: PasswordHashService;

  constructor() {
    this.passwordHashService = new PasswordHashService();
    this.initializeDefaultUsers();
  }

  private async initializeDefaultUsers(): Promise<void> {
    try {
      // 創建預設用戶 Alice (玩家)
      const hashedPassword = await this.passwordHashService.hashPassword('alice123');
      const defaultUser = new UserEntity(
        'default-alice-001',
        'Alice',
        'alice@gmail.com',
        hashedPassword,
        '0912345678',
        '台北市信義區市府路1號',
        0,
        UserRole.PLAYER,
        new Date(),
        new Date()
      );
      
      // 創建預設管理員 Admin
      const hashedAdminPassword = await this.passwordHashService.hashPassword('admin123');
      const defaultAdmin = new UserEntity(
        'default-admin-001',
        'Administrator',
        'admin@gmail.com',
        hashedAdminPassword,
        '0900000000',
        '台北市信義區市府路1號',
        1000,
        UserRole.ADMIN,
        new Date(),
        new Date()
      );
      
      this.users.set(defaultUser.id, defaultUser);
      this.users.set(defaultAdmin.id, defaultAdmin);
      console.log('預設用戶 Alice (玩家) 已創建');
      console.log('預設管理員 Administrator 已創建');
    } catch (error) {
      console.error('創建預設用戶失敗:', error);
    }
  }



  async findById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  async findAll(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async findByRole(role: UserRole): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.role === role);
  }

  async save(user: User): Promise<User> {
    this.users.set(user.id, user);
    return user;
  }

  async delete(id: string): Promise<boolean> {
    return this.users.delete(id);
  }
}
