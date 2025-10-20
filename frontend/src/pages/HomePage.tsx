import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ChatRoom from '../components/ChatRoom';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="container-lg">
      {/* <iframe width="560" height="315" src="https://www.youtube.com/embed/4BZYPei8uPw?si=QzWpnf3t258uRA_1" title="YouTube video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" ></iframe> */}

      <div className="my-5">
        <h1 className="text-center mb-3">歡迎來到願望靶場一番賞 </h1>
       
        <div className="row justify-content-center g-4">
          <div className="col-12 col-md-6 col-lg-4">
            <div className="card h-100 shadow-sm">
              <div className="card-body d-flex flex-column">
                <h5 className="card-title">遊戲中心</h5>
                <p className="card-text text-muted mb-3">開始玩遊戲</p>
                
                <button 
                  className="btn btn-primary mt-auto"
                  onClick={() => navigate('/game')}
                >
                  前往遊戲
                </button>
              </div>
            </div>
          </div>

          {user && (
            <div className="col-12 col-md-6 col-lg-4">
              <div className="card h-100 shadow-sm">
                <div className="card-body d-flex flex-column">
                  <h5 className="card-title">個人資料</h5>
                  <p className="card-text text-muted mb-3">管理您的帳戶</p>
                  <p className="card-text flex-grow-1">查看和編輯您的個人資料設定。</p>
                  <button 
                    className="btn btn-primary mt-auto"
                    onClick={() => navigate(`/edit-user/${user.id}`)}
                  >
                    編輯資料
                  </button>
                </div>
              </div>
            </div>
          )}

          {user?.role === 'admin' && (
            <div className="col-12 col-md-6 col-lg-4">
              <div className="card h-100 shadow-sm">
                <div className="card-body d-flex flex-column">
                  <h5 className="card-title">管理員面板</h5>
                  <p className="card-text text-muted mb-3">系統管理</p>
                  <p className="card-text flex-grow-1">管理使用者、遊戲和系統設定。</p>
                  <button 
                    className="btn btn-primary mt-auto"
                    onClick={() => navigate('/admin')}
                  >
                    管理面板
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* 全域聊天室 */}
      <ChatRoom className="chat-room--homepage" />
    </div>
  );
};

export default HomePage;
