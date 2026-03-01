import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';

const gold = '#D4A017';
const dark = '#2A1810';
const F = "'Outfit', sans-serif";
const S = "'Cormorant Garamond', serif";
const B = "'Lora', serif";

const inp = { width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1.5px solid rgba(139,90,43,0.18)', background: '#fff', fontFamily: B, fontSize: '14px', outline: 'none', color: dark, boxSizing: 'border-box' };
const lbl = { fontFamily: F, fontSize: '11px', fontWeight: 600, color: '#6B5244', letterSpacing: '0.5px', display: 'block', marginBottom: '5px' };
const fw = { marginBottom: '14px' };
const btn = (disabled) => ({ width: '100%', fontFamily: F, fontSize: '14px', fontWeight: 700, background: disabled ? '#ccc' : `linear-gradient(135deg,${gold},#B8860B)`, color: '#fff', border: 'none', padding: '13px', borderRadius: '10px', cursor: disabled ? 'not-allowed' : 'pointer' });

function Err({ msg }) { return msg ? <div style={{ fontFamily: F, fontSize: '13px', color: '#C0392B', background: '#FEF0EF', borderRadius: '8px', padding: '9px 12px', marginBottom: '14px' }}>{msg}</div> : null; }
function Suc({ msg }) { return msg ? <div style={{ fontFamily: F, fontSize: '13px', color: '#2E7D32', background: '#F0FEF0', borderRadius: '8px', padding: '9px 12px', marginBottom: '14px' }}>{msg}</div> : null; }
function OtpBox({ val, onChange }) {
  return <div style={fw}><label style={lbl}>6-Digit OTP</label><input value={val} onChange={e => onChange(e.target.value.replace(/\D/g,'').slice(0,6))} placeholder="● ● ● ● ● ●" style={{ ...inp, fontSize: '22px', letterSpacing: '8px', textAlign: 'center' }} maxLength={6} /></div>;
}

export default function AdminAuthPage({ defaultMode = 'login' }) {
  const [mode, setMode] = useState(defaultMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { adminLogin } = useAdminAuth();
  const navigate = useNavigate();

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [signupStep, setSignupStep] = useState(1);
  const [signupForm, setSignupForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [signupChannel, setSignupChannel] = useState('email');
  const [signupOTP, setSignupOTP] = useState('');

  const [forgotStep, setForgotStep] = useState(1);
  const [forgotChannel, setForgotChannel] = useState('email');
  const [forgotTarget, setForgotTarget] = useState('');
  const [forgotOTP, setForgotOTP] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');

  const [findPhone, setFindPhone] = useState('');
  const [foundEmail, setFoundEmail] = useState('');

  const api = async (url, body) => {
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || 'Something went wrong');
    return d;
  };

  const resetAll = (m) => { setMode(m); setError(''); setSuccess(''); setSignupStep(1); setForgotStep(1); setSignupOTP(''); setForgotOTP(''); setFoundEmail(''); };

  const handleLogin = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const d = await api('/api/admin/auth/login', loginForm);
      adminLogin(d.admin, d.token);
      navigate('/admin');
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const handleSignupSendOTP = async (e) => {
    e.preventDefault();
    if (!signupForm.name || !signupForm.email || !signupForm.password) return setError('Fill all required fields');
    if (signupChannel === 'phone' && !signupForm.phone) return setError('Enter phone for SMS OTP');
    setError(''); setLoading(true);
    try {
      const target = signupChannel === 'email' ? signupForm.email : signupForm.phone;
      await api('/api/admin/auth/send-otp', { target, target_type: signupChannel, otp_type: 'admin_signup' });
      setSuccess(`OTP sent to your ${signupChannel}!`); setSignupStep(3);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const handleSignupVerify = async (e) => {
    e.preventDefault();
    if (signupOTP.length !== 6) return setError('Enter 6-digit OTP');
    setError(''); setLoading(true);
    try {
      const otp_target = signupChannel === 'email' ? signupForm.email : signupForm.phone;
      const d = await api('/api/admin/auth/complete-signup', { ...signupForm, otp_code: signupOTP, otp_target, otp_target_type: signupChannel });
      adminLogin(d.admin, d.token);
      navigate('/admin');
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const handleForgotSendOTP = async (e) => {
    e.preventDefault();
    if (!forgotTarget) return setError(`Enter your ${forgotChannel}`);
    setError(''); setLoading(true);
    try {
      await api('/api/admin/auth/send-otp', { target: forgotTarget, target_type: forgotChannel, otp_type: 'admin_reset' });
      setSuccess('OTP sent!'); setForgotStep(3);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const handleForgotOTPNext = (e) => {
    e.preventDefault();
    if (forgotOTP.length !== 6) return setError('Enter 6-digit OTP');
    setError(''); setSuccess('OTP accepted! Set your new password.'); setForgotStep(4);
  };

  const handleResetPwd = async (e) => {
    e.preventDefault();
    if (!newPwd || newPwd.length < 6) return setError('Password must be at least 6 characters');
    if (newPwd !== confirmPwd) return setError('Passwords do not match');
    setError(''); setLoading(true);
    try {
      await api('/api/admin/auth/reset-password', { target: forgotTarget, target_type: forgotChannel, otp_code: forgotOTP, new_password: newPwd });
      setSuccess('Password reset! Redirecting to login...');
      setTimeout(() => resetAll('login'), 2000);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const handleFindAccount = async (e) => {
    e.preventDefault();
    if (!findPhone) return setError('Enter phone number');
    setError(''); setLoading(true);
    try {
      const d = await api('/api/admin/auth/find-account', { phone: findPhone });
      setFoundEmail(d.maskedEmail);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const tab = (active) => ({ flex: 1, fontFamily: F, fontSize: '12px', fontWeight: 700, padding: '9px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: active ? '#fff' : 'transparent', color: active ? dark : '#8B7355', boxShadow: active ? '0 2px 8px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.2s' });
  const back = (label, fn) => <button type="button" onClick={fn} style={{ fontFamily: F, fontSize: '12px', color: gold, background: 'none', border: 'none', cursor: 'pointer', marginTop: '6px', textDecoration: 'underline' }}>← {label}</button>;
  const ChPicker = ({ val, onChange }) => (
    <div style={fw}>
      <label style={lbl}>Send OTP via</label>
      <div style={{ display: 'flex', gap: '8px' }}>
        {['email','phone'].map(ch => <button key={ch} type="button" onClick={() => onChange(ch)} disabled={ch==='phone'&&!signupForm.phone} style={{ flex:1, fontFamily:F, fontSize:'13px', fontWeight:600, padding:'10px', borderRadius:'10px', cursor:(ch==='phone'&&!signupForm.phone)?'not-allowed':'pointer', border:`2px solid ${val===ch?gold:'rgba(139,90,43,0.15)'}`, background:val===ch?`${gold}15`:'#fff', color:val===ch?gold:(ch==='phone'&&!signupForm.phone?'#ccc':'#6B5244') }}>{ch==='email'?'📧 Email':'📱 Mobile'}{ch==='phone'&&!signupForm.phone&&<div style={{fontSize:'9px',color:'#ccc',marginTop:'2px'}}>Enter phone first</div>}</button>)}
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1C1008 0%, #2A1810 50%, #1C1008 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Lora:wght@400;500&family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px', cursor: 'pointer' }} onClick={() => navigate('/')}>
          <div style={{ fontFamily: S, fontSize: '26px', fontWeight: 700, color: gold }}>Stones & Spices</div>
          <div style={{ fontFamily: F, fontSize: '9px', letterSpacing: '3px', textTransform: 'uppercase', color: 'rgba(212,160,23,0.5)', marginTop: '2px' }}>Admin Dashboard</div>
        </div>

        <div style={{ background: '#fff', borderRadius: '20px', padding: '32px', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
          {(mode === 'login' || mode === 'signup') && (
            <div style={{ display: 'flex', background: 'rgba(42,24,16,0.05)', borderRadius: '10px', padding: '4px', marginBottom: '22px' }}>
              <button style={tab(mode === 'login')} onClick={() => resetAll('login')}>Sign In</button>
              <button style={tab(mode === 'signup')} onClick={() => resetAll('signup')}>Register Staff</button>
            </div>
          )}

          {mode === 'login' && (
            <>
              <h2 style={{ fontFamily: S, fontSize: '24px', fontWeight: 700, color: dark, margin: '0 0 4px' }}>Admin Login</h2>
              <p style={{ fontFamily: B, fontSize: '12px', color: '#8B7355', margin: '0 0 22px', fontStyle: 'italic' }}>Owner & Staff access only</p>
              <form onSubmit={handleLogin}>
                <div style={fw}><label style={lbl}>Email</label><input type="email" value={loginForm.email} onChange={e => setLoginForm({...loginForm,email:e.target.value})} placeholder="admin@email.com" required style={inp} /></div>
                <div style={{ ...fw, marginBottom: '8px' }}><label style={lbl}>Password</label><input type="password" value={loginForm.password} onChange={e => setLoginForm({...loginForm,password:e.target.value})} placeholder="••••••••" required style={inp} /></div>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '18px' }}>
                  <button type="button" onClick={() => resetAll('forgot')} style={{ fontFamily:F, fontSize:'12px', color:gold, background:'none', border:'none', cursor:'pointer', textDecoration:'underline' }}>Forgot Password?</button>
                  <button type="button" onClick={() => resetAll('find-email')} style={{ fontFamily:F, fontSize:'12px', color:'#8B7355', background:'none', border:'none', cursor:'pointer', textDecoration:'underline' }}>Forgot Email?</button>
                </div>
                <Err msg={error} /><button type="submit" disabled={loading} style={btn(loading)}>{loading ? 'Signing in...' : 'Sign In to Dashboard'}</button>
              </form>
              <div style={{ marginTop: '16px', padding: '12px', background: '#FBF7F0', borderRadius: '10px', border: '1px solid rgba(212,160,23,0.2)' }}>
                <div style={{ fontFamily: F, fontSize: '11px', color: '#8B7355', marginBottom: '4px', fontWeight: 600 }}>Default Owner Credentials</div>
                <div style={{ fontFamily: B, fontSize: '12px', color: dark }}>Email: owner@stonesandspices.com</div>
                <div style={{ fontFamily: B, fontSize: '12px', color: dark }}>Password: Admin@2024</div>
              </div>
            </>
          )}

          {mode === 'signup' && signupStep === 1 && (
            <>
              <h2 style={{ fontFamily: S, fontSize: '22px', fontWeight: 700, color: dark, margin: '0 0 4px' }}>Register as Staff</h2>
              <p style={{ fontFamily: B, fontSize: '12px', color: '#8B7355', margin: '0 0 20px', fontStyle: 'italic' }}>New accounts get STAFF role by default</p>
              <form onSubmit={e => { e.preventDefault(); setError(''); setSignupStep(2); }}>
                <div style={fw}><label style={lbl}>Full Name *</label><input value={signupForm.name} onChange={e => setSignupForm({...signupForm,name:e.target.value})} required style={inp} placeholder="Your name" /></div>
                <div style={fw}><label style={lbl}>Email *</label><input type="email" value={signupForm.email} onChange={e => setSignupForm({...signupForm,email:e.target.value})} required style={inp} placeholder="your@email.com" /></div>
                <div style={fw}><label style={lbl}>Password *</label><input type="password" value={signupForm.password} onChange={e => setSignupForm({...signupForm,password:e.target.value})} required minLength={6} style={inp} placeholder="••••••••" /></div>
                <div style={{ ...fw, marginBottom: '18px' }}><label style={lbl}>Mobile (for SMS OTP)</label><input type="tel" value={signupForm.phone} onChange={e => setSignupForm({...signupForm,phone:e.target.value})} style={inp} placeholder="+91 98765 43210" /></div>
                <Err msg={error} /><button type="submit" style={btn(false)}>Continue →</button>
              </form>
            </>
          )}

          {mode === 'signup' && signupStep === 2 && (
            <form onSubmit={handleSignupSendOTP}>
              <h2 style={{ fontFamily: S, fontSize: '22px', fontWeight: 700, color: dark, margin: '0 0 18px' }}>Verify Identity</h2>
              <ChPicker val={signupChannel} onChange={setSignupChannel} />
              <Err msg={error} /><button type="submit" disabled={loading} style={btn(loading)}>{loading ? 'Sending OTP...' : 'Send OTP'}</button>
              {back('Edit details', () => { setSignupStep(1); setError(''); })}
            </form>
          )}

          {mode === 'signup' && signupStep === 3 && (
            <form onSubmit={handleSignupVerify}>
              <h2 style={{ fontFamily: S, fontSize: '22px', fontWeight: 700, color: dark, margin: '0 0 8px' }}>Enter OTP</h2>
              <p style={{ fontFamily: B, fontSize: '12px', color: '#8B7355', margin: '0 0 18px', fontStyle: 'italic' }}>Sent to your {signupChannel}</p>
              <Suc msg={success} /><OtpBox val={signupOTP} onChange={setSignupOTP} />
              <Err msg={error} /><button type="submit" disabled={loading} style={btn(loading)}>{loading ? 'Creating account...' : 'Verify & Register'}</button>
              {back('Change method', () => { setSignupStep(2); setError(''); setSuccess(''); })}
            </form>
          )}

          {mode === 'forgot' && forgotStep === 1 && (
            <form onSubmit={e => { e.preventDefault(); setForgotStep(2); setError(''); }}>
              <h2 style={{ fontFamily: S, fontSize: '22px', fontWeight: 700, color: dark, margin: '0 0 18px' }}>Reset Password</h2>
              <div style={{ ...fw, marginBottom: '10px' }}>
                <label style={lbl}>Reset via</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['email','phone'].map(ch => <button key={ch} type="button" onClick={() => { setForgotChannel(ch); setForgotTarget(''); }} style={{ flex:1, fontFamily:F, fontSize:'13px', fontWeight:600, padding:'10px', borderRadius:'10px', cursor:'pointer', border:`2px solid ${forgotChannel===ch?gold:'rgba(139,90,43,0.15)'}`, background:forgotChannel===ch?`${gold}15`:'#fff', color:forgotChannel===ch?gold:'#6B5244' }}>{ch==='email'?'📧 Email':'📱 Mobile'}</button>)}
                </div>
              </div>
              <div style={{ ...fw, marginBottom: '18px' }}><label style={lbl}>{forgotChannel === 'email' ? 'Registered Email' : 'Registered Mobile'}</label><input type={forgotChannel==='email'?'email':'tel'} value={forgotTarget} onChange={e => setForgotTarget(e.target.value)} required style={inp} placeholder={forgotChannel==='email'?'admin@email.com':'+91 98765 43210'} /></div>
              <Err msg={error} /><button type="submit" style={btn(false)}>Continue →</button>
              {back('Back to Login', () => resetAll('login'))}
            </form>
          )}

          {mode === 'forgot' && forgotStep === 2 && (
            <form onSubmit={handleForgotSendOTP}>
              <h2 style={{ fontFamily: S, fontSize: '22px', fontWeight: 700, color: dark, margin: '0 0 8px' }}>Send OTP</h2>
              <p style={{ fontFamily: B, fontSize: '12px', color: '#8B7355', margin: '0 0 18px', fontStyle: 'italic' }}>Sending to: <strong>{forgotTarget}</strong></p>
              <Err msg={error} /><button type="submit" disabled={loading} style={btn(loading)}>{loading ? 'Sending...' : 'Send OTP'}</button>
              {back('Change contact', () => { setForgotStep(1); setError(''); })}
            </form>
          )}

          {mode === 'forgot' && forgotStep === 3 && (
            <form onSubmit={handleForgotOTPNext}>
              <h2 style={{ fontFamily: S, fontSize: '22px', fontWeight: 700, color: dark, margin: '0 0 8px' }}>Enter OTP</h2>
              <p style={{ fontFamily: B, fontSize: '12px', color: '#8B7355', margin: '0 0 18px', fontStyle: 'italic' }}>Sent to your {forgotChannel}</p>
              <Suc msg={success} /><OtpBox val={forgotOTP} onChange={setForgotOTP} />
              <Err msg={error} /><button type="submit" style={btn(false)}>Verify OTP →</button>
              {back('Resend OTP', () => { setForgotStep(2); setError(''); setSuccess(''); setForgotOTP(''); })}
            </form>
          )}

          {mode === 'forgot' && forgotStep === 4 && (
            <form onSubmit={handleResetPwd}>
              <h2 style={{ fontFamily: S, fontSize: '22px', fontWeight: 700, color: dark, margin: '0 0 18px' }}>New Password</h2>
              <Suc msg={success} />
              <div style={fw}><label style={lbl}>New Password</label><input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} required minLength={6} style={inp} placeholder="••••••••" /></div>
              <div style={{ ...fw, marginBottom: '18px' }}><label style={lbl}>Confirm Password</label><input type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} required style={inp} placeholder="••••••••" /></div>
              <Err msg={error} /><button type="submit" disabled={loading} style={btn(loading)}>{loading ? 'Resetting...' : 'Reset Password'}</button>
            </form>
          )}

          {mode === 'find-email' && (
            <>
              <h2 style={{ fontFamily: S, fontSize: '22px', fontWeight: 700, color: dark, margin: '0 0 8px' }}>Find Your Account</h2>
              <p style={{ fontFamily: B, fontSize: '12px', color: '#8B7355', margin: '0 0 18px', fontStyle: 'italic' }}>Enter your registered mobile number</p>
              {!foundEmail ? (
                <form onSubmit={handleFindAccount}>
                  <div style={{ ...fw, marginBottom: '18px' }}><label style={lbl}>Registered Mobile</label><input type="tel" value={findPhone} onChange={e => setFindPhone(e.target.value)} required style={inp} placeholder="+91 98765 43210" /></div>
                  <Err msg={error} /><button type="submit" disabled={loading} style={btn(loading)}>{loading ? 'Searching...' : 'Find Account'}</button>
                </form>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: F, fontSize: '13px', color: '#8B7355', marginBottom: '8px' }}>Your registered email:</div>
                  <div style={{ fontFamily: F, fontSize: '17px', fontWeight: 700, color: dark, background: `${gold}15`, border: `1px solid ${gold}`, borderRadius: '10px', padding: '12px', marginBottom: '16px' }}>{foundEmail}</div>
                  <button onClick={() => resetAll('login')} style={{ ...btn(false), marginBottom: '0' }}>Back to Login</button>
                </div>
              )}
              {!foundEmail && back('Back to Login', () => resetAll('login'))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
