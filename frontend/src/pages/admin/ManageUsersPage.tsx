import React, { useState, useEffect } from 'react';
import { User } from '../../types/user';
import { UserService } from '../../services/userService';
import UserDetailDialog from '../../components/UserDetailDialog';

const ManageUsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const fetchedUsers = await UserService.getAllUsers();
      setUsers(fetchedUsers);
    } catch (err) {
      setError(err instanceof Error ? err.message : '載入用戶列表失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setDetailDialogOpen(true);
  };

  const handleCloseDetailDialog = () => {
    setDetailDialogOpen(false);
    setSelectedUser(null);
  };

  const handleUserUpdated = async () => {
    // 重新載入用戶列表以獲取最新數據
    await loadUsers();
    
    // 如果有選中的用戶，也要更新選中用戶的資料
    if (selectedUser) {
      try {
        const updatedUser = await UserService.getUserById(selectedUser.id);
        setSelectedUser(updatedUser);
      } catch (error) {
        console.error('更新選中用戶資料失敗:', error);
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-TW');
  };

  const getRoleColor = (role: string) => {
    return role === 'admin' ? 'danger' : 'primary';
  };

  const getRoleText = (role: string) => {
    return role === 'admin' ? '管理員' : '玩家';
  };

  // 搜尋功能
  const filteredUsers = users.filter(user => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      user.name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      user.phone.toLowerCase().includes(searchLower) ||
      getRoleText(user.role).toLowerCase().includes(searchLower)
    );
  });

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
  };

  // 計算統計數據（基於篩選後的結果）
  const totalUsers = filteredUsers.length;
  const adminUsers = filteredUsers.filter(user => user.role === 'admin').length;
  const playerUsers = filteredUsers.filter(user => user.role === 'player').length;
  const totalPoints = filteredUsers.reduce((sum, user) => sum + user.point, 0);

  if (loading) {
    return (
      <div className="container-fluid">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">載入中...</span>
          </div>
          <h6 className="ms-3">載入用戶資料中...</h6>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="py-4">
        {/* 頁面標題 */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="h3">用戶管理</h1>
          <button
            className="btn btn-outline-primary"
            onClick={loadUsers}
            disabled={loading}
          >
            <i className="bi bi-arrow-clockwise me-2"></i>
            重新整理
          </button>
        </div>

        {/* 統計卡片 */}
        <div className="row mb-4">
          <div className="col-md-3 mb-3">
            <div className="card h-100">
              <div className="card-body d-flex align-items-center">
                <div className="text-primary me-3">
                  <i className="bi bi-people fs-1"></i>
                </div>
                <div>
                  <h4 className="card-title fw-bold mb-1">{totalUsers}</h4>
                  <p className="card-text text-muted mb-0">
                    {searchTerm ? '符合搜尋條件' : '總用戶數'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-3 mb-3">
            <div className="card h-100">
              <div className="card-body d-flex align-items-center">
                <div className="text-danger me-3">
                  <i className="bi bi-shield-check fs-1"></i>
                </div>
                <div>
                  <h4 className="card-title fw-bold mb-1">{adminUsers}</h4>
                  <p className="card-text text-muted mb-0">管理員</p>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-3 mb-3">
            <div className="card h-100">
              <div className="card-body d-flex align-items-center">
                <div className="text-primary me-3">
                  <i className="bi bi-person fs-1"></i>
                </div>
                <div>
                  <h4 className="card-title fw-bold mb-1">{playerUsers}</h4>
                  <p className="card-text text-muted mb-0">玩家</p>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-3 mb-3">
            <div className="card h-100">
              <div className="card-body d-flex align-items-center">
                <div className="text-success me-3">
                  <i className="bi bi-wallet2 fs-1"></i>
                </div>
                <div>
                  <h4 className="card-title fw-bold mb-1">{totalPoints.toLocaleString()}</h4>
                  <p className="card-text text-muted mb-0">總願望幣</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 搜尋欄位 */}
        <div className="mb-4">
          <div className="input-group">
            <span className="input-group-text">
              <i className="bi bi-search"></i>
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="搜尋用戶（姓名、電子郵件、電話、角色）"
              value={searchTerm}
              onChange={handleSearchChange}
            />
            {searchTerm && (
              <button
                className="btn btn-outline-secondary"
                type="button"
                onClick={handleClearSearch}
              >
                <i className="bi bi-x"></i>
              </button>
            )}
          </div>
        </div>

        {/* 錯誤訊息 */}
        {error && (
          <div className="alert alert-danger mb-4" role="alert">
            {error}
          </div>
        )}

        {/* 用戶列表 */}
        <div className="card">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-dark">
                  <tr>
                    <th>姓名</th>
                    <th>電子郵件</th>
                    <th>電話</th>
                    <th>角色</th>
                    <th className="text-end">願望幣</th>
                    <th>建立時間</th>
                    <th className="text-center">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-5 text-muted">
                        {searchTerm ? `找不到符合「${searchTerm}」的用戶` : '沒有找到用戶資料'}
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id}>
                        <td>
                          <div className="d-flex align-items-center">
                            <i className={`bi ${user.role === 'admin' ? 'bi-shield-check text-danger' : 'bi-person text-primary'} me-2`}></i>
                            <strong>{user.name}</strong>
                          </div>
                        </td>
                        <td>{user.email}</td>
                        <td>{user.phone}</td>
                        <td>
                          <span className={`badge bg-${getRoleColor(user.role)}`}>
                            {getRoleText(user.role)}
                          </span>
                        </td>
                        <td className="text-end">
                          <strong>{user.point.toLocaleString()} 點</strong>
                        </td>
                        <td>{formatDate(user.createdAt)}</td>
                        <td className="text-center">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleViewUser(user)}
                            title="查看詳細資料"
                          >
                            <i className="bi bi-eye"></i>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 用戶詳細資料對話框 */}
        <UserDetailDialog
          open={detailDialogOpen}
          user={selectedUser}
          onClose={handleCloseDetailDialog}
          onUserUpdated={handleUserUpdated}
        />
      </div>
    </div>
  );
};

export default ManageUsersPage;
