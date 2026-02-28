import express from 'express';
import cors from 'cors';
import pool from './db.js';
import authRoutes from './routes/auth.js';
import ordersRoutes from './routes/orders.js';
import reviewsRoutes from './routes/reviews.js';

const app = express();
app.use(cors());
app.use(express.json());

const initDB = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      phone VARCHAR(20),
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      total_amount DECIMAL(10,2) NOT NULL,
      delivery_address TEXT NOT NULL,
      phone VARCHAR(20),
      notes TEXT,
      status VARCHAR(50) DEFAULT 'confirmed',
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id SERIAL PRIMARY KEY,
      order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
      item_id INTEGER NOT NULL,
      item_name VARCHAR(255) NOT NULL,
      item_price DECIMAL(10,2) NOT NULL,
      quantity INTEGER NOT NULL,
      category VARCHAR(100)
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      order_id INTEGER REFERENCES orders(id),
      item_id INTEGER NOT NULL,
      item_name VARCHAR(255) NOT NULL,
      rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
      review_text TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS review_comments (
      id SERIAL PRIMARY KEY,
      review_id INTEGER REFERENCES reviews(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id),
      user_name VARCHAR(255) NOT NULL,
      comment_text TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS otps (
      id SERIAL PRIMARY KEY,
      target VARCHAR(255) NOT NULL,
      target_type VARCHAR(10) NOT NULL,
      otp_code VARCHAR(6) NOT NULL,
      otp_type VARCHAR(20) NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      used BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
  console.log('Database schema initialized');
};

initDB().catch(console.error);

app.use('/api/auth', authRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/reviews', reviewsRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.get('/api/stats', async (req, res) => {
  try {
    const [mealsResult, customersResult, bestsellersResult] = await Promise.all([
      pool.query(`SELECT COUNT(*) as count FROM orders`),
      pool.query(`SELECT COUNT(DISTINCT user_id) as count FROM orders`),
      pool.query(`
        SELECT item_id, SUM(quantity) as total_qty
        FROM order_items
        GROUP BY item_id
        ORDER BY total_qty DESC
        LIMIT 8
      `),
    ]);
    res.json({
      meals_served: parseInt(mealsResult.rows[0].count),
      happy_customers: parseInt(customersResult.rows[0].count),
      bestseller_ids: bestsellersResult.rows.map(r => r.item_id),
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
