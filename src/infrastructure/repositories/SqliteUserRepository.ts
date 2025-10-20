// Infrastructure - SQLite User Repository
import { User, UserRole, UserEntity } from '../../domain/entities/User';
import { UserRepository } from '../../domain/repositories/UserRepository';
import { SqliteService } from '../services/SqliteService';
import { PasswordHashService } from '../services/PasswordHashService';

interface UserRow {
  id: string;
  name: string;
  email: string;
  password: string;
  phone: string;
  address: string;
  point: number;
  role: string;
  created_at: string;
  updated_at: string;
}

export class SqliteUserRepository implements UserRepository {
  private sqliteService: SqliteService;
  private passwordHashService: PasswordHashService;

  constructor() {
    this.sqliteService = SqliteService.getInstance();
    this.passwordHashService = new PasswordHashService();
    this.initializeDefaultUsers();
  }

  private async initializeDefaultUsers(): Promise<void> {
    try {
      // 檢查是否已有預設用戶
      const existingUser = await this.findByEmail('alice@gmail.com');
      if (existingUser) {
        console.log('✅ 預設用戶已存在，跳過初始化');
        return;
      }

      // 創建預設用戶 Alice (玩家)
      // const hashedPassword = await this.passwordHashService.hashPassword('alice123');
      // const defaultUser = new UserEntity(
      //   'default-alice-001',
      //   'Alice',
      //   'alice@gmail.com',
      //   hashedPassword,
      //   '0912345678',
      //   '台北市信義區市府路1號',
      //   0,
      //   UserRole.PLAYER,
      //   new Date(),
      //   new Date()
      // );

      // 創建預設管理員 Admin
      const hashedAdminPassword = await this.passwordHashService.hashPassword('admin123');
      const defaultAdmin = new UserEntity(
        'default-admin-001',
        'Administrator',
        'admin@gmail.com',
        hashedAdminPassword,
        '0900000000',
        '台北市信義區松仁路1號',
        500,
        UserRole.ADMIN,
        new Date(),
        new Date()
      );

      // await this.save(defaultUser);
      await this.save(defaultAdmin);

      console.log('✅ 預設用戶資料已創建到 SQLite');
    } catch (error) {
      console.error('❌ 創建預設用戶資料失敗:', error);
    }
  }

  private rowToUser(row: UserRow): User {
    return new UserEntity(
      row.id,
      row.name,
      row.email,
      row.password,
      row.phone,
      row.address,
      row.point,
      row.role as UserRole,
      new Date(row.created_at),
      new Date(row.updated_at)
    );
  }

  async findById(id: string): Promise<User | null> {
    try {
      const row = await this.sqliteService.get<UserRow>(
        'SELECT * FROM users WHERE id = ?',
        [id]
      );
      return row ? this.rowToUser(row) : null;
    } catch (error) {
      console.error('❌ 根據ID查找用戶失敗:', error);
      return null;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      const row = await this.sqliteService.get<UserRow>(
        'SELECT * FROM users WHERE email = ?',
        [email]
      );
      return row ? this.rowToUser(row) : null;
    } catch (error) {
      console.error('❌ 根據Email查找用戶失敗:', error);
      return null;
    }
  }

  async findAll(): Promise<User[]> {
    try {
      const rows = await this.sqliteService.all<UserRow>(
        'SELECT * FROM users ORDER BY created_at DESC'
      );
      return rows.map(row => this.rowToUser(row));
    } catch (error) {
      console.error('❌ 查找所有用戶失敗:', error);
      return [];
    }
  }

  async findByRole(role: UserRole): Promise<User[]> {
    try {
      const rows = await this.sqliteService.all<UserRow>(
        'SELECT * FROM users WHERE role = ? ORDER BY created_at DESC',
        [role]
      );
      return rows.map(row => this.rowToUser(row));
    } catch (error) {
      console.error('❌ 根據角色查找用戶失敗:', error);
      return [];
    }
  }

  async save(user: User): Promise<User> {
    try {
      await this.sqliteService.run(
        `INSERT OR REPLACE INTO users 
         (id, name, email, password, phone, address, point, role, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          user.id,
          user.name,
          user.email,
          user.password,
          user.phone,
          user.address,
          user.point,
          user.role,
          user.createdAt.toISOString(),
          new Date().toISOString()
        ]
      );
      return user;
    } catch (error) {
      console.error('❌ 保存用戶失敗:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const result = await this.sqliteService.run(
        'DELETE FROM users WHERE id = ?',
        [id]
      );
      return result.changes > 0;
    } catch (error) {
      console.error('❌ 刪除用戶失敗:', error);
      return false;
    }
  }
}
