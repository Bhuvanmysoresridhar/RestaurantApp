import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db.js';
import { JWT_SECRET } from '../middleware/auth.js';
import { generateOTP, sendOTPEmail } from '../email.js';
import { sendOTPSMS } from '../sms.js';

const router = Router();

function normalizeTarget(target, target_type) {
  return target_type === 'email' ? target.trim().toLowerCase() : target.trim();
}

async function storeOTP({ target, target_type, otp_code, otp_type }) {
  await pool.query(
    'DELETE FROM otps WHERE LOWER(target) = LOWER($1) AND otp_type = $2',
    [target, otp_type]
  );
  const expires_at = new Date(Date.now() + 10 * 60 * 1000);
  await pool.query(
    'INSERT INTO otps (target, target_type, otp_code, otp_type, expires_at) VALUES ($1, $2, $3, $4, $5)',
    [target, target_type, otp_code, otp_type, expires_at]
  );
}

async function verifyOTPCode({ target, otp_code, otp_type }) {
  const result = await pool.query(
    `SELECT * FROM otps WHERE LOWER(target)=LOWER($1) AND otp_code=$2 AND otp_type=$3 AND used=FALSE AND expires_at > NOW()`,
    [target, otp_code, otp_type]
  );
  if (result.rows.length === 0) return false;
  await pool.query('UPDATE otps SET used=TRUE WHERE id=$1', [result.rows[0].id]);
  return true;
}

router.post('/send-otp', async (req, res) => {
  let { target, target_type, otp_type } = req.body;
  if (!target || !target_type || !otp_type)
    return res.status(400).json({ error: 'Missing required fields' });

  target = normalizeTarget(target, target_type);

  try {
    if (otp_type === 'signup' && target_type === 'email') {
      const ex = await pool.query('SELECT id FROM users WHERE LOWER(email)=$1', [target]);
      if (ex.rows.length > 0) return res.status(409).json({ error: 'Email already registered' });
    }
    if (otp_type === 'signup' && target_type === 'phone') {
      const ex = await pool.query('SELECT id FROM users WHERE phone=$1', [target]);
      if (ex.rows.length > 0) return res.status(409).json({ error: 'Phone already registered' });
    }
    if (otp_type === 'reset') {
      const col = target_type === 'email' ? 'LOWER(email)' : 'phone';
      const ex = await pool.query(`SELECT id FROM users WHERE ${col}=$1`, [target]);
      if (ex.rows.length === 0)
        return res.status(404).json({ error: `No account found with this ${target_type}` });
    }

    const otp = generateOTP();
    await storeOTP({ target, target_type, otp_code: otp, otp_type });

    if (target_type === 'email') {
      await sendOTPEmail({ to: target, otp, type: otp_type });
    } else {
      await sendOTPSMS({ to: target, otp, type: otp_type });
    }

    res.json({ message: 'OTP sent successfully' });
  } catch (err) {
    console.error('Send OTP error:', err);
    res.status(500).json({ error: err.message || 'Failed to send OTP' });
  }
});

router.post('/complete-signup', async (req, res) => {
  let { name, email, password, phone, otp_code, otp_target, otp_target_type } = req.body;
  if (!name || !email || !password || !otp_code || !otp_target)
    return res.status(400).json({ error: 'All fields required' });

  email = email.trim().toLowerCase();
  otp_target = normalizeTarget(otp_target, otp_target_type);

  try {
    const ex = await pool.query('SELECT id FROM users WHERE LOWER(email)=$1', [email]);
    if (ex.rows.length > 0) return res.status(409).json({ error: 'Email already registered' });

    const valid = await verifyOTPCode({ target: otp_target, otp_code, otp_type: 'signup' });
    if (!valid) return res.status(400).json({ error: 'Invalid or expired OTP' });

    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash, phone) VALUES ($1,$2,$3,$4) RETURNING id,name,email',
      [name, email, hash, phone ? phone.trim() : null]
    );
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ user, token });
  } catch (err) {
    console.error('Complete signup error:', err);
    res.status(500).json({ error: 'Signup failed' });
  }
});

router.post('/reset-password', async (req, res) => {
  let { target, target_type, otp_code, new_password } = req.body;
  if (!target || !otp_code || !new_password)
    return res.status(400).json({ error: 'Missing fields' });

  target = normalizeTarget(target, target_type);

  try {
    const valid = await verifyOTPCode({ target, otp_code, otp_type: 'reset' });
    if (!valid) return res.status(400).json({ error: 'Invalid or expired OTP' });

    const hash = await bcrypt.hash(new_password, 10);
    let result;
    if (target_type === 'email') {
      result = await pool.query(
        'UPDATE users SET password_hash=$1 WHERE LOWER(email)=$2 RETURNING id',
        [hash, target]
      );
    } else {
      result = await pool.query(
        'UPDATE users SET password_hash=$1 WHERE phone=$2 RETURNING id',
        [hash, target]
      );
    }
    if (result.rowCount === 0) return res.status(404).json({ error: 'Account not found' });
    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Password reset failed' });
  }
});

router.post('/find-account', async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone number required' });
  try {
    const result = await pool.query('SELECT email FROM users WHERE phone=$1', [phone.trim()]);
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'No account found with this phone number' });
    const email = result.rows[0].email;
    const [user, domain] = email.split('@');
    const masked = user.slice(0, 2) + '*'.repeat(Math.max(1, user.length - 2)) + '@' + domain;
    res.json({ maskedEmail: masked });
  } catch (err) {
    console.error('Find account error:', err);
    res.status(500).json({ error: 'Failed to find account' });
  }
});

router.post('/login', async (req, res) => {
  let { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  email = email.trim().toLowerCase();
  try {
    const result = await pool.query('SELECT * FROM users WHERE LOWER(email)=$1', [email]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid email or password' });
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });
    const token = jwt.sign({ id: user.id, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ user: { id: user.id, name: user.name, email: user.email }, token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login' });
  }
});

export default router;
