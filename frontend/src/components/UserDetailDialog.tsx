import React, { useState } from 'react';
import { User } from '../types/user';
import { UserService } from '../services/userService';

interface UserDetailDialogProps {
  open: boolean;
  user: User | null;
  onClose: () => void;
  onUserUpdated: () => void;
}

const UserDetailDialog: React.FC<UserDetailDialogProps> = ({
  open,
  user,
  onClose,
  onUserUpdated
}) => {
  const [pointsToAdd, setPointsToAdd] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleAddPoints = () => {
    if (!user || !pointsToAdd) return;

    const points = parseInt(pointsToAdd);
    if (isNaN(points) || points <= 0) {
      setMessage({ type: 'error', text: '請輸入有效的願望幣（大於0的整數）' });
      return;
    }

    // 顯示確認視窗
    setShowConfirmModal(true);
  };

  const confirmAddPoints = async () => {
    if (!user || !pointsToAdd) return;

    const points = parseInt(pointsToAdd);
    setLoading(true);
    setMessage(null);
    setShowConfirmModal(false);

    try {
      const response = await UserService.addUserPoints(user.id, points);
      if (response.success) {
        setMessage({ type: 'success', text: response.message });
        setPointsToAdd('');
        
        // 刷新用戶願望幣資料
        onUserUpdated();
        
        // 延遲清除成功訊息
        setTimeout(() => {
          setMessage(null);
        }, 3000);
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : '增加願望幣失敗' 
      });
    } finally {
      setLoading(false);
    }
  };

  const cancelAddPoints = () => {
    setShowConfirmModal(false);
  };

  const handleClose = () => {
    setPointsToAdd('');
    setMessage(null);
    setShowConfirmModal(false);
    onClose();
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

  const getRoleColor = (role: string) => {
    return role === 'admin' ? 'danger' : 'primary';
  };

  const getRoleText = (role: string) => {
    return role === 'admin' ? '管理員' : '玩家';
  };

  if (!user) return null;

  return (
    <>
      {/* Modal Backdrop */}
      {open && (
        <div 
          className="modal fade show" 
          style={{ display: 'block' }}
          aria-labelledby="userDetailModalLabel" 
          aria-hidden="true"
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="userDetailModalLabel">
                  <i className="bi bi-person me-2"></i>
                  用戶詳細資料
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={handleClose}
                  aria-label="Close"
                ></button>
              </div>
              
              <div className="modal-body">
                <div className="row g-3">
                  {/* 基本資料 */}
                  <div className="col-12">
                    <div className="card">
                      <div className="card-header">
                        <h6 className="mb-0">基本資料</h6>
                      </div>
                      <div className="card-body">
                        <div className="row g-2">
                          <div className="col-12 col-sm-6">
                            <div className="d-flex align-items-center mb-1">
                              <i className="bi bi-person text-muted me-2"></i>
                              <small className="text-muted">姓名</small>
                            </div>
                            <div className="fw-medium">{user.name}</div>
                          </div>
                          
                          <div className="col-12 col-sm-6">
                            <div className="d-flex align-items-center mb-1">
                              <i className="bi bi-shield-check text-muted me-2"></i>
                              <small className="text-muted">角色</small>
                            </div>
                            <span className={`badge bg-${getRoleColor(user.role)}`}>
                              {getRoleText(user.role)}
                            </span>
                          </div>
                          
                          <div className="col-12 col-sm-6">
                            <div className="d-flex align-items-center mb-1">
                              <i className="bi bi-envelope text-muted me-2"></i>
                              <small className="text-muted">電子郵件</small>
                            </div>
                            <div>{user.email}</div>
                          </div>
                          
                          <div className="col-12 col-sm-6">
                            <div className="d-flex align-items-center mb-1">
                              <i className="bi bi-telephone text-muted me-2"></i>
                              <small className="text-muted">電話</small>
                            </div>
                            <div>{user.phone}</div>
                          </div>
                          
                          <div className="col-12">
                            <div className="d-flex align-items-center mb-1">
                              <i className="bi bi-geo-alt text-muted me-2"></i>
                              <small className="text-muted">地址</small>
                            </div>
                            <div>{user.address}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 願望幣資料 */}
                  <div className="col-12">
                    <div className="card">
                      <div className="card-header">
                        <h6 className="mb-0">願望幣資料</h6>
                      </div>
                      <div className="card-body">
                        <div className="d-flex align-items-center mb-2">
                          <i className="bi bi-wallet2 text-muted me-2"></i>
                          <small className="text-muted">目前願望幣</small>
                        </div>
                        <h4 className="text-primary fw-bold mb-3">
                          {user.point.toLocaleString()} 點
                        </h4>

                        <hr />

                        <h6 className="mb-3">增加願望幣</h6>
                        <div className="d-flex gap-2 align-items-start">
                          <div className="flex-grow-1">
                            <input
                              type="number"
                              className="form-control"
                              placeholder="請輸入要增加的願望幣"
                              value={pointsToAdd}
                              onChange={(e) => setPointsToAdd(e.target.value)}
                              disabled={loading}
                              min="1"
                            />
                            <div className="form-text">請輸入要增加的願望幣</div>
                          </div>
                          <button
                            className="btn btn-primary"
                            onClick={handleAddPoints}
                            disabled={loading || !pointsToAdd}
                          >
                            {loading ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                處理中...
                              </>
                            ) : (
                              <>
                                <i className="bi bi-wallet2 me-2"></i>
                                增加願望幣
                              </>
                            )}
                          </button>
                        </div>

                        {message && (
                          <div className={`alert alert-${message.type === 'success' ? 'success' : 'danger'} mt-3`} role="alert">
                            {message.text}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 時間資料 */}
                  <div className="col-12">
                    <div className="card">
                      <div className="card-header">
                        <h6 className="mb-0">時間資料</h6>
                      </div>
                      <div className="card-body">
                        <div className="row g-2">
                          <div className="col-12 col-sm-6">
                            <div className="d-flex align-items-center mb-1">
                              <i className="bi bi-calendar text-muted me-2"></i>
                              <small className="text-muted">建立時間</small>
                            </div>
                            <div>{formatDate(user.createdAt)}</div>
                          </div>
                          
                          <div className="col-12 col-sm-6">
                            <div className="d-flex align-items-center mb-1">
                              <i className="bi bi-calendar text-muted me-2"></i>
                              <small className="text-muted">更新時間</small>
                            </div>
                            <div>{formatDate(user.updatedAt)}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleClose}>
                  關閉
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal Backdrop */}
      {open && <div className="modal-backdrop fade show"></div>}

      {/* 確認增加願望幣的模態框 */}
      {showConfirmModal && (
        <div 
          className="modal fade show" 
          style={{ display: 'block', zIndex: 1060 }}
          aria-labelledby="confirmModalLabel" 
          aria-hidden="true"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="confirmModalLabel">
                  <i className="bi bi-exclamation-triangle-fill text-warning me-2"></i>
                  確認增加願望幣
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={cancelAddPoints}
                  aria-label="Close"
                ></button>
              </div>
              
              <div className="modal-body">
                <div className="text-center">
                  <div className="mb-3">
                    <i className="bi bi-wallet2 text-primary" style={{ fontSize: '3rem' }}></i>
                  </div>
                  <h6 className="mb-3">您確定要為以下用戶增加願望幣嗎？</h6>
                  
                  <div className="bg-light p-3 rounded mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="fw-medium">用戶姓名：</span>
                      <span>{user?.name}</span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="fw-medium">目前願望幣：</span>
                      <span className="text-primary fw-bold">{user?.point.toLocaleString()} 點</span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="fw-medium">增加願望幣：</span>
                      <span className="text-success fw-bold">+{parseInt(pointsToAdd || '0').toLocaleString()} 點</span>
                    </div>
                    <hr className="my-2" />
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="fw-medium">增加後願望幣：</span>
                      <span className="text-primary fw-bold">
                        {((user?.point || 0) + parseInt(pointsToAdd || '0')).toLocaleString()} 點
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-muted small mb-0">
                    <i className="bi bi-info-circle me-1"></i>
                    此操作將會立即生效，請確認資訊無誤後再進行確認。
                  </p>
                </div>
              </div>
              
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={cancelAddPoints}
                  disabled={loading}
                >
                  <i className="bi bi-x me-2"></i>
                  取消
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={confirmAddPoints}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      處理中...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check me-2"></i>
                      確認增加
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 確認視窗的背景遮罩 */}
      {showConfirmModal && <div className="modal-backdrop fade show" style={{ zIndex: 1055 }}></div>}
    </>
  );
};

export default UserDetailDialog;
