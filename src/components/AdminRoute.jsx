import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';

export default function AdminRoute({ children, ownerOnly = false }) {
  const { admin } = useAdminAuth();
  if (!admin) return <Navigate to="/admin/login" replace />;
  if (ownerOnly && admin.role !== 'OWNER') return <Navigate to="/admin" replace />;
  return children;
}
