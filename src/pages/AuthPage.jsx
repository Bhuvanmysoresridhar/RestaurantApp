import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const gold = '#D4A017';
const dark = '#2A1810';
const F = "'Outfit', sans-serif";
const S = "'Cormorant Garamond', serif";
const B = "'Lora', serif";

const inp = {
  width: '100%', padding: '13px 16px', borderRadius: '12px',
  border: '1.5px solid rgba(139,90,43,0.15)', background: '#fff',
  fontFamily: B, fontSize: '14px', outline: 'none', color: dark,
  boxSizing: 'border-box',
};

const btn = (disabled) => ({
  width: '100%', fontFamily: F, fontSize: '15px', fontWeight: 700,
  background: disabled ? '#ccc' : `linear-gradient(135deg,${gold},#B8860B)`,
  color: '#fff', border: 'none', padding: '14px', borderRadius: '12px',
  cursor: disabled ? 'not-allowed' : 'pointer',
  boxShadow: disabled ? 'none' : `0 4px 20px rgba(212,160,23,0.3)`,
  transition: 'all 0.2s',
});

const label = { fontFamily: F, fontSize: '11px', fontWeight: 600, color: '#6B5244', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' };
const fieldWrap = { marginBottom: '14px' };

function OTPChannelPicker({ hasPhone, value, onChange }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ ...label, marginBottom: '10px' }}>Send OTP via</div>
      <div style={{ display: 'flex', gap: '10px' }}>
        {['email', 'phone'].map(ch => (
          <button
            key={ch}
            type="button"
            disabled={ch === 'phone' && !hasPhone}
            onClick={() => onChange(ch)}
            style={{
              flex: 1, fontFamily: F, fontSize: '13px', fontWeight: 600,
              padding: '12px', borderRadius: '12px', cursor: (ch === 'phone' && !hasPhone) ? 'not-allowed' : 'pointer',
              border: `2px solid ${value === ch ? gold : 'rgba(139,90,43,0.15)'}`,
              background: value === ch ? `${gold}15` : '#fff',
              color: value === ch ? gold : (ch === 'phone' && !hasPhone ? '#ccc' : '#6B5244'),
              transition: 'all 0.2s',
            }}
          >
            {ch === 'email' ? '📧 Email' : '📱 Mobile'}
            {ch === 'phone' && !hasPhone && <div style={{ fontSize: '9px', marginTop: '2px', color: '#ccc' }}>Enter phone first</div>}
          </button>
        ))}
      </div>
    </div>
  );
}

function ErrorBox({ msg }) {
  if (!msg) return null;
  return (
    <div style={{ fontFamily: F, fontSize: '13px', color: '#C0392B', background: '#FEF0EF', border: '1px solid rgba(192,57,43,0.15)', borderRadius: '10px', padding: '10px 14px', marginBottom: '16px' }}>
      {msg}
    </div>
  );
}

function SuccessBox({ msg }) {
  if (!msg) return null;
  return (
    <div style={{ fontFamily: F, fontSize: '13px', color: '#2E7D32', background: '#F0FEF0', border: '1px solid rgba(46,125,50,0.15)', borderRadius: '10px', padding: '10px 14px', marginBottom: '16px' }}>
      {msg}
    </div>
  );
}

