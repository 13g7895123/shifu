// Infrastructure - Ticket Routes
import { Router } from 'express';
import { TicketController } from '../controllers/TicketController';

export class TicketRoutes {
  private router: Router;

  constructor(private ticketController: TicketController) {
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // 購買票券 - 需要登入
    this.router.post('/purchase', this.ticketController.purchaseTicket.bind(this.ticketController));
    
    // 獲取遊戲的所有已購買票券
    this.router.get('/game/:gameId', this.ticketController.getGameTickets.bind(this.ticketController));
    
    // 獲取用戶的所有已購買票券 - 需要登入
    this.router.get('/user', this.ticketController.getUserTickets.bind(this.ticketController));
    
    // 獲取特定票券詳情
    this.router.get('/:id', this.ticketController.getTicketById.bind(this.ticketController));
  }

  getRouter(): Router {
    return this.router;
  }
}
