import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import GameIndexPage from './pages/game/GameIndexPage';
import GameGuidePage from './pages/game/GameGuidePage';
import MyTicketsPage from './pages/MyTicketsPage';
import MyPrizesPage from './pages/MyPrizesPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageUsersPage from './pages/admin/ManageUsersPage';
import ManageGamesPage from './pages/admin/ManageGamesPage';
import ShippingManagePage from './pages/admin/ShippingManagePage';
import SystemSettingsPage from './pages/admin/SystemSettingsPage';
import CreateUserPage from './pages/CreateUserPage';
import EditUserPage from './pages/EditUserPage';
import CustomerServicePage from './pages/CustomerServicePage';
import TopUpPage from './pages/TopUpPage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  // Hot reload test - 第二次測試！應該會正常工作了！
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/game" element={<GameIndexPage />} />
            <Route path="/game/guide" element={<GameGuidePage />} />
            <Route 
              path="/my-tickets" 
              element={
                <ProtectedRoute>
                  <MyTicketsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/my-prizes" 
              element={
                <ProtectedRoute>
                  <MyPrizesPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/create-user" 
              element={
                <ProtectedRoute>
                  <CreateUserPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/edit-user/:id" 
              element={
                <ProtectedRoute>
                  <EditUserPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/users" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <ManageUsersPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/games" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <ManageGamesPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/shipping" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <ShippingManagePage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/settings" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <SystemSettingsPage />
                </ProtectedRoute>
              } 
            />
            <Route path="/customer-service" element={<CustomerServicePage />} />
            <Route 
              path="/top-up" 
              element={
                <ProtectedRoute>
                  <TopUpPage />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}

export default App;
