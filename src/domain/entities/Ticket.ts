// Domain - Ticket Entity
export interface Ticket {
  id: string;
  gameId: string;
  ticketNumber: number;
  userId: string;
  purchasePrice: number;
  purchasedAt: Date;
}

export class TicketEntity implements Ticket {
  constructor(
    public id: string,
    public gameId: string,
    public ticketNumber: number,
    public userId: string,
    public purchasePrice: number,
    public purchasedAt: Date = new Date()
  ) {}

  public toJSON(): Ticket {
    return {
      id: this.id,
      gameId: this.gameId,
      ticketNumber: this.ticketNumber,
      userId: this.userId,
      purchasePrice: this.purchasePrice,
      purchasedAt: this.purchasedAt
    };
  }
}
