import React, { useState, useEffect } from 'react';
import { User } from '../../types/user';
import { apiCall } from '../../services/apiConfig';

// 內聯類型定義
enum PrizeType {
  POINTS = 'points',
  PHYSICAL = 'physical'
}

enum PrizeStatus {
  PENDING_SHIPMENT = 'pending_shipment',
  SHIPMENT_NOTIFIED = 'shipment_notified', 
  SHIPPED = 'shipped'
}

interface Prize {
  id: string;
  gameId: string;
  playerId: string;
  ticketNumber: number;
  prizeType: PrizeType;
  prizeContent: string;
  status: PrizeStatus;
  awardedAt: string;
  createdAt: string;
  updatedAt: string;
}

interface PrizeWithUser {
  id: string;
  gameId: string;
  playerId: string;
  ticketNumber: number;
  prizeType: PrizeType;
  prizeContent: string;
  status: PrizeStatus;
  awardedAt: string;
  createdAt: string;
  updatedAt: string;
  user?: User;
}

interface UserPrizeGroup {
  user: User;
  prizes: PrizeWithUser[];
}

const ShippingManagePage: React.FC = () => {
  const [prizes, setPrizes] = useState<PrizeWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());

  // 獲取所有獎勵和用戶資料
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        // 獲取所有獎勵
        const prizesResponse = await apiCall('/api/prizes', {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        });
        
        if (!prizesResponse.ok) {
          throw new Error('無法獲取獎勵列表');
        }
        
        const prizesData = await prizesResponse.json();
        
        // 獲取所有用戶
        const usersResponse = await apiCall('/api/admin/users', {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        });
        
        if (!usersResponse.ok) {
          throw new Error('無法獲取用戶列表');
        }

        const usersData = await usersResponse.json();

        // 為每個獎勵添加用戶資訊
        const prizesWithUsers: PrizeWithUser[] = (prizesData.data || prizesData).map((prize: Prize) => ({
          ...prize,
          user: (usersData.data?.users || usersData).find((user: User) => user.id === prize.playerId)
        }));
        
        setPrizes(prizesWithUsers);
      } catch (err) {
        setError(err instanceof Error ? err.message : '載入資料時發生錯誤');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 根據狀態篩選獎勵
  const filteredPrizes = prizes.filter(prize => {
    if (selectedStatus === 'all') return true;
    return prize.status === selectedStatus;
  });

  // 按用戶分組獎勵
  const groupedPrizes: UserPrizeGroup[] = React.useMemo(() => {
    const groups = new Map<string, UserPrizeGroup>();
    
    filteredPrizes.forEach(prize => {
      if (!prize.user) return;
      
      const userId = prize.user.id;
      if (!groups.has(userId)) {
        groups.set(userId, {
          user: prize.user,
          prizes: []
        });
      }
      groups.get(userId)!.prizes.push(prize);
    });
    
    return Array.from(groups.values()).sort((a, b) => 
      a.user.name.localeCompare(b.user.name)
    );
  }, [filteredPrizes]);

  // 切換用戶展開狀態
  const toggleUserExpanded = (userId: string) => {
    const newExpanded = new Set(expandedUsers);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedUsers(newExpanded);
  };

  // 更新獎勵狀態
  const updatePrizeStatus = async (prizeId: string, newStatus: PrizeStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await apiCall(`/api/admin/api/prizes/${prizeId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('更新獎勵狀態失敗');
      }

      // 更新本地狀態
      setPrizes(prev => prev.map(prize => 
        prize.id === prizeId ? { ...prize, status: newStatus } : prize
      ));
    } catch (err) {
      alert(err instanceof Error ? err.message : '更新狀態時發生錯誤');
    }
  };

  // 獲取狀態顯示文字
  const getStatusText = (status: PrizeStatus) => {
    switch (status) {
      case PrizeStatus.PENDING_SHIPMENT:
        return '等待出貨';
      case PrizeStatus.SHIPMENT_NOTIFIED:
        return '已通知出貨';
      case PrizeStatus.SHIPPED:
        return '已出貨';
      default:
        return status;
    }
  };

  // 獲取狀態顏色
  const getStatusColor = (status: PrizeStatus) => {
    switch (status) {
      case PrizeStatus.PENDING_SHIPMENT:
        return 'warning';
      case PrizeStatus.SHIPMENT_NOTIFIED:
        return 'info';
      case PrizeStatus.SHIPPED:
        return 'success';
      default:
        return 'secondary';
    }
  };

  // 獲取類型顯示文字
  const getTypeText = (type: PrizeType) => {
    switch (type) {
      case PrizeType.POINTS:
        return '願望幣';
      case PrizeType.PHYSICAL:
        return '實體';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="container-lg">
        <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
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
        <div className="alert alert-danger mt-4" role="alert">
          <h4 className="alert-heading">錯誤</h4>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-lg">
      <div className="my-4">
        {/* 頁面標題 */}
        <div className="d-flex align-items-center justify-content-between mb-4">
          <div className="d-flex align-items-center">
            <span className="display-4 me-3">📦</span>
            <h1 className="text-primary mb-0">出貨管理</h1>
          </div>
          
          {/* 狀態篩選器 */}
          <div className="d-flex align-items-center">
            <label htmlFor="statusFilter" className="form-label me-2 mb-0">
              篩選狀態：
            </label>
            <select
              id="statusFilter"
              className="form-select"
              style={{ width: 'auto' }}
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">全部</option>
              <option value={PrizeStatus.PENDING_SHIPMENT}>等待出貨</option>
              <option value={PrizeStatus.SHIPMENT_NOTIFIED}>已通知出貨</option>
              <option value={PrizeStatus.SHIPPED}>已出貨</option>
            </select>
          </div>
        </div>

        {/* 統計資訊 */}
        <div className="row mb-4">
          <div className="col-md-3">
            <div className="card text-center border-warning">
              <div className="card-body">
                <h5 className="card-title text-warning">等待出貨</h5>
                <h3 className="text-warning">
                  {prizes.filter(p => p.status === PrizeStatus.PENDING_SHIPMENT).length}
                </h3>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center border-info">
              <div className="card-body">
                <h5 className="card-title text-info">已通知出貨</h5>
                <h3 className="text-info">
                  {prizes.filter(p => p.status === PrizeStatus.SHIPMENT_NOTIFIED).length}
                </h3>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center border-success">
              <div className="card-body">
                <h5 className="card-title text-success">已出貨</h5>
                <h3 className="text-success">
                  {prizes.filter(p => p.status === PrizeStatus.SHIPPED).length}
                </h3>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card text-center border-primary">
              <div className="card-body">
                <h5 className="card-title text-primary">總計</h5>
                <h3 className="text-primary">{prizes.length}</h3>
              </div>
            </div>
          </div>
        </div>

        {/* 用戶分組獎勵列表 */}
        {groupedPrizes.length === 0 ? (
          <div className="text-center py-5">
            <span className="display-1">📭</span>
            <h3 className="mt-3 text-muted">沒有符合條件的獎勵</h3>
          </div>
        ) : (
          <div className="accordion" id="userPrizesAccordion">
            {groupedPrizes.map((group, index) => {
              const isExpanded = expandedUsers.has(group.user.id);
              const physicalPrizes = group.prizes.filter(p => p.prizeType === PrizeType.PHYSICAL);
              const pendingCount = physicalPrizes.filter(p => p.status === PrizeStatus.PENDING_SHIPMENT).length;
              
              return (
                <div key={group.user.id} className="accordion-item">
                  <h2 className="accordion-header">
                    <button
                      className={`accordion-button ${!isExpanded ? 'collapsed' : ''}`}
                      type="button"
                      onClick={() => toggleUserExpanded(group.user.id)}
                    >
                      <div className="d-flex align-items-center justify-content-between w-100 me-2">
                        <div className="d-flex flex-column align-items-start">
                          <div className="d-flex align-items-center">
                            <strong>{group.user.name}</strong>
                            <span className="ms-2 text-muted">({group.user.email})</span>
                          </div>
                          <div className="text-muted small mt-1">
                            <i className="bi bi-geo-alt me-1"></i>
                            {group.user.address || '未提供地址'}
                          </div>
                        </div>
                        <div className="d-flex gap-2">
                          <span className="badge bg-primary">{group.prizes.length} 個獎勵</span>
                          {pendingCount > 0 && (
                            <span className="badge bg-warning">{pendingCount} 待出貨</span>
                          )}
                        </div>
                      </div>
                    </button>
                  </h2>
                  {isExpanded && (
                    <div className="accordion-collapse collapse show">
                      <div className="accordion-body">
                        <div className="table-responsive">
                          <table className="table table-striped">
                            <thead>
                              <tr>
                                <th>獎勵ID</th>
                                <th>遊戲ID</th>
                                <th>票號</th>
                                <th>類型</th>
                                <th>內容</th>
                                <th>狀態</th>
                                <th>獲獎時間</th>
                                <th>操作</th>
                              </tr>
                            </thead>
                            <tbody>
                              {group.prizes.map(prize => (
                                <tr key={prize.id}>
                                  <td>
                                    <code className="small">{prize.id.substring(0, 8)}...</code>
                                  </td>
                                  <td>
                                    <code className="small">{prize.gameId}</code>
                                  </td>
                                  <td>{prize.ticketNumber}</td>
                                  <td>
                                    <span className={`badge bg-${prize.prizeType === PrizeType.POINTS ? 'info' : 'secondary'}`}>
                                      {getTypeText(prize.prizeType)}
                                    </span>
                                  </td>
                                  <td>{prize.prizeContent}</td>
                                  <td>
                                    <span className={`badge bg-${getStatusColor(prize.status)}`}>
                                      {getStatusText(prize.status)}
                                    </span>
                                  </td>
                                  <td>{new Date(prize.awardedAt).toLocaleDateString('zh-TW')}</td>
                                  <td>
                                    {prize.prizeType === PrizeType.PHYSICAL && (
                                      <div className="btn-group" role="group">
                                        {prize.status === PrizeStatus.PENDING_SHIPMENT && (
                                          <button
                                            className="btn btn-outline-info btn-sm"
                                            onClick={() => updatePrizeStatus(prize.id, PrizeStatus.SHIPMENT_NOTIFIED)}
                                          >
                                            通知出貨
                                          </button>
                                        )}
                                        {prize.status === PrizeStatus.SHIPMENT_NOTIFIED && (
                                          <button
                                            className="btn btn-outline-success btn-sm"
                                            onClick={() => updatePrizeStatus(prize.id, PrizeStatus.SHIPPED)}
                                          >
                                            標記已出貨
                                          </button>
                                        )}
                                        {prize.status === PrizeStatus.SHIPPED && (
                                          <button
                                            className="btn btn-outline-secondary btn-sm"
                                            onClick={() => updatePrizeStatus(prize.id, PrizeStatus.SHIPMENT_NOTIFIED)}
                                          >
                                            改為通知中
                                          </button>
                                        )}
                                      </div>
                                    )}
                                    {prize.prizeType === PrizeType.POINTS && (
                                      <span className="text-muted small">願望幣獎勵</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShippingManagePage;
