import { useState, useEffect } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import AdminLayout from './AdminLayout';

const gold = '#D4A017';
const dark = '#2A1810';
const F = "'Outfit', sans-serif";

const inp = { width: '100%', padding: '10px 12px', borderRadius: '9px', border: '1.5px solid rgba(139,90,43,0.18)', background: '#fff', fontFamily: F, fontSize: '13px', outline: 'none', color: dark, boxSizing: 'border-box' };
const lbl = { fontFamily: F, fontSize: '11px', fontWeight: 600, color: '#6B5244', letterSpacing: '0.5px', display: 'block', marginBottom: '5px' };

const BLANK = { name: '', email: '', password: '', phone: '', role: 'STAFF' };

export default function AdminStaff() {
  const { adminToken, admin: currentAdmin } = useAdminAuth();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resetId, setResetId] = useState(null);
  const [resetPwd, setResetPwd] = useState('');

  const fetchStaff = async () => {
    try {
      const r = await fetch('/api/admin/staff', { headers: { Authorization: `Bearer ${adminToken}` } });
      const d = await r.json();
      if (Array.isArray(d)) setStaff(d);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchStaff(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return setError('Name, email and password required');
    setSaving(true); setError('');
    try {
      const r = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setStaff(prev => [...prev, d]);
      setSuccess(`${d.name} added as ${d.role}!`);
      setForm(BLANK); setShowForm(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { setError(err.message); }
    setSaving(false);
  };

  const toggleActive = async (id, is_active) => {
    try {
      const r = await fetch(`/api/admin/staff/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ is_active }),
      });
      const d = await r.json();
      if (r.ok) setStaff(prev => prev.map(s => s.id === id ? d : s));
    } catch {}
  };

  const handleResetPwd = async (id) => {
    if (!resetPwd || resetPwd.length < 6) return setError('Password must be at least 6 characters');
    try {
      const r = await fetch(`/api/admin/staff/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ new_password: resetPwd }),
      });
      if (r.ok) { setSuccess('Password reset!'); setResetId(null); setResetPwd(''); setTimeout(() => setSuccess(''), 3000); }
    } catch {}
  };

  const fmt = (ts) => new Date(ts).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <AdminLayout>
      <div style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontFamily: F, fontSize: '22px', fontWeight: 700, color: dark, margin: 0 }}>Staff Management</h1>
            <div style={{ fontFamily: F, fontSize: '12px', color: '#8B7355', marginTop: '2px' }}>{staff.length} admin account{staff.length !== 1 ? 's' : ''}</div>
          </div>
          <button onClick={() => { setShowForm(true); setForm(BLANK); setError(''); }} style={{ fontFamily: F, fontSize: '13px', fontWeight: 700, padding: '10px 20px', borderRadius: '10px', border: 'none', background: `linear-gradient(135deg,${gold},#B8860B)`, color: '#fff', cursor: 'pointer' }}>
            + Add Staff
          </button>
        </div>

        {success && <div style={{ fontFamily: F, fontSize: '13px', color: '#16A34A', background: '#DCFCE7', borderRadius: '10px', padding: '10px 14px', marginBottom: '14px' }}>{success}</div>}

        {showForm && (
          <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', marginBottom: '20px', boxShadow: '0 4px 20px rgba(42,24,16,0.10)', border: '1px solid rgba(139,90,43,0.08)' }}>
            <h2 style={{ fontFamily: F, fontSize: '16px', fontWeight: 700, color: dark, margin: '0 0 16px' }}>Create Admin Account</h2>
            {error && <div style={{ fontFamily: F, fontSize: '13px', color: '#C0392B', background: '#FEF0EF', borderRadius: '8px', padding: '9px 12px', marginBottom: '12px' }}>{error}</div>}
            <form onSubmit={handleCreate}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><label style={lbl}>Full Name *</label><input value={form.name} onChange={e => setForm({...form,name:e.target.value})} required style={inp} placeholder="Staff name" /></div>
                <div><label style={lbl}>Email *</label><input type="email" value={form.email} onChange={e => setForm({...form,email:e.target.value})} required style={inp} placeholder="staff@email.com" /></div>
                <div><label style={lbl}>Password *</label><input type="password" value={form.password} onChange={e => setForm({...form,password:e.target.value})} required minLength={6} style={inp} placeholder="Min 6 chars" /></div>
                <div><label style={lbl}>Mobile (optional)</label><input type="tel" value={form.phone} onChange={e => setForm({...form,phone:e.target.value})} style={inp} placeholder="+91 98765 43210" /></div>
                <div><label style={lbl}>Role</label>
                  <select value={form.role} onChange={e => setForm({...form,role:e.target.value})} style={inp}>
                    <option value="STAFF">STAFF</option>
                    <option value="OWNER">OWNER</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                <button type="submit" disabled={saving} style={{ fontFamily: F, fontSize: '13px', fontWeight: 700, padding: '11px 24px', borderRadius: '10px', border: 'none', background: saving ? '#ccc' : `linear-gradient(135deg,${gold},#B8860B)`, color: '#fff', cursor: saving ? 'not-allowed' : 'pointer' }}>{saving ? 'Creating...' : 'Create Account'}</button>
                <button type="button" onClick={() => { setShowForm(false); setError(''); }} style={{ fontFamily: F, fontSize: '13px', fontWeight: 600, padding: '11px 20px', borderRadius: '10px', border: '1px solid rgba(139,90,43,0.2)', background: '#fff', color: '#6B5244', cursor: 'pointer' }}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', fontFamily: F, color: '#8B7355' }}>Loading...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {staff.map(s => (
              <div key={s.id} style={{ background: '#fff', borderRadius: '12px', padding: '16px 20px', boxShadow: '0 1px 4px rgba(42,24,16,0.05)', border: '1px solid rgba(139,90,43,0.08)', opacity: s.is_active ? 1 : 0.6 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontFamily: F, fontSize: '14px', fontWeight: 600, color: dark }}>{s.name}</span>
                      <span style={{ fontFamily: F, fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px', background: s.role === 'OWNER' ? `${gold}20` : '#EDE9FE', color: s.role === 'OWNER' ? gold : '#8B5CF6' }}>{s.role}</span>
                      {!s.is_active && <span style={{ fontFamily: F, fontSize: '10px', fontWeight: 700, color: '#EF4444', background: '#FEE2E2', padding: '2px 8px', borderRadius: '10px' }}>DISABLED</span>}
                      {s.id === currentAdmin?.id && <span style={{ fontFamily: F, fontSize: '10px', color: '#8B7355', background: '#F3F4F6', padding: '2px 8px', borderRadius: '10px' }}>You</span>}
                    </div>
                    <div style={{ fontFamily: F, fontSize: '12px', color: '#8B7355', marginTop: '2px' }}>{s.email} {s.phone ? `· ${s.phone}` : ''}</div>
                    <div style={{ fontFamily: F, fontSize: '11px', color: '#B89B7A', marginTop: '2px' }}>Joined {fmt(s.created_at)}</div>
                  </div>
                  {s.id !== currentAdmin?.id && (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button onClick={() => { setResetId(resetId === s.id ? null : s.id); setResetPwd(''); setError(''); }} style={{ fontFamily: F, fontSize: '12px', fontWeight: 600, padding: '6px 14px', borderRadius: '8px', border: `1px solid ${gold}`, background: '#fff', color: gold, cursor: 'pointer' }}>Reset Password</button>
                      <button onClick={() => toggleActive(s.id, !s.is_active)} style={{ fontFamily: F, fontSize: '12px', fontWeight: 600, padding: '6px 14px', borderRadius: '8px', border: 'none', background: s.is_active ? '#EF4444' : '#16A34A', color: '#fff', cursor: 'pointer' }}>{s.is_active ? 'Disable' : 'Enable'}</button>
                    </div>
                  )}
                </div>
                {resetId === s.id && (
                  <div style={{ marginTop: '12px', padding: '12px', background: '#FBF7F0', borderRadius: '10px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {error && <div style={{ width: '100%', fontFamily: F, fontSize: '12px', color: '#C0392B' }}>{error}</div>}
                    <input type="password" value={resetPwd} onChange={e => setResetPwd(e.target.value)} placeholder="New password (min 6 chars)" style={{ ...inp, flex: 1, minWidth: '200px', marginBottom: '0' }} />
                    <button onClick={() => handleResetPwd(s.id)} style={{ fontFamily: F, fontSize: '12px', fontWeight: 700, padding: '9px 16px', borderRadius: '8px', border: 'none', background: gold, color: '#fff', cursor: 'pointer' }}>Save</button>
                    <button onClick={() => { setResetId(null); setResetPwd(''); }} style={{ fontFamily: F, fontSize: '12px', fontWeight: 600, padding: '9px 14px', borderRadius: '8px', border: '1px solid rgba(139,90,43,0.2)', background: '#fff', color: '#6B5244', cursor: 'pointer' }}>Cancel</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
