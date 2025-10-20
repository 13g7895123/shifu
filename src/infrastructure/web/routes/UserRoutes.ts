// Infrastructure - Express Routes
import { Router } from 'express';
import { UserController } from '../controllers/UserController';

export class UserRoutes {
  private router: Router;

  constructor(private userController: UserController) {
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // API endpoints only - web pages are handled separately or by frontend
    this.router.get('/', this.userController.getAllUsers.bind(this.userController));
    this.router.get('/:id', this.userController.getUser.bind(this.userController));
    this.router.put('/:id/profile', this.userController.updateUserProfile.bind(this.userController));
    this.router.post('/:id/points', this.userController.updateUserPoints.bind(this.userController));
  }

  getRouter(): Router {
    return this.router;
  }
}
