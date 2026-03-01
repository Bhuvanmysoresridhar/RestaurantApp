import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import pool from './db.js';
import authRoutes from './routes/auth.js';
import ordersRoutes from './routes/orders.js';
import reviewsRoutes from './routes/reviews.js';
import adminAuthRoutes from './routes/admin-auth.js';
import adminRoutes from './routes/admin.js';

const app = express();
app.use(cors());
app.use(express.json());

const MENU_SEED = [
  { id:1,  name:'Paneer Tikka',          desc:'Marinated cottage cheese grilled in tandoor with bell peppers', price:220, cat:'Starters',        veg:true,  best:true,  sort:1 },
  { id:2,  name:'Chicken Seekh Kebab',   desc:'Spiced minced chicken skewers, charcoal grilled',              price:260, cat:'Starters',        veg:false, best:false, sort:2 },
  { id:3,  name:'Aloo Tikki Chaat',      desc:'Crispy potato patties with tangy chutneys and yogurt',         price:150, cat:'Starters',        veg:true,  best:false, sort:3 },
  { id:4,  name:'Mutton Shammi Kebab',   desc:'Melt-in-mouth minced mutton patties with aromatic spices',     price:300, cat:'Starters',        veg:false, best:true,  sort:4 },
  { id:5,  name:'Corn Cheese Balls',     desc:'Golden fried corn and cheese balls with mint chutney',         price:180, cat:'Starters',        veg:true,  best:false, sort:5 },
  { id:6,  name:'Tandoori Chicken',      desc:'Half chicken marinated overnight in yogurt & spices',          price:320, cat:'Starters',        veg:false, best:true,  sort:6 },
  { id:7,  name:'Butter Chicken',        desc:'Creamy tomato gravy with tender tandoori chicken pieces',      price:300, cat:'Mains',           veg:false, best:true,  sort:1 },
  { id:8,  name:'Dal Makhani',           desc:'Overnight slow-cooked black lentils in buttery gravy',        price:240, cat:'Mains',           veg:true,  best:true,  sort:2 },
  { id:9,  name:'Mutton Rogan Josh',     desc:'Kashmiri-style slow-cooked mutton in aromatic gravy',         price:360, cat:'Mains',           veg:false, best:true,  sort:3 },
  { id:10, name:'Paneer Butter Masala',  desc:'Cottage cheese cubes in rich, creamy tomato sauce',           price:260, cat:'Mains',           veg:true,  best:false, sort:4 },
  { id:11, name:'Chole Bhature',         desc:'Spiced chickpea curry with fluffy deep-fried bread',          price:200, cat:'Mains',           veg:true,  best:true,  sort:5 },
  { id:12, name:'Chicken Biryani',       desc:'Fragrant dum-style biryani with tender chicken pieces',       price:280, cat:'Mains',           veg:false, best:true,  sort:6 },
  { id:13, name:'Egg Curry',             desc:'Boiled eggs in a rich, spiced onion-tomato gravy',            price:200, cat:'Mains',           veg:false, best:false, sort:7 },
  { id:14, name:'Palak Paneer',          desc:'Fresh spinach gravy with soft cottage cheese cubes',          price:240, cat:'Mains',           veg:true,  best:false, sort:8 },
  { id:15, name:'Butter Naan',           desc:'Soft tandoor bread brushed with butter',                      price:50,  cat:'Breads & Rice',   veg:true,  best:false, sort:1 },
  { id:16, name:'Garlic Naan',           desc:'Naan topped with garlic and coriander',                       price:60,  cat:'Breads & Rice',   veg:true,  best:true,  sort:2 },
  { id:17, name:'Laccha Paratha',        desc:'Flaky layered whole wheat bread',                             price:55,  cat:'Breads & Rice',   veg:true,  best:false, sort:3 },
  { id:18, name:'Jeera Rice',            desc:'Basmati rice tempered with cumin seeds',                      price:140, cat:'Breads & Rice',   veg:true,  best:false, sort:4 },
  { id:19, name:'Veg Pulao',             desc:'Fragrant rice with seasonal vegetables',                      price:180, cat:'Breads & Rice',   veg:true,  best:false, sort:5 },
  { id:20, name:'Stuffed Kulcha',        desc:'Tandoor bread stuffed with spiced potato filling',            price:80,  cat:'Breads & Rice',   veg:true,  best:true,  sort:6 },
  { id:21, name:'Gulab Jamun',           desc:'Soft milk dumplings soaked in rose-scented syrup',            price:100, cat:'Desserts & Drinks', veg:true, best:true,  sort:1 },
  { id:22, name:'Mango Lassi',           desc:'Creamy yogurt smoothie with fresh mango pulp',                price:120, cat:'Desserts & Drinks', veg:true, best:true,  sort:2 },
  { id:23, name:'Gajar Ka Halwa',        desc:'Warm carrot pudding with nuts and khoya',                     price:140, cat:'Desserts & Drinks', veg:true, best:false, sort:3 },
  { id:24, name:'Masala Chai',           desc:'Authentic Indian spiced tea with ginger',                     price:50,  cat:'Desserts & Drinks', veg:true, best:false, sort:4 },
];

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
      status VARCHAR(50) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id SERIAL PRIMARY KEY,
      order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
      item_id INTEGER NOT NULL,
      item_name VARCHAR(255) NOT NULL,
      item_price DECIMAL(10,2) NOT NULL,
      quantity INTEGER NOT NULL,
      category VARCHAR(100),
      item_status VARCHAR(20) DEFAULT 'pending'
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
      otp_type VARCHAR(30) NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      used BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS admin_users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      phone VARCHAR(20),
      role VARCHAR(10) DEFAULT 'STAFF',
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS kitchen_status (
      id INTEGER PRIMARY KEY DEFAULT 1,
      is_open BOOLEAN DEFAULT TRUE,
      updated_at TIMESTAMP DEFAULT NOW(),
      updated_by_id INTEGER REFERENCES admin_users(id)
    );

    CREATE TABLE IF NOT EXISTS menu_items (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT DEFAULT '',
      price DECIMAL(10,2) NOT NULL,
      category VARCHAR(100) NOT NULL,
      is_veg BOOLEAN DEFAULT TRUE,
      is_bestseller BOOLEAN DEFAULT FALSE,
      spice_level VARCHAR(20) DEFAULT 'medium',
      image_url TEXT,
      is_available BOOLEAN DEFAULT TRUE,
      stock_status VARCHAR(20) DEFAULT 'IN_STOCK',
      is_active BOOLEAN DEFAULT TRUE,
      sort_order INTEGER DEFAULT 0,
      created_by INTEGER REFERENCES admin_users(id),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()`);
  await pool.query(`ALTER TABLE order_items ADD COLUMN IF NOT EXISTS item_status VARCHAR(20) DEFAULT 'pending'`);

  await pool.query(`INSERT INTO kitchen_status (id, is_open) VALUES (1, TRUE) ON CONFLICT (id) DO NOTHING`);

  const ownerExists = await pool.query(`SELECT id FROM admin_users WHERE LOWER(email)='owner@stonesandspices.com'`);
  if (ownerExists.rows.length === 0) {
    const hash = await bcrypt.hash('Admin@2024', 10);
    await pool.query(
      `INSERT INTO admin_users (name, email, password_hash, role) VALUES ($1, $2, $3, $4)`,
      ['Komalatha N', 'owner@stonesandspices.com', hash, 'OWNER']
    );
    console.log('Owner account seeded: owner@stonesandspices.com / Admin@2024');
  }

  for (const item of MENU_SEED) {
    await pool.query(
      `INSERT INTO menu_items (id, name, description, price, category, is_veg, is_bestseller, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (id) DO NOTHING`,
      [item.id, item.name, item.desc, item.price, item.cat, item.veg, item.best, item.sort]
    );
  }
  await pool.query(`SELECT setval('menu_items_id_seq', GREATEST((SELECT MAX(id) FROM menu_items), 24))`);

  console.log('Database schema initialized');
};

initDB().catch(console.error);

app.use('/api/auth', authRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.get('/api/kitchen', async (req, res) => {
  try {
    const r = await pool.query('SELECT is_open FROM kitchen_status WHERE id=1');
    res.json(r.rows[0] || { is_open: true });
  } catch { res.json({ is_open: true }); }
});

app.get('/api/menu', async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT id, name, description, price, category, is_veg, is_bestseller, spice_level, image_url, is_available, stock_status
       FROM menu_items WHERE is_active=TRUE ORDER BY category, sort_order, id`
    );
    res.json(r.rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to fetch menu' }); }
});

app.get('/api/stats', async (req, res) => {
  try {
    const [mealsResult, customersResult, bestsellersResult] = await Promise.all([
      pool.query(`SELECT COUNT(*) as count FROM orders`),
      pool.query(`SELECT COUNT(DISTINCT user_id) as count FROM orders`),
      pool.query(`SELECT item_id, SUM(quantity) as total_qty FROM order_items GROUP BY item_id ORDER BY total_qty DESC LIMIT 8`),
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
