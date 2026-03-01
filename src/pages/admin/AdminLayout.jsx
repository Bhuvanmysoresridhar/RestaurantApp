import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';

const gold = '#D4A017';
const dark = '#2A1810';
const F = "'Outfit', sans-serif";

export default function AdminLayout({ children }) {
  const { admin, adminToken, adminLogout } = useAdminAuth();
  const navigate = useNavigate();
  const [kitchenOpen, setKitchenOpen] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetch('/api/admin/kitchen', { headers: { Authorization: `Bearer ${adminToken}` } })
      .then(r => r.json()).then(d => setKitchenOpen(d.is_open)).catch(() => {});
  }, []);

  const toggleKitchen = async () => {
    setToggling(true);
    try {
      const r = await fetch('/api/admin/kitchen', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ is_open: !kitchenOpen }),
      });
      const d = await r.json();
      setKitchenOpen(d.is_open);
    } catch {}
    setToggling(false);
  };

  const navItem = (to, icon, label, ownerRequired = false) => {
    if (ownerRequired && admin?.role !== 'OWNER') return null;
    return (
      <NavLink to={to} style={({ isActive }) => ({
        display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 16px', borderRadius: '10px',
        fontFamily: F, fontSize: '13px', fontWeight: 600, textDecoration: 'none', marginBottom: '4px',
        background: isActive ? `${gold}20` : 'transparent',
        color: isActive ? gold : 'rgba(251,247,240,0.7)',
        transition: 'all 0.15s',
      })} onClick={() => setSidebarOpen(false)}>
        <span style={{ fontSize: '16px' }}>{icon}</span> {label}
      </NavLink>
    );
  };

  const sidebar = (
    <div style={{ width: '220px', background: '#2A1810', display: 'flex', flexDirection: 'column', flexShrink: 0, height: '100vh', position: 'sticky', top: 0, overflowY: 'auto' }}>
      <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid rgba(251,247,240,0.08)' }}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '20px', fontWeight: 700, color: gold }}>Stones & Spices</div>
        <div style={{ fontFamily: F, fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(212,160,23,0.5)', marginTop: '2px' }}>Admin Dashboard</div>
      </div>

      <div style={{ padding: '16px 12px', borderBottom: '1px solid rgba(251,247,240,0.08)' }}>
        <div style={{ fontFamily: F, fontSize: '10px', color: 'rgba(251,247,240,0.4)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>Kitchen Status</div>
        <button onClick={toggleKitchen} disabled={toggling} style={{
          width: '100%', padding: '10px', borderRadius: '10px', border: 'none', cursor: toggling ? 'wait' : 'pointer',
          background: kitchenOpen ? '#16A34A' : '#DC2626',
          color: '#fff', fontFamily: F, fontSize: '13px', fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          transition: 'all 0.2s',
        }}>
          <span>{kitchenOpen ? '🟢' : '🔴'}</span>
          {kitchenOpen ? 'OPEN — Click to Close' : 'CLOSED — Click to Open'}
        </button>
      </div>

      <nav style={{ padding: '12px', flex: 1 }}>
        <div style={{ fontFamily: F, fontSize: '9px', color: 'rgba(251,247,240,0.3)', letterSpacing: '1px', textTransform: 'uppercase', padding: '0 4px', marginBottom: '6px' }}>Management</div>
        {navItem('/admin', '📋', 'Orders')}
        {navItem('/admin/menu', '🍽️', 'Menu Items')}
        {navItem('/admin/analytics', '📊', 'Analytics', true)}
        {navItem('/admin/staff', '👥', 'Staff', true)}
      </nav>

      <div style={{ padding: '12px', borderTop: '1px solid rgba(251,247,240,0.08)' }}>
        <div style={{ fontFamily: F, fontSize: '12px', color: 'rgba(251,247,240,0.5)', marginBottom: '2px' }}>{admin?.name}</div>
        <div style={{ fontFamily: F, fontSize: '10px', color: gold, fontWeight: 600, marginBottom: '10px' }}>{admin?.role}</div>
        <button onClick={() => { adminLogout(); navigate('/admin/login'); }} style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid rgba(251,247,240,0.15)', background: 'transparent', color: 'rgba(251,247,240,0.6)', fontFamily: F, fontSize: '12px', cursor: 'pointer' }}>
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: F }}>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      <div style={{ display: 'none' }} className="sidebar-desktop">{sidebar}</div>
      {sidebar}
      <div style={{ flex: 1, background: '#F4F1ED', overflow: 'auto', minWidth: 0 }}>
        {children}
      </div>
    </div>
  );
}
