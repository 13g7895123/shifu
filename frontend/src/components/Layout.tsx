import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // 關閉導航選單的函數
  const collapseNavbar = () => {
    const navbarToggle = document.querySelector('.navbar-toggler') as HTMLButtonElement;
    const navbarCollapse = document.querySelector('#navbarNav') as HTMLElement;
    
    if (navbarToggle && navbarCollapse) {
      if (navbarCollapse.classList.contains('show')) {
        navbarToggle.click();
      }
    }
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    collapseNavbar();
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    collapseNavbar();
  };

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
        <div className="container-fluid">
          <button className="navbar-brand fw-bold btn btn-link p-0 text-decoration-none text-white" onClick={() => handleNavigate('/')}>
            願望靶場一番賞
          </button>
          
          <button 
            className="navbar-toggler" 
            type="button" 
            data-bs-toggle="collapse" 
            data-bs-target="#navbarNav" 
            aria-controls="navbarNav" 
            aria-expanded="false" 
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto">
              <li className="nav-item">
                <button 
                  className="nav-link btn btn-link text-white" 
                  onClick={() => handleNavigate('/')}
                >
                  首頁
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className="nav-link btn btn-link text-white" 
                  onClick={() => handleNavigate('/game')}
                >
                  遊戲
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className="nav-link btn btn-link text-white" 
                  onClick={() => handleNavigate('/game/guide')}
                >
                  說明
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className="nav-link btn btn-link text-white" 
                  onClick={() => handleNavigate('/customer-service')}
                >
                  客服
                </button>
              </li>
              {user && (
                <li className="nav-item">
                  <button 
                    className="nav-link btn btn-link text-white" 
                    onClick={() => handleNavigate('/top-up')}
                  >
                    儲值
                  </button>
                </li>
              )}
              {user ? (
                <>
                  <li className="nav-item">
                    <button 
                      className="nav-link btn btn-link text-white" 
                      onClick={() => handleNavigate('/my-prizes')}
                    >
                      我的背包
                    </button>
                  </li>
                  {user.role === 'admin' && (
                    <li className="nav-item">
                      <button 
                        className="nav-link btn btn-link text-white" 
                        onClick={() => handleNavigate('/admin')}
                      >
                        管理員
                      </button>
                    </li>
                  )}
                  <li className="nav-item">
                    <span className="nav-link text-white d-flex align-items-center">
                      <i className="bi bi-coin me-1"></i>
                      {user.point}
                    </span>
                  </li>
                  <li className="nav-item dropdown">
                    <button 
                      className="nav-link dropdown-toggle btn btn-link text-white" 
                      id="navbarDropdown" 
                      data-bs-toggle="dropdown" 
                      aria-expanded="false"
                    >
                      <i className="bi bi-person-circle me-1"></i>
                      {user.name}
                    </button>
                    <ul className="dropdown-menu" aria-labelledby="navbarDropdown">
                      <li>
                        <button 
                          className="dropdown-item" 
                          onClick={() => handleNavigate(`/edit-user/${user.id}`)}
                        >
                          <i className="bi bi-person-gear me-2"></i>
                          編輯個人資料
                        </button>
                      </li>
                      <li><hr className="dropdown-divider" /></li>
                      <li>
                        <button 
                          className="dropdown-item text-danger" 
                          onClick={handleLogout}
                        >
                          <i className="bi bi-box-arrow-right me-2"></i>
                          登出
                        </button>
                      </li>
                    </ul>
                  </li>
                </>
              ) : (
                <>
                  <li className="nav-item">
                    <button 
                      className="nav-link btn btn-link text-white" 
                      onClick={() => handleNavigate('/login')}
                    >
                      登入
                    </button>
                  </li>
                  <li className="nav-item">
                    <button 
                      className="nav-link btn btn-link text-white" 
                      onClick={() => handleNavigate('/register')}
                    >
                      註冊
                    </button>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </nav>
      
      <div className="p-3">
        {children}
      </div>
    </>
  );
};

export default Layout;
