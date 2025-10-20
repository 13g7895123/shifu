import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiCall } from '../services/apiConfig';

interface GameSpec {
  title?: string;
  description?: string;
  tickets?: number;
  ticketPrice?: number;
  [key: string]: any;
}

interface Game {
  id: string;
  gameId: string;
  spec: GameSpec;
  finishTime?: string;
  canceled: boolean;
  purchasingStopped: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PurchasedTicket {
  id: string;
  gameId: string;
  ticketNumber: number;
  userId: string;
  purchasePrice: number;
  purchasedAt: string;
}

interface GameTicketsProps {
  game: Game;
  onTicketClick?: (ticketNumber: number) => void;
  refreshTrigger?: number; // 用於觸發重新載入
}

const GameTickets: React.FC<GameTicketsProps> = ({ game, onTicketClick, refreshTrigger }) => {
  const { user } = useAuth();
  const tickets = game.spec.tickets || 0;
  const [purchasedTickets, setPurchasedTickets] = useState<PurchasedTicket[]>([]);
  const [loading, setLoading] = useState(true);

  // 載入已購買的票券
  const loadPurchasedTickets = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiCall(`/api/tickets/game/${game.gameId}`);

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPurchasedTickets(data.data);
        }
      } else {
        console.error('API call failed with status:', response.status);
        const text = await response.text();
        console.error('Response text:', text);
      }
    } catch (error) {
      console.error('載入已購買票券失敗:', error);
    } finally {
      setLoading(false);
    }
  }, [game.gameId]);

  useEffect(() => {
    loadPurchasedTickets();
  }, [game.gameId, refreshTrigger, loadPurchasedTickets]);

  // 檢查票券是否已被購買
  const isTicketPurchased = (ticketNumber: number) => {
    return purchasedTickets.some(ticket => ticket.ticketNumber === ticketNumber);
  };

  // 檢查票券是否由當前用戶購買
  const isTicketPurchasedByCurrentUser = (ticketNumber: number) => {
    if (!user) return false;
    return purchasedTickets.some(ticket => 
      ticket.ticketNumber === ticketNumber && ticket.userId === user.id
    );
  };

  // 獲取票券購買者信息
  const getTicketPurchaser = (ticketNumber: number) => {
    return purchasedTickets.find(ticket => ticket.ticketNumber === ticketNumber);
  };

  // 生成票卷格子
  const renderTickets = () => {
    const ticketElements = [];
    
    for (let i = 1; i <= tickets; i++) {
      const isPurchased = isTicketPurchased(i);
      const isPurchasedByCurrentUser = isTicketPurchasedByCurrentUser(i);
      const purchaser = getTicketPurchaser(i);
      
      // 決定按鈕樣式
      let buttonClass = 'btn w-100 d-flex align-items-center justify-content-center ';
      let titleText = '';
      let isDisabled = false;
      
      if (isPurchased) {
        if (isPurchasedByCurrentUser) {
          // 自己購買的票：藍色
          buttonClass += 'btn-primary disabled';
          titleText = `票券 ${i} - 您已購買`;
          isDisabled = true;
        } else {
          // 別人購買的票：紅色
          buttonClass += 'btn-danger disabled';
          titleText = `票券 ${i} - 已售出`;
          isDisabled = true;
        }
      } else if (game.purchasingStopped) {
        // 購買已停止的票：灰色
        buttonClass += 'btn-secondary disabled';
        titleText = `票券 ${i} - 已停止購買`;
        isDisabled = true;
      } else {
        // 未購買的票：可購買樣式
        buttonClass += 'btn-outline-primary';
        titleText = `票券 ${i} - 點擊購買`;
        isDisabled = false;
      }
      
      ticketElements.push(
        <div
          key={i}
          className="col-2 col-sm-1 mb-2"
        >
          <button
            className={buttonClass}
            style={{ 
              aspectRatio: '1',
              minHeight: '40px',
              fontSize: '0.8rem'
            }}
            onClick={() => !isDisabled && onTicketClick && onTicketClick(i)}
            disabled={isDisabled}
            title={titleText}
          >
            {
              i
            }
          </button>
        </div>
      );
    }
    
    return ticketElements;
  };

  if (tickets === 0) {
    return (
      <div className="alert alert-warning">
        <i className="bi bi-exclamation-triangle me-2"></i>
        此遊戲沒有設定票券數量
      </div>
    );
  }

  return (
    <div className="game-tickets">
      <div className="mb-3">
        <h5 className="mb-2">
          <i className="bi bi-ticket-perforated me-2"></i>
          遊戲票券
        </h5>
        
        {/* 購買狀態提醒 */}
        {game.purchasingStopped && (
          <div className="alert alert-warning mb-3">
            <i className="bi bi-exclamation-triangle me-2"></i>
            此遊戲已停止購買票券
          </div>
        )}
        
        <div className="d-flex justify-content-between align-items-center">
          <p className="text-muted small mb-0">
            共 {tickets} 張票券，每張 {game.spec.ticketPrice || 0} 點
          </p>
          {loading ? (
            <small className="text-muted">載入中...</small>
          ) : (
            <small className="text-muted">
              已售出: {purchasedTickets.length} / {tickets}
            </small>
          )}
        </div>
      </div>
      
      <div className="mb-3">
        <div className="d-flex gap-3 text-small">
          <div className="d-flex align-items-center">
            <div className="btn btn-outline-primary btn-sm me-2" style={{ width: '30px', height: '30px' }}></div>
            <span className="small text-muted">可購買</span>
          </div>
          <div className="d-flex align-items-center">
            <div className="btn btn-primary btn-sm me-2" style={{ width: '30px', height: '30px' }}>
              {/* <i className="bi bi-check-lg"></i> */}
            </div>
            <span className="small text-muted">您已購買</span>
          </div>
          <div className="d-flex align-items-center">
            <div className="btn btn-danger btn-sm me-2" style={{ width: '30px', height: '30px' }}>
              {/* <i className="bi bi-check-lg"></i> */}
            </div>
            <span className="small text-muted">他人已購買</span>
          </div>
        </div>
      </div>
      
      <div className="row g-2">
        {renderTickets()}
      </div>
    </div>
  );
};

export default GameTickets;
