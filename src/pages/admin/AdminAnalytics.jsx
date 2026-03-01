import { useState, useEffect } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import AdminLayout from './AdminLayout';

const gold = '#D4A017';
const dark = '#2A1810';
const F = "'Outfit', sans-serif";

function StatCard({ label, value, sub, color = dark }) {
  return (
    <div style={{ background: '#fff', borderRadius: '14px', padding: '20px 24px', boxShadow: '0 1px 4px rgba(42,24,16,0.06)', border: '1px solid rgba(139,90,43,0.08)' }}>
      <div style={{ fontFamily: F, fontSize: '11px', fontWeight: 600, color: '#8B7355', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>{label}</div>
      <div style={{ fontFamily: F, fontSize: '28px', fontWeight: 800, color }}>{value}</div>
      {sub && <div style={{ fontFamily: F, fontSize: '12px', color: '#B89B7A', marginTop: '4px' }}>{sub}</div>}
    </div>
  );
}

function MiniBar({ data, valueKey, labelKey, color = gold }) {
  if (!data || data.length === 0) return <div style={{ fontFamily: F, fontSize: '13px', color: '#8B7355', textAlign: 'center', padding: '20px' }}>No data yet</div>;
  const max = Math.max(...data.map(d => parseFloat(d[valueKey]) || 0)) || 1;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '100px', padding: '0 4px' }}>
      {data.map((d, i) => {
        const h = Math.max(4, (parseFloat(d[valueKey]) / max) * 100);
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }} title={`${d[labelKey]}: ${d[valueKey]}`}>
            <div style={{ width: '100%', height: `${h}%`, background: color, borderRadius: '3px 3px 0 0', transition: 'height 0.3s' }} />
          </div>
        );
      })}
    </div>
  );
}

export default function AdminAnalytics() {
  const { adminToken } = useAdminAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/analytics', { headers: { Authorization: `Bearer ${adminToken}` } })
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setData(d); })
      .catch(() => setError('Failed to load analytics'))
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n) => `₹${parseFloat(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  if (loading) return <AdminLayout><div style={{ padding: '60px', textAlign: 'center', fontFamily: F, color: '#8B7355' }}>Loading analytics...</div></AdminLayout>;
  if (error) return <AdminLayout><div style={{ padding: '60px', textAlign: 'center', fontFamily: F, color: '#EF4444' }}>{error}</div></AdminLayout>;

  return (
    <AdminLayout>
      <div style={{ padding: '24px' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontFamily: F, fontSize: '22px', fontWeight: 700, color: dark, margin: 0 }}>Analytics</h1>
          <div style={{ fontFamily: F, fontSize: '12px', color: '#8B7355', marginTop: '2px' }}>Owner-only financial overview</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '24px' }}>
          <StatCard label="Revenue Today" value={fmt(data.today.revenue)} sub={`${data.today.orders} orders`} color="#16A34A" />
          <StatCard label="Revenue This Month" value={fmt(data.month.revenue)} sub={`${data.month.orders} orders`} color="#3B82F6" />
          <StatCard label="Revenue This Year" value={fmt(data.year.revenue)} sub={`${data.year.orders} orders`} color="#8B5CF6" />
          <StatCard label="Avg Order Value" value={fmt(data.today.avg_order)} sub="Today's average" color={gold} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          <div style={{ background: '#fff', borderRadius: '14px', padding: '20px', boxShadow: '0 1px 4px rgba(42,24,16,0.06)', border: '1px solid rgba(139,90,43,0.08)' }}>
            <div style={{ fontFamily: F, fontSize: '13px', fontWeight: 700, color: dark, marginBottom: '4px' }}>Revenue — Last 30 Days</div>
            <div style={{ fontFamily: F, fontSize: '11px', color: '#8B7355', marginBottom: '16px' }}>Each bar = one day</div>
            <MiniBar data={data.by_day} valueKey="revenue" labelKey="date" color={gold} />
          </div>
          <div style={{ background: '#fff', borderRadius: '14px', padding: '20px', boxShadow: '0 1px 4px rgba(42,24,16,0.06)', border: '1px solid rgba(139,90,43,0.08)' }}>
            <div style={{ fontFamily: F, fontSize: '13px', fontWeight: 700, color: dark, marginBottom: '4px' }}>Orders — Last 30 Days</div>
            <div style={{ fontFamily: F, fontSize: '11px', color: '#8B7355', marginBottom: '16px' }}>Each bar = one day</div>
            <MiniBar data={data.by_day} valueKey="orders" labelKey="date" color="#8B5CF6" />
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: '14px', padding: '20px', boxShadow: '0 1px 4px rgba(42,24,16,0.06)', border: '1px solid rgba(139,90,43,0.08)' }}>
          <div style={{ fontFamily: F, fontSize: '13px', fontWeight: 700, color: dark, marginBottom: '16px' }}>Top Selling Items</div>
          {data.top_items?.length === 0 ? (
            <div style={{ fontFamily: F, fontSize: '13px', color: '#8B7355', textAlign: 'center', padding: '20px' }}>No sales data yet</div>
          ) : (
            <div>
              {data.top_items?.map((item, i) => {
                const maxQty = data.top_items[0]?.total_qty || 1;
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                    <div style={{ fontFamily: F, fontSize: '12px', fontWeight: 700, color: '#B89B7A', width: '20px', textAlign: 'center' }}>{i + 1}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontFamily: F, fontSize: '13px', fontWeight: 600, color: dark }}>{item.item_name}</span>
                        <span style={{ fontFamily: F, fontSize: '12px', color: '#8B7355' }}>{item.total_qty} sold · {fmt(item.revenue)}</span>
                      </div>
                      <div style={{ height: '6px', borderRadius: '3px', background: '#F4F1ED', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(item.total_qty / maxQty) * 100}%`, background: `linear-gradient(90deg,${gold},#B8860B)`, borderRadius: '3px' }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
