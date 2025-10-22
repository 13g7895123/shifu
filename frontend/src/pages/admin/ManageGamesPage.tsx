import React, { useState, useEffect } from 'react';
import { apiCall } from '../../services/apiConfig';

interface GameSpec {
  description?: string;
  maxPlayers?: number;
  duration?: number;
  rules?: string[];
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
  status?: string;
  soldTickets?: number;
}

interface CreateGameData {
  gameId: string;
  spec: GameSpec;
}

const ManageGamesPage: React.FC = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [showPurchaseInfoModal, setShowPurchaseInfoModal] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [purchaseInfo, setPurchaseInfo] = useState<any[]>([]);
  const [purchaseInfoLoading, setPurchaseInfoLoading] = useState(false);
  
  // 創建遊戲表單數據
  const [createFormData, setCreateFormData] = useState<CreateGameData>({
    gameId: '', // 系統自動生成，不需要用戶輸入
    spec: {
      description: '',
      tickets: undefined,
      ticketPrice: undefined
    }
  });

  // 編輯遊戲表單數據
  const [editFormData, setEditFormData] = useState<CreateGameData>({
    gameId: '',
    spec: {
      description: '',
      tickets: undefined,
      ticketPrice: undefined
    }
  });

  // 發禮物表單數據
  const [giftFormData, setGiftFormData] = useState({
    ticketNumber: '',
    prizeType: 'points',
    prizeContent: ''
  });

  const [statusFilter, setStatusFilter] = useState<string>('all');

  // 載入遊戲列表
  const loadGames = async () => {
    try {
      setLoading(true);
      const response = await apiCall('/api/admin/api/games', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('載入遊戲列表失敗');
      }

      const data = await response.json();
      if (data.success) {
        // 處理不同的數據結構
        const games = data.data?.games || data.games || [];
        setGames(games);
      } else {
        throw new Error(data.message || '載入遊戲列表失敗');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '載入遊戲列表失敗');
    } finally {
      setLoading(false);
    }
  };

  // 創建遊戲
  const handleCreateGame = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 驗證票數
    if (createFormData.spec.tickets === undefined || createFormData.spec.tickets === null) {
      alert('請輸入票數');
      return;
    }
    
    if (isNaN(createFormData.spec.tickets) || createFormData.spec.tickets <= 0 || !Number.isInteger(createFormData.spec.tickets)) {
      alert('請輸入有效的票數（需為正整數）');
      return;
    }
    
    // 驗證票價
    if (createFormData.spec.ticketPrice === undefined || createFormData.spec.ticketPrice === null) {
      alert('請輸入票價');
      return;
    }
    
    if (isNaN(createFormData.spec.ticketPrice) || createFormData.spec.ticketPrice < 0 || !Number.isInteger(createFormData.spec.ticketPrice)) {
      alert('請輸入有效的票價（需為非負整數）');
      return;
    }
    
    try {
      // 只發送 spec 資料，讓後端自動生成 gameId
      const requestData = {
        spec: createFormData.spec
      };
      
      const response = await apiCall('/api/admin/api/games', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(requestData)
      });

      const data = await response.json();
      
      if (data.success) {
        setShowCreateModal(false);
        setCreateFormData({
          gameId: '', // 系統自動生成
          spec: {
            description: '',
            tickets: undefined,
            ticketPrice: undefined
          }
        });
        await loadGames();
        alert('遊戲創建成功！');
      } else {
        alert(data.message || '創建遊戲失敗');
      }
    } catch (err) {
      alert('創建遊戲時發生錯誤');
    }
  };

  // 更新遊戲
  const handleUpdateGame = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedGame) return;

    // 驗證票數
    if (editFormData.spec.tickets === undefined || editFormData.spec.tickets === null) {
      alert('請輸入票數');
      return;
    }
    
    if (isNaN(editFormData.spec.tickets) || editFormData.spec.tickets <= 0 || !Number.isInteger(editFormData.spec.tickets)) {
      alert('請輸入有效的票數（需為正整數）');
      return;
    }
    
    // 驗證票價
    if (editFormData.spec.ticketPrice === undefined || editFormData.spec.ticketPrice === null) {
      alert('請輸入票價');
      return;
    }
    
    if (isNaN(editFormData.spec.ticketPrice) || editFormData.spec.ticketPrice < 0 || !Number.isInteger(editFormData.spec.ticketPrice)) {
      alert('請輸入有效的票價（需為非負整數）');
      return;
    }

    try {
      const response = await apiCall(`/api/admin/api/games/${selectedGame.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          spec: editFormData.spec
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setShowEditModal(false);
        setSelectedGame(null);
        await loadGames();
        alert('遊戲更新成功！');
      } else {
        alert(data.message || '更新遊戲失敗');
      }
    } catch (err) {
      alert('更新遊戲時發生錯誤');
    }
  };

  // 刪除遊戲
  const handleDeleteGame = async (gameId: string) => {
    if (!window.confirm('確定要刪除這個遊戲嗎？此操作無法撤銷。')) {
      return;
    }

    try {
      const response = await apiCall(`/api/admin/api/games/${gameId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const data = await response.json();
      
      if (data.success) {
        await loadGames();
        alert('遊戲刪除成功！');
      } else {
        alert(data.message || '刪除遊戲失敗');
      }
    } catch (err) {
      alert('刪除遊戲時發生錯誤');
    }
  };

  // 發禮物
  const handleGiftGame = (game: Game) => {
    setSelectedGame(game);
    setGiftFormData({
      ticketNumber: '',
      prizeType: 'points',
      prizeContent: ''
    });
    setShowGiftModal(true);
  };

  // 提交發禮物
  const handleSubmitGift = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedGame) return;

    try {
      const response = await apiCall('/api/admin/api/prizes/award', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          gameId: selectedGame.gameId,
          ticketNumber: parseInt(giftFormData.ticketNumber),
          prizeType: giftFormData.prizeType,
          prizeContent: giftFormData.prizeContent
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setShowGiftModal(false);
        setSelectedGame(null);
        setGiftFormData({
          ticketNumber: '',
          prizeType: 'points',
          prizeContent: ''
        });
        alert('禮物發送成功！');
      } else {
        alert(data.message || '發送禮物失敗');
      }
    } catch (err) {
      alert('發送禮物時發生錯誤');
    }
  };

  // 編輯遊戲
  const handleEditGame = (game: Game) => {
    setSelectedGame(game);
    setEditFormData({
      gameId: game.gameId,
      spec: { ...game.spec }
    });
    setShowEditModal(true);
  };

  // 開始遊戲
  const handleStartGame = async (gameId: string) => {
    try {
      const response = await apiCall(`/api/admin/api/games/${gameId}/start`, {
        method: 'POST',
        credentials: 'include'
      });

      const data = await response.json();
      
      if (data.success) {
        await loadGames();
        alert('遊戲已開始！');
      } else {
        alert(data.message || '開始遊戲失敗');
      }
    } catch (err) {
      alert('開始遊戲時發生錯誤');
    }
  };

  // 結束遊戲
  const handleFinishGame = async (gameId: string) => {
    if (!window.confirm('確定要結束這個遊戲嗎？')) {
      return;
    }

    try {
      const response = await apiCall(`/api/admin/api/games/${gameId}/finish`, {
        method: 'POST',
        credentials: 'include'
      });

      const data = await response.json();
      
      if (data.success) {
        await loadGames();
        alert('遊戲已結束！');
      } else {
        alert(data.message || '結束遊戲失敗');
      }
    } catch (err) {
      alert('結束遊戲時發生錯誤');
    }
  };

  // 取消遊戲
  const handleCancelGame = async (gameId: string) => {
    if (!window.confirm('確定要取消這個遊戲嗎？此操作將：\n• 收回所有已發放的獎勵\n• 退還所有票券購買金額\n• 刪除所有票券和獎勵記錄\n\n此操作無法撤銷。')) {
      return;
    }

    try {
      const response = await apiCall(`/api/admin/api/games/${gameId}/cancel`, {
        method: 'POST',
        credentials: 'include'
      });

      const data = await response.json();
      
      if (data.success) {
        await loadGames();
        alert('遊戲已取消！所有獎勵已收回，票券金額已退還給玩家。');
      } else {
        alert(data.message || '取消遊戲失敗');
      }
    } catch (err) {
      alert('取消遊戲時發生錯誤');
    }
  };

  // 停止購買
  const handleStopPurchasing = async (gameId: string) => {
    if (!window.confirm('確定要停止此遊戲的票券購買嗎？')) {
      return;
    }

    try {
      const response = await apiCall(`/api/admin/api/games/${gameId}/stop-purchasing`, {
        method: 'POST',
        credentials: 'include'
      });

      const data = await response.json();
      
      if (data.success) {
        await loadGames();
        alert('已停止票券購買！');
      } else {
        alert(data.message || '停止購買失敗');
      }
    } catch (err) {
      alert('停止購買時發生錯誤');
    }
  };

  // 恢復購買
  const handleResumePurchasing = async (gameId: string) => {
    if (!window.confirm('確定要恢復此遊戲的票券購買嗎？')) {
      return;
    }

    try {
      const response = await apiCall(`/api/admin/api/games/${gameId}/resume-purchasing`, {
        method: 'POST',
        credentials: 'include'
      });

      const data = await response.json();
      
      if (data.success) {
        await loadGames();
        alert('已恢復票券購買！');
      } else {
        alert(data.message || '恢復購買失敗');
      }
    } catch (err) {
      alert('恢復購買時發生錯誤');
    }
  };

  // 查看購買資訊
  const handleViewPurchaseInfo = async (game: Game) => {
    setSelectedGame(game);
    setShowPurchaseInfoModal(true);
    setPurchaseInfoLoading(true);
    
    try {
      const response = await apiCall(`/api/admin/api/games/${game.id}/purchase-info`, {
        credentials: 'include'
      });

      const data = await response.json();
      
      if (data.success) {
        setPurchaseInfo(data.data);
      } else {
        alert(data.message || '載入購買資訊失敗');
        setPurchaseInfo([]);
      }
    } catch (err) {
      alert('載入購買資訊時發生錯誤');
      setPurchaseInfo([]);
    } finally {
      setPurchaseInfoLoading(false);
    }
  };

  // 獲取遊戲狀態
  const getGameStatus = (game: Game) => {
    // 優先使用後端返回的status
    if (game.status) {
      switch (game.status) {
        case 'pending':
          return '待開始';
        case 'active':
          return '進行中';
        case 'finished':
          return '已結束';
        case 'cancelled':
          return '已取消';
        default:
          return game.status;
      }
    }
    
    // 向後兼容：根據遊戲屬性判斷狀態
    if (game.canceled) return '已取消';
    if (game.finishTime) return '已結束';
    return '待開始';
  };

  // 獲取狀態樣式
  const getStatusBadgeClass = (game: Game) => {
    // 優先使用後端返回的status
    if (game.status) {
      switch (game.status) {
        case 'pending':
          return 'badge bg-warning';
        case 'active':
          return 'badge bg-primary';
        case 'finished':
          return 'badge bg-success';
        case 'cancelled':
          return 'badge bg-secondary';
        default:
          return 'badge bg-info';
      }
    }
    
    // 向後兼容：根據遊戲屬性判斷樣式
    if (game.canceled) return 'badge bg-secondary';
    if (game.finishTime) return 'badge bg-success';
    return 'badge bg-warning';
  };

  // 過濾並排序遊戲
  const filteredGames = games.filter(game => {
    if (statusFilter === 'all') return true;
    
    // 使用後端返回的 status 欄位進行篩選
    if (game.status) {
      if (statusFilter === 'pending') return game.status === 'pending';
      if (statusFilter === 'active') return game.status === 'active';
      if (statusFilter === 'finished') return game.status === 'finished';
      if (statusFilter === 'cancelled') return game.status === 'cancelled';
    } else {
      // 向後兼容：使用舊的邏輯
      if (statusFilter === 'pending') return !game.canceled && !game.finishTime;
      if (statusFilter === 'active') return !game.canceled && !game.finishTime;
      if (statusFilter === 'finished') return game.finishTime;
      if (statusFilter === 'cancelled') return game.canceled;
    }
    
    return true;
  }).sort((a, b) => {
    const aIsActive = a.status === 'active';
    const bIsActive = b.status === 'active';

    if (aIsActive && !bIsActive) {
      return -1; // a 置頂
    }
    if (!aIsActive && bIsActive) {
      return 1; // b 置頂
    }

    // 對於相同狀態的遊戲，按創建時間倒序排列（最新的在前）
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  useEffect(() => {
    loadGames();
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

  return (
    <div className="container-lg">
      <div className="my-4">
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
          <h1 className="text-primary mb-0">遊戲管理</h1>
          <button 
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            <i className="bi bi-plus-circle me-2"></i>
            <span className="d-none d-sm-inline">新增遊戲</span>
            <span className="d-sm-none">新增</span>
          </button>
        </div>

        {error && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            {error}
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => setError(null)}
            ></button>
          </div>
        )}

        {/* 狀態篩選 */}
        <div className="mb-3">
          <div className="d-flex gap-2 flex-wrap">
            <button 
              className={`btn btn-sm ${statusFilter === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setStatusFilter('all')}
            >
              全部 ({games.length})
            </button>
            <button 
              className={`btn btn-sm ${statusFilter === 'pending' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setStatusFilter('pending')}
            >
              待開始 ({games.filter(g => g.status === 'pending' || (!g.status && !g.canceled && !g.finishTime)).length})
            </button>
            <button 
              className={`btn btn-sm ${statusFilter === 'active' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setStatusFilter('active')}
            >
              進行中 ({games.filter(g => g.status === 'active').length})
            </button>
            <button 
              className={`btn btn-sm ${statusFilter === 'finished' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setStatusFilter('finished')}
            >
              已結束 ({games.filter(g => g.status === 'finished' || (!g.status && g.finishTime)).length})
            </button>
            <button 
              className={`btn btn-sm ${statusFilter === 'cancelled' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setStatusFilter('cancelled')}
            >
              已取消 ({games.filter(g => g.status === 'cancelled' || (!g.status && g.canceled)).length})
            </button>
          </div>
        </div>

        {/* 遊戲列表 */}
        <div className="card">
          <div className="card-body">
            {filteredGames.length === 0 ? (
              <div className="text-center py-4">
                <i className="bi bi-controller display-1 text-muted"></i>
                <p className="text-muted mt-3">目前沒有遊戲</p>
              </div>
            ) : (
              <>
                {/* 桌面版表格 */}
                <div className="table-responsive d-none d-lg-block">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>遊戲ID</th>
                        <th>描述</th>
                        <th>票數</th>
                        <th>票價</th>
                        <th>狀態</th>
                        <th>購買狀態</th>
                        <th>創建時間</th>
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredGames.map((game) => (
                        <tr key={game.id} className={game.status === 'active' ? 'table-warning' : ''}>
                          <td>
                            <strong>{game.gameId}</strong>
                          </td>
                          <td>{game.spec.description || '無描述'}</td>
                          <td>
                            <span className="badge bg-info">
                              {game.soldTickets || 0}/{game.spec.tickets || 0}
                            </span>
                          </td>
                          <td>NT$ {game.spec.ticketPrice || 0}</td>
                          <td>
                            <span className={getStatusBadgeClass(game)}>
                              {getGameStatus(game)}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${game.purchasingStopped ? 'bg-danger' : 'bg-success'}`}>
                              {game.purchasingStopped ? '已停止購買' : '可購買'}
                            </span>
                          </td>
                          <td>{new Date(game.createdAt).toLocaleString('zh-TW')}</td>
                          <td>
                            <div className="btn-group btn-group-sm">
                              {/* 根據遊戲狀態顯示不同的操作按鈕 */}
                              {(game.status === 'pending' || (!game.status && !game.canceled && !game.finishTime)) && (
                                <button 
                                  className="btn btn-outline-success"
                                  onClick={() => handleStartGame(game.id)}
                                  title="開始遊戲"
                                >
                                  <i className="bi bi-play-fill"></i>
                                </button>
                              )}
                              
                              {game.status === 'active' && (
                                <>
                                  <button 
                                    className="btn btn-outline-info"
                                    onClick={() => handleFinishGame(game.id)}
                                    title="結束遊戲"
                                  >
                                    <i className="bi bi-stop-fill"></i>
                                  </button>
                                  <button 
                                    className="btn btn-outline-secondary"
                                    onClick={() => handleCancelGame(game.id)}
                                    title="取消遊戲"
                                  >
                                    <i className="bi bi-x-circle"></i>
                                  </button>
                                </>
                              )}
                              
                              {/* 購買控制按鈕 - 只有進行中和待開始的遊戲可以控制購買 */}
                              {(game.status === 'active' || game.status === 'pending' || 
                                (!game.status && !game.canceled && !game.finishTime)) && (
                                <>
                                  {!game.purchasingStopped ? (
                                    <button 
                                      className="btn btn-outline-warning"
                                      onClick={() => handleStopPurchasing(game.id)}
                                      title="停止購買"
                                    >
                                      <i className="bi bi-pause-circle"></i>
                                    </button>
                                  ) : (
                                    <button 
                                      className="btn btn-outline-success"
                                      onClick={() => handleResumePurchasing(game.id)}
                                      title="恢復購買"
                                    >
                                      <i className="bi bi-play-circle"></i>
                                    </button>
                                  )}
                                </>
                              )}
                              
                              {/* 發禮物按鈕 - 只有進行中的遊戲可以發禮物 */}
                              {game.status === 'active' && (
                                <button 
                                  className="btn btn-outline-warning"
                                  onClick={() => handleGiftGame(game)}
                                  title="發禮物"
                                >
                                  <i className="bi bi-gift"></i>
                                </button>
                              )}
                              
                              {/* 購買資訊按鈕 - 所有遊戲都可以查看購買資訊 */}
                              <button 
                                className="btn btn-outline-info"
                                onClick={() => handleViewPurchaseInfo(game)}
                                title="列出購買資訊"
                              >
                                <i className="bi bi-list-ul"></i>
                              </button>
                              
                              {/* 編輯和刪除按鈕 - 只有待開始和已結束的遊戲可以編輯/刪除 */}
                              {(game.status === 'pending' || game.status === 'finished' || game.status === 'cancelled' || 
                                (!game.status && (game.finishTime || game.canceled || (!game.canceled && !game.finishTime)))) && (
                                <>
                                  <button 
                                    className="btn btn-outline-primary"
                                    onClick={() => handleEditGame(game)}
                                    title="編輯"
                                  >
                                    <i className="bi bi-pencil"></i>
                                  </button>
                                  <button 
                                    className="btn btn-outline-danger"
                                    onClick={() => handleDeleteGame(game.id)}
                                    title="刪除"
                                  >
                                    <i className="bi bi-trash"></i>
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 手機版卡片布局 */}
                <div className="d-lg-none">
                  {filteredGames.map((game) => (
                    <div key={game.id} className={`card mb-3 border-start border-1 border-primary ${game.status === 'active' ? 'table-warning' : ''}`}>
                      <div className="card-body">
                        <div className="row">
                          <div className="col-12">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <h6 className="card-title mb-0 text-primary fw-bold">{game.gameId}</h6>
                              <div className="d-flex gap-1">
                                <span className={getStatusBadgeClass(game)} style={{fontSize: '0.75rem'}}>
                                  {getGameStatus(game)}
                                </span>
                                <span className={`badge ${game.purchasingStopped || game.status !== 'active' ? 'bg-danger' : 'bg-success'}`} style={{fontSize: '0.75rem'}}>
                                  {game.purchasingStopped || game.status !== 'active' ? '停止購買' : '可購買'}
                                </span>
                              </div>
                            </div>
                            
                            {game.spec.description && (
                              <p className="card-text text-muted small mb-2">{game.spec.description}</p>
                            )}
                            
                            <div className="row g-2 mb-3">
                              <div className="col-6">
                                <small className="text-muted d-block">票數</small>
                                <span className="badge bg-info fs-6">
                                  {game.soldTickets || 0}/{game.spec.tickets || 0}
                                </span>
                              </div>
                              <div className="col-6">
                                <small className="text-muted d-block">票價</small>
                                <span className="fw-bold text-success">NT$ {game.spec.ticketPrice || 0}</span>
                              </div>
                            </div>
                            
                            <div className="mb-3">
                              <small className="text-muted d-block">創建時間</small>
                              <small className="text-secondary">{new Date(game.createdAt).toLocaleString('zh-TW')}</small>
                            </div>
                            
                            {/* 手機版操作按鈕 */}
                            <div className="d-flex flex-wrap gap-2">
                              {/* 根據遊戲狀態顯示不同的操作按鈕 */}
                              {(game.status === 'pending' || (!game.status && !game.canceled && !game.finishTime)) && (
                                <button 
                                  className="btn btn-outline-success btn-sm flex-fill"
                                  onClick={() => handleStartGame(game.id)}
                                >
                                  <i className="bi bi-play-fill me-1"></i>開始
                                </button>
                              )}
                              
                              {game.status === 'active' && (
                                <>
                                  <button 
                                    className="btn btn-outline-info btn-sm flex-fill"
                                    onClick={() => handleFinishGame(game.id)}
                                  >
                                    <i className="bi bi-stop-fill me-1"></i>結束
                                  </button>
                                  <button 
                                    className="btn btn-outline-secondary btn-sm flex-fill"
                                    onClick={() => handleCancelGame(game.id)}
                                  >
                                    <i className="bi bi-x-circle me-1"></i>取消
                                  </button>
                                </>
                              )}
                              
                              {/* 購買控制按鈕 - 只有進行中和待開始的遊戲可以控制購買 */}
                              {(game.status === 'active' || game.status === 'pending' || 
                                (!game.status && !game.canceled && !game.finishTime)) && (
                                <>
                                  {!game.purchasingStopped ? (
                                    <button 
                                      className="btn btn-outline-warning btn-sm"
                                      onClick={() => handleStopPurchasing(game.id)}
                                    >
                                      <i className="bi bi-pause-circle me-1"></i>停止購買
                                    </button>
                                  ) : (
                                    <button 
                                      className="btn btn-outline-success btn-sm"
                                      onClick={() => handleResumePurchasing(game.id)}
                                    >
                                      <i className="bi bi-play-circle me-1"></i>恢復購買
                                    </button>
                                  )}
                                </>
                              )}
                              
                              {/* 發禮物按鈕 - 只有進行中的遊戲可以發禮物 */}
                              {game.status === 'active' && (
                                <button 
                                  className="btn btn-outline-warning btn-sm"
                                  onClick={() => handleGiftGame(game)}
                                >
                                  <i className="bi bi-gift me-1"></i>發禮物
                                </button>
                              )}
                              
                              {/* 購買資訊按鈕 - 所有遊戲都可以查看購買資訊 */}
                              <button 
                                className="btn btn-outline-info btn-sm"
                                onClick={() => handleViewPurchaseInfo(game)}
                              >
                                <i className="bi bi-list-ul me-1"></i>購買資訊
                              </button>
                              
                              {/* 編輯和刪除按鈕 - 只有待開始和已結束的遊戲可以編輯/刪除 */}
                              {(game.status === 'pending' || game.status === 'finished' || game.status === 'cancelled' || 
                                (!game.status && (game.finishTime || game.canceled || (!game.canceled && !game.finishTime)))) && (
                                <>
                                  <button 
                                    className="btn btn-outline-primary btn-sm"
                                    onClick={() => handleEditGame(game)}
                                  >
                                    <i className="bi bi-pencil me-1"></i>編輯
                                  </button>
                                  <button 
                                    className="btn btn-outline-danger btn-sm"
                                    onClick={() => handleDeleteGame(game.id)}
                                  >
                                    <i className="bi bi-trash me-1"></i>刪除
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 創建遊戲 Modal */}
      {showCreateModal && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">新增遊戲</h5>
                <button 
                  type="button" 
                  className="btn-close"
                  onClick={() => setShowCreateModal(false)}
                ></button>
              </div>
              <form onSubmit={handleCreateGame}>
                <div className="modal-body">
                  <div className="alert alert-info">
                    <i className="bi bi-info-circle me-2"></i>
                    <strong>遊戲ID將由系統自動生成</strong>
                    <div className="small text-muted">系統會自動產生唯一的遊戲識別碼，無需手動輸入</div>
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">描述</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={createFormData.spec.description || ''}
                      onChange={(e) => setCreateFormData(prev => ({ 
                        ...prev, 
                        spec: { ...prev.spec, description: e.target.value }
                      }))}
                    />
                  </div>
                  
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">票數</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="請輸入票數，例如：100"
                          value={createFormData.spec.tickets !== undefined ? createFormData.spec.tickets.toString() : ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            setCreateFormData(prev => ({ 
                              ...prev, 
                              spec: { 
                                ...prev.spec, 
                                tickets: value === '' ? undefined : parseInt(value)
                              }
                            }));
                          }}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">票價</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="請輸入票價，例如：10"
                          value={createFormData.spec.ticketPrice !== undefined ? createFormData.spec.ticketPrice.toString() : ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            setCreateFormData(prev => ({ 
                              ...prev, 
                              spec: { 
                                ...prev.spec, 
                                ticketPrice: value === '' ? undefined : parseInt(value)
                              }
                            }));
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setShowCreateModal(false)}
                  >
                    取消
                  </button>
                  <button type="submit" className="btn btn-primary">
                    創建遊戲
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 編輯遊戲 Modal */}
      {showEditModal && selectedGame && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">編輯遊戲 - {selectedGame.gameId}</h5>
                <button 
                  type="button" 
                  className="btn-close"
                  onClick={() => setShowEditModal(false)}
                ></button>
              </div>
              <form onSubmit={handleUpdateGame}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">描述</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={editFormData.spec.description || ''}
                      onChange={(e) => setEditFormData(prev => ({ 
                        ...prev, 
                        spec: { ...prev.spec, description: e.target.value }
                      }))}
                    />
                  </div>
                  
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">票數</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="請輸入票數，例如：100"
                          value={editFormData.spec.tickets !== undefined ? editFormData.spec.tickets.toString() : ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            setEditFormData(prev => ({ 
                              ...prev, 
                              spec: { 
                                ...prev.spec, 
                                tickets: value === '' ? undefined : parseInt(value)
                              }
                            }));
                          }}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">票價</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="請輸入票價，例如：10"
                          value={editFormData.spec.ticketPrice !== undefined ? editFormData.spec.ticketPrice.toString() : ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            setEditFormData(prev => ({ 
                              ...prev, 
                              spec: { 
                                ...prev.spec, 
                                ticketPrice: value === '' ? undefined : parseInt(value)
                              }
                            }));
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setShowEditModal(false)}
                  >
                    取消
                  </button>
                  <button type="submit" className="btn btn-primary">
                    更新遊戲
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 發禮物 Modal */}
      {showGiftModal && selectedGame && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">發禮物 - {selectedGame.gameId}</h5>
                <button 
                  type="button" 
                  className="btn-close"
                  onClick={() => setShowGiftModal(false)}
                ></button>
              </div>
              <form onSubmit={handleSubmitGift}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">票號 *</label>
                    <input
                      type="number"
                      className="form-control"
                      min="1"
                      value={giftFormData.ticketNumber}
                      onChange={(e) => setGiftFormData(prev => ({ 
                        ...prev, 
                        ticketNumber: e.target.value 
                      }))}
                      required
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">禮物類型 *</label>
                    <select
                      className="form-control"
                      value={giftFormData.prizeType}
                      onChange={(e) => setGiftFormData(prev => ({ 
                        ...prev, 
                        prizeType: e.target.value,
                        prizeContent: '' // 切換禮物類型時清空內容
                      }))}
                      required
                    >
                      <option value="points">願望幣</option>
                      <option value="physical">實體</option>
                    </select>
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">禮物內容 *</label>
                    {giftFormData.prizeType === 'points' ? (
                      <input
                        type="number"
                        className="form-control"
                        min="1"
                        step="1"
                        value={giftFormData.prizeContent}
                        onChange={(e) => setGiftFormData(prev => ({ 
                          ...prev, 
                          prizeContent: e.target.value 
                        }))}
                        placeholder="請輸入願望幣，例如：100"
                        required
                      />
                    ) : (
                      <textarea
                        className="form-control"
                        rows={3}
                        value={giftFormData.prizeContent}
                        onChange={(e) => setGiftFormData(prev => ({ 
                          ...prev, 
                          prizeContent: e.target.value 
                        }))}
                        placeholder="請描述實體禮物內容，例如：iPhone 15 Pro、現金1000元等"
                        required
                      />
                    )}
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setShowGiftModal(false)}
                  >
                    取消
                  </button>
                  <button type="submit" className="btn btn-warning">
                    發送禮物
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 購買資訊 Modal */}
      {showPurchaseInfoModal && selectedGame && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">購買資訊 - {selectedGame.gameId}</h5>
                <button 
                  type="button" 
                  className="btn-close"
                  onClick={() => setShowPurchaseInfoModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                {purchaseInfoLoading ? (
                  <div className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">載入中...</span>
                    </div>
                    <p className="mt-2 text-muted">載入購買資訊中...</p>
                  </div>
                ) : purchaseInfo.length === 0 ? (
                  <div className="text-center py-4">
                    <i className="bi bi-ticket-detailed display-1 text-muted"></i>
                    <p className="text-muted mt-3">目前還沒有人購買票券</p>
                  </div>
                ) : (
                  <>
                    <div className="alert alert-info mb-3">
                      <i className="bi bi-info-circle me-2"></i>
                      <strong>已售出 {purchaseInfo.length} 張票券，共 {selectedGame.spec.tickets || 0} 張</strong>
                    </div>
                    
                    {/* 桌面版表格 */}
                    <div className="table-responsive d-none d-md-block">
                      <table className="table table-striped table-hover">
                        <thead>
                          <tr>
                            <th>票券號碼</th>
                            <th>購買者姓名</th>
                            <th>購買價格</th>
                            <th>購買時間</th>
                          </tr>
                        </thead>
                        <tbody>
                          {purchaseInfo.map((info, index) => (
                            <tr key={index}>
                              <td>
                                <span className="badge bg-primary fs-6">#{info.ticketNumber}</span>
                              </td>
                              <td className="fw-semibold">{info.purchaserName}</td>
                              <td className="text-success">NT$ {info.purchasePrice}</td>
                              <td className="text-muted small">
                                {new Date(info.purchasedAt).toLocaleString('zh-TW')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* 手機版卡片 */}
                    <div className="d-md-none">
                      {purchaseInfo.map((info, index) => (
                        <div key={index} className="card mb-2">
                          <div className="card-body py-2">
                            <div className="row align-items-center">
                              <div className="col-3">
                                <span className="badge bg-primary">#{info.ticketNumber}</span>
                              </div>
                              <div className="col-9">
                                <div className="fw-semibold">{info.purchaserName}</div>
                                <div className="small text-success">NT$ {info.purchasePrice}</div>
                                <div className="small text-muted">
                                  {new Date(info.purchasedAt).toLocaleString('zh-TW')}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowPurchaseInfoModal(false)}
                >
                  關閉
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageGamesPage;
