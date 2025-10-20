// Domain - Ticket Repository Interface
import { TicketEntity } from '../entities/Ticket';

export interface TicketRepository {
  findById(id: string): Promise<TicketEntity | null>;
  findByGameIdAndTicketNumber(gameId: string, ticketNumber: number): Promise<TicketEntity | null>;
  findByGameId(gameId: string): Promise<TicketEntity[]>;
  findByUserId(userId: string): Promise<TicketEntity[]>;
  save(ticket: TicketEntity): Promise<TicketEntity>;
  delete(id: string): Promise<boolean>;
}
