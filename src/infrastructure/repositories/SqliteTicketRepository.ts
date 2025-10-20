// Infrastructure - SQLite Ticket Repository
import { TicketEntity } from '../../domain/entities/Ticket';
import { TicketRepository } from '../../domain/repositories/TicketRepository';
import { SqliteService } from '../services/SqliteService';
import { v4 as uuidv4 } from 'uuid';

interface TicketRow {
  id: string;
  game_id: string;
  ticket_number: number;
  user_id: string;
  purchase_price: number;
  purchased_at: string;
}

export class SqliteTicketRepository implements TicketRepository {
  private sqliteService: SqliteService;

  constructor() {
    this.sqliteService = SqliteService.getInstance();
  }

  private rowToTicket(row: TicketRow): TicketEntity {
    return new TicketEntity(
      row.id,
      row.game_id,
      row.ticket_number,
      row.user_id,
      row.purchase_price,
      new Date(row.purchased_at)
    );
  }

  async findById(id: string): Promise<TicketEntity | null> {
    try {
      const row = await this.sqliteService.get<TicketRow>(
        'SELECT * FROM tickets WHERE id = ?',
        [id]
      );
      return row ? this.rowToTicket(row) : null;
    } catch (error) {
      console.error('❌ 根據ID查找票券失敗:', error);
      return null;
    }
  }

  async findByGameIdAndTicketNumber(gameId: string, ticketNumber: number): Promise<TicketEntity | null> {
    try {
      const row = await this.sqliteService.get<TicketRow>(
        'SELECT * FROM tickets WHERE game_id = ? AND ticket_number = ?',
        [gameId, ticketNumber]
      );
      return row ? this.rowToTicket(row) : null;
    } catch (error) {
      console.error('❌ 根據遊戲ID和票號查找票券失敗:', error);
      return null;
    }
  }

  async findByGameId(gameId: string): Promise<TicketEntity[]> {
    try {
      const rows = await this.sqliteService.all<TicketRow>(
        'SELECT * FROM tickets WHERE game_id = ? ORDER BY ticket_number',
        [gameId]
      );
      return rows.map(row => this.rowToTicket(row));
    } catch (error) {
      console.error('❌ 根據遊戲ID查找票券失敗:', error);
      return [];
    }
  }

  async findByUserId(userId: string): Promise<TicketEntity[]> {
    try {
      const rows = await this.sqliteService.all<TicketRow>(
        'SELECT * FROM tickets WHERE user_id = ? ORDER BY purchased_at DESC',
        [userId]
      );
      return rows.map(row => this.rowToTicket(row));
    } catch (error) {
      console.error('❌ 根據用戶ID查找票券失敗:', error);
      return [];
    }
  }

  async save(ticket: TicketEntity): Promise<TicketEntity> {
    try {
      await this.sqliteService.run(
        `INSERT OR REPLACE INTO tickets 
         (id, game_id, ticket_number, user_id, purchase_price, purchased_at) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          ticket.id,
          ticket.gameId,
          ticket.ticketNumber,
          ticket.userId,
          ticket.purchasePrice,
          ticket.purchasedAt.toISOString()
        ]
      );
      return ticket;
    } catch (error) {
      console.error('❌ 保存票券失敗:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const result = await this.sqliteService.run(
        'DELETE FROM tickets WHERE id = ?',
        [id]
      );
      return result.changes > 0;
    } catch (error) {
      console.error('❌ 刪除票券失敗:', error);
      return false;
    }
  }
}
