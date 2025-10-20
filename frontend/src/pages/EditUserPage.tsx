import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserService } from '../services/userService';
import { User, UpdateProfileRequest } from '../types/user';

const EditUserPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser, refreshUser } = useAuth();
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: ''
  });

  useEffect(() => {
    fetchUserData();
  }, [id]);

  const fetchUserData = async () => {
    if (!id) {
      setError('無效的用戶ID');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const userData = await UserService.getUserById(id);
      setUser(userData);
      setFormData({
        name: userData.name,
        phone: userData.phone,
        address: userData.address
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '載入用戶資料失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id || !user) {
      setError('無效的用戶資料');
      return;
    }

    // 檢查權限：只能編輯自己的資料（除非是管理員）
    if (currentUser?.id !== id && currentUser?.role !== 'admin') {
      setError('您沒有權限編輯此用戶的資料');
      return;
    }

    // 驗證表單
    if (!formData.name.trim()) {
      setError('姓名不能為空');
      return;
    }
    if (!formData.phone.trim()) {
      setError('電話不能為空');
      return;
    }
    if (!formData.address.trim()) {
      setError('地址不能為空');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const updateData: UpdateProfileRequest = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim()
      };

      const response = await UserService.updateUserProfile(id, updateData);
      
      if (response.success) {
        setUser(response.user);
        setSuccess('個人資料更新成功！');
        
        // 如果更新的是當前用戶，刷新認證信息
        if (currentUser?.id === id) {
          await refreshUser();
        }
        
        // 3秒後導航回首頁
        setTimeout(() => {
          navigate('/');
        }, 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新個人資料失敗');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="container-lg">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">載入中...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container-lg">
        <div className="my-4">
          <div className="alert alert-danger">
            找不到用戶資料
          </div>
          <button className="btn btn-secondary" onClick={() => navigate('/')}>
            返回首頁
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-lg">
      <div className="my-4">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            <div className="card shadow">
              <div className="card-header bg-primary text-white">
                <h1 className="h4 mb-0">
                  <i className="bi bi-person-gear me-2"></i>
                  編輯個人資料
                </h1>
              </div>
              <div className="card-body">
                {error && (
                  <div className="alert alert-danger" role="alert">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    {error}
                  </div>
                )}

                {success && (
                  <div className="alert alert-success" role="alert">
                    <i className="bi bi-check-circle me-2"></i>
                    {success}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label htmlFor="name" className="form-label">
                      <i className="bi bi-person me-1"></i>
                      姓名 <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      disabled={saving}
                      placeholder="請輸入您的姓名"
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="phone" className="form-label">
                      <i className="bi bi-telephone me-1"></i>
                      電話 <span className="text-danger">*</span>
                    </label>
                    <input
                      type="tel"
                      className="form-control"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      disabled={saving}
                      placeholder="請輸入您的電話號碼"
                    />
                  </div>

                  <div className="mb-4">
                    <label htmlFor="address" className="form-label">
                      <i className="bi bi-geo-alt me-1"></i>
                      地址 <span className="text-danger">*</span>
                    </label>
                    <textarea
                      className="form-control"
                      id="address"
                      name="address"
                      rows={3}
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                      disabled={saving}
                      placeholder="請輸入您的地址"
                    />
                  </div>

                  <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                    <button
                      type="button"
                      className="btn btn-secondary me-md-2"
                      onClick={handleCancel}
                      disabled={saving}
                    >
                      <i className="bi bi-x-circle me-1"></i>
                      取消
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          更新中...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-check2 me-1"></i>
                          更新資料
                        </>
                      )}
                    </button>
                  </div>
                </form>

                <hr className="my-4" />
                
                <div className="text-muted small">
                  <p className="mb-1">
                    <strong>Email:</strong> {user.email}
                  </p>
                  <p className="mb-1">
                    <strong>積分:</strong> {user.point}
                  </p>
                  <p className="mb-1">
                    <strong>角色:</strong> {user.role === 'admin' ? '管理員' : '玩家'}
                  </p>
                  <p className="mb-0">
                    <strong>註冊時間:</strong> {new Date(user.createdAt).toLocaleDateString('zh-TW')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditUserPage;
