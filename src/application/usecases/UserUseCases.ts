// Application Use Cases - User Management
import { User, UserEntity, UserRole } from '../../domain/entities/User';
import { UserRepository } from '../../domain/repositories/UserRepository';
import { PasswordHashService } from '../../infrastructure/services/PasswordHashService';

export class CreateUserUseCase {
  constructor(
    private userRepository: UserRepository,
    private passwordHashService: PasswordHashService
  ) {}

  async execute(name: string, email: string, password: string, phone: string, address: string, role: UserRole = UserRole.PLAYER): Promise<User> {
    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('此電子郵件已被註冊，請使用其他電子郵件');
    }

    // 驗證密碼強度
    const isPasswordValid = await this.passwordHashService.isValidPassword(password);
    if (!isPasswordValid) {
      const requirements = this.passwordHashService.getPasswordRequirements();
      throw new Error(`密碼不符合要求：${requirements.join('、')}`);
    }

    // 雜湊密碼
    const hashedPassword = await this.passwordHashService.hashPassword(password);

    // Create new user
    const user = UserEntity.create(name, email, hashedPassword, phone, address, role);
    return await this.userRepository.save(user);
  }
}

export class GetUserUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(id: string): Promise<User | null> {
    return await this.userRepository.findById(id);
  }
}

export class GetAllUsersUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(): Promise<User[]> {
    return await this.userRepository.findAll();
  }
}

export class UpdateUserUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(id: string, name: string): Promise<User | null> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new Error('找不到使用者');
    }

    const userEntity = new UserEntity(
      user.id,
      user.name,
      user.email,
      user.password,
      user.phone,
      user.address,
      user.point,
      user.role,
      user.createdAt,
      user.updatedAt
    );

    const updatedUser = userEntity.updateName(name);
    return await this.userRepository.save(updatedUser);
  }
}

export class DeleteUserUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(id: string): Promise<boolean> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new Error('找不到使用者');
    }

    return await this.userRepository.delete(id);
  }
}

export class UpdateUserProfileUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(id: string, profileData: { name?: string; phone?: string; address?: string }): Promise<User | null> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new Error('找不到使用者');
    }

    // 驗證輸入資料
    if (profileData.name && profileData.name.trim().length === 0) {
      throw new Error('姓名不能為空');
    }
    if (profileData.phone && profileData.phone.trim().length === 0) {
      throw new Error('電話不能為空');
    }
    if (profileData.address && profileData.address.trim().length === 0) {
      throw new Error('地址不能為空');
    }

    const userEntity = new UserEntity(
      user.id,
      user.name,
      user.email,
      user.password,
      user.phone,
      user.address,
      user.point,
      user.role,
      user.createdAt,
      user.updatedAt
    );

    const updatedUser = userEntity.updateProfile(profileData);
    return await this.userRepository.save(updatedUser);
  }
}

export class UpdateUserPointUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(id: string, pointsToAdd: number): Promise<User | null> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new Error('找不到使用者');
    }

    const userEntity = new UserEntity(
      user.id,
      user.name,
      user.email,
      user.password,
      user.phone,
      user.address,
      user.point,
      user.role,
      user.createdAt,
      user.updatedAt
    );

    const updatedUser = userEntity.addPoint(pointsToAdd);
    return await this.userRepository.save(updatedUser);
  }
}
