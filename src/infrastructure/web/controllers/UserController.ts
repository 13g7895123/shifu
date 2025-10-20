// Infrastructure - Web Controllers
import { Request, Response } from 'express';
import {
  CreateUserUseCase,
  GetUserUseCase,
  GetAllUsersUseCase,
  UpdateUserUseCase,
  DeleteUserUseCase,
  UpdateUserPointUseCase,
  UpdateUserProfileUseCase
} from '../../../application/usecases/UserUseCases';
import { UserRole } from '../../../domain/entities/User';

export class UserController {
  constructor(
    private createUserUseCase: CreateUserUseCase,
    private getUserUseCase: GetUserUseCase,
    private getAllUsersUseCase: GetAllUsersUseCase,
    private updateUserUseCase: UpdateUserUseCase,
    private deleteUserUseCase: DeleteUserUseCase,
    private updateUserPointUseCase: UpdateUserPointUseCase,
    private updateUserProfileUseCase: UpdateUserProfileUseCase
  ) {}

  // Web pages
  async indexPage(req: Request, res: Response): Promise<void> {
    try {
      const users = await this.getAllUsersUseCase.execute();
      res.render('index', { 
        title: '使用者管理系統',
        users: users,
        user: req.user || null
      });
    } catch (error) {
      res.status(500).render('error', { 
        title: '錯誤',
        message: '載入使用者失敗',
        error: error 
      });
    }
  }

  async createUserPage(req: Request, res: Response): Promise<void> {
    res.render('create-user', { 
      title: '註冊新使用者',
      user: req.user || null,
      UserRole // 傳遞角色枚舉到模板
    });
  }

  async editUserPage(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = await this.getUserUseCase.execute(id);
      
      if (!user) {
        res.status(404).render('error', { 
          title: '錯誤',
          message: '找不到使用者',
          user: null // 暫時設定為 null，之後實作登入系統時會修改
        });
        return;
      }

      res.render('edit-user', { 
        title: '編輯使用者',
        currentUser: null, // 暫時設定為 null，之後實作登入系統時會修改
        user: user 
      });
    } catch (error) {
      res.status(500).render('error', { 
        title: '錯誤',
        message: '載入使用者失敗',
        error: error 
      });
    }
  }

  // API endpoints
  async createUser(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, password, phone, address, role } = req.body;
      
      if (!name || !email || !password || !phone || !address) {
      res.status(400).render('create-user', {
        title: '註冊新使用者',
        error: '所有欄位都是必填的',
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        address: req.body.address,
        user: req.user || null,
        UserRole
      });
        return;
      }

      // 檢查角色是否有效，如果沒有提供則默認為玩家
      let userRole = UserRole.PLAYER;
      if (role && Object.values(UserRole).includes(role)) {
        userRole = role as UserRole;
      }

      // 只有管理員才能創建管理員帳號
      if (userRole === UserRole.ADMIN && (!req.user || req.user.role !== UserRole.ADMIN)) {
        res.status(403).render('create-user', {
          title: '註冊新使用者',
          error: '只有管理員可以創建管理員帳號',
          name: req.body.name,
          email: req.body.email,
          phone: req.body.phone,
          address: req.body.address,
          user: req.user || null,
          UserRole
        });
        return;
      }

      const user = await this.createUserUseCase.execute(name, email, password, phone, address, userRole);
      res.redirect('/');
    } catch (error) {
      res.status(400).render('create-user', {
        title: '註冊新使用者',
        error: (error as Error).message,
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        address: req.body.address,
        user: req.user || null,
        UserRole
      });
    }
  }

  async getUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = await this.getUserUseCase.execute(id);
      
      if (!user) {
        res.status(404).json({ error: '找不到使用者' });
        return;
      }

      res.json(user);
    } catch (error) {
      res.status(500).json({ error: '內部伺服器錯誤' });
    }
  }

  async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const users = await this.getAllUsersUseCase.execute();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: '內部伺服器錯誤' });
    }
  }

  async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name } = req.body;
      
      if (!name) {
        res.status(400).json({ 
          error: '姓名為必填欄位' 
        });
        return;
      }

      const user = await this.updateUserUseCase.execute(id, name);
      res.redirect('/');
    } catch (error) {
      res.status(400).render('edit-user', {
        title: '編輯使用者',
        error: (error as Error).message,
        user: { id: req.params.id, name: req.body.name },
        currentUser: null // 暫時設定為 null，之後實作登入系統時會修改
      });
    }
  }

  async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await this.deleteUserUseCase.execute(id);
      res.redirect('/');
    } catch (error) {
      res.status(500).json({ error: '內部伺服器錯誤' });
    }
  }

  // API endpoint for updating user profile
  async updateUserProfile(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, phone, address } = req.body;

      // 檢查用戶是否有權限更新此個人資料（只能更新自己的資料，除非是管理員）
      if (req.user && req.user.id !== id && req.user.role !== UserRole.ADMIN) {
        res.status(403).json({ 
          success: false,
          error: '無權限更新此用戶資料' 
        });
        return;
      }

      // 構建更新資料物件（只包含非空值）
      const updateData: { name?: string; phone?: string; address?: string } = {};
      if (name !== undefined && name !== null) updateData.name = name;
      if (phone !== undefined && phone !== null) updateData.phone = phone;
      if (address !== undefined && address !== null) updateData.address = address;

      if (Object.keys(updateData).length === 0) {
        res.status(400).json({ 
          success: false,
          error: '沒有提供要更新的資料' 
        });
        return;
      }

      const updatedUser = await this.updateUserProfileUseCase.execute(id, updateData);
      
      if (!updatedUser) {
        res.status(404).json({ 
          success: false,
          error: '找不到使用者' 
        });
        return;
      }

      res.json({
        success: true,
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          phone: updatedUser.phone,
          address: updatedUser.address,
          point: updatedUser.point,
          role: updatedUser.role,
          createdAt: updatedUser.createdAt,
          updatedAt: updatedUser.updatedAt
        },
        message: '個人資料更新成功'
      });

    } catch (error) {
      res.status(400).json({ 
        success: false,
        error: (error as Error).message
      });
    }
  }

  // API endpoint for updating user points
  async updateUserPoints(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { points } = req.body;

      if (typeof points !== 'number') {
        res.status(400).json({ 
          success: false,
          error: '積分必須是數字' 
        });
        return;
      }

      const updatedUser = await this.updateUserPointUseCase.execute(id, points);
      
      if (!updatedUser) {
        res.status(404).json({ 
          success: false,
          error: '找不到使用者' 
        });
        return;
      }

      res.json({
        success: true,
        newPoints: updatedUser.point,
        message: `成功增加 ${points} 積分`
      });

    } catch (error) {
      res.status(500).json({ 
        success: false,
        error: '更新積分失敗' 
      });
    }
  }
}
