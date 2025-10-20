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
  awardedAt: string;   // 獲獎時間 (ISO string format)
  createdAt: string;
  updatedAt: string;
}

export interface UpdatePrizeStatusRequest {
  status: PrizeStatus;
}

export interface UpdatePrizeStatusResponse {
  success: boolean;
  prize: Prize;
  message: string;
  error?: string;
}
