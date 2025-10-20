import { PrizeRepository } from '../../domain/repositories/PrizeRepository';
import { Prize, PrizeEntity, PrizeType, PrizeStatus } from '../../domain/entities/Prize';

export class InMemoryPrizeRepository implements PrizeRepository {
  private prizes: Map<string, PrizeEntity> = new Map();

  constructor() {
    // 初始化一些示例獎品資料
    this.initializeSamplePrizes();
  }

  private initializeSamplePrizes(): void {
    try {
      // 為 Alice 創建一些不同狀態的獎品
      const samplePrizes = [
        new PrizeEntity(
          'prize-001',
          'game-001',
          'default-alice-001',
          1,
          PrizeType.PHYSICAL,
          '限量版T恤',
          PrizeStatus.PENDING_SHIPMENT,
          new Date('2024-01-15T10:30:00'),
          new Date('2024-01-15T10:30:00'),
          new Date('2024-01-15T10:30:00')
        ),
        new PrizeEntity(
          'prize-002',
          'game-002',
          'default-alice-001',
          3,
          PrizeType.PHYSICAL,
          '精美馬克杯',
          PrizeStatus.SHIPMENT_NOTIFIED,
          new Date('2024-01-20T14:20:00'),
          new Date('2024-01-20T14:20:00'),
          new Date('2024-01-20T14:20:00')
        ),
        new PrizeEntity(
          'prize-003',
          'game-003',
          'default-alice-001',
          5,
          PrizeType.PHYSICAL,
          '紀念徽章',
          PrizeStatus.SHIPPED,
          new Date('2024-01-25T16:45:00'),
          new Date('2024-01-25T16:45:00'),
          new Date('2024-01-25T16:45:00')
        ),
        new PrizeEntity(
          'prize-004',
          'game-001',
          'default-alice-001',
          7,
          PrizeType.PHYSICAL,
          '限量海報',
          PrizeStatus.SHIPMENT_NOTIFIED,
          new Date('2024-02-01T09:15:00'),
          new Date('2024-02-01T09:15:00'),
          new Date('2024-02-01T09:15:00')
        ),
        new PrizeEntity(
          'prize-005',
          'game-002',
          'default-alice-001',
          9,
          PrizeType.PHYSICAL,
          '遊戲周邊包',
          PrizeStatus.SHIPPED,
          new Date('2024-02-05T11:30:00'),
          new Date('2024-02-05T11:30:00'),
          new Date('2024-02-05T11:30:00')
        ),
        // 為管理員也添加一些獎品用於測試
        new PrizeEntity(
          'prize-006',
          'game-001',
          'default-admin-001',
          11,
          PrizeType.PHYSICAL,
          '管理員專屬禮盒',
          PrizeStatus.PENDING_SHIPMENT,
          new Date('2024-02-10T08:00:00'),
          new Date('2024-02-10T08:00:00'),
          new Date('2024-02-10T08:00:00')
        ),
        new PrizeEntity(
          'prize-007',
          'game-003',
          'default-admin-001',
          13,
          PrizeType.PHYSICAL,
          '高級滑鼠墊',
          PrizeStatus.SHIPMENT_NOTIFIED,
          new Date('2024-02-12T16:30:00'),
          new Date('2024-02-12T16:30:00'),
          new Date('2024-02-12T16:30:00')
        ),
        new PrizeEntity(
          'prize-008',
          'game-002',
          'default-admin-001',
          15,
          PrizeType.PHYSICAL,
          '藍牙耳機',
          PrizeStatus.SHIPPED,
          new Date('2024-02-15T10:45:00'),
          new Date('2024-02-15T10:45:00'),
          new Date('2024-02-15T10:45:00')
        )
      ];

      samplePrizes.forEach(prize => {
        this.prizes.set(prize.id, prize);
      });

      console.log('✅ 預設獎品資料已創建');
    } catch (error) {
      console.error('❌ 創建預設獎品資料失敗:', error);
    }
  }

  async create(prize: PrizeEntity): Promise<PrizeEntity> {
    this.prizes.set(prize.id, prize);
    return prize;
  }

  async findById(id: string): Promise<PrizeEntity | null> {
    return this.prizes.get(id) || null;
  }

  async findByGameId(gameId: string): Promise<PrizeEntity[]> {
    return Array.from(this.prizes.values()).filter(prize => prize.gameId === gameId);
  }

  async findByPlayerId(playerId: string): Promise<PrizeEntity[]> {
    return Array.from(this.prizes.values()).filter(prize => prize.playerId === playerId);
  }

  async findByTicketNumber(gameId: string, ticketNumber: number): Promise<PrizeEntity | null> {
    const prize = Array.from(this.prizes.values()).find(
      prize => prize.gameId === gameId && prize.ticketNumber === ticketNumber
    );
    return prize || null;
  }

  async findAll(): Promise<PrizeEntity[]> {
    return Array.from(this.prizes.values());
  }

  async update(id: string, prizeData: Partial<Prize>): Promise<PrizeEntity | null> {
    const existingPrize = this.prizes.get(id);
    if (!existingPrize) {
      return null;
    }

    const updatedPrize = new PrizeEntity(
      existingPrize.id,
      existingPrize.gameId,
      existingPrize.playerId,
      existingPrize.ticketNumber,
      prizeData.prizeType || existingPrize.prizeType,
      prizeData.prizeContent || existingPrize.prizeContent,
      prizeData.status || existingPrize.status,
      prizeData.awardedAt || existingPrize.awardedAt,
      existingPrize.createdAt,
      new Date()
    );

    this.prizes.set(id, updatedPrize);
    return updatedPrize;
  }

  async delete(id: string): Promise<boolean> {
    return this.prizes.delete(id);
  }

  // 清空所有獲獎紀錄 (用於測試)
  async clear(): Promise<void> {
    this.prizes.clear();
  }
}
