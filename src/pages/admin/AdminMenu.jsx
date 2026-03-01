import { useState, useEffect } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import AdminLayout from './AdminLayout';

const gold = '#D4A017';
const dark = '#2A1810';
const F = "'Outfit', sans-serif";
const B = "'Lora', serif";

const CATEGORIES = ['Starters', 'Mains', 'Breads & Rice', 'Desserts & Drinks'];
const SPICE_LEVELS = ['mild', 'medium', 'spicy'];

const inp = { width: '100%', padding: '10px 12px', borderRadius: '9px', border: '1.5px solid rgba(139,90,43,0.18)', background: '#fff', fontFamily: F, fontSize: '13px', outline: 'none', color: dark, boxSizing: 'border-box' };
const lbl = { fontFamily: F, fontSize: '11px', fontWeight: 600, color: '#6B5244', letterSpacing: '0.5px', display: 'block', marginBottom: '5px' };

function Toggle({ value, onChange, onLabel, offLabel, onColor = '#16A34A' }) {
  return (
    <button type="button" onClick={() => onChange(!value)} style={{
      fontFamily: F, fontSize: '11px', fontWeight: 700, padding: '4px 12px', borderRadius: '20px', border: 'none', cursor: 'pointer',
      background: value ? onColor : '#EF4444', color: '#fff', transition: 'all 0.2s',
    }}>
      {value ? onLabel : offLabel}
    </button>
  );
}

const BLANK_FORM = { name: '', description: '', price: '', category: 'Starters', is_veg: true, spice_level: 'medium', image_url: '' };

