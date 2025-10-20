// Infrastructure - Password Hash Service
import * as bcrypt from 'bcryptjs';

export class PasswordHashService {
  private saltRounds: number;

  constructor() {
    this.saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10);
  }

  async hashPassword(password: string): Promise<string> {
    try {
      const salt = await bcrypt.genSalt(this.saltRounds);
      return await bcrypt.hash(password, salt);
    } catch (error) {
      console.error('密碼雜湊失敗:', error);
      throw new Error('密碼加密失敗');
    }
  }

  async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
      console.error('密碼比較失敗:', error);
      return false;
    }
  }

  async isValidPassword(password: string): Promise<boolean> {
    // 基本密碼驗證規則
    if (!password || password.length < 6) {
      return false;
    }

    // 至少包含一個數字和一個字母
    const hasNumber = /\d/.test(password);
    const hasLetter = /[a-zA-Z]/.test(password);

    return hasNumber && hasLetter;
  }

  getPasswordRequirements(): string[] {
    return [
      '密碼長度至少 6 個字元',
      '至少包含一個數字',
      '至少包含一個字母'
    ];
  }
}
