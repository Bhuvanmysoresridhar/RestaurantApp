import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import AdminLayout from './AdminLayout';

const gold = '#D4A017';
const dark = '#2A1810';
const F = "'Outfit', sans-serif";

const STATUS_CONFIG = {
  pending:            { label: 'Pending',           color: '#F59E0B', bg: '#FEF3C7' },
  confirmed:          { label: 'Accepted',           color: '#3B82F6', bg: '#DBEAFE' },
  accepted:           { label: 'Accepted',           color: '#3B82F6', bg: '#DBEAFE' },
  preparing:          { label: 'Preparing',          color: '#8B5CF6', bg: '#EDE9FE' },
  ready_for_delivery: { label: 'Ready for Delivery', color: '#10B981', bg: '#D1FAE5' },
  out_for_delivery:   { label: 'Out for Delivery',   color: '#06B6D4', bg: '#CFFAFE' },
  delivered:          { label: 'Delivered',          color: '#6B7280', bg: '#F3F4F6' },
  completed:          { label: 'Completed',          color: '#16A34A', bg: '#DCFCE7' },
  rejected:           { label: 'Rejected',           color: '#EF4444', bg: '#FEE2E2' },
  cancelled:          { label: 'Cancelled',          color: '#EF4444', bg: '#FEE2E2' },
};

const ITEM_STATUS_CONFIG = {
  pending:   { label: 'Pending',   color: '#F59E0B', bg: '#FEF3C7' },
  preparing: { label: 'Preparing', color: '#8B5CF6', bg: '#EDE9FE' },
  done:      { label: 'Done ✓',    color: '#16A34A', bg: '#DCFCE7' },
};

const ORDER_FLOW = [
  { status: 'accepted',           label: 'Accept Order',       color: '#3B82F6' },
  { status: 'preparing',          label: 'Start Preparing',    color: '#8B5CF6' },
  { status: 'ready_for_delivery', label: 'Mark Ready',         color: '#10B981' },
  { status: 'out_for_delivery',   label: 'Out for Delivery',   color: '#06B6D4' },
  { status: 'delivered',          label: 'Mark Delivered',     color: '#6B7280' },
  { status: 'completed',          label: 'Complete Order',     color: '#16A34A' },
];

const REJECT_STATUSES = ['rejected', 'cancelled'];

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: '#6B7280', bg: '#F3F4F6' };
  return <span style={{ fontFamily: F, fontSize: '12px', fontWeight: 700, color: cfg.color, background: cfg.bg, padding: '4px 12px', borderRadius: '20px' }}>{cfg.label}</span>;
}

