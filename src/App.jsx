import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import IntroVideo from './components/IntroVideo';
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import MenuDashboard from './pages/MenuDashboard';
import OrdersPage from './pages/OrdersPage';
import ReviewsPage from './pages/ReviewsPage';

export default function App() {
  const [introSeen, setIntroSeen] = useState(
    () => sessionStorage.getItem('sas_intro_seen') === 'true'
  );

  if (!introSeen) {
    return <IntroVideo onFinish={() => setIntroSeen(true)} />;
  }

  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/menu" element={<ProtectedRoute><MenuDashboard /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
          <Route path="/reviews" element={<ProtectedRoute><ReviewsPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
