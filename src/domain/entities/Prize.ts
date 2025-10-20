// Domain - Prize Entity
export enum PrizeType {
  POINTS = 'points',    // 願望幣
  PHYSICAL = 'physical' // 實體
}

export enum PrizeStatus {
  PENDING_SHIPMENT = 'pending_shipment',     // 等待出貨
  SHIPMENT_NOTIFIED = 'shipment_notified',   // 已通知出貨
  SHIPPED = 'shipped'                        // 已出貨
}

export interface Prize {
  id: string;
  gameId: string;
  playerId: string;    // 玩家ID (User ID)
  ticketNumber: number; // 票號
  prizeType: PrizeType; // 禮物類型
  prizeContent: string; // 禮物內容
  status: PrizeStatus;  // 獎品狀態
  awardedAt: Date;     // 獲獎時間
  createdAt: Date;
  updatedAt: Date;
}

export class PrizeEntity implements Prize {
  public readonly status: PrizeStatus;

  constructor(
    public id: string,
    public gameId: string,
    public playerId: string,
    public ticketNumber: number,
    public prizeType: PrizeType,
    public prizeContent: string,
    status?: PrizeStatus,
    public awardedAt: Date = new Date(),
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {
    // 如果是願望幣獎勵，直接設定為已出貨；否則使用提供的狀態或預設為等待出貨
    this.status = status ?? (prizeType === PrizeType.POINTS ? PrizeStatus.SHIPPED : PrizeStatus.PENDING_SHIPMENT);
  }

  public updatePrizeContent(prizeContent: string): PrizeEntity {
    return new PrizeEntity(
      this.id,
      this.gameId,
      this.playerId,
      this.ticketNumber,
      this.prizeType,
      prizeContent,
      this.status,
      this.awardedAt,
      this.createdAt,
      new Date()
    );
  }

  public updateStatus(status: PrizeStatus): PrizeEntity {
    return new PrizeEntity(
      this.id,
      this.gameId,
      this.playerId,
      this.ticketNumber,
      this.prizeType,
      this.prizeContent,
      status,
      this.awardedAt,
      this.createdAt,
      new Date()
    );
  }

  public toJSON(): Prize {
    return {
      id: this.id,
      gameId: this.gameId,
      playerId: this.playerId,
      ticketNumber: this.ticketNumber,
      prizeType: this.prizeType,
      prizeContent: this.prizeContent,
      status: this.status,
      awardedAt: this.awardedAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}