export default function AdminOrderDetail() {
  const { id } = useParams();
  const { adminToken, admin } = useAdminAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  const fetchOrder = async () => {
    try {
      const r = await fetch(`/api/admin/orders/${id}`, { headers: { Authorization: `Bearer ${adminToken}` } });
      const d = await r.json();
      if (r.ok) setOrder(d); else setError(d.error);
    } catch { setError('Failed to load order'); }
    setLoading(false);
  };

  useEffect(() => { fetchOrder(); }, [id]);

  const updateOrderStatus = async (status) => {
    setUpdating(true); setError('');
    try {
      const r = await fetch(`/api/admin/orders/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ status }),
      });
      const d = await r.json();
      if (r.ok) setOrder(o => ({ ...o, ...d })); else setError(d.error);
    } catch { setError('Update failed'); }
    await fetchOrder();
    setUpdating(false);
  };

  const updateItemStatus = async (itemId, item_status) => {
    try {
      const r = await fetch(`/api/admin/order-items/${itemId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ item_status }),
      });
      if (r.ok) await fetchOrder();
    } catch {}
  };

  if (loading) return <AdminLayout><div style={{ padding: '60px', textAlign: 'center', fontFamily: F, color: '#8B7355' }}>Loading order...</div></AdminLayout>;
  if (!order) return <AdminLayout><div style={{ padding: '60px', textAlign: 'center', fontFamily: F, color: '#EF4444' }}>{error || 'Order not found'}</div></AdminLayout>;

  const allDone = order.items?.every(i => i.item_status === 'done');
  const activeStatuses = ['pending','confirmed','accepted','preparing','ready_for_delivery','out_for_delivery'];
  const isActive = activeStatuses.includes(order.status);
  const isRejected = ['rejected','cancelled'].includes(order.status);

  const nextActions = ORDER_FLOW.filter(f => {
    const statusOrder = ['pending','accepted','preparing','ready_for_delivery','out_for_delivery','delivered','completed'];
    const currentIdx = statusOrder.indexOf(order.status === 'confirmed' ? 'accepted' : order.status);
    const targetIdx = statusOrder.indexOf(f.status);
    return targetIdx > currentIdx && targetIdx <= currentIdx + 1;
  });

  const fmt = (ts) => new Date(ts).toLocaleString('en-IN', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const card = (children, extra = {}) => (
    <div style={{ background: '#fff', borderRadius: '14px', padding: '20px', marginBottom: '16px', boxShadow: '0 1px 4px rgba(42,24,16,0.06)', border: '1px solid rgba(139,90,43,0.08)', ...extra }}>
      {children}
    </div>
  );

  return (
    <AdminLayout>
      <div style={{ padding: '24px', maxWidth: '860px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/admin')} style={{ fontFamily: F, fontSize: '13px', padding: '7px 14px', borderRadius: '8px', border: '1px solid rgba(139,90,43,0.2)', background: '#fff', color: '#6B5244', cursor: 'pointer' }}>← Back</button>
          <h1 style={{ fontFamily: F, fontSize: '20px', fontWeight: 700, color: dark, margin: 0 }}>Order #{String(order.id).padStart(4,'0')}</h1>
          <StatusBadge status={order.status} />
        </div>

        {error && <div style={{ fontFamily: F, fontSize: '13px', color: '#C0392B', background: '#FEF0EF', borderRadius: '10px', padding: '10px 14px', marginBottom: '14px' }}>{error}</div>}

        {card(<>
          <div style={{ fontFamily: F, fontSize: '12px', fontWeight: 700, color: '#8B7355', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px' }}>Customer</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div><div style={{ fontSize: '11px', color: '#B89B7A', fontFamily: F }}>Name</div><div style={{ fontSize: '14px', fontWeight: 600, color: dark, fontFamily: F }}>{order.user_name}</div></div>
            <div><div style={{ fontSize: '11px', color: '#B89B7A', fontFamily: F }}>Email</div><div style={{ fontSize: '13px', color: dark, fontFamily: F }}>{order.user_email}</div></div>
            <div><div style={{ fontSize: '11px', color: '#B89B7A', fontFamily: F }}>Phone</div><div style={{ fontSize: '13px', color: dark, fontFamily: F }}>{order.phone || '—'}</div></div>
            <div><div style={{ fontSize: '11px', color: '#B89B7A', fontFamily: F }}>Placed At</div><div style={{ fontSize: '13px', color: dark, fontFamily: F }}>{fmt(order.created_at)}</div></div>
            <div style={{ gridColumn: '1/-1' }}><div style={{ fontSize: '11px', color: '#B89B7A', fontFamily: F }}>Delivery Address</div><div style={{ fontSize: '13px', color: dark, fontFamily: F }}>{order.delivery_address}</div></div>
            {order.notes && <div style={{ gridColumn: '1/-1' }}><div style={{ fontSize: '11px', color: '#B89B7A', fontFamily: F }}>Notes</div><div style={{ fontSize: '13px', color: dark, fontFamily: F, fontStyle: 'italic' }}>{order.notes}</div></div>}
          </div>
        </>)}

        {isActive && !isRejected && card(<>
          <div style={{ fontFamily: F, fontSize: '12px', fontWeight: 700, color: '#8B7355', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '14px' }}>Actions</div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {order.status === 'pending' && (
              <>
                <button onClick={() => updateOrderStatus('accepted')} disabled={updating} style={{ fontFamily: F, fontSize: '13px', fontWeight: 700, padding: '10px 20px', borderRadius: '10px', border: 'none', background: '#3B82F6', color: '#fff', cursor: 'pointer' }}>✓ Accept Order</button>
                <button onClick={() => updateOrderStatus('rejected')} disabled={updating} style={{ fontFamily: F, fontSize: '13px', fontWeight: 700, padding: '10px 20px', borderRadius: '10px', border: 'none', background: '#EF4444', color: '#fff', cursor: 'pointer' }}>✕ Reject Order</button>
              </>
            )}
            {nextActions.map(a => (
              <button key={a.status} onClick={() => updateOrderStatus(a.status)} disabled={updating || (a.status === 'ready_for_delivery' && !allDone && admin?.role !== 'OWNER')} style={{ fontFamily: F, fontSize: '13px', fontWeight: 700, padding: '10px 20px', borderRadius: '10px', border: 'none', background: a.color, color: '#fff', cursor: 'pointer', opacity: (a.status === 'ready_for_delivery' && !allDone && admin?.role !== 'OWNER') ? 0.5 : 1 }}>
                {a.label}
                {a.status === 'ready_for_delivery' && !allDone && <span style={{ fontSize: '11px', fontWeight: 400, display: 'block' }}>({order.items?.filter(i=>i.item_status!=='done').length} items not done{admin?.role==='OWNER'?' – override':''})</span>}
              </button>
            ))}
            {isActive && order.status !== 'pending' && (
              <button onClick={() => updateOrderStatus('cancelled')} disabled={updating} style={{ fontFamily: F, fontSize: '13px', fontWeight: 600, padding: '10px 16px', borderRadius: '10px', border: '1px solid #EF4444', background: 'transparent', color: '#EF4444', cursor: 'pointer' }}>Cancel</button>
            )}
          </div>
        </>)}

        {card(<>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ fontFamily: F, fontSize: '12px', fontWeight: 700, color: '#8B7355', letterSpacing: '1px', textTransform: 'uppercase' }}>Order Items</div>
            <div style={{ fontFamily: F, fontSize: '12px', color: '#8B7355' }}>{allDone ? '✓ All done' : `${order.items?.filter(i=>i.item_status==='done').length}/${order.items?.length} done`}</div>
          </div>
          {order.items?.map(item => {
            const cfg = ITEM_STATUS_CONFIG[item.item_status] || { label: item.item_status, color: '#6B7280', bg: '#F3F4F6' };
            return (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(139,90,43,0.06)', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: F, fontSize: '14px', fontWeight: 600, color: dark }}>{item.item_name} <span style={{ color: '#8B7355', fontWeight: 400 }}>×{item.quantity}</span></div>
                  <div style={{ fontFamily: F, fontSize: '12px', color: '#B89B7A' }}>₹{parseFloat(item.item_price).toFixed(0)} each · {item.category}</div>
                </div>
                <span style={{ fontFamily: F, fontSize: '11px', fontWeight: 700, color: cfg.color, background: cfg.bg, padding: '3px 10px', borderRadius: '20px' }}>{cfg.label}</span>
                {isActive && item.item_status !== 'done' && (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {item.item_status === 'pending' && <button onClick={() => updateItemStatus(item.id, 'preparing')} style={{ fontFamily: F, fontSize: '11px', fontWeight: 600, padding: '5px 10px', borderRadius: '8px', border: 'none', background: '#8B5CF6', color: '#fff', cursor: 'pointer' }}>Start</button>}
                    {item.item_status === 'preparing' && <button onClick={() => updateItemStatus(item.id, 'done')} style={{ fontFamily: F, fontSize: '11px', fontWeight: 600, padding: '5px 10px', borderRadius: '8px', border: 'none', background: '#16A34A', color: '#fff', cursor: 'pointer' }}>Mark Done</button>}
                  </div>
                )}
              </div>
            );
          })}
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '14px', fontFamily: F, fontWeight: 700, fontSize: '16px', color: dark }}>
            <span>Total</span><span>₹{parseFloat(order.total_amount).toFixed(2)}</span>
          </div>
        </>)}
      </div>
    </AdminLayout>
  );
}
