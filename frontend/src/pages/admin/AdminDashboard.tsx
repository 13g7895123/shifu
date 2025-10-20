import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import './AdminDashboard.css';

const AdminDashboard: React.FC = () => {
  const adminFeatures = [
    {
      title: '用戶管理',
      description: '管理系統用戶、查看用戶資料、調整用戶權限',
      icon: '👥',
      link: '/admin/users',
      color: 'primary'
    },
    {
      title: '遊戲管理',
      description: '管理遊戲內容、設定遊戲參數',
      icon: '🎮',
      link: '/admin/games',
      color: 'success'
    },
    {
      title: '出貨管理',
      description: '管理獎勵出貨狀態、查看用戶獲獎紀錄',
      icon: '📦',
      link: '/admin/shipping',
      color: 'warning'
    },
    {
      title: '系統設定',
      description: '管理系統設定、調整系統參數',
      icon: '⚙️',
      link: '/admin/settings',
      color: 'danger'
    }
  ];


  return (
    <div className="container-lg">
      <div className="my-4">
        {/* 頁面標題 */}
        <div className="d-flex align-items-center mb-4">
          <span className="display-4 me-3">📊</span>
          <h1 className="text-primary mb-0">管理員控制台</h1>
        </div>

        {/* 主要功能卡片 */}
        <div className="row mb-4">
          {adminFeatures.map((feature, index) => (
            <div className="col-12 col-md-6 mb-3" key={index}>
              <div className="card h-100 shadow-sm border-0 hover-card">
                <div className="card-body">
                  <div className="d-flex align-items-center mb-3">
                    <span className="display-6 me-3">{feature.icon}</span>
                    <h5 className="card-title mb-0 fw-bold">{feature.title}</h5>
                  </div>
                  <p className="card-text text-muted">{feature.description}</p>
                </div>
                <div className="card-footer bg-transparent border-0 pt-0">
                  <RouterLink
                    to={feature.link}
                    className={`btn btn-${feature.color} w-100`}
                  >
                    進入管理
                  </RouterLink>
                </div>
              </div>
            </div>
          ))}
        </div>



      </div>
    </div>
  );
};

export default AdminDashboard;
