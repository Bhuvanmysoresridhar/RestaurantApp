import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db.js';
import { JWT_SECRET } from '../middleware/auth.js';
import { generateOTP, sendOTPEmail } from '../email.js';
import { sendOTPSMS } from '../sms.js';

const router = Router();

const norm = (email) => email.trim().toLowerCase();

async function storeOTP({ target, target_type, otp_code, otp_type }) {
  await pool.query('DELETE FROM otps WHERE LOWER(target)=LOWER($1) AND otp_type=$2', [target, otp_type]);
  const expires_at = new Date(Date.now() + 10 * 60 * 1000);
  await pool.query(
    'INSERT INTO otps (target,target_type,otp_code,otp_type,expires_at) VALUES ($1,$2,$3,$4,$5)',
    [target, target_type, otp_code, otp_type, expires_at]
  );
}

async function verifyOTP({ target, otp_code, otp_type }) {
  const r = await pool.query(
    `SELECT * FROM otps WHERE LOWER(target)=LOWER($1) AND otp_code=$2 AND otp_type=$3 AND used=FALSE AND expires_at>NOW()`,
    [target, otp_code, otp_type]
  );
  if (r.rows.length === 0) return false;
  await pool.query('UPDATE otps SET used=TRUE WHERE id=$1', [r.rows[0].id]);
  return true;
}

router.post('/login', async (req, res) => {
  let { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  email = norm(email);
  try {
    const r = await pool.query('SELECT * FROM admin_users WHERE LOWER(email)=$1 AND is_active=TRUE', [email]);
    if (r.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials or account disabled' });
    const admin = r.rows[0];
    const valid = await bcrypt.compare(password, admin.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign(
      { admin_id: admin.id, name: admin.name, email: admin.email, role: admin.role },
      JWT_SECRET, { expiresIn: '7d' }
    );
    res.json({ admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role }, token });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Login failed' }); }
});

router.post('/send-otp', async (req, res) => {
  let { target, target_type, otp_type } = req.body;
  if (!target || !target_type || !otp_type) return res.status(400).json({ error: 'Missing fields' });
  if (target_type === 'email') target = norm(target);
  try {
    if (otp_type === 'admin_signup') {
      const col = target_type === 'email' ? 'LOWER(email)' : 'phone';
      const ex = await pool.query(`SELECT id FROM admin_users WHERE ${col}=$1`, [target]);
      if (ex.rows.length > 0) return res.status(409).json({ error: `${target_type === 'email' ? 'Email' : 'Phone'} already registered` });
    }
    if (otp_type === 'admin_reset') {
      const col = target_type === 'email' ? 'LOWER(email)' : 'phone';
      const ex = await pool.query(`SELECT id FROM admin_users WHERE ${col}=$1 AND is_active=TRUE`, [target]);
      if (ex.rows.length === 0) return res.status(404).json({ error: `No admin account found with this ${target_type}` });
    }
    const otp = generateOTP();
    await storeOTP({ target, target_type, otp_code: otp, otp_type });
    if (target_type === 'email') {
      await sendOTPEmail({ to: target, otp, type: otp_type === 'admin_signup' ? 'signup' : 'reset' });
    } else {
      await sendOTPSMS({ to: target, otp, type: otp_type === 'admin_signup' ? 'signup' : 'reset' });
    }
    res.json({ message: 'OTP sent' });
  } catch (err) { console.error(err); res.status(500).json({ error: err.message || 'Failed to send OTP' }); }
});

router.post('/complete-signup', async (req, res) => {
  let { name, email, password, phone, otp_code, otp_target, otp_target_type } = req.body;
  if (!name || !email || !password || !otp_code || !otp_target) return res.status(400).json({ error: 'All fields required' });
  email = norm(email);
  otp_target = otp_target_type === 'email' ? norm(otp_target) : otp_target.trim();
  try {
    const ex = await pool.query('SELECT id FROM admin_users WHERE LOWER(email)=$1', [email]);
    if (ex.rows.length > 0) return res.status(409).json({ error: 'Email already registered' });
    const valid = await verifyOTP({ target: otp_target, otp_code, otp_type: 'admin_signup' });
    if (!valid) return res.status(400).json({ error: 'Invalid or expired OTP' });
    const hash = await bcrypt.hash(password, 10);
    const r = await pool.query(
      'INSERT INTO admin_users (name,email,password_hash,phone,role) VALUES ($1,$2,$3,$4,$5) RETURNING id,name,email,role',
      [name, email, hash, phone?.trim() || null, 'STAFF']
    );
    const admin = r.rows[0];
    const token = jwt.sign({ admin_id: admin.id, name: admin.name, email: admin.email, role: admin.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ admin, token });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Signup failed' }); }
});

router.post('/reset-password', async (req, res) => {
  let { target, target_type, otp_code, new_password } = req.body;
  if (!target || !otp_code || !new_password) return res.status(400).json({ error: 'Missing fields' });
  if (target_type === 'email') target = norm(target);
  try {
    const valid = await verifyOTP({ target, otp_code, otp_type: 'admin_reset' });
    if (!valid) return res.status(400).json({ error: 'Invalid or expired OTP' });
    const hash = await bcrypt.hash(new_password, 10);
    const col = target_type === 'email' ? 'LOWER(email)' : 'phone';
    const r = await pool.query(`UPDATE admin_users SET password_hash=$1 WHERE ${col}=$2 RETURNING id`, [hash, target]);
    if (r.rowCount === 0) return res.status(404).json({ error: 'Account not found' });
    res.json({ message: 'Password reset successfully' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Reset failed' }); }
});

router.post('/find-account', async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone required' });
  try {
    const r = await pool.query('SELECT email FROM admin_users WHERE phone=$1 AND is_active=TRUE', [phone.trim()]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'No admin account found with this phone' });
    const email = r.rows[0].email;
    const [user, domain] = email.split('@');
    const masked = user.slice(0, 2) + '*'.repeat(Math.max(1, user.length - 2)) + '@' + domain;
    res.json({ maskedEmail: masked });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

export default router;
