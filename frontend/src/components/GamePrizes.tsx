import React, { useState, useEffect } from 'react';
import { apiCall } from '../services/apiConfig';

interface Prize {
  id: string;
  gameId: string;
  playerId: string;
  ticketNumber: number;
  prizeType: 'points' | 'physical';
  prizeContent: string;
  awardedAt: string;
  createdAt: string;
  updatedAt: string;
}

interface GamePrizesProps {
  gameId: string;
  refreshTrigger?: number;
}

const GamePrizes: React.FC<GamePrizesProps> = ({ gameId, refreshTrigger = 0 }) => {
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 載入遊戲獎勵列表
  const loadGamePrizes = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiCall(`/api/prizes/game/${gameId}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('載入獎勵資料失敗');
      }

      const data = await response.json();
      
      if (data.success) {
        setPrizes(data.data || []);
      } else {
        setError(data.message || '載入獎勵資料失敗');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '載入獎勵資料失敗');
    } finally {
      setLoading(false);
    }
  };

  // 格式化時間
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // 格式化獎勵內容
  const formatPrizeContent = (prize: Prize) => {
    if (prize.prizeType === 'points') {
      return `${prize.prizeContent} 願望幣`;
    }
    return prize.prizeContent;
  };

  // 獲取獎勵類型顯示文字
  const getPrizeTypeText = (prizeType: string) => {
    switch (prizeType) {
      case 'points':
        return '願望幣';
      case 'physical':
        return '實體獎品';
      default:
        return '未知';
    }
  };

  // 獲取獎勵類型樣式
  const getPrizeTypeClass = (prizeType: string) => {
    switch (prizeType) {
      case 'points':
        return 'bg-success';
      case 'physical':
        return 'bg-warning';
      default:
        return 'bg-secondary';
    }
  };

  useEffect(() => {
    if (gameId) {
      loadGamePrizes();
    }
  }, [gameId, refreshTrigger]);

  if (loading) {
    return (
      <div className="text-center py-3">
        <div className="spinner-border spinner-border-sm text-primary" role="status">
          <span className="visually-hidden">載入中...</span>
        </div>
        <div className="mt-2 text-muted">載入獎勵資料中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger">
        <i className="bi bi-exclamation-triangle me-2"></i>
        {error}
        <button 
          className="btn btn-sm btn-outline-danger ms-2"
          onClick={loadGamePrizes}
        >
          重試
        </button>
      </div>
    );
  }

  if (prizes.length === 0) {
    return (
      <div className="text-center py-4">
        <i className="bi bi-gift display-6 text-muted"></i>
        <div className="mt-2 text-muted">本場遊戲尚未發放任何獎勵</div>
      </div>
    );
  }

  return (
    <div className="game-prizes">
      <h5 className="mb-3">
        <i className="bi bi-gift me-2"></i>
        本場遊戲獎勵 ({prizes.length})
      </h5>
      
      <div className="list-group">
        {prizes.map((prize) => (
          <div key={prize.id} className="list-group-item d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <div className="me-3">
                <div className="fw-bold text-primary mb-1">
                  <i className="bi bi-ticket me-1"></i>
                  票券 #{prize.ticketNumber}
                </div>

              </div>
              <span className={`badge ${getPrizeTypeClass(prize.prizeType)} me-2`}>
                {getPrizeTypeText(prize.prizeType)}
              </span>
              <div className="fw-bold">
                {formatPrizeContent(prize)}
              </div>
              <div className="ms-3 text-muted">
                  <small className="text-muted">
                  <i className="bi bi-clock me-1"></i>
                  {formatTime(prize.awardedAt)}
                </small>
                </div>
            </div>
          </div>
        ))}
      </div>
      
      {prizes.length > 0 && (
        <div className="mt-3 d-flex justify-content-between align-items-center">
          <small className="text-muted">
            總計發放 {prizes.length} 個獎勵
          </small>
          <button 
            className="btn btn-sm btn-outline-secondary"
            onClick={loadGamePrizes}
            title="重新載入"
          >
            <i className="bi bi-arrow-clockwise"></i>
          </button>
        </div>
      )}
    </div>
  );
};

export default GamePrizes;
