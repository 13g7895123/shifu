import { Prize, PrizeEntity } from '../entities/Prize';

export interface PrizeRepository {
  // 創建獲獎紀錄
  create(prize: PrizeEntity): Promise<PrizeEntity>;
  
  // 根據ID查找獲獎紀錄
  findById(id: string): Promise<PrizeEntity | null>;
  
  // 根據遊戲ID查找所有獲獎紀錄
  findByGameId(gameId: string): Promise<PrizeEntity[]>;
  
  // 根據玩家ID查找所有獲獎紀錄
  findByPlayerId(playerId: string): Promise<PrizeEntity[]>;
  
  // 根據票號查找獲獎紀錄
  findByTicketNumber(gameId: string, ticketNumber: number): Promise<PrizeEntity | null>;
  
  // 獲取所有獲獎紀錄
  findAll(): Promise<PrizeEntity[]>;
  
  // 更新獲獎紀錄
  update(id: string, prize: Partial<Prize>): Promise<PrizeEntity | null>;
  
  // 刪除獲獎紀錄
  delete(id: string): Promise<boolean>;
}
