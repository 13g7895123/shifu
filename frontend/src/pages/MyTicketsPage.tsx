import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiCall } from '../services/apiConfig';

interface PurchasedTicket {
  id: string;
  gameId: string;
  ticketNumber: number;
  userId: string;
  purchasePrice: number;
  purchasedAt: string;
}

const MyTicketsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tickets, setTickets] = useState<PurchasedTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 載入用戶的票券
  const loadUserTickets = async () => {
    try {
      setLoading(true);
      const response = await apiCall('/api/tickets/user');

      if (!response.ok) {
        throw new Error('載入票券失敗');
      }

      const data = await response.json();
      
      if (data.success) {
        setTickets(data.data);
      } else {
        setError(data.message || '載入票券失敗');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '載入票券失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadUserTickets();
    }
  }, [user]);

  if (!user) {
    return (
      <div className="container-lg">
        <div className="my-4">
          <div className="alert alert-warning">
            <i className="bi bi-exclamation-triangle me-2"></i>
            請先登入以查看您的票券
          </div>
          <button 
            className="btn btn-primary"
            onClick={() => navigate('/login')}
          >
            前往登入
          </button>
        </div>
      </div>
    );
  }

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
          <h1 className="h3 mb-4">我的票券</h1>
          <div className="alert alert-danger">
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}
          </div>
          <button 
            className="btn btn-primary"
            onClick={loadUserTickets}
          >
            重新載入
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-lg">
      <div className="my-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="h3 mb-0">我的票券</h1>
          <div className="d-flex align-items-center gap-3">
            <div className="text-muted">
              <i className="bi bi-coin me-1"></i>
              目前願望幣：<strong>{user.point}</strong>
            </div>
            <button 
              className="btn btn-outline-secondary"
              onClick={loadUserTickets}
            >
              <i className="bi bi-arrow-clockwise me-2"></i>
              重新載入
            </button>
          </div>
        </div>

        {tickets.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-ticket-perforated display-1 text-muted"></i>
            <h3 className="text-muted mt-3">您還沒有購買任何票券</h3>
            <p className="text-muted">前往遊戲頁面開始購買票券吧！</p>
            <button 
              className="btn btn-primary mt-3"
              onClick={() => navigate('/game')}
            >
              前往遊戲
            </button>
          </div>
        ) : (
          <div className="row">
            <div className="col-12">
              <div className="card">
                <div className="card-header">
                  <h5 className="card-title mb-0">
                    <i className="bi bi-ticket-perforated me-2"></i>
                    已購買票券 ({tickets.length})
                  </h5>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>遊戲ID</th>
                          <th>票券號碼</th>
                          <th>購買價格</th>
                          <th>購買時間</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tickets.map((ticket) => (
                          <tr key={ticket.id}>
                            <td>
                              <span className="fw-bold">{ticket.gameId}</span>
                            </td>
                            <td>
                              <span className="badge bg-primary fs-6">
                                #{ticket.ticketNumber}
                              </span>
                            </td>
                            <td>NT$ {ticket.purchasePrice}</td>
                            <td>
                              {new Date(ticket.purchasedAt).toLocaleString('zh-TW')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="row mt-4">
          <div className="col-12">
            <button 
              className="btn btn-outline-secondary"
              onClick={() => navigate('/game')}
            >
              <i className="bi bi-arrow-left me-2"></i>
              返回遊戲
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyTicketsPage;
