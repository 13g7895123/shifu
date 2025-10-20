// Infrastructure - JWT Service
import jwt from 'jsonwebtoken';
import { User } from '../../domain/entities/User';

export interface TokenPayload {
  userId: string;
  email: string;
  name: string;
  point: number;
}

export class JWTService {
  private secretKey: string;
  private expiresIn: string | number;

  constructor() {
    this.secretKey = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    this.expiresIn = process.env.JWT_EXPIRES_IN || '24h';
  }

  generateToken(user: User): string {
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      point: user.point
    };

    return jwt.sign(payload, this.secretKey, {
      expiresIn: this.expiresIn
    } as jwt.SignOptions);
  }

  verifyToken(token: string): TokenPayload | null {
    try {
      const decoded = jwt.verify(token, this.secretKey) as TokenPayload;
      return decoded;
    } catch (error) {
      console.error('JWT 驗證失敗:', error);
      return null;
    }
  }

  refreshToken(token: string): string | null {
    const payload = this.verifyToken(token);
    if (!payload) {
      return null;
    }

    // 生成新的 token
    return jwt.sign(
      {
        userId: payload.userId,
        email: payload.email,
        name: payload.name,
        point: payload.point
      },
      this.secretKey,
      {
        expiresIn: this.expiresIn
      } as jwt.SignOptions
    );
  }
}
