// Infrastructure - In Memory Ticket Repository
import { TicketEntity } from '../../domain/entities/Ticket';
import { TicketRepository } from '../../domain/repositories/TicketRepository';
import { v4 as uuidv4 } from 'uuid';

export class InMemoryTicketRepository implements TicketRepository {
  private tickets: Map<string, TicketEntity> = new Map();

  async findById(id: string): Promise<TicketEntity | null> {
    return this.tickets.get(id) || null;
  }

  async findByGameIdAndTicketNumber(gameId: string, ticketNumber: number): Promise<TicketEntity | null> {
    for (const ticket of this.tickets.values()) {
      if (ticket.gameId === gameId && ticket.ticketNumber === ticketNumber) {
        return ticket;
      }
    }
    return null;
  }

  async findByGameId(gameId: string): Promise<TicketEntity[]> {
    return Array.from(this.tickets.values())
      .filter(ticket => ticket.gameId === gameId)
      .sort((a, b) => a.ticketNumber - b.ticketNumber);
  }

  async findByUserId(userId: string): Promise<TicketEntity[]> {
    return Array.from(this.tickets.values())
      .filter(ticket => ticket.userId === userId)
      .sort((a, b) => b.purchasedAt.getTime() - a.purchasedAt.getTime());
  }

  async save(ticket: TicketEntity): Promise<TicketEntity> {
    this.tickets.set(ticket.id, ticket);
    return ticket;
  }

  async delete(id: string): Promise<boolean> {
    return this.tickets.delete(id);
  }
}
