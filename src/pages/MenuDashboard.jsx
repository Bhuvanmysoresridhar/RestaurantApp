import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const gold = '#D4A017';
const dark = '#2A1810';
const F = "'Outfit', sans-serif";
const S = "'Cormorant Garamond', serif";
const B = "'Lora', serif";

const CATEGORIES = ['Starters', 'Mains', 'Breads & Rice', 'Desserts & Drinks'];

export default function MenuDashboard() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [menu, setMenu] = useState({});
  const [menuLoading, setMenuLoading] = useState(true);
  const [kitchenOpen, setKitchenOpen] = useState(true);
  const [cart, setCart] = useState({});
  const [activeCategory, setActiveCategory] = useState('Starters');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [form, setForm] = useState({ phone: '', address: '', notes: '' });
  const [placing, setPlacing] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [bestsellerIds, setBestsellerIds] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/menu').then(r => r.json()),
      fetch('/api/kitchen').then(r => r.json()),
      fetch('/api/stats').then(r => r.json()).catch(() => ({})),
    ]).then(([menuData, kitchenData, statsData]) => {
      if (Array.isArray(menuData)) {
        const grouped = {};
        CATEGORIES.forEach(cat => { grouped[cat] = []; });
        menuData.forEach(item => {
          const cat = item.category;
          if (!grouped[cat]) grouped[cat] = [];
          grouped[cat].push(item);
        });
        setMenu(grouped);
        const firstCatWithItems = CATEGORIES.find(c => grouped[c]?.length > 0) || CATEGORIES[0];
        setActiveCategory(firstCatWithItems);
      }
      if (typeof kitchenData?.is_open === 'boolean') setKitchenOpen(kitchenData.is_open);
      if (statsData?.bestseller_ids) setBestsellerIds(statsData.bestseller_ids);
    }).catch(() => {}).finally(() => setMenuLoading(false));
  }, []);

  const addToCart = (id) => {
    const allItems = Object.values(menu).flat();
    const item = allItems.find(i => i.id === id);
    if (!item || !item.is_available || item.stock_status === 'OUT_OF_STOCK') return;
    setCart(c => ({ ...c, [id]: (c[id] || 0) + 1 }));
  };
  const removeFromCart = (id) => setCart(c => { const n = { ...c }; if (n[id] > 1) n[id]--; else delete n[id]; return n; });

  const isBest = (item) => bestsellerIds !== null ? bestsellerIds.includes(item.id) : item.is_bestseller;

  const allItems = Object.values(menu).flat();
  const cartItems = Object.entries(cart).map(([id, qty]) => ({ ...allItems.find(i => i.id === +id), qty })).filter(i => i.name);
  const cartTotal = cartItems.reduce((s, i) => s + parseFloat(i.price) * i.qty, 0);
  const cartCount = Object.values(cart).reduce((s, q) => s + q, 0);

  const currentCatItems = menu[activeCategory] || [];
  const filteredItems = currentCatItems.filter(item => {
    if (filter === 'veg' && !item.is_veg) return false;
    if (filter === 'nonveg' && item.is_veg) return false;
    if (search && !item.name.toLowerCase().includes(search.toLowerCase()) && !(item.description || '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleOrder = async () => {
    if (!kitchenOpen) { setOrderError('Kitchen is currently closed. Orders cannot be placed.'); return; }
    if (!form.address || !form.phone) { setOrderError('Please fill in phone and address'); return; }
    setPlacing(true); setOrderError('');
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          items: cartItems.map(i => ({ id: i.id, name: i.name, price: parseFloat(i.price), qty: i.qty, category: i.category })),
          total_amount: cartTotal,
          delivery_address: form.address,
          phone: form.phone,
          notes: form.notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setShowCheckout(false);
      setOrderPlaced(true);
      setTimeout(() => { setOrderPlaced(false); setCart({}); navigate('/orders'); }, 3500);
    } catch (err) {
      setOrderError(err.message || 'Failed to place order');
    } finally { setPlacing(false); }
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';
  const availableCategories = CATEGORIES.filter(c => menu[c]?.length > 0);

  return (
    <div style={{ fontFamily: B, background: '#FBF7F0', minHeight: '100vh', color: dark }}>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Lora:ital,wght@0,400;0,500;0,600;1,400&family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />

      <div style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(251,247,240,0.97)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(139,90,43,0.08)', padding: '10px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#6B5244', padding: '4px 8px' }}>←</button>
          <div>
            <div style={{ fontFamily: S, fontSize: '18px', fontWeight: 700, color: dark, lineHeight: 1.1 }}>Stones & Spices</div>
            <div style={{ fontFamily: F, fontSize: '8px', letterSpacing: '2.5px', textTransform: 'uppercase', color: '#B8860B', fontWeight: 600 }}>Order Menu</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={() => navigate('/orders')} style={{ fontFamily: F, fontSize: '12px', fontWeight: 600, color: '#6B5244', background: 'rgba(42,24,16,0.04)', border: 'none', padding: '8px 14px', borderRadius: '50px', cursor: 'pointer' }}>📋 My Orders</button>
          <button onClick={() => navigate('/reviews')} style={{ fontFamily: F, fontSize: '12px', fontWeight: 600, color: '#6B5244', background: 'rgba(42,24,16,0.04)', border: 'none', padding: '8px 14px', borderRadius: '50px', cursor: 'pointer' }}>⭐ Reviews</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'rgba(42,24,16,0.04)', borderRadius: '50px' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: `linear-gradient(135deg,#8B5A2B,${gold})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F, fontSize: '10px', fontWeight: 700, color: '#fff' }}>{initials}</div>
            <span style={{ fontFamily: F, fontSize: '12px', fontWeight: 600, color: dark }}>{user?.name?.split(' ')[0]}</span>
          </div>
          <button onClick={() => { logout(); navigate('/'); }} style={{ fontFamily: F, fontSize: '12px', fontWeight: 600, color: '#8B7355', background: 'none', border: '1px solid rgba(139,90,43,0.15)', padding: '7px 14px', borderRadius: '50px', cursor: 'pointer' }}>Sign Out</button>
          <button onClick={() => setShowCart(true)} style={{ fontFamily: F, fontSize: '13px', fontWeight: 700, background: cartCount > 0 ? `linear-gradient(135deg,${gold},#B8860B)` : 'rgba(42,24,16,0.06)', color: cartCount > 0 ? '#fff' : '#8B7355', border: 'none', padding: '10px 22px', borderRadius: '50px', cursor: 'pointer', boxShadow: cartCount > 0 ? '0 3px 16px rgba(212,160,23,0.3)' : 'none' }}>
            🛒 {cartCount > 0 ? `${cartCount} · ₹${cartTotal}` : 'Cart'}
          </button>
        </div>
      </div>

      {!kitchenOpen && (
        <div style={{ background: '#DC2626', color: '#fff', textAlign: 'center', padding: '12px 20px', fontFamily: F, fontSize: '14px', fontWeight: 700 }}>
          🔴 Kitchen is currently CLOSED — Orders cannot be placed right now. Please check back later.
        </div>
      )}

      <div style={{ padding: '16px 28px 0', maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: '16px', opacity: 0.4 }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search dishes..."
              style={{ width: '100%', padding: '11px 14px 11px 40px', borderRadius: '14px', border: '1px solid rgba(139,90,43,0.1)', background: '#fff', fontFamily: B, fontSize: '14px', outline: 'none', color: dark, boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {[['all', 'All'], ['veg', '🟢 Veg'], ['nonveg', '🔴 Non-Veg']].map(([v, l]) => (
              <button key={v} onClick={() => setFilter(v)} style={{ fontFamily: F, fontSize: '12px', fontWeight: 600, padding: '9px 16px', borderRadius: '50px', cursor: 'pointer', border: filter === v ? `2px solid ${gold}` : '1.5px solid rgba(139,90,43,0.1)', background: filter === v ? `${gold}12` : '#fff', color: filter === v ? gold : '#8B7355' }}>{l}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: '14px 28px 0', maxWidth: '1000px', margin: '0 auto', display: 'flex', gap: '8px', overflowX: 'auto' }}>
        {availableCategories.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)} style={{ fontFamily: F, fontSize: '13px', fontWeight: activeCategory === cat ? 700 : 500, padding: '10px 20px', borderRadius: '50px', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', background: activeCategory === cat ? dark : 'rgba(42,24,16,0.04)', color: activeCategory === cat ? '#fff' : '#8B7355' }}>{cat}</button>
        ))}
      </div>

      <div style={{ padding: '8px 28px 100px', maxWidth: '1000px', margin: '0 auto' }}>
        {menuLoading ? (
          <div style={{ textAlign: 'center', padding: '60px', fontFamily: F, color: '#8B7355' }}>Loading menu...</div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {filteredItems.map(item => {
                const qty = cart[item.id] || 0;
                const unavailable = !item.is_available;
                const outOfStock = item.stock_status === 'OUT_OF_STOCK';
                const disabled = unavailable || outOfStock;
                return (
                  <div key={item.id} style={{ background: '#fff', borderRadius: '18px', padding: '22px', border: '1px solid rgba(139,90,43,0.06)', boxShadow: '0 2px 12px rgba(42,24,16,0.03)', position: 'relative', overflow: 'hidden', transition: 'box-shadow 0.3s', opacity: disabled ? 0.65 : 1 }}
                    onMouseOver={e => !disabled && (e.currentTarget.style.boxShadow = '0 8px 28px rgba(42,24,16,0.08)')}
                    onMouseOut={e => e.currentTarget.style.boxShadow = '0 2px 12px rgba(42,24,16,0.03)'}>
                    {isBest(item) && !disabled && <div style={{ position: 'absolute', top: 12, right: 12, fontFamily: F, fontSize: '9px', fontWeight: 700, background: `linear-gradient(135deg,${gold},#B8860B)`, color: '#fff', padding: '3px 10px', borderRadius: '50px', letterSpacing: '0.5px' }}>★ BESTSELLER</div>}
                    {outOfStock && <div style={{ position: 'absolute', top: 12, right: 12, fontFamily: F, fontSize: '9px', fontWeight: 700, background: '#EF4444', color: '#fff', padding: '3px 10px', borderRadius: '50px' }}>OUT OF STOCK</div>}
                    {unavailable && !outOfStock && <div style={{ position: 'absolute', top: 12, right: 12, fontFamily: F, fontSize: '9px', fontWeight: 700, background: '#6B7280', color: '#fff', padding: '3px 10px', borderRadius: '50px' }}>NOT AVAILABLE</div>}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span style={{ width: 10, height: 10, borderRadius: '2px', border: `1.5px solid ${item.is_veg ? '#2E7D32' : '#C0392B'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: item.is_veg ? '#2E7D32' : '#C0392B' }} />
                      </span>
                      <h3 style={{ fontFamily: S, fontSize: '20px', fontWeight: 600, color: dark, margin: 0 }}>{item.name}</h3>
                    </div>
                    <p style={{ fontFamily: B, fontSize: '13px', color: '#8B7355', lineHeight: 1.6, marginBottom: '12px' }}>{item.description}</p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <span style={{ fontFamily: F, fontSize: '18px', fontWeight: 700, color: dark }}>₹{parseFloat(item.price).toFixed(0)}</span>
                      </div>
                      {disabled ? (
                        <span style={{ fontFamily: F, fontSize: '11px', fontWeight: 600, color: '#9CA3AF', padding: '6px 14px', borderRadius: '50px', border: '1.5px solid #E5E7EB' }}>{outOfStock ? 'Out of Stock' : 'Unavailable'}</span>
                      ) : qty === 0 ? (
                        <button onClick={() => addToCart(item.id)} style={{ fontFamily: F, fontSize: '12px', fontWeight: 700, padding: '8px 20px', borderRadius: '50px', border: `1.5px solid ${gold}`, background: 'transparent', color: gold, cursor: 'pointer' }}
                          onMouseOver={e => { e.target.style.background = gold; e.target.style.color = '#fff'; }}
                          onMouseOut={e => { e.target.style.background = 'transparent'; e.target.style.color = gold; }}>ADD</button>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: `${gold}10`, borderRadius: '50px', padding: '4px 6px' }}>
                          <button onClick={() => removeFromCart(item.id)} style={{ width: 30, height: 30, borderRadius: '50%', border: `1.5px solid ${gold}`, background: 'transparent', color: gold, fontSize: '16px', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                          <span style={{ fontFamily: F, fontSize: '15px', fontWeight: 700, color: dark, minWidth: '20px', textAlign: 'center' }}>{qty}</span>
                          <button onClick={() => addToCart(item.id)} style={{ width: 30, height: 30, borderRadius: '50%', border: 'none', background: gold, color: '#fff', fontSize: '16px', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {filteredItems.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>🍽️</div>
                <p style={{ fontFamily: F, fontSize: '15px', color: '#8B7355' }}>No dishes found. Try a different search or filter.</p>
              </div>
            )}
          </>
        )}
      </div>

      {cartCount > 0 && !showCart && !showCheckout && (
        <div style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 90, background: dark, borderRadius: '50px', padding: '12px 28px', display: 'flex', alignItems: 'center', gap: '20px', boxShadow: '0 8px 32px rgba(42,24,16,0.3)' }}>
          <span style={{ fontFamily: F, fontSize: '14px', fontWeight: 600, color: 'rgba(251,247,240,0.7)' }}>{cartCount} item{cartCount > 1 ? 's' : ''}</span>
          <span style={{ fontFamily: F, fontSize: '18px', fontWeight: 700, color: gold }}>₹{cartTotal}</span>
          <button onClick={() => setShowCart(true)} style={{ fontFamily: F, fontSize: '13px', fontWeight: 700, background: `linear-gradient(135deg,${gold},#B8860B)`, color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '50px', cursor: 'pointer' }}>View Cart →</button>
        </div>
      )}

      {showCart && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', justifyContent: 'flex-end' }}>
          <div onClick={() => setShowCart(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(42,24,16,0.5)', backdropFilter: 'blur(4px)' }} />
          <div style={{ position: 'relative', width: '420px', maxWidth: '90vw', background: '#FBF7F0', height: '100%', overflowY: 'auto', boxShadow: '-8px 0 40px rgba(42,24,16,0.2)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(139,90,43,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: 'rgba(251,247,240,0.97)', backdropFilter: 'blur(20px)', zIndex: 1 }}>
              <h2 style={{ fontFamily: S, fontSize: '24px', fontWeight: 700, color: dark, margin: 0 }}>Your Cart</h2>
              <button onClick={() => setShowCart(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#8B7355' }}>✕</button>
            </div>
            {!kitchenOpen && (
              <div style={{ background: '#FEE2E2', color: '#DC2626', padding: '10px 16px', fontFamily: F, fontSize: '13px', fontWeight: 600, textAlign: 'center' }}>
                🔴 Kitchen is currently closed. Checkout unavailable.
              </div>
            )}
            {cartItems.length === 0 ? (
              <div style={{ padding: '60px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>🛒</div>
                <p style={{ fontFamily: F, fontSize: '15px', color: '#8B7355' }}>Your cart is empty</p>
              </div>
            ) : (
              <>
                <div style={{ padding: '16px 24px' }}>
                  {cartItems.map(item => (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 0', borderBottom: '1px solid rgba(139,90,43,0.05)' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.is_veg ? '#2E7D32' : '#C0392B', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: F, fontSize: '14px', fontWeight: 600, color: dark }}>{item.name}</div>
                        <div style={{ fontFamily: F, fontSize: '13px', color: '#8B7355' }}>₹{parseFloat(item.price).toFixed(0)} each</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button onClick={() => removeFromCart(item.id)} style={{ width: 28, height: 28, borderRadius: '50%', border: `1.5px solid ${gold}`, background: 'transparent', color: gold, fontSize: '14px', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                        <span style={{ fontFamily: F, fontSize: '14px', fontWeight: 700, minWidth: '18px', textAlign: 'center' }}>{item.qty}</span>
                        <button onClick={() => addToCart(item.id)} style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: gold, color: '#fff', fontSize: '14px', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                      </div>
                      <div style={{ fontFamily: F, fontSize: '15px', fontWeight: 700, color: dark, minWidth: '56px', textAlign: 'right' }}>₹{(parseFloat(item.price) * item.qty).toFixed(0)}</div>
                    </div>
                  ))}
                </div>
                <div style={{ padding: '16px 24px', borderTop: '2px solid rgba(139,90,43,0.08)', position: 'sticky', bottom: 0, background: '#FBF7F0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontFamily: F, fontSize: '13px', color: '#8B7355' }}>Delivery</span>
                    <span style={{ fontFamily: F, fontSize: '13px', color: '#2E7D32', fontWeight: 600 }}>FREE</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <span style={{ fontFamily: F, fontSize: '16px', fontWeight: 700, color: dark }}>Total</span>
                    <span style={{ fontFamily: F, fontSize: '20px', fontWeight: 700, color: gold }}>₹{cartTotal}</span>
                  </div>
                  <button onClick={() => { if (!kitchenOpen) return; setShowCart(false); setShowCheckout(true); }} disabled={!kitchenOpen} style={{ width: '100%', fontFamily: F, fontSize: '15px', fontWeight: 700, background: kitchenOpen ? `linear-gradient(135deg,${gold},#B8860B)` : '#ccc', color: '#fff', border: 'none', padding: '14px', borderRadius: '14px', cursor: kitchenOpen ? 'pointer' : 'not-allowed' }}>
                    {kitchenOpen ? 'Proceed to Checkout →' : 'Kitchen Closed'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showCheckout && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div onClick={() => setShowCheckout(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(42,24,16,0.6)', backdropFilter: 'blur(6px)' }} />
          <div style={{ position: 'relative', background: '#FBF7F0', borderRadius: '24px', padding: '32px', maxWidth: '440px', width: '100%', boxShadow: '0 20px 60px rgba(42,24,16,0.25)', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontFamily: S, fontSize: '28px', fontWeight: 700, color: dark, marginBottom: '4px' }}>Checkout</h2>
            <p style={{ fontFamily: F, fontSize: '13px', color: '#8B7355', marginBottom: '6px' }}>{cartCount} item{cartCount > 1 ? 's' : ''} · ₹{cartTotal}</p>
            <div style={{ fontFamily: F, fontSize: '13px', color: '#6B5244', background: 'rgba(212,160,23,0.08)', borderRadius: '10px', padding: '8px 12px', marginBottom: '20px' }}>
              Ordering as: <strong>{user?.name}</strong>
            </div>
            {[
              { key: 'phone', label: 'Phone Number', placeholder: '+91 98765 43210', type: 'tel' },
              { key: 'address', label: 'Delivery Address', placeholder: 'House no, street, area...', type: 'text' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: '16px' }}>
                <label style={{ fontFamily: F, fontSize: '12px', fontWeight: 600, color: '#6B5244', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>{f.label}</label>
                <input type={f.type} value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} placeholder={f.placeholder}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1.5px solid rgba(139,90,43,0.12)', background: '#fff', fontFamily: B, fontSize: '14px', outline: 'none', color: dark, boxSizing: 'border-box' }} />
              </div>
            ))}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontFamily: F, fontSize: '12px', fontWeight: 600, color: '#6B5244', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>Special Instructions</label>
              <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Less spicy, extra raita..."
                style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1.5px solid rgba(139,90,43,0.12)', background: '#fff', fontFamily: B, fontSize: '14px', outline: 'none', color: dark, resize: 'vertical', minHeight: '70px', boxSizing: 'border-box' }} />
            </div>
            <div style={{ background: 'rgba(42,24,16,0.03)', borderRadius: '12px', padding: '14px', marginBottom: '20px' }}>
              <div style={{ fontFamily: F, fontSize: '12px', fontWeight: 600, color: '#6B5244', marginBottom: '6px' }}>Payment Method</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['💵 Cash on Delivery', '📱 UPI on Delivery'].map((m, i) => (
                  <div key={i} style={{ flex: 1, fontFamily: F, fontSize: '12px', fontWeight: 600, padding: '10px', borderRadius: '10px', border: i === 0 ? `2px solid ${gold}` : '1.5px solid rgba(139,90,43,0.1)', background: i === 0 ? `${gold}08` : '#fff', textAlign: 'center', color: i === 0 ? gold : '#8B7355', cursor: 'pointer' }}>{m}</div>
                ))}
              </div>
            </div>
            {orderError && <div style={{ fontFamily: F, fontSize: '13px', color: '#C0392B', background: '#FEF0EF', borderRadius: '10px', padding: '10px 14px', marginBottom: '14px' }}>{orderError}</div>}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowCheckout(false)} style={{ flex: 1, fontFamily: F, fontSize: '14px', fontWeight: 600, padding: '13px', borderRadius: '12px', border: '1.5px solid rgba(139,90,43,0.12)', background: 'transparent', color: '#8B7355', cursor: 'pointer' }}>Back</button>
              <button onClick={handleOrder} disabled={placing || !form.phone || !form.address || !kitchenOpen} style={{ flex: 2, fontFamily: F, fontSize: '14px', fontWeight: 700, padding: '13px', borderRadius: '12px', border: 'none', background: form.phone && form.address && !placing && kitchenOpen ? `linear-gradient(135deg,${gold},#B8860B)` : '#ccc', color: '#fff', cursor: form.phone && form.address && !placing && kitchenOpen ? 'pointer' : 'not-allowed' }}>
                {placing ? 'Placing...' : !kitchenOpen ? 'Kitchen Closed' : `Place Order · ₹${cartTotal}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {orderPlaced && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(42,24,16,0.8)', backdropFilter: 'blur(10px)' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 100, height: 100, borderRadius: '50%', background: `linear-gradient(135deg,${gold},#B8860B)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px', margin: '0 auto 20px', boxShadow: `0 8px 40px rgba(212,160,23,0.4)` }}>✓</div>
            <h2 style={{ fontFamily: S, fontSize: '32px', fontWeight: 700, color: '#FBF7F0', marginBottom: '8px' }}>Order Placed!</h2>
            <p style={{ fontFamily: B, fontSize: '16px', color: 'rgba(251,247,240,0.6)' }}>Maa is preparing your meal with love 🫶</p>
            <p style={{ fontFamily: F, fontSize: '13px', color: 'rgba(251,247,240,0.4)', marginTop: '8px' }}>Redirecting to your orders...</p>
          </div>
        </div>
      )}
    </div>
  );
}
