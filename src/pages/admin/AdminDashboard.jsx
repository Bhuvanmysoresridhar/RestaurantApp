import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import AdminLayout from './AdminLayout';

const gold = '#D4A017';
const dark = '#2A1810';
const F = "'Outfit', sans-serif";

const STATUS_CONFIG = {
  pending:             { label: 'Pending',           color: '#F59E0B', bg: '#FEF3C7' },
  confirmed:           { label: 'Accepted',           color: '#3B82F6', bg: '#DBEAFE' },
  accepted:            { label: 'Accepted',           color: '#3B82F6', bg: '#DBEAFE' },
  preparing:           { label: 'Preparing',          color: '#8B5CF6', bg: '#EDE9FE' },
  ready_for_delivery:  { label: 'Ready for Delivery', color: '#10B981', bg: '#D1FAE5' },
  out_for_delivery:    { label: 'Out for Delivery',   color: '#06B6D4', bg: '#CFFAFE' },
  delivered:           { label: 'Delivered',          color: '#6B7280', bg: '#F3F4F6' },
  completed:           { label: 'Completed',          color: '#16A34A', bg: '#DCFCE7' },
  rejected:            { label: 'Rejected',           color: '#EF4444', bg: '#FEE2E2' },
  cancelled:           { label: 'Cancelled',          color: '#EF4444', bg: '#FEE2E2' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: '#6B7280', bg: '#F3F4F6' };
  return (
    <span style={{ fontFamily: F, fontSize: '11px', fontWeight: 700, color: cfg.color, background: cfg.bg, padding: '3px 10px', borderRadius: '20px', letterSpacing: '0.3px' }}>
      {cfg.label}
    </span>
  );
}

const STATUSES = ['all','pending','accepted','preparing','ready_for_delivery','out_for_delivery','delivered','completed','rejected','cancelled'];

export default function AdminDashboard() {
  const { adminToken } = useAdminAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const fetchOrders = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('status', filter);
      if (search) params.set('search', search);
      const r = await fetch(`/api/admin/orders?${params}`, { headers: { Authorization: `Bearer ${adminToken}` } });
      const d = await r.json();
      if (Array.isArray(d)) setOrders(d);
    } catch {}
    setLoading(false);
  }, [filter, search, adminToken]);

  useEffect(() => { setLoading(true); fetchOrders(); }, [fetchOrders]);
  useEffect(() => { const t = setInterval(fetchOrders, 30000); return () => clearInterval(t); }, [fetchOrders]);

  const fmt = (ts) => new Date(ts).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

  return (
    <AdminLayout>
      <div style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontFamily: F, fontSize: '22px', fontWeight: 700, color: dark, margin: 0 }}>Orders</h1>
            <div style={{ fontFamily: F, fontSize: '12px', color: '#8B7355', marginTop: '2px' }}>{orders.length} order{orders.length !== 1 ? 's' : ''} shown · auto-refreshes every 30s</div>
          </div>
          <button onClick={fetchOrders} style={{ fontFamily: F, fontSize: '12px', fontWeight: 600, padding: '8px 16px', borderRadius: '8px', border: `1px solid ${gold}`, background: 'transparent', color: gold, cursor: 'pointer' }}>
            ↻ Refresh
          </button>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email, order ID, phone..." style={{ flex: 1, minWidth: '200px', padding: '9px 14px', borderRadius: '10px', border: '1.5px solid rgba(139,90,43,0.18)', fontFamily: F, fontSize: '13px', outline: 'none', background: '#fff' }} />
          <select value={filter} onChange={e => setFilter(e.target.value)} style={{ padding: '9px 14px', borderRadius: '10px', border: '1.5px solid rgba(139,90,43,0.18)', fontFamily: F, fontSize: '13px', background: '#fff', outline: 'none', cursor: 'pointer' }}>
            {STATUSES.map(s => <option key={s} value={s}>{s === 'all' ? 'All Statuses' : STATUS_CONFIG[s]?.label || s}</option>)}
          </select>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#8B7355', fontFamily: F }}>Loading orders...</div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#8B7355', fontFamily: F }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>📭</div>
            <div style={{ fontWeight: 600 }}>No orders found</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {orders.map(order => (
              <div key={order.id} onClick={() => navigate(`/admin/orders/${order.id}`)} style={{ background: '#fff', borderRadius: '14px', padding: '16px 20px', boxShadow: '0 1px 4px rgba(42,24,16,0.06)', border: '1px solid rgba(139,90,43,0.08)', cursor: 'pointer', transition: 'box-shadow 0.15s', display: 'grid', gridTemplateColumns: 'auto 1fr auto auto', alignItems: 'center', gap: '16px' }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(42,24,16,0.12)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px rgba(42,24,16,0.06)'}>
                <div style={{ fontFamily: F, fontSize: '14px', fontWeight: 700, color: gold, minWidth: '50px' }}>#{String(order.id).padStart(4,'0')}</div>
                <div>
                  <div style={{ fontFamily: F, fontSize: '14px', fontWeight: 600, color: dark }}>{order.user_name}</div>
                  <div style={{ fontFamily: F, fontSize: '12px', color: '#8B7355', marginTop: '2px' }}>{order.user_email} · {order.item_count} item{order.item_count !== 1 ? 's' : ''} · {order.order_phone || '—'}</div>
                  <div style={{ fontFamily: F, fontSize: '11px', color: '#B89B7A', marginTop: '2px' }}>{fmt(order.created_at)}</div>
                </div>
                <div style={{ fontFamily: F, fontSize: '15px', fontWeight: 700, color: dark, textAlign: 'right' }}>₹{parseFloat(order.total_amount).toFixed(0)}</div>
                <StatusBadge status={order.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
