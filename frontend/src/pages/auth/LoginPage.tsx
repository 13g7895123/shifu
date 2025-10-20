import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const [credential, setCredential] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const success = await login(credential, password);
      if (success) {
        navigate('/');
      } else {
        setError('登入失敗，請檢查您的帳號密碼');
      }
    } catch (error) {
      setError('登入過程發生錯誤，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-4">
          <div className="mt-5">
            <div className="card shadow">
              <div className="card-body p-4">
                <h1 className="h4 text-center mb-3">登入</h1>
                
                {error && (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label htmlFor="credential" className="form-label">電子郵件或用戶名</label>
                    <input
                      type="text"
                      className="form-control"
                      id="credential"
                      value={credential}
                      onChange={(e) => setCredential(e.target.value)}
                      required
                      autoComplete="username"
                      autoFocus
                    />
                    <div className="form-text">請輸入您的電子郵件地址或用戶名</div>
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="password" className="form-label">密碼</label>
                    <input
                      type="password"
                      className="form-control"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-100 mb-3"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        登入中...
                      </>
                    ) : (
                      '登入'
                    )}
                  </button>

                  <div className="text-center">
                    <span className="text-muted">還沒有帳號？</span>{' '}
                    <Link to="/register" className="text-decoration-none">
                      立即註冊
                    </Link>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
