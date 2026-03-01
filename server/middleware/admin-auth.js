import jwt from 'jsonwebtoken';
import { JWT_SECRET } from './auth.js';

export function adminAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET);
    if (!payload.admin_id) return res.status(403).json({ error: 'Not an admin account' });
    req.admin = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function ownerOnly(req, res, next) {
  if (req.admin?.role !== 'OWNER') return res.status(403).json({ error: 'Owner access required' });
  next();
}
