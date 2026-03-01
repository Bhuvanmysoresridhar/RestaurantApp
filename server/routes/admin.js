import { Router } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../db.js';
import { adminAuth, ownerOnly } from '../middleware/admin-auth.js';

const router = Router();
router.use(adminAuth);

const ORDER_STATUSES = ['pending','accepted','preparing','ready_for_delivery','out_for_delivery','delivered','completed','rejected','cancelled'];
const ITEM_STATUSES = ['pending','preparing','done'];

router.get('/orders', async (req, res) => {
  const { status, search, limit = 100, offset = 0 } = req.query;
  try {
    let where = [];
    const params = [];
    if (status && status !== 'all') {
      params.push(status); where.push(`o.status=$${params.length}`);
    }
    if (search) {
      params.push(`%${search}%`);
      where.push(`(u.name ILIKE $${params.length} OR u.email ILIKE $${params.length} OR CAST(o.id AS TEXT) LIKE $${params.length} OR o.phone ILIKE $${params.length})`);
    }
    const clause = where.length ? 'WHERE ' + where.join(' AND ') : '';
    params.push(parseInt(limit), parseInt(offset));
    const r = await pool.query(`
      SELECT o.id, o.total_amount, o.delivery_address, o.phone as order_phone,
             o.notes, o.status, o.created_at, o.updated_at,
             u.id as user_id, u.name as user_name, u.email as user_email,
             COUNT(oi.id)::int as item_count
      FROM orders o
      JOIN users u ON o.user_id=u.id
      LEFT JOIN order_items oi ON oi.order_id=o.id
      ${clause}
      GROUP BY o.id, u.id
      ORDER BY o.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `, params);
    res.json(r.rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to fetch orders' }); }
});

router.get('/orders/:id', async (req, res) => {
  try {
    const order = await pool.query(
      `SELECT o.*, u.name as user_name, u.email as user_email FROM orders o JOIN users u ON o.user_id=u.id WHERE o.id=$1`,
      [req.params.id]
    );
    if (order.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    const items = await pool.query('SELECT * FROM order_items WHERE order_id=$1 ORDER BY id', [req.params.id]);
    res.json({ ...order.rows[0], items: items.rows });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

router.patch('/orders/:id/status', async (req, res) => {
  const { status } = req.body;
  if (!ORDER_STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status' });
  try {
    if (status === 'accepted' || status === 'preparing') {
      await pool.query(`UPDATE order_items SET item_status='preparing' WHERE order_id=$1 AND item_status='pending'`, [req.params.id]);
    }
    const r = await pool.query(
      `UPDATE orders SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING *`,
      [status, req.params.id]
    );
    if (r.rowCount === 0) return res.status(404).json({ error: 'Order not found' });
    res.json(r.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

router.patch('/order-items/:id/status', async (req, res) => {
  const { item_status } = req.body;
  if (!ITEM_STATUSES.includes(item_status)) return res.status(400).json({ error: 'Invalid status' });
  try {
    const r = await pool.query(
      `UPDATE order_items SET item_status=$1 WHERE id=$2 RETURNING *`,
      [item_status, req.params.id]
    );
    if (r.rowCount === 0) return res.status(404).json({ error: 'Item not found' });
    const chk = await pool.query(
      `SELECT COUNT(*)::int as total, SUM(CASE WHEN item_status='done' THEN 1 ELSE 0 END)::int as done_count FROM order_items WHERE order_id=$1`,
      [r.rows[0].order_id]
    );
    const { total, done_count } = chk.rows[0];
    res.json({ ...r.rows[0], all_done: done_count === total });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

router.get('/kitchen', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM kitchen_status WHERE id=1');
    res.json(r.rows[0] || { is_open: true });
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

router.patch('/kitchen', async (req, res) => {
  const { is_open } = req.body;
  try {
    const r = await pool.query(
      `UPDATE kitchen_status SET is_open=$1, updated_at=NOW(), updated_by_id=$2 WHERE id=1 RETURNING *`,
      [is_open, req.admin.admin_id]
    );
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

router.get('/menu', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM menu_items ORDER BY category, sort_order, id');
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

router.post('/menu', async (req, res) => {
  const { name, description, price, category, is_veg, spice_level, image_url } = req.body;
  if (!name || !price || !category) return res.status(400).json({ error: 'Name, price and category required' });
  try {
    const r = await pool.query(
      `INSERT INTO menu_items (name,description,price,category,is_veg,spice_level,image_url,created_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [name, description || '', parseFloat(price), category, is_veg || false, spice_level || 'medium', image_url || null, req.admin.admin_id]
    );
    res.json(r.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to add item' }); }
});

router.patch('/menu/:id', async (req, res) => {
  const fields = ['name','description','price','category','is_veg','spice_level','image_url','is_available','stock_status','is_active'];
  const sets = []; const params = [];
  for (const f of fields) {
    if (req.body[f] !== undefined) { params.push(req.body[f]); sets.push(`${f}=$${params.length}`); }
  }
  if (sets.length === 0) return res.status(400).json({ error: 'Nothing to update' });
  sets.push('updated_at=NOW()');
  params.push(req.params.id);
  try {
    const r = await pool.query(`UPDATE menu_items SET ${sets.join(',')} WHERE id=$${params.length} RETURNING *`, params);
    if (r.rowCount === 0) return res.status(404).json({ error: 'Item not found' });
    res.json(r.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

router.get('/analytics', ownerOnly, async (req, res) => {
  try {
    const [todayR, monthR, yearR, byDayR, topItemsR] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int as orders, COALESCE(SUM(total_amount),0)::numeric as revenue, COALESCE(AVG(total_amount),0)::numeric as avg_order FROM orders WHERE DATE(created_at AT TIME ZONE 'Asia/Kolkata')=CURRENT_DATE AND status NOT IN ('pending','rejected','cancelled')`),
      pool.query(`SELECT COUNT(*)::int as orders, COALESCE(SUM(total_amount),0)::numeric as revenue FROM orders WHERE DATE_TRUNC('month',created_at)=DATE_TRUNC('month',NOW()) AND status NOT IN ('pending','rejected','cancelled')`),
      pool.query(`SELECT COUNT(*)::int as orders, COALESCE(SUM(total_amount),0)::numeric as revenue FROM orders WHERE DATE_TRUNC('year',created_at)=DATE_TRUNC('year',NOW()) AND status NOT IN ('pending','rejected','cancelled')`),
      pool.query(`SELECT DATE(created_at) as date, COUNT(*)::int as orders, COALESCE(SUM(total_amount),0)::numeric as revenue FROM orders WHERE created_at>=NOW()-INTERVAL '30 days' AND status NOT IN ('pending','rejected','cancelled') GROUP BY DATE(created_at) ORDER BY date ASC`),
      pool.query(`SELECT oi.item_name, SUM(oi.quantity)::int as total_qty, SUM(oi.item_price*oi.quantity)::numeric as revenue FROM order_items oi JOIN orders o ON o.id=oi.order_id WHERE o.status NOT IN ('pending','rejected','cancelled') GROUP BY oi.item_name ORDER BY total_qty DESC LIMIT 10`),
    ]);
    res.json({ today: todayR.rows[0], month: monthR.rows[0], year: yearR.rows[0], by_day: byDayR.rows, top_items: topItemsR.rows });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

router.get('/staff', ownerOnly, async (req, res) => {
  try {
    const r = await pool.query('SELECT id,name,email,phone,role,is_active,created_at FROM admin_users ORDER BY created_at');
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

router.post('/staff', ownerOnly, async (req, res) => {
  let { name, email, password, phone, role } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password required' });
  email = email.trim().toLowerCase();
  role = ['OWNER', 'STAFF'].includes(role?.toUpperCase()) ? role.toUpperCase() : 'STAFF';
  try {
    const ex = await pool.query('SELECT id FROM admin_users WHERE LOWER(email)=$1', [email]);
    if (ex.rows.length > 0) return res.status(409).json({ error: 'Email already exists' });
    const hash = await bcrypt.hash(password, 10);
    const r = await pool.query(
      'INSERT INTO admin_users (name,email,password_hash,phone,role) VALUES ($1,$2,$3,$4,$5) RETURNING id,name,email,role,is_active,created_at',
      [name, email, hash, phone?.trim() || null, role]
    );
    res.json(r.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

router.patch('/staff/:id', ownerOnly, async (req, res) => {
  const { is_active, new_password } = req.body;
  try {
    if (new_password) {
      const hash = await bcrypt.hash(new_password, 10);
      await pool.query('UPDATE admin_users SET password_hash=$1 WHERE id=$2', [hash, req.params.id]);
    }
    if (is_active !== undefined) {
      await pool.query('UPDATE admin_users SET is_active=$1 WHERE id=$2', [is_active, req.params.id]);
    }
    const r = await pool.query('SELECT id,name,email,role,is_active,created_at FROM admin_users WHERE id=$1', [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Staff not found' });
    res.json(r.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

export default router;
