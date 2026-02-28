import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const gold = '#D4A017';
const dark = '#2A1810';
const F = "'Outfit', sans-serif";
const S = "'Cormorant Garamond', serif";
const B = "'Lora', serif";

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/signup';
      const body = mode === 'login'
        ? { email: form.email, password: form.password }
        : { name: form.name, email: form.email, password: form.password, phone: form.phone };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      login(data.user, data.token);
      navigate('/menu');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inp = {
    width: '100%', padding: '13px 16px', borderRadius: '12px',
    border: '1.5px solid rgba(139,90,43,0.15)', background: '#fff',
    fontFamily: B, fontSize: '14px', outline: 'none', color: dark,
    boxSizing: 'border-box',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#FBF7F0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: B }}>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Lora:ital,wght@0,400;0,500;1,400&family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

      <div style={{ marginBottom: '32px', textAlign: 'center', cursor: 'pointer' }} onClick={() => navigate('/')}>
        <div style={{ fontFamily: S, fontSize: '28px', fontWeight: 700, color: dark }}>Stones & Spices</div>
        <div style={{ fontFamily: F, fontSize: '9px', letterSpacing: '3px', textTransform: 'uppercase', color: gold, fontWeight: 600 }}>Cloud Kitchen</div>
      </div>

      <div style={{ background: '#fff', borderRadius: '24px', padding: '40px', maxWidth: '420px', width: '100%', boxShadow: '0 8px 40px rgba(42,24,16,0.08)', border: '1px solid rgba(139,90,43,0.06)' }}>
        <div style={{ display: 'flex', background: 'rgba(42,24,16,0.04)', borderRadius: '12px', padding: '4px', marginBottom: '28px' }}>
          {['login', 'signup'].map(m => (
            <button key={m} onClick={() => { setMode(m); setError(''); }} style={{
              flex: 1, fontFamily: F, fontSize: '13px', fontWeight: 700, padding: '10px',
              borderRadius: '10px', border: 'none', cursor: 'pointer', transition: 'all 0.2s',
              background: mode === m ? '#fff' : 'transparent',
              color: mode === m ? dark : '#8B7355',
              boxShadow: mode === m ? '0 2px 8px rgba(42,24,16,0.08)' : 'none',
              textTransform: 'capitalize',
            }}>
              {m === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        <h2 style={{ fontFamily: S, fontSize: '26px', fontWeight: 700, color: dark, marginBottom: '6px' }}>
          {mode === 'login' ? 'Welcome back' : 'Join our family'}
        </h2>
        <p style={{ fontFamily: B, fontSize: '13px', color: '#8B7355', marginBottom: '24px', fontStyle: 'italic' }}>
          {mode === 'login' ? 'Sign in to order and track your meals' : 'Create an account to start ordering'}
        </p>

        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontFamily: F, fontSize: '11px', fontWeight: 600, color: '#6B5244', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>Full Name</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Your name" required style={inp} />
            </div>
          )}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontFamily: F, fontSize: '11px', fontWeight: 600, color: '#6B5244', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>Email</label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="your@email.com" required style={inp} />
          </div>
          <div style={{ marginBottom: mode === 'signup' ? '14px' : '20px' }}>
            <label style={{ fontFamily: F, fontSize: '11px', fontWeight: 600, color: '#6B5244', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>Password</label>
            <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="••••••••" required style={inp} />
          </div>
          {mode === 'signup' && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontFamily: F, fontSize: '11px', fontWeight: 600, color: '#6B5244', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>Phone (optional)</label>
              <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+91 98765 43210" style={inp} />
            </div>
          )}
          {error && (
            <div style={{ fontFamily: F, fontSize: '13px', color: '#C0392B', background: '#FEF0EF', border: '1px solid rgba(192,57,43,0.15)', borderRadius: '10px', padding: '10px 14px', marginBottom: '16px' }}>
              {error}
            </div>
          )}
          <button type="submit" disabled={loading} style={{
            width: '100%', fontFamily: F, fontSize: '15px', fontWeight: 700,
            background: loading ? '#ccc' : `linear-gradient(135deg,${gold},#B8860B)`,
            color: '#fff', border: 'none', padding: '14px', borderRadius: '12px',
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: loading ? 'none' : `0 4px 20px rgba(212,160,23,0.3)`,
          }}>
            {loading ? 'Please wait...' : (mode === 'login' ? 'Sign In' : 'Create Account')}
          </button>
        </form>
      </div>

      <button onClick={() => navigate('/')} style={{ marginTop: '20px', fontFamily: F, fontSize: '13px', color: '#8B7355', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
        ← Back to Home
      </button>
    </div>
  );
}
