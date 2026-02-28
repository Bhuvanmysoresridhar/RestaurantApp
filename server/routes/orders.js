import { Router } from 'express';
import pool from '../db.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const ordersResult = await pool.query(
      `SELECT o.id, o.total_amount, o.delivery_address, o.phone, o.notes, o.status, o.created_at
       FROM orders o
       WHERE o.user_id = $1
       ORDER BY o.created_at DESC`,
      [req.user.id]
    );
    const orders = ordersResult.rows;

    for (const order of orders) {
      const itemsResult = await pool.query(
        `SELECT id, item_id, item_name, item_price, quantity, category
         FROM order_items WHERE order_id = $1`,
        [order.id]
      );
      order.items = itemsResult.rows;

      const reviewedResult = await pool.query(
        `SELECT item_id FROM reviews WHERE order_id = $1 AND user_id = $2`,
        [order.id, req.user.id]
      );
      order.reviewed_item_ids = reviewedResult.rows.map(r => r.item_id);
    }

    res.json(orders);
  } catch (err) {
    console.error('Get orders error:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

router.post('/', async (req, res) => {
  const { items, total_amount, delivery_address, phone, notes } = req.body;
  if (!items || !items.length || !total_amount || !delivery_address) {
    return res.status(400).json({ error: 'Items, total, and address are required' });
  }
  try {
    const orderResult = await pool.query(
      `INSERT INTO orders (user_id, total_amount, delivery_address, phone, notes)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [req.user.id, total_amount, delivery_address, phone || null, notes || null]
    );
    const orderId = orderResult.rows[0].id;

    for (const item of items) {
      await pool.query(
        `INSERT INTO order_items (order_id, item_id, item_name, item_price, quantity, category)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [orderId, item.id, item.name, item.price, item.qty, item.category || '']
      );
    }

    res.json({ orderId, message: 'Order placed successfully' });
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ error: 'Failed to place order' });
  }
});

router.get('/:id/invoice', async (req, res) => {
  try {
    const orderResult = await pool.query(
      `SELECT o.*, u.name as user_name, u.email as user_email
       FROM orders o JOIN users u ON o.user_id = u.id
       WHERE o.id = $1 AND o.user_id = $2`,
      [req.params.id, req.user.id]
    );
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    const order = orderResult.rows[0];
    const itemsResult = await pool.query(
      `SELECT * FROM order_items WHERE order_id = $1`,
      [order.id]
    );
    order.items = itemsResult.rows;
    res.json(order);
  } catch (err) {
    console.error('Invoice error:', err);
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
});

export default router;
