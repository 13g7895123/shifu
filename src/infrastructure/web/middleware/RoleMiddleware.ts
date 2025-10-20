// Infrastructure - Role Authorization Middleware
import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../../../domain/entities/User';

export class RoleMiddleware {
  static requireRole(requiredRole: UserRole) {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).render('error', {
          message: '請先登入',
          statusCode: 401
        });
      }

      if (req.user.role !== requiredRole) {
        const roleName = requiredRole === UserRole.ADMIN ? '管理員' : '玩家';
        return res.status(403).render('error', {
          message: `此功能僅限${roleName}使用`,
          statusCode: 403
        });
      }

      next();
    };
  }

  static requireAdmin() {
    return RoleMiddleware.requireRole(UserRole.ADMIN);
  }

  static requirePlayer() {
    return RoleMiddleware.requireRole(UserRole.PLAYER);
  }

  static requireAnyRole(allowedRoles: UserRole[]) {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).render('error', {
          message: '請先登入',
          statusCode: 401
        });
      }

      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).render('error', {
          message: '您沒有權限訪問此功能',
          statusCode: 403
        });
      }

      next();
    };
  }
}