export default function AdminMenu() {
  const { adminToken } = useAdminAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(BLANK_FORM);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [search, setSearch] = useState('');

  const fetchItems = async () => {
    try {
      const r = await fetch('/api/admin/menu', { headers: { Authorization: `Bearer ${adminToken}` } });
      const d = await r.json();
      if (Array.isArray(d)) setItems(d);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const apiPatch = async (id, body) => {
    const r = await fetch(`/api/admin/menu/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify(body),
    });
    const d = await r.json();
    if (r.ok) setItems(prev => prev.map(i => i.id === id ? d : i));
    return d;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.category) return setError('Name, price and category required');
    setSaving(true); setError('');
    try {
      const url = editId ? `/api/admin/menu/${editId}` : '/api/admin/menu';
      const method = editId ? 'PATCH' : 'POST';
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ ...form, price: parseFloat(form.price) }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      if (editId) setItems(prev => prev.map(i => i.id === editId ? d : i));
      else setItems(prev => [...prev, d]);
      setSuccess(editId ? 'Item updated!' : 'Item added to menu!');
      setForm(BLANK_FORM); setShowForm(false); setEditId(null);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { setError(err.message); }
    setSaving(false);
  };

  const startEdit = (item) => {
    setEditId(item.id);
    setForm({ name: item.name, description: item.description || '', price: item.price, category: item.category, is_veg: item.is_veg, spice_level: item.spice_level || 'medium', image_url: item.image_url || '' });
    setShowForm(true); setError('');
  };

  const grouped = CATEGORIES.reduce((acc, cat) => {
    const filtered = items.filter(i => i.category === cat && (catFilter === 'all' || catFilter === cat) && (!search || i.name.toLowerCase().includes(search.toLowerCase())));
    if (filtered.length) acc[cat] = filtered;
    return acc;
  }, {});

  return (
    <AdminLayout>
      <div style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontFamily: F, fontSize: '22px', fontWeight: 700, color: dark, margin: 0 }}>Menu Items</h1>
            <div style={{ fontFamily: F, fontSize: '12px', color: '#8B7355', marginTop: '2px' }}>{items.length} total items</div>
          </div>
          <button onClick={() => { setShowForm(true); setEditId(null); setForm(BLANK_FORM); setError(''); }} style={{ fontFamily: F, fontSize: '13px', fontWeight: 700, padding: '10px 20px', borderRadius: '10px', border: 'none', background: `linear-gradient(135deg,${gold},#B8860B)`, color: '#fff', cursor: 'pointer' }}>
            + Add New Item
          </button>
        </div>

        {success && <div style={{ fontFamily: F, fontSize: '13px', color: '#16A34A', background: '#DCFCE7', borderRadius: '10px', padding: '10px 14px', marginBottom: '14px' }}>{success}</div>}

        {showForm && (
          <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', marginBottom: '24px', boxShadow: '0 4px 20px rgba(42,24,16,0.10)', border: '1px solid rgba(139,90,43,0.08)' }}>
            <h2 style={{ fontFamily: F, fontSize: '16px', fontWeight: 700, color: dark, margin: '0 0 18px' }}>{editId ? 'Edit Item' : 'Add New Menu Item'}</h2>
            {error && <div style={{ fontFamily: F, fontSize: '13px', color: '#C0392B', background: '#FEF0EF', borderRadius: '8px', padding: '9px 12px', marginBottom: '14px' }}>{error}</div>}
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div style={{ gridColumn: '1/-1' }}><label style={lbl}>Item Name *</label><input value={form.name} onChange={e => setForm({...form,name:e.target.value})} required style={inp} placeholder="e.g. Paneer Tikka" /></div>
                <div style={{ gridColumn: '1/-1' }}><label style={lbl}>Description</label><textarea value={form.description} onChange={e => setForm({...form,description:e.target.value})} style={{ ...inp, resize: 'vertical', minHeight: '70px' }} placeholder="Brief description of the dish" /></div>
                <div><label style={lbl}>Price (₹) *</label><input type="number" value={form.price} onChange={e => setForm({...form,price:e.target.value})} required min="1" style={inp} placeholder="0.00" /></div>
                <div><label style={lbl}>Category *</label><select value={form.category} onChange={e => setForm({...form,category:e.target.value})} style={inp}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div>
                <div><label style={lbl}>Type</label>
                  <div style={{ display: 'flex', gap: '8px', paddingTop: '6px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: F, fontSize: '13px', cursor: 'pointer' }}><input type="radio" checked={form.is_veg} onChange={() => setForm({...form,is_veg:true})} />🟢 Veg</label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: F, fontSize: '13px', cursor: 'pointer' }}><input type="radio" checked={!form.is_veg} onChange={() => setForm({...form,is_veg:false})} />🔴 Non-Veg</label>
                  </div>
                </div>
                <div><label style={lbl}>Spice Level</label><select value={form.spice_level} onChange={e => setForm({...form,spice_level:e.target.value})} style={inp}>{SPICE_LEVELS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}</select></div>
                <div style={{ gridColumn: '1/-1' }}><label style={lbl}>Image URL (optional)</label><input value={form.image_url} onChange={e => setForm({...form,image_url:e.target.value})} style={inp} placeholder="https://..." /></div>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
                <button type="submit" disabled={saving} style={{ fontFamily: F, fontSize: '13px', fontWeight: 700, padding: '11px 24px', borderRadius: '10px', border: 'none', background: saving ? '#ccc' : `linear-gradient(135deg,${gold},#B8860B)`, color: '#fff', cursor: saving ? 'not-allowed' : 'pointer' }}>{saving ? 'Saving...' : editId ? 'Update Item' : 'Add Item'}</button>
                <button type="button" onClick={() => { setShowForm(false); setEditId(null); setError(''); }} style={{ fontFamily: F, fontSize: '13px', fontWeight: 600, padding: '11px 20px', borderRadius: '10px', border: '1px solid rgba(139,90,43,0.2)', background: '#fff', color: '#6B5244', cursor: 'pointer' }}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search items..." style={{ flex: 1, minWidth: '160px', padding: '9px 14px', borderRadius: '10px', border: '1.5px solid rgba(139,90,43,0.18)', fontFamily: F, fontSize: '13px', outline: 'none', background: '#fff' }} />
          <select value={catFilter} onChange={e => setCatFilter(e.target.value)} style={{ padding: '9px 14px', borderRadius: '10px', border: '1.5px solid rgba(139,90,43,0.18)', fontFamily: F, fontSize: '13px', background: '#fff', outline: 'none' }}>
            <option value="all">All Categories</option>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', fontFamily: F, color: '#8B7355' }}>Loading menu...</div>
        ) : (
          Object.entries(grouped).map(([cat, catItems]) => (
            <div key={cat} style={{ marginBottom: '24px' }}>
              <div style={{ fontFamily: F, fontSize: '13px', fontWeight: 700, color: '#8B7355', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '10px', paddingBottom: '6px', borderBottom: '1px solid rgba(139,90,43,0.1)' }}>{cat}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {catItems.map(item => (
                  <div key={item.id} style={{ background: '#fff', borderRadius: '12px', padding: '14px 18px', boxShadow: '0 1px 4px rgba(42,24,16,0.05)', border: '1px solid rgba(139,90,43,0.08)', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', opacity: item.is_active ? 1 : 0.5 }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px' }}>{item.is_veg ? '🟢' : '🔴'}</span>
                        <span style={{ fontFamily: F, fontSize: '14px', fontWeight: 600, color: dark }}>{item.name}</span>
                        {item.is_bestseller && <span style={{ fontFamily: F, fontSize: '10px', fontWeight: 700, color: gold, background: `${gold}20`, padding: '1px 6px', borderRadius: '10px' }}>BEST</span>}
                        {!item.is_active && <span style={{ fontFamily: F, fontSize: '10px', fontWeight: 700, color: '#6B7280', background: '#F3F4F6', padding: '1px 6px', borderRadius: '10px' }}>INACTIVE</span>}
                      </div>
                      <div style={{ fontFamily: F, fontSize: '12px', color: '#8B7355', marginTop: '2px' }}>₹{parseFloat(item.price).toFixed(0)} · {item.spice_level || 'medium'} spice</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <Toggle value={item.is_available} onChange={v => apiPatch(item.id, { is_available: v })} onLabel="Available" offLabel="Not Available" onColor="#16A34A" />
                      <Toggle value={item.stock_status === 'IN_STOCK'} onChange={v => apiPatch(item.id, { stock_status: v ? 'IN_STOCK' : 'OUT_OF_STOCK' })} onLabel="In Stock" offLabel="Out of Stock" onColor="#3B82F6" />
                      <Toggle value={item.is_active} onChange={v => apiPatch(item.id, { is_active: v })} onLabel="Active" offLabel="Hidden" onColor="#8B5CF6" />
                      <button onClick={() => startEdit(item)} style={{ fontFamily: F, fontSize: '11px', fontWeight: 600, padding: '4px 12px', borderRadius: '8px', border: `1px solid ${gold}`, background: '#fff', color: gold, cursor: 'pointer' }}>Edit</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </AdminLayout>
  );
}
