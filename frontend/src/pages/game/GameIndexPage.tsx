import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import GameTickets from '../../components/GameTickets';
import GamePrizes from '../../components/GamePrizes';
import ChatRoom from '../../components/ChatRoom';
import { apiCall } from '../../services/apiConfig';
import { systemSettingsAPI, LiveStreamSettings } from '../../services/systemSettingsService';

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

const GameIndexPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [currentGame, setCurrentGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<number | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isSliderOpen, setIsSliderOpen] = useState(false);
  const [liveStreamSettings, setLiveStreamSettings] = useState<LiveStreamSettings>({
    url: 'https://www.youtube.com/embed/IuEEEhSgTbs?si=AnexDTswpSpcSyqk',
    isEnabled: true
  });

  // 載入直播設定
  const loadLiveStreamSettings = async () => {
    try {
      const settings = await systemSettingsAPI.getLiveStreamSettingsPublic();
      setLiveStreamSettings(settings);
    } catch (err) {
      console.error('載入直播設定失敗:', err);
      // 使用預設設定
    }
  };

  // 載入當前活躍的遊戲
  const loadCurrentGame = async () => {
    try {
      setLoading(true);
      const response = await apiCall('/api/games/active');

      if (!response.ok) {
        throw new Error('載入遊戲失敗');
      }

      const data = await response.json();
      
      if (data.success) {
        setCurrentGame(data.data);
      } else {
        setError(data.message || '載入遊戲失敗');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '載入遊戲失敗');
    } finally {
      setLoading(false);
    }
  };

  // 處理票券點擊
  const handleTicketClick = async (ticketNumber: number) => {
    if (!currentGame) return;

    // 檢查是否已停止購買
    if (currentGame.purchasingStopped) {
      alert('此遊戲已停止購買票券，無法進行購買。');
      return;
    }

    // 確認購買
    const confirmed = window.confirm(
      `確定要購買票券 #${ticketNumber} 嗎？\n價格：NT$ ${currentGame.spec.ticketPrice || 0}`
    );

    if (!confirmed) return;

    try {
      const response = await apiCall('/api/tickets/purchase', {
        method: 'POST',
        body: JSON.stringify({
          gameId: currentGame.gameId,
          ticketNumber: ticketNumber
        })
      });

      const data = await response.json();

      if (data.success) {
        setSelectedTicket(ticketNumber);
        alert(`票券 #${ticketNumber} 購買成功！`);
        // 重新載入遊戲資料以更新票券狀態
        loadCurrentGame();
        // 刷新用戶資訊以更新願望幣
        await refreshUser();
        // 觸發 GameTickets 組件重新載入
        setRefreshTrigger(prev => prev + 1);
      } else {
        alert(`購買失敗：${data.message}`);
      }
    } catch (error) {
      console.error('購買票券失敗:', error);
      alert('購買票券時發生錯誤，請稍後再試');
    }
  };

  useEffect(() => {
    loadCurrentGame();
    loadLiveStreamSettings();
  }, []);

  if (loading) {
    return (
      <div className="container-lg">
        <div className="d-flex justify-content-center my-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">載入中...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-lg">
        <div className="my-4">
          <div className="alert alert-danger">
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}
          </div>
          <button 
            className="btn btn-primary"
            onClick={loadCurrentGame}
          >
            重新載入
          </button>
        </div>
      </div>
    );
  }

  // 如果沒有活躍的遊戲，顯示原本的遊戲中心介面
  if (!currentGame) {
    return (
      <div className="container-lg">
        <div className="my-4">
          <h1 className="h3 text-center mb-4">遊戲中心</h1>
          
          <div className="text-center py-5">
            <i className="bi bi-controller display-1 text-muted"></i>
            <h3 className="text-muted mt-3">目前沒有進行中的遊戲</h3>
            <p className="text-muted">請等待管理員開始新遊戲，或查看遊戲指南了解更多資訊。</p>
          </div>
          
          <div className="row g-3 mt-2">
            <div className="col-12">
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title">重新載入</h5>
                  <p className="card-text text-muted">
                    檢查是否有新的遊戲開始。
                  </p>
                  <button 
                    className="btn btn-outline-secondary"
                    onClick={loadCurrentGame}
                  >
                    <i className="bi bi-arrow-clockwise me-2"></i>
                    重新載入
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 有活躍遊戲時顯示遊戲界面
  return (
    <div className="position-relative p-0">
      {/* 桌面版：並排佈局 */}
      <div className="d-none d-xl-flex" style={{ height: '100vh' }}>
        {/* 直播區域 */}
        <div className="flex-grow-1 position-relative" style={{ minWidth: 0 }}>
          {liveStreamSettings.isEnabled ? (
            <iframe 
              src={liveStreamSettings.url} 
              title={liveStreamSettings.title || "直播視頻"}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              className="w-100 h-100"
              style={{ border: 'none' }}
            ></iframe>
          ) : (
            <div className="d-flex align-items-center justify-content-center bg-light h-100">
              <div className="text-center">
                <i className="bi bi-camera-video-off display-1 text-muted"></i>
                <h3 className="text-muted mt-3">直播暫時關閉</h3>
                <p className="text-muted">管理員可能正在設定直播內容，請稍後再試。</p>
              </div>
            </div>
          )}
          
          {/* 桌面版聊天室 - 固定在右下角 */}
          <ChatRoom
            className="chat-room--game-overlay"
          />
        </div>
        
        {/* 購票區域 */}
        <div className="bg-white border-start" style={{ width: '400px', overflowY: 'auto' }}>
          <div className="p-3">
            {/* 遊戲標題和描述 */}
            <div className="mb-4">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>           
                  <h4>
                    遊戲 ID: <span className="fw-bold">{currentGame.gameId}</span>
                  </h4>
                </div>
                <span className="badge bg-success">
                  <i className="bi bi-play-fill me-1"></i>
                  進行中
                </span>
              </div>
              
              {currentGame.spec.description && (
                <div className="alert alert-info py-2">
                  <i className="bi bi-info-circle me-2"></i>
                  <small>{currentGame.spec.description}</small>
                </div>
              )}
            </div>

            {/* 遊戲票券格子 */}
            <div className="mb-4">
              <div className="card">
                <div className="card-body p-2">
                  <GameTickets 
                    game={currentGame} 
                    onTicketClick={handleTicketClick}
                    refreshTrigger={refreshTrigger}
                  />
                </div>
              </div>
            </div>

            {/* 遊戲獎勵列表 */}
            <div className="mb-4">
              <div className="card">
                <div className="card-body p-2">
                  <GamePrizes 
                    gameId={currentGame.gameId} 
                    refreshTrigger={refreshTrigger}
                  />
                </div>
              </div>
            </div>

            {/* 操作按鈕 */}
            <div className="mb-3">
              <div className="d-flex flex-column gap-2">
                <button 
                  className="btn btn-outline-primary btn-sm"
                  onClick={() => navigate('/game/guide')}
                >
                  <i className="bi bi-book me-2"></i>
                  遊戲指南
                </button>
   
                <button 
                  className="btn btn-outline-secondary btn-sm"
                  onClick={loadCurrentGame}
                >
                  <i className="bi bi-arrow-clockwise me-2"></i>
                  重新載入
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 移動版：原有的滑動側邊欄設計 */}
      <div className="d-xl-none">
        {/* 主要內容區域 */}
        <div className={`container-lg transition-all p-0 ${isSliderOpen ? 'me-5' : ''}`} style={{
          transition: 'margin-right 0.3s ease-in-out',
          marginRight: isSliderOpen ? 'min(400px, 90vw)' : '0'
        }}>
          
          {liveStreamSettings.isEnabled ? (
            <iframe 
              src={liveStreamSettings.url} 
              title={liveStreamSettings.title || "直播視頻"}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              className="w-100"
              style={{ border: 'none' , height: '85vh' }}
            ></iframe>
          ) : (
            <div className="d-flex align-items-center justify-content-center bg-light" style={{ height: '85vh' }}>
              <div className="text-center">
                <i className="bi bi-camera-video-off display-1 text-muted"></i>
                <h3 className="text-muted mt-3">直播暫時關閉</h3>
                <p className="text-muted">管理員可能正在設定直播內容，請稍後再試。</p>
              </div>
            </div>
          )}
        </div>

        {/* 聊天室組件 - 固定在右下角，疊加在 iframe 上方 */}
        <ChatRoom
          className={`chat-room--game-overlay ${!isSliderOpen ? 'chat-room--sidebar-closed' : ''}`}
        />

        {/* 箭頭按鈕 */}
        <div 
          className="position-fixed d-flex align-items-center justify-content-center"
          style={{
            right: isSliderOpen ? `calc(min(400px, 90vw) - 20px)` : '0px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '40px',
            height: '60px',
            backgroundColor: '#007bff',
            color: 'white',
            cursor: 'pointer',
            borderRadius: isSliderOpen ? '8px 0 0 8px' : '8px 0 0 8px',
            transition: 'right 0.3s ease-in-out',
            zIndex: 1251,
            boxShadow: '-2px 0 8px rgba(0,0,0,0.1)'
          }}
          onClick={() => setIsSliderOpen(!isSliderOpen)}
        >
          <i className={`bi ${isSliderOpen ? 'bi-chevron-right' : 'bi-chevron-left'} fs-4`}></i>
        </div>

        {/* 滑動側邊欄 */}
        <div 
          className="position-fixed top-0 h-100 bg-white border-start shadow-lg"
          style={{
            right: isSliderOpen ? '0' : 'calc(-1 * min(400px, 90vw))',
            width: 'min(400px, 90vw)',
            transition: 'right 0.3s ease-in-out',
            zIndex: 1250,
            overflowY: 'auto'
          }}
        >
          <div className="p-3">
            {/* 遊戲標題和描述 */}
            <div className="mb-4">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>           
                  <h4>
                    遊戲 ID: <span className="fw-bold">{currentGame.gameId}</span>
                  </h4>
                </div>
                <span className="badge bg-success">
                  <i className="bi bi-play-fill me-1"></i>
                  進行中
                </span>
              </div>
              
              {currentGame.spec.description && (
                <div className="alert alert-info py-2">
                  <i className="bi bi-info-circle me-2"></i>
                  <small>{currentGame.spec.description}</small>
                </div>
              )}
            </div>

            {/* 遊戲票券格子 */}
            <div className="mb-4">
              <div className="card">
                <div className="card-body p-2">
                  <GameTickets 
                    game={currentGame} 
                    onTicketClick={handleTicketClick}
                    refreshTrigger={refreshTrigger}
                  />
                </div>
              </div>
            </div>

            {/* 遊戲獎勵列表 */}
            <div className="mb-4">
              <div className="card">
                <div className="card-body p-2">
                  <GamePrizes 
                    gameId={currentGame.gameId} 
                    refreshTrigger={refreshTrigger}
                  />
                </div>
              </div>
            </div>

            {/* 操作按鈕 */}
            <div className="mb-3">
              <div className="d-flex flex-column gap-2">
                <button 
                  className="btn btn-outline-primary btn-sm"
                  onClick={() => navigate('/game/guide')}
                >
                  <i className="bi bi-book me-2"></i>
                  遊戲指南
                </button>
   
                <button 
                  className="btn btn-outline-secondary btn-sm"
                  onClick={loadCurrentGame}
                >
                  <i className="bi bi-arrow-clockwise me-2"></i>
                  重新載入
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameIndexPage;
