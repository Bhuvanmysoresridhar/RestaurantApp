import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AdminAuthProvider } from './context/AdminAuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import IntroVideo from './components/IntroVideo';
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import MenuDashboard from './pages/MenuDashboard';
import OrdersPage from './pages/OrdersPage';
import ReviewsPage from './pages/ReviewsPage';
import AdminAuthPage from './pages/admin/AdminAuthPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminOrderDetail from './pages/admin/AdminOrderDetail';
import AdminMenu from './pages/admin/AdminMenu';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminStaff from './pages/admin/AdminStaff';

export default function App() {
  const [introSeen, setIntroSeen] = useState(
    () => sessionStorage.getItem('sas_intro_seen') === 'true'
  );

  const isAdminPath = window.location.pathname.startsWith('/admin');

  if (!introSeen && !isAdminPath) {
    return <IntroVideo onFinish={() => setIntroSeen(true)} />;
  }

  return (
    <BrowserRouter>
      <AdminAuthProvider>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/menu" element={<ProtectedRoute><MenuDashboard /></ProtectedRoute>} />
            <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
            <Route path="/reviews" element={<ProtectedRoute><ReviewsPage /></ProtectedRoute>} />

            <Route path="/admin/login" element={<AdminAuthPage defaultMode="login" />} />
            <Route path="/admin/signup" element={<AdminAuthPage defaultMode="signup" />} />
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/orders/:id" element={<AdminRoute><AdminOrderDetail /></AdminRoute>} />
            <Route path="/admin/menu" element={<AdminRoute><AdminMenu /></AdminRoute>} />
            <Route path="/admin/analytics" element={<AdminRoute ownerOnly><AdminAnalytics /></AdminRoute>} />
            <Route path="/admin/staff" element={<AdminRoute ownerOnly><AdminStaff /></AdminRoute>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </AdminAuthProvider>
    </BrowserRouter>
  );
}
