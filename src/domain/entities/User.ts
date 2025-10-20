// Domain Entity - User
export enum UserRole {
  PLAYER = 'player',
  ADMIN = 'admin'
}

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  phone: string;
  address: string;
  point: number;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export class UserEntity implements User {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly email: string,
    public readonly password: string,
    public readonly phone: string,
    public readonly address: string,
    public readonly point: number,
    public readonly role: UserRole,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static create(name: string, email: string, password: string, phone: string, address: string, role: UserRole = UserRole.PLAYER): UserEntity {
    const now = new Date();
    return new UserEntity(
      this.generateId(),
      name,
      email,
      password, // 注意：這裡應該傳入已經雜湊過的密碼
      phone,
      address,
      0, // 新用戶預設積分
      role,
      now,
      now
    );
  }

  updateName(newName: string): UserEntity {
    return new UserEntity(
      this.id,
      newName,
      this.email,
      this.password,
      this.phone,
      this.address,
      this.point,
      this.role,
      this.createdAt,
      new Date()
    );
  }

  updateProfile(profile: { name?: string; email?: string; phone?: string; address?: string }): UserEntity {
    return new UserEntity(
      this.id,
      profile.name ?? this.name,
      profile.email ?? this.email,
      this.password,
      profile.phone ?? this.phone,
      profile.address ?? this.address,
      this.point,
      this.role,
      this.createdAt,
      new Date()
    );
  }

  updatePoint(newPoint: number): UserEntity {
    return new UserEntity(
      this.id,
      this.name,
      this.email,
      this.password,
      this.phone,
      this.address,
      newPoint,
      this.role,
      this.createdAt,
      new Date()
    );
  }

  updatePoints(pointsToAdd: number): UserEntity {
    return this.updatePoint(this.point + pointsToAdd);
  }

  addPoint(pointsToAdd: number): UserEntity {
    return this.updatePoint(this.point + pointsToAdd);
  }

  updateRole(newRole: UserRole): UserEntity {
    return new UserEntity(
      this.id,
      this.name,
      this.email,
      this.password,
      this.phone,
      this.address,
      this.point,
      newRole,
      this.createdAt,
      new Date()
    );
  }

  isAdmin(): boolean {
    return this.role === UserRole.ADMIN;
  }

  isPlayer(): boolean {
    return this.role === UserRole.PLAYER;
  }

  private static generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}
