// Infrastructure - SQLite Prize Repository
import { PrizeRepository } from '../../domain/repositories/PrizeRepository';
import { Prize, PrizeEntity, PrizeType, PrizeStatus } from '../../domain/entities/Prize';
import { SqliteService } from '../services/SqliteService';

interface PrizeRow {
  id: string;
  game_id: string;
  player_id: string;
  ticket_number: number;
  prize_type: string;
  prize_content: string;
  status: string;
  awarded_at: string;
  created_at: string;
  updated_at: string;
}

export class SqlitePrizeRepository implements PrizeRepository {
  private sqliteService: SqliteService;

  constructor() {
    this.sqliteService = SqliteService.getInstance();
    this.initializeSamplePrizes();
  }

  private async initializeSamplePrizes(): Promise<void> {
    try {
      // 檢查是否已有獎品資料
      const existingPrizes = await this.findAll();
      if (existingPrizes.length > 0) {
        console.log('✅ 獎品資料已存在，跳過初始化');
        return;
      }

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
        new PrizeEntity(
          'prize-006',
          'game-003',
          'default-alice-001',
          11,
          PrizeType.POINTS,
          '50 願望幣',
          PrizeStatus.SHIPPED,
          new Date('2024-02-10T13:45:00'),
          new Date('2024-02-10T13:45:00'),
          new Date('2024-02-10T13:45:00')
        ),
        new PrizeEntity(
          'prize-007',
          'game-001',
          'default-alice-001',
          13,
          PrizeType.POINTS,
          '100 願望幣',
          PrizeStatus.SHIPPED,
          new Date('2024-02-15T10:45:00'),
          new Date('2024-02-15T10:45:00'),
          new Date('2024-02-15T10:45:00')
        )
      ];

      for (const prize of samplePrizes) {
        await this.create(prize);
      }

      console.log('✅ 預設獎品資料已創建到 SQLite');
    } catch (error) {
      console.error('❌ 創建預設獎品資料失敗:', error);
    }
  }

  private rowToPrize(row: PrizeRow): PrizeEntity {
    return new PrizeEntity(
      row.id,
      row.game_id,
      row.player_id,
      row.ticket_number,
      row.prize_type as PrizeType,
      row.prize_content,
      row.status as PrizeStatus,
      new Date(row.awarded_at),
      new Date(row.created_at),
      new Date(row.updated_at)
    );
  }

  async create(prize: PrizeEntity): Promise<PrizeEntity> {
    try {
      await this.sqliteService.run(
        `INSERT INTO prizes 
         (id, game_id, player_id, ticket_number, prize_type, prize_content, status, awarded_at, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          prize.id,
          prize.gameId,
          prize.playerId,
          prize.ticketNumber,
          prize.prizeType,
          prize.prizeContent,
          prize.status,
          prize.awardedAt.toISOString(),
          prize.createdAt.toISOString(),
          prize.updatedAt.toISOString()
        ]
      );
      return prize;
    } catch (error) {
      console.error('❌ 創建獎品失敗:', error);
      throw error;
    }
  }

  async findById(id: string): Promise<PrizeEntity | null> {
    try {
      const row = await this.sqliteService.get<PrizeRow>(
        'SELECT * FROM prizes WHERE id = ?',
        [id]
      );
      return row ? this.rowToPrize(row) : null;
    } catch (error) {
      console.error('❌ 根據ID查找獎品失敗:', error);
      return null;
    }
  }

  async findByGameId(gameId: string): Promise<PrizeEntity[]> {
    try {
      const rows = await this.sqliteService.all<PrizeRow>(
        'SELECT * FROM prizes WHERE game_id = ? ORDER BY awarded_at DESC',
        [gameId]
      );
      return rows.map(row => this.rowToPrize(row));
    } catch (error) {
      console.error('❌ 根據遊戲ID查找獎品失敗:', error);
      return [];
    }
  }

  async findByPlayerId(playerId: string): Promise<PrizeEntity[]> {
    try {
      const rows = await this.sqliteService.all<PrizeRow>(
        'SELECT * FROM prizes WHERE player_id = ? ORDER BY awarded_at DESC',
        [playerId]
      );
      return rows.map(row => this.rowToPrize(row));
    } catch (error) {
      console.error('❌ 根據玩家ID查找獎品失敗:', error);
      return [];
    }
  }

  async findByTicketNumber(gameId: string, ticketNumber: number): Promise<PrizeEntity | null> {
    try {
      const row = await this.sqliteService.get<PrizeRow>(
        'SELECT * FROM prizes WHERE game_id = ? AND ticket_number = ?',
        [gameId, ticketNumber]
      );
      return row ? this.rowToPrize(row) : null;
    } catch (error) {
      console.error('❌ 根據票號查找獎品失敗:', error);
      return null;
    }
  }

  async findAll(): Promise<PrizeEntity[]> {
    try {
      const rows = await this.sqliteService.all<PrizeRow>(
        'SELECT * FROM prizes ORDER BY awarded_at DESC'
      );
      return rows.map(row => this.rowToPrize(row));
    } catch (error) {
      console.error('❌ 查找所有獎品失敗:', error);
      return [];
    }
  }

  async update(id: string, prize: Partial<Prize>): Promise<PrizeEntity | null> {
    try {
      const existingPrize = await this.findById(id);
      if (!existingPrize) {
        return null;
      }

      const updatedPrize = new PrizeEntity(
        existingPrize.id,
        prize.gameId ?? existingPrize.gameId,
        prize.playerId ?? existingPrize.playerId,
        prize.ticketNumber ?? existingPrize.ticketNumber,
        prize.prizeType ?? existingPrize.prizeType,
        prize.prizeContent ?? existingPrize.prizeContent,
        prize.status ?? existingPrize.status,
        prize.awardedAt ?? existingPrize.awardedAt,
        existingPrize.createdAt,
        new Date()
      );

      await this.sqliteService.run(
        `UPDATE prizes SET 
         game_id = ?, player_id = ?, ticket_number = ?, prize_type = ?, 
         prize_content = ?, status = ?, awarded_at = ?, updated_at = ?
         WHERE id = ?`,
        [
          updatedPrize.gameId,
          updatedPrize.playerId,
          updatedPrize.ticketNumber,
          updatedPrize.prizeType,
          updatedPrize.prizeContent,
          updatedPrize.status,
          updatedPrize.awardedAt.toISOString(),
          updatedPrize.updatedAt.toISOString(),
          id
        ]
      );

      return updatedPrize;
    } catch (error) {
      console.error('❌ 更新獎品失敗:', error);
      return null;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const result = await this.sqliteService.run(
        'DELETE FROM prizes WHERE id = ?',
        [id]
      );
      return result.changes > 0;
    } catch (error) {
      console.error('❌ 刪除獎品失敗:', error);
      return false;
    }
  }

  // 清空所有獲獎紀錄 (用於測試)
  async clear(): Promise<void> {
    try {
      await this.sqliteService.run('DELETE FROM prizes');
      console.log('✅ 所有獎品紀錄已清空');
    } catch (error) {
      console.error('❌ 清空獎品紀錄失敗:', error);
      throw error;
    }
  }
}
