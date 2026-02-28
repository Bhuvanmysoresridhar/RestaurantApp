import { Router } from 'express';
import pool from '../db.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/recent', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.id, u.name as user_name, r.item_name, r.rating, r.review_text, r.created_at
       FROM reviews r JOIN users u ON r.user_id = u.id
       ORDER BY r.created_at DESC LIMIT 10`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Recent reviews error:', err);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.id, u.name as user_name, r.item_name, r.item_id, r.rating, r.review_text, r.created_at,
              r.user_id,
              (SELECT COUNT(*) FROM review_comments rc WHERE rc.review_id = r.id) as comment_count
       FROM reviews r JOIN users u ON r.user_id = u.id
       ORDER BY r.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get reviews error:', err);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

router.post('/', async (req, res) => {
  const { order_id, item_id, item_name, rating, review_text } = req.body;
  if (!order_id || !item_id || !item_name || !rating) {
    return res.status(400).json({ error: 'order_id, item_id, item_name, and rating are required' });
  }
  if (rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }
  try {
    const orderCheck = await pool.query(
      `SELECT id FROM orders WHERE id = $1 AND user_id = $2`,
      [order_id, req.user.id]
    );
    if (orderCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Order not found or not yours' });
    }
    const existing = await pool.query(
      `SELECT id FROM reviews WHERE order_id = $1 AND item_id = $2 AND user_id = $3`,
      [order_id, item_id, req.user.id]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'You have already reviewed this item for this order' });
    }
    const result = await pool.query(
      `INSERT INTO reviews (user_id, order_id, item_id, item_name, rating, review_text)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.user.id, order_id, item_id, item_name, rating, review_text || null]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Create review error:', err);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

router.get('/:id/comments', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT rc.id, rc.comment_text, rc.created_at, u.name as user_name
       FROM review_comments rc JOIN users u ON rc.user_id = u.id
       WHERE rc.review_id = $1
       ORDER BY rc.created_at ASC`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get comments error:', err);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

router.post('/:id/comments', async (req, res) => {
  const { comment_text } = req.body;
  if (!comment_text || !comment_text.trim()) {
    return res.status(400).json({ error: 'Comment text is required' });
  }
  try {
    const reviewCheck = await pool.query(`SELECT id FROM reviews WHERE id = $1`, [req.params.id]);
    if (reviewCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }
    const result = await pool.query(
      `INSERT INTO review_comments (review_id, user_id, user_name, comment_text)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.params.id, req.user.id, req.user.name, comment_text.trim()]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Add comment error:', err);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

export default router;
