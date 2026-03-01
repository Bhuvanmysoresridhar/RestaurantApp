import { createContext, useContext, useState } from 'react';

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sas_admin')) || null; } catch { return null; }
  });
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem('sas_admin_token') || null);

  const adminLogin = (adminData, token) => {
    setAdmin(adminData);
    setAdminToken(token);
    localStorage.setItem('sas_admin', JSON.stringify(adminData));
    localStorage.setItem('sas_admin_token', token);
  };

  const adminLogout = () => {
    setAdmin(null);
    setAdminToken(null);
    localStorage.removeItem('sas_admin');
    localStorage.removeItem('sas_admin_token');
  };

  return (
    <AdminAuthContext.Provider value={{ admin, adminToken, adminLogin, adminLogout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}
