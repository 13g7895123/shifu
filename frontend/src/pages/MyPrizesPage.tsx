import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiCall } from '../services/apiConfig';

interface Prize {
  id: string;
  gameId: string;
  playerId: string;
  ticketNumber: number;
  prizeType: 'points' | 'physical';
  prizeContent: string;
  status: 'pending_shipment' | 'shipment_notified' | 'shipped';
  awardedAt: string;
  createdAt: string;
  updatedAt: string;
}

interface Game {
  gameId: string;
  spec: {
    title: string;
    description: string;
  };
}

const MyPrizesPage: React.FC = () => {
  const { user } = useAuth();
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [filteredPrizes, setFilteredPrizes] = useState<Prize[]>([]);
  const [games, setGames] = useState<{ [key: string]: Game }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [notifyingPrizes, setNotifyingPrizes] = useState<Set<string>>(new Set());
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedPrize, setSelectedPrize] = useState<Prize | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      loadUserPrizes();
    }
  }, [user]);

  useEffect(() => {
    filterPrizes();
  }, [prizes, statusFilter]);

  const filterPrizes = () => {
    if (statusFilter === 'all') {
      setFilteredPrizes(prizes);
    } else {
      setFilteredPrizes(prizes.filter(prize => prize.status === statusFilter));
    }
  };

  const loadUserPrizes = async (showRefreshIndicator = false) => {
    if (!user) return;

    try {
      if (showRefreshIndicator) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // 獲取用戶的所有獎品
      const response = await apiCall(`/api/prizes/player/${user.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const allPrizes = data.data || [];
      
      // 只顯示實體獎品
      const physicalPrizes = allPrizes.filter((prize: Prize) => prize.prizeType === 'physical');
      setPrizes(physicalPrizes);

      // 獲取相關遊戲資訊
      const gameIds = Array.from(new Set(physicalPrizes.map((prize: Prize) => prize.gameId))) as string[];
      const gamePromises = gameIds.map((gameId: string) => loadGameInfo(gameId));
      const gameResults = await Promise.all(gamePromises);
      
      const gameMap: { [key: string]: Game } = {};
      gameResults.forEach(game => {
        if (game) {
          gameMap[game.gameId] = game;
        }
      });
      setGames(gameMap);

    } catch (error) {
      console.error('載入獎品失敗:', error);
      setError('載入獎品失敗，請稍後再試');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadGameInfo = async (gameId: string): Promise<Game | null> => {
    try {
      const response = await apiCall(`/api/games/gameId/${gameId}`);
      if (!response.ok) {
        return null;
      }
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error(`載入遊戲 ${gameId} 資訊失敗:`, error);
      return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending_shipment':
        return '未出貨';
      case 'shipment_notified':
        return '已通知出貨';
      case 'shipped':
        return '已出貨';
      default:
        return '未知狀態';
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'pending_shipment':
        return 'bg-warning text-dark';
      case 'shipment_notified':
        return 'bg-info text-white';
      case 'shipped':
        return 'bg-success text-white';
      default:
        return 'bg-secondary text-white';
    }
  };

  const handleNotifyShipment = async (prizeId: string) => {
    try {
      setNotifyingPrizes(prev => {
        const newSet = new Set(prev);
        newSet.add(prizeId);
        return newSet;
      });
      
      const response = await apiCall(`/api/prizes/${prizeId}/notify-shipment`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // 更新本地狀態
        setPrizes(prevPrizes => 
          prevPrizes.map(prize => 
            prize.id === prizeId 
              ? { ...prize, status: 'shipment_notified' as any }
              : prize
          )
        );
        
        // 顯示成功訊息
        setError(null);
        setShowConfirmModal(false);
        setSelectedPrize(null);
      } else {
        throw new Error(data.message || '通知出貨失敗');
      }
    } catch (error) {
      console.error('通知出貨失敗:', error);
      setError(error instanceof Error ? error.message : '通知出貨失敗，請稍後再試');
    } finally {
      setNotifyingPrizes(prev => {
        const newSet = new Set(prev);
        newSet.delete(prizeId);
        return newSet;
      });
    }
  };

  const handleNotifyClick = (prize: Prize) => {
    setSelectedPrize(prize);
    setShowConfirmModal(true);
  };

  const handleConfirmNotify = () => {
    if (selectedPrize) {
      handleNotifyShipment(selectedPrize.id);
    }
  };

  const handleCancelNotify = () => {
    setShowConfirmModal(false);
    setSelectedPrize(null);
  };

  // Handle pull-to-refresh for mobile
  const handleRefresh = () => {
    if (!refreshing && user) {
      loadUserPrizes(true);
    }
  };

  if (!user) {
    return (
      <div className="container mt-4">
        <div className="alert alert-warning" role="alert">
          請先登入才能查看背包內容
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="d-flex justify-content-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">載入中...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid px-3 mt-3">
      <div className="row">
        <div className="col-12">
          {/* Header - Mobile Optimized */}
          <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-3 gap-2">
            <h2 className="mb-0 fs-3">
              <i className="bi bi-bag-fill me-2"></i>
              我的背包
            </h2>
            <div className="d-flex align-items-center gap-2">
              <button 
                className="btn btn-outline-secondary btn-sm"
                onClick={handleRefresh}
                disabled={refreshing || loading}
                title="重新載入"
              >
                <i className={`bi bi-arrow-clockwise ${refreshing ? 'spin' : ''}`}></i>
                <span className="d-none d-sm-inline ms-1">
                  {refreshing ? '載入中...' : '重新載入'}
                </span>
              </button>
              <span className="badge bg-primary fs-6 px-3 py-2">
                {filteredPrizes.length} / {prizes.length} 項實體獎品
              </span>
            </div>
          </div>

          {/* Mobile-First Filter */}
          <div className="card mb-3">
            <div className="card-body p-3">
              <h6 className="card-title mb-3 fs-6">
                <i className="bi bi-funnel me-2"></i>
                篩選獎品狀態
              </h6>
              
              {/* Mobile: Dropdown for small screens */}
              <div className="d-block d-md-none">
                <select 
                  className="form-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">全部 ({prizes.length})</option>
                  <option value="pending_shipment">未出貨 ({prizes.filter(p => p.status === 'pending_shipment').length})</option>
                  <option value="shipment_notified">已通知出貨 ({prizes.filter(p => p.status === 'shipment_notified').length})</option>
                  <option value="shipped">已出貨 ({prizes.filter(p => p.status === 'shipped').length})</option>
                </select>
              </div>

              {/* Desktop: Button group for larger screens */}
              <div className="d-none d-md-block">
                <div className="btn-group" role="group">
                  <input 
                    type="radio" 
                    className="btn-check" 
                    name="statusFilter" 
                    id="all"
                    checked={statusFilter === 'all'}
                    onChange={() => setStatusFilter('all')}
                  />
                  <label className="btn btn-outline-primary" htmlFor="all">
                    全部 ({prizes.length})
                  </label>

                  <input 
                    type="radio" 
                    className="btn-check" 
                    name="statusFilter" 
                    id="pending_shipment"
                    checked={statusFilter === 'pending_shipment'}
                    onChange={() => setStatusFilter('pending_shipment')}
                  />
                  <label className="btn btn-outline-warning" htmlFor="pending_shipment">
                    未出貨 ({prizes.filter(p => p.status === 'pending_shipment').length})
                  </label>

                  <input 
                    type="radio" 
                    className="btn-check" 
                    name="statusFilter" 
                    id="shipment_notified"
                    checked={statusFilter === 'shipment_notified'}
                    onChange={() => setStatusFilter('shipment_notified')}
                  />
                  <label className="btn btn-outline-info" htmlFor="shipment_notified">
                    已通知出貨 ({prizes.filter(p => p.status === 'shipment_notified').length})
                  </label>

                  <input 
                    type="radio" 
                    className="btn-check" 
                    name="statusFilter" 
                    id="shipped"
                    checked={statusFilter === 'shipped'}
                    onChange={() => setStatusFilter('shipped')}
                  />
                  <label className="btn btn-outline-success" htmlFor="shipped">
                    已出貨 ({prizes.filter(p => p.status === 'shipped').length})
                  </label>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="alert alert-danger d-flex align-items-center" role="alert">
              <i className="bi bi-exclamation-triangle-fill me-2 fs-5"></i>
              <div>{error}</div>
            </div>
          )}

          {filteredPrizes.length === 0 ? (
            statusFilter === 'all' ? (
              <div className="text-center py-5">
                <i className="bi bi-bag-x display-1 text-muted"></i>
                <h4 className="mt-3 text-muted fs-5">背包是空的</h4>
                <p className="text-muted">參加遊戲獲得實體獎品後，它們會出現在這裡！</p>
                <button 
                  className="btn btn-primary mt-2 px-4"
                  onClick={() => window.location.href = '/game'}
                >
                  <i className="bi bi-controller me-2"></i>
                  去玩遊戲
                </button>
              </div>
            ) : (
              <div className="text-center py-5">
                <i className="bi bi-search display-1 text-muted"></i>
                <h4 className="mt-3 text-muted fs-5">沒有符合條件的獎品</h4>
                <p className="text-muted">請嘗試其他篩選條件</p>
                <button 
                  className="btn btn-outline-secondary mt-2 px-4"
                  onClick={() => setStatusFilter('all')}
                >
                  <i className="bi bi-arrow-clockwise me-2"></i>
                  顯示全部
                </button>
              </div>
            )
          ) : (
            <>
              {/* Mobile: Card Layout */}
              <div className="d-block d-lg-none">
                <div className="row g-3">
                  {filteredPrizes.map((prize) => (
                    <div key={prize.id} className="col-12">
                      <div className="card h-100 shadow-sm prize-card">
                        <div className="card-body p-3">
                          {/* Prize Header */}
                          <div className="d-flex align-items-start justify-content-between mb-3">
                            <div className="d-flex align-items-center flex-grow-1">
                              <div className="me-3 prize-icon">
                                <i className="bi bi-gift-fill" style={{fontSize: '1.5rem'}}></i>
                              </div>
                              <div className="flex-grow-1">
                                <h6 className="mb-1 fw-bold text-dark">{prize.prizeContent}</h6>
                                <small className="text-muted">實體獎品</small>
                              </div>
                            </div>
                            <span className={`badge ${getStatusClass(prize.status)} fs-6 px-2 py-1`}>
                              {getStatusText(prize.status)}
                            </span>
                          </div>

                          {/* Prize Details */}
                          <div className="row g-2 small mb-3">
                            <div className="col-6">
                              <div className="text-muted mb-1">
                                <i className="bi bi-controller me-1"></i>來源遊戲
                              </div>
                              <div className="fw-medium text-truncate">
                                {games[prize.gameId]?.spec.title || '-'}
                              </div>
                            </div>
                            <div className="col-6">
                              <div className="text-muted mb-1">
                                <i className="bi bi-ticket me-1"></i>票號
                              </div>
                              <span className="badge bg-secondary">#{prize.ticketNumber}</span>
                            </div>
                            <div className="col-12">
                              <div className="text-muted mb-1">
                                <i className="bi bi-calendar-event me-1"></i>獲獎時間
                              </div>
                              <div className="small">{formatDate(prize.awardedAt)}</div>
                            </div>
                          </div>

                          {/* Action Button */}
                          {prize.status === 'pending_shipment' && (
                            <div className="d-grid">
                              <button 
                                className="btn btn-warning btn-lg"
                                onClick={() => handleNotifyClick(prize)}
                                disabled={notifyingPrizes.has(prize.id)}
                              >
                                {notifyingPrizes.has(prize.id) ? (
                                  <>
                                    <div className="spinner-border spinner-border-sm me-2" role="status">
                                      <span className="visually-hidden">處理中...</span>
                                    </div>
                                    處理中...
                                  </>
                                ) : (
                                  <>
                                    <i className="bi bi-bell-fill me-2"></i>
                                    通知出貨
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Desktop: Table Layout */}
              <div className="d-none d-lg-block">
                <div className="card">
                  <div className="card-header bg-light">
                    <div className="row fw-bold text-muted small">
                      <div className="col-md-3">獎品資訊</div>
                      <div className="col-md-2">來源遊戲</div>
                      <div className="col-md-1">票號</div>
                      <div className="col-md-2">獲獎時間</div>
                      <div className="col-md-2">出貨狀態</div>
                      <div className="col-md-2">操作</div>
                    </div>
                  </div>
                  <div className="card-body p-0">
                    <div className="list-group list-group-flush">
                      {filteredPrizes.map((prize) => (
                        <div key={prize.id} className="list-group-item list-group-item-action">
                          <div className="row align-items-center">
                            <div className="col-md-3">
                              <div className="d-flex align-items-center">
                                <div className="me-3">
                                  <i className="bi bi-gift-fill text-primary fs-4"></i>
                                </div>
                                <div>
                                  <h6 className="mb-1 fw-bold">{prize.prizeContent}</h6>
                                  <small className="text-muted">實體獎品</small>
                                </div>
                              </div>
                            </div>
                            
                            <div className="col-md-2">
                              <div className="text-truncate">
                                {games[prize.gameId] ? (
                                  <>
                                    <i className="bi bi-controller me-1"></i>
                                    {games[prize.gameId].spec.title}
                                  </>
                                ) : (
                                  <span className="text-muted">-</span>
                                )}
                              </div>
                            </div>
                            
                            <div className="col-md-1">
                              <span className="badge bg-secondary">
                                #{prize.ticketNumber}
                              </span>
                            </div>
                            
                            <div className="col-md-2">
                              <small className="text-muted">
                                <i className="bi bi-calendar-event me-1"></i>
                                {formatDate(prize.awardedAt)}
                              </small>
                            </div>
                            
                            <div className="col-md-2">
                              <span className={`badge ${getStatusClass(prize.status)}`}>
                                <i className="bi bi-box-seam me-1"></i>
                                {getStatusText(prize.status)}
                              </span>
                            </div>
                            
                            <div className="col-md-2">
                              <div className="d-flex gap-1 justify-content-start">
                                {prize.status === 'pending_shipment' && (
                                  <button 
                                    className="btn btn-sm btn-warning"
                                    title="通知出貨"
                                    onClick={() => handleNotifyClick(prize)}
                                    disabled={notifyingPrizes.has(prize.id)}
                                  >
                                    {notifyingPrizes.has(prize.id) ? (
                                      <div className="spinner-border spinner-border-sm" role="status">
                                        <span className="visually-hidden">處理中...</span>
                                      </div>
                                    ) : (
                                      <>
                                        <i className="bi bi-bell-fill me-1"></i>
                                        通知出貨
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Help Section - Mobile Optimized */}
          <div className="mt-4">
            <div className="card">
              <div className="card-body p-3">
                <h6 className="card-title fs-6">
                  <i className="bi bi-info-circle me-2"></i>
                  關於實體獎品
                </h6>
                <div className="row g-2 small text-muted">
                  <div className="col-12 col-md-6">
                    <div className="d-flex align-items-center mb-2">
                      <span className="badge bg-warning text-dark me-2 flex-shrink-0">未出貨</span>
                      <span>獎品正在準備中，可點擊「通知出貨」按鈕提醒管理員</span>
                    </div>
                  </div>
                  <div className="col-12 col-md-6">
                    <div className="d-flex align-items-center mb-2">
                      <span className="badge bg-info text-white me-2 flex-shrink-0">已通知出貨</span>
                      <span>已通知管理員準備出貨，請耐心等待</span>
                    </div>
                  </div>
                  <div className="col-12 col-md-6">
                    <div className="d-flex align-items-center mb-2">
                      <span className="badge bg-success text-white me-2 flex-shrink-0">已出貨</span>
                      <span>獎品已寄出或可領取</span>
                    </div>
                  </div>
                  <div className="col-12 col-md-6">
                    <div className="d-flex align-items-center mb-2">
                      <i className="bi bi-coin text-warning me-2 flex-shrink-0"></i>
                      <span>願望幣獎品會自動加入您的帳戶餘額</span>
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="d-flex align-items-center">
                      <i className="bi bi-headset text-primary me-2 flex-shrink-0"></i>
                      <span>如有任何問題，請聯絡客服</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile-Optimized Confirmation Modal */}
      {showConfirmModal && selectedPrize && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-fullscreen-sm-down">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fs-6">
                  <i className="bi bi-bell-fill text-warning me-2"></i>
                  確認通知出貨
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={handleCancelNotify}
                  disabled={notifyingPrizes.has(selectedPrize.id)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="alert alert-info d-flex align-items-center">
                  <i className="bi bi-info-circle me-2 fs-5"></i>
                  <div>您確定要通知管理員出貨嗎？</div>
                </div>
                
                <div className="card">
                  <div className="card-body p-3">
                    <h6 className="card-title fs-6">
                      <i className="bi bi-gift-fill text-primary me-2"></i>
                      獎品資訊
                    </h6>
                    <div className="row g-3">
                      <div className="col-12 col-sm-6">
                        <div className="text-muted small mb-1">獎品內容</div>
                        <div className="fw-medium">{selectedPrize.prizeContent}</div>
                      </div>
                      <div className="col-12 col-sm-6">
                        <div className="text-muted small mb-1">來源遊戲</div>
                        <div className="fw-medium">{games[selectedPrize.gameId]?.spec.title || '-'}</div>
                      </div>
                      <div className="col-6">
                        <div className="text-muted small mb-1">票號</div>
                        <span className="badge bg-secondary">#{selectedPrize.ticketNumber}</span>
                      </div>
                      <div className="col-6">
                        <div className="text-muted small mb-1">獲獎時間</div>
                        <div className="small">{formatDate(selectedPrize.awardedAt)}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-3 p-3 bg-light rounded">
                  <small className="text-muted d-flex align-items-start">
                    <i className="bi bi-exclamation-triangle me-2 flex-shrink-0 mt-1"></i>
                    <span>通知後，獎品狀態將變更為「已通知出貨」，管理員會開始準備出貨流程。</span>
                  </small>
                </div>
              </div>
              <div className="modal-footer gap-2">
                <button 
                  type="button" 
                  className="btn btn-secondary flex-fill"
                  onClick={handleCancelNotify}
                  disabled={notifyingPrizes.has(selectedPrize.id)}
                >
                  <i className="bi bi-x-circle me-1"></i>
                  取消
                </button>
                <button 
                  type="button" 
                  className="btn btn-warning flex-fill"
                  onClick={handleConfirmNotify}
                  disabled={notifyingPrizes.has(selectedPrize.id)}
                >
                  {notifyingPrizes.has(selectedPrize.id) ? (
                    <>
                      <div className="spinner-border spinner-border-sm me-2" role="status">
                        <span className="visually-hidden">處理中...</span>
                      </div>
                      處理中...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-bell-fill me-1"></i>
                      確認通知
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyPrizesPage;