function OTPInput({ value, onChange, label: lbl }) {
  return (
    <div style={fieldWrap}>
      <label style={label}>{lbl || 'Enter 6-digit OTP'}</label>
      <input
        value={value}
        onChange={e => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
        placeholder="● ● ● ● ● ●"
        style={{ ...inp, fontSize: '24px', letterSpacing: '8px', textAlign: 'center', fontFamily: F }}
        maxLength={6}
      />
    </div>
  );
}

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });

  const [signupStep, setSignupStep] = useState(1);
  const [signupForm, setSignupForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [signupChannel, setSignupChannel] = useState('email');
  const [signupOTP, setSignupOTP] = useState('');

  const [forgotStep, setForgotStep] = useState(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotChannel, setForgotChannel] = useState('email');
  const [forgotTarget, setForgotTarget] = useState('');
  const [forgotOTP, setForgotOTP] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [findPhone, setFindPhone] = useState('');
  const [foundEmail, setFoundEmail] = useState('');

  const api = async (url, body) => {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Something went wrong');
    return data;
  };

  const reset = (m) => { setMode(m); setError(''); setSuccess(''); setSignupStep(1); setForgotStep(1); setSignupOTP(''); setForgotOTP(''); };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const data = await api('/api/auth/login', loginForm);
      login(data.user, data.token);
      navigate('/menu');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleSignupSendOTP = async (e) => {
    e.preventDefault();
    if (!signupForm.name || !signupForm.email || !signupForm.password)
      return setError('Please fill in all required fields');
    if (signupChannel === 'phone' && !signupForm.phone)
      return setError('Please enter your phone number to use SMS OTP');
    setError(''); setLoading(true);
    try {
      const target = signupChannel === 'email' ? signupForm.email : signupForm.phone;
      await api('/api/auth/send-otp', { target, target_type: signupChannel, otp_type: 'signup' });
      setSuccess(`OTP sent to your ${signupChannel === 'email' ? 'email' : 'mobile'}!`);
      setSignupStep(3);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleSignupVerify = async (e) => {
    e.preventDefault();
    if (signupOTP.length !== 6) return setError('Please enter the 6-digit OTP');
    setError(''); setLoading(true);
    try {
      const otp_target = signupChannel === 'email' ? signupForm.email : signupForm.phone;
      const data = await api('/api/auth/complete-signup', {
        ...signupForm,
        otp_code: signupOTP,
        otp_target,
        otp_target_type: signupChannel,
      });
      login(data.user, data.token);
      navigate('/menu');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleForgotSendOTP = async (e) => {
    e.preventDefault();
    if (!forgotTarget) return setError(`Please enter your ${forgotChannel === 'email' ? 'email' : 'phone'}`);
    setError(''); setLoading(true);
    try {
      await api('/api/auth/send-otp', { target: forgotTarget, target_type: forgotChannel, otp_type: 'reset' });
      setSuccess(`OTP sent to your ${forgotChannel === 'email' ? 'email' : 'mobile'}!`);
      setForgotStep(3);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleForgotVerifyOTP = async (e) => {
    e.preventDefault();
    if (forgotOTP.length !== 6) return setError('Please enter the 6-digit OTP');
    setError(''); setLoading(true);
    try {
      await api('/api/auth/verify-otp', { target: forgotTarget, otp_code: forgotOTP, otp_type: 'reset' });
      setSuccess('Identity verified! Set your new password below.');
      setForgotStep(4);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) return setError('Password must be at least 6 characters');
    if (newPassword !== confirmPassword) return setError('Passwords do not match');
    setError(''); setLoading(true);
    try {
      await api('/api/auth/reset-password', { target: forgotTarget, target_type: forgotChannel, otp_code: forgotOTP, new_password: newPassword });
      setSuccess('Password reset successfully! You can now sign in.');
      setTimeout(() => reset('login'), 2000);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleFindAccount = async (e) => {
    e.preventDefault();
    if (!findPhone) return setError('Please enter your phone number');
    setError(''); setLoading(true);
    try {
      const data = await api('/api/auth/find-account', { phone: findPhone });
      setFoundEmail(data.maskedEmail);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const tabStyle = (active) => ({
    flex: 1, fontFamily: F, fontSize: '12px', fontWeight: 700, padding: '10px',
    borderRadius: '10px', border: 'none', cursor: 'pointer', transition: 'all 0.2s',
    background: active ? '#fff' : 'transparent',
    color: active ? dark : '#8B7355',
    boxShadow: active ? '0 2px 8px rgba(42,24,16,0.08)' : 'none',
    textTransform: 'capitalize',
  });

  const backLink = (label, onClick) => (
    <button type="button" onClick={onClick} style={{ fontFamily: F, fontSize: '12px', color: gold, background: 'none', border: 'none', cursor: 'pointer', marginTop: '8px', textDecoration: 'underline' }}>
      ← {label}
    </button>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#FBF7F0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: B }}>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Lora:ital,wght@0,400;0,500;1,400&family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

      <div style={{ marginBottom: '28px', textAlign: 'center', cursor: 'pointer' }} onClick={() => navigate('/')}>
        <div style={{ fontFamily: S, fontSize: '28px', fontWeight: 700, color: dark }}>Stones & Spices</div>
        <div style={{ fontFamily: F, fontSize: '9px', letterSpacing: '3px', textTransform: 'uppercase', color: gold, fontWeight: 600 }}>Cloud Kitchen</div>
      </div>

      <div style={{ background: '#fff', borderRadius: '24px', padding: '36px', maxWidth: '420px', width: '100%', boxShadow: '0 8px 40px rgba(42,24,16,0.08)', border: '1px solid rgba(139,90,43,0.06)' }}>

        {(mode === 'login' || mode === 'signup') && (
          <div style={{ display: 'flex', background: 'rgba(42,24,16,0.04)', borderRadius: '12px', padding: '4px', marginBottom: '24px' }}>
            <button style={tabStyle(mode === 'login')} onClick={() => reset('login')}>Sign In</button>
            <button style={tabStyle(mode === 'signup')} onClick={() => reset('signup')}>Create Account</button>
          </div>
        )}

        {/* ── LOGIN ── */}
        {mode === 'login' && (
          <>
            <h2 style={{ fontFamily: S, fontSize: '26px', fontWeight: 700, color: dark, marginBottom: '4px' }}>Welcome back</h2>
            <p style={{ fontFamily: B, fontSize: '13px', color: '#8B7355', marginBottom: '24px', fontStyle: 'italic' }}>Sign in to order and track your meals</p>
            <form onSubmit={handleLogin}>
              <div style={fieldWrap}><label style={label}>Email</label><input type="email" value={loginForm.email} onChange={e => setLoginForm({ ...loginForm, email: e.target.value })} placeholder="your@email.com" required style={inp} /></div>
              <div style={{ ...fieldWrap, marginBottom: '8px' }}><label style={label}>Password</label><input type="password" value={loginForm.password} onChange={e => setLoginForm({ ...loginForm, password: e.target.value })} placeholder="••••••••" required style={inp} /></div>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                <button type="button" onClick={() => { reset('forgot'); setForgotStep(1); setForgotChannel('email'); }} style={{ fontFamily: F, fontSize: '12px', color: gold, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Forgot Password?</button>
                <button type="button" onClick={() => reset('find-email')} style={{ fontFamily: F, fontSize: '12px', color: '#8B7355', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Forgot Email?</button>
              </div>
              <ErrorBox msg={error} />
              <button type="submit" disabled={loading} style={btn(loading)}>{loading ? 'Signing in...' : 'Sign In'}</button>
            </form>
          </>
        )}

        {/* ── SIGNUP STEP 1: Details ── */}
        {mode === 'signup' && signupStep === 1 && (
          <>
            <h2 style={{ fontFamily: S, fontSize: '26px', fontWeight: 700, color: dark, marginBottom: '4px' }}>Join our family</h2>
            <p style={{ fontFamily: B, fontSize: '13px', color: '#8B7355', marginBottom: '24px', fontStyle: 'italic' }}>Create your account to start ordering</p>
            <form onSubmit={(e) => { e.preventDefault(); setError(''); setSignupStep(2); }}>
              <div style={fieldWrap}><label style={label}>Full Name *</label><input value={signupForm.name} onChange={e => setSignupForm({ ...signupForm, name: e.target.value })} placeholder="Your full name" required style={inp} /></div>
              <div style={fieldWrap}><label style={label}>Email *</label><input type="email" value={signupForm.email} onChange={e => setSignupForm({ ...signupForm, email: e.target.value })} placeholder="your@email.com" required style={inp} /></div>
              <div style={fieldWrap}><label style={label}>Password *</label><input type="password" value={signupForm.password} onChange={e => setSignupForm({ ...signupForm, password: e.target.value })} placeholder="••••••••" required minLength={6} style={inp} /></div>
              <div style={{ ...fieldWrap, marginBottom: '20px' }}><label style={label}>Mobile Number (for SMS OTP)</label><input type="tel" value={signupForm.phone} onChange={e => setSignupForm({ ...signupForm, phone: e.target.value })} placeholder="+91 98765 43210" style={inp} /></div>
              <ErrorBox msg={error} />
              <button type="submit" style={btn(false)}>Continue →</button>
            </form>
          </>
        )}

        {/* ── SIGNUP STEP 2: OTP Channel ── */}
        {mode === 'signup' && signupStep === 2 && (
          <>
            <h2 style={{ fontFamily: S, fontSize: '24px', fontWeight: 700, color: dark, marginBottom: '4px' }}>Verify Your Identity</h2>
            <p style={{ fontFamily: B, fontSize: '13px', color: '#8B7355', marginBottom: '24px', fontStyle: 'italic' }}>Choose how you'd like to receive your OTP</p>
            <form onSubmit={handleSignupSendOTP}>
              <OTPChannelPicker hasPhone={!!signupForm.phone} value={signupChannel} onChange={setSignupChannel} />
              <ErrorBox msg={error} />
              <button type="submit" disabled={loading} style={btn(loading)}>{loading ? 'Sending OTP...' : 'Send OTP'}</button>
              {backLink('Edit details', () => { setSignupStep(1); setError(''); })}
            </form>
          </>
        )}

        {/* ── SIGNUP STEP 3: Enter OTP ── */}
        {mode === 'signup' && signupStep === 3 && (
          <>
            <h2 style={{ fontFamily: S, fontSize: '24px', fontWeight: 700, color: dark, marginBottom: '4px' }}>Enter OTP</h2>
            <p style={{ fontFamily: B, fontSize: '13px', color: '#8B7355', marginBottom: '24px', fontStyle: 'italic' }}>
              We sent a 6-digit code to your {signupChannel === 'email' ? 'email' : 'mobile'}
            </p>
            <form onSubmit={handleSignupVerify}>
              <SuccessBox msg={success} />
              <OTPInput value={signupOTP} onChange={setSignupOTP} />
              <ErrorBox msg={error} />
              <button type="submit" disabled={loading} style={btn(loading)}>{loading ? 'Verifying...' : 'Verify & Create Account'}</button>
              {backLink('Change OTP method', () => { setSignupStep(2); setError(''); setSuccess(''); })}
            </form>
          </>
        )}

        {/* ── FORGOT PASSWORD STEP 1: Choose channel & enter contact ── */}
        {mode === 'forgot' && forgotStep === 1 && (
          <>
            <h2 style={{ fontFamily: S, fontSize: '24px', fontWeight: 700, color: dark, marginBottom: '4px' }}>Reset Password</h2>
            <p style={{ fontFamily: B, fontSize: '13px', color: '#8B7355', marginBottom: '24px', fontStyle: 'italic' }}>We'll send an OTP to verify your identity</p>
            <form onSubmit={(e) => { e.preventDefault(); setForgotStep(2); setError(''); }}>
              <div style={{ ...fieldWrap, marginBottom: '20px' }}>
                <label style={label}>Reset via</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {['email', 'phone'].map(ch => (
                    <button key={ch} type="button" onClick={() => { setForgotChannel(ch); setForgotTarget(''); }} style={{
                      flex: 1, fontFamily: F, fontSize: '13px', fontWeight: 600, padding: '12px', borderRadius: '12px', cursor: 'pointer',
                      border: `2px solid ${forgotChannel === ch ? gold : 'rgba(139,90,43,0.15)'}`,
                      background: forgotChannel === ch ? `${gold}15` : '#fff',
                      color: forgotChannel === ch ? gold : '#6B5244', transition: 'all 0.2s',
                    }}>{ch === 'email' ? '📧 Email' : '📱 Mobile'}</button>
                  ))}
                </div>
              </div>
              <div style={{ ...fieldWrap, marginBottom: '20px' }}>
                <label style={label}>{forgotChannel === 'email' ? 'Registered Email' : 'Registered Mobile'}</label>
                <input
                  type={forgotChannel === 'email' ? 'email' : 'tel'}
                  value={forgotTarget}
                  onChange={e => setForgotTarget(e.target.value)}
                  placeholder={forgotChannel === 'email' ? 'your@email.com' : '+91 98765 43210'}
                  required style={inp}
                />
              </div>
              <ErrorBox msg={error} />
              <button type="submit" style={btn(false)}>Continue →</button>
              {backLink('Back to Sign In', () => reset('login'))}
            </form>
          </>
        )}

        {/* ── FORGOT PASSWORD STEP 2: Send OTP ── */}
        {mode === 'forgot' && forgotStep === 2 && (
          <>
            <h2 style={{ fontFamily: S, fontSize: '24px', fontWeight: 700, color: dark, marginBottom: '4px' }}>Send OTP</h2>
            <p style={{ fontFamily: B, fontSize: '13px', color: '#8B7355', marginBottom: '24px', fontStyle: 'italic' }}>
              Sending to: <strong>{forgotTarget}</strong>
            </p>
            <form onSubmit={handleForgotSendOTP}>
              <ErrorBox msg={error} />
              <button type="submit" disabled={loading} style={btn(loading)}>{loading ? 'Sending...' : 'Send OTP'}</button>
              {backLink('Change contact', () => { setForgotStep(1); setError(''); })}
            </form>
          </>
        )}

        {/* ── FORGOT PASSWORD STEP 3: Enter OTP ── */}
        {mode === 'forgot' && forgotStep === 3 && (
          <>
            <h2 style={{ fontFamily: S, fontSize: '24px', fontWeight: 700, color: dark, marginBottom: '4px' }}>Enter OTP</h2>
            <p style={{ fontFamily: B, fontSize: '13px', color: '#8B7355', marginBottom: '24px', fontStyle: 'italic' }}>
              6-digit code sent to your {forgotChannel === 'email' ? 'email' : 'mobile'}
            </p>
            <form onSubmit={handleForgotVerifyOTP}>
              <SuccessBox msg={success} />
              <OTPInput value={forgotOTP} onChange={setForgotOTP} />
              <ErrorBox msg={error} />
              <button type="submit" disabled={loading} style={btn(loading)}>{loading ? 'Verifying...' : 'Verify OTP'}</button>
              {backLink('Resend OTP', () => { setForgotStep(2); setError(''); setSuccess(''); setForgotOTP(''); })}
            </form>
          </>
        )}

        {/* ── FORGOT PASSWORD STEP 4: New Password ── */}
        {mode === 'forgot' && forgotStep === 4 && (
          <>
            <h2 style={{ fontFamily: S, fontSize: '24px', fontWeight: 700, color: dark, marginBottom: '4px' }}>New Password</h2>
            <p style={{ fontFamily: B, fontSize: '13px', color: '#8B7355', marginBottom: '24px', fontStyle: 'italic' }}>Choose a strong new password</p>
            <form onSubmit={handleResetPassword}>
              <SuccessBox msg={success} />
              <div style={fieldWrap}><label style={label}>New Password</label><input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" required minLength={6} style={inp} /></div>
              <div style={{ ...fieldWrap, marginBottom: '20px' }}><label style={label}>Confirm Password</label><input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" required style={inp} /></div>
              <ErrorBox msg={error} />
              <button type="submit" disabled={loading} style={btn(loading)}>{loading ? 'Resetting...' : 'Reset Password'}</button>
            </form>
          </>
        )}

        {/* ── FIND EMAIL ── */}
        {mode === 'find-email' && (
          <>
            <h2 style={{ fontFamily: S, fontSize: '24px', fontWeight: 700, color: dark, marginBottom: '4px' }}>Find Your Account</h2>
            <p style={{ fontFamily: B, fontSize: '13px', color: '#8B7355', marginBottom: '24px', fontStyle: 'italic' }}>Enter your registered mobile number to find your email</p>
            {!foundEmail ? (
              <form onSubmit={handleFindAccount}>
                <div style={{ ...fieldWrap, marginBottom: '20px' }}>
                  <label style={label}>Registered Mobile Number</label>
                  <input type="tel" value={findPhone} onChange={e => setFindPhone(e.target.value)} placeholder="+91 98765 43210" required style={inp} />
                </div>
                <ErrorBox msg={error} />
                <button type="submit" disabled={loading} style={btn(loading)}>{loading ? 'Searching...' : 'Find Account'}</button>
              </form>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: F, fontSize: '13px', color: '#8B7355', marginBottom: '8px' }}>Your registered email is:</div>
                <div style={{ fontFamily: F, fontSize: '18px', fontWeight: 700, color: dark, background: `${gold}15`, border: `1px solid ${gold}`, borderRadius: '12px', padding: '14px', marginBottom: '20px' }}>{foundEmail}</div>
                <button type="button" onClick={() => { reset('login'); }} style={{ ...btn(false), marginBottom: '8px' }}>Back to Sign In</button>
                <div style={{ fontFamily: F, fontSize: '12px', color: '#8B7355', marginTop: '8px' }}>Use "Forgot Password?" if you've also forgotten your password</div>
              </div>
            )}
            {!foundEmail && backLink('Back to Sign In', () => reset('login'))}
          </>
        )}

      </div>

      <button onClick={() => navigate('/')} style={{ marginTop: '20px', fontFamily: F, fontSize: '13px', color: '#8B7355', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
        ← Back to Home
      </button>
    </div>
  );
}
