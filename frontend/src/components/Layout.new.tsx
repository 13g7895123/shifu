import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
        <div className="container-fluid">
          <a className="navbar-brand fw-bold" href="#" onClick={() => navigate('/')}>
            願望靶場一番賞
          </a>
          
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
                  onClick={() => navigate('/')}
                >
                  首頁
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className="nav-link btn btn-link text-white" 
                  onClick={() => navigate('/game')}
                >
                  遊戲
                </button>
              </li>
              {user ? (
                <>
                  {user.role === 'admin' && (
                    <li className="nav-item">
                      <button 
                        className="nav-link btn btn-link text-white" 
                        onClick={() => navigate('/admin')}
                      >
                        管理員
                      </button>
                    </li>
                  )}
                  <li className="nav-item">
                    <button 
                      className="nav-link btn btn-link text-white" 
                      onClick={handleLogout}
                    >
                      登出 ({user.name})
                    </button>
                  </li>
                </>
              ) : (
                <li className="nav-item">
                  <button 
                    className="nav-link btn btn-link text-white" 
                    onClick={() => navigate('/login')}
                  >
                    登入
                  </button>
                </li>
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
