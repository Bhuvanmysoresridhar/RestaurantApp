import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const gold = '#D4A017';
const dark = '#2A1810';
const F = "'Outfit', sans-serif";
const S = "'Cormorant Garamond', serif";
const B = "'Lora', serif";

function InvoiceModal({ order, onClose }) {
  const date = new Date(order.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(42,24,16,0.65)', backdropFilter: 'blur(6px)' }} />
      <div style={{ position: 'relative', background: '#fff', borderRadius: '20px', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(42,24,16,0.3)' }}>
        <div style={{ background: `linear-gradient(135deg,${dark},#3D2215)`, padding: '28px 28px 20px', borderRadius: '20px 20px 0 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontFamily: S, fontSize: '26px', fontWeight: 700, color: gold, lineHeight: 1 }}>Stones & Spices</div>
              <div style={{ fontFamily: F, fontSize: '8px', letterSpacing: '3px', textTransform: 'uppercase', color: 'rgba(251,247,240,0.4)', fontWeight: 600, marginTop: '4px' }}>Cloud Kitchen · Pune</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: F, fontSize: '10px', color: 'rgba(251,247,240,0.4)', letterSpacing: '1px', textTransform: 'uppercase' }}>Invoice</div>
              <div style={{ fontFamily: F, fontSize: '16px', fontWeight: 700, color: '#fff' }}>#{String(order.id).padStart(4, '0')}</div>
            </div>
          </div>
        </div>

        <div style={{ padding: '24px 28px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px', background: 'rgba(42,24,16,0.03)', borderRadius: '12px', padding: '16px' }}>
            <div>
              <div style={{ fontFamily: F, fontSize: '10px', color: '#B89B7A', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>Date & Time</div>
              <div style={{ fontFamily: F, fontSize: '13px', color: dark, fontWeight: 600 }}>{date}</div>
            </div>
            <div>
              <div style={{ fontFamily: F, fontSize: '10px', color: '#B89B7A', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>Status</div>
              <div style={{ display: 'inline-block', fontFamily: F, fontSize: '12px', fontWeight: 700, color: '#2E7D32', background: 'rgba(46,125,50,0.1)', padding: '3px 10px', borderRadius: '50px' }}>✓ {order.status}</div>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ fontFamily: F, fontSize: '10px', color: '#B89B7A', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>Delivery Address</div>
              <div style={{ fontFamily: B, fontSize: '13px', color: dark }}>{order.delivery_address}</div>
            </div>
            {order.phone && (
              <div>
                <div style={{ fontFamily: F, fontSize: '10px', color: '#B89B7A', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>Phone</div>
                <div style={{ fontFamily: F, fontSize: '13px', color: dark }}>{order.phone}</div>
              </div>
            )}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: '8px', fontFamily: F, fontSize: '10px', color: '#B89B7A', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 600, padding: '0 0 8px', borderBottom: '1px solid rgba(139,90,43,0.1)', marginBottom: '8px' }}>
              <span>Item</span><span style={{ textAlign: 'center' }}>Qty</span><span style={{ textAlign: 'right' }}>Price</span><span style={{ textAlign: 'right' }}>Total</span>
            </div>
            {order.items?.map(item => (
              <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: '8px', padding: '10px 0', borderBottom: '1px solid rgba(139,90,43,0.05)', alignItems: 'center' }}>
                <div>
                  <div style={{ fontFamily: F, fontSize: '14px', fontWeight: 600, color: dark }}>{item.item_name}</div>
                  {item.category && <div style={{ fontFamily: F, fontSize: '10px', color: '#B89B7A' }}>{item.category}</div>}
                </div>
                <div style={{ fontFamily: F, fontSize: '14px', color: '#8B7355', textAlign: 'center' }}>×{item.quantity}</div>
                <div style={{ fontFamily: F, fontSize: '13px', color: '#8B7355', textAlign: 'right' }}>₹{Number(item.item_price).toFixed(0)}</div>
                <div style={{ fontFamily: F, fontSize: '14px', fontWeight: 700, color: dark, textAlign: 'right' }}>₹{(item.item_price * item.quantity).toFixed(0)}</div>
              </div>
            ))}
          </div>

          <div style={{ background: `linear-gradient(135deg,${dark},#3D2215)`, borderRadius: '12px', padding: '16px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontFamily: F, fontSize: '13px', color: 'rgba(251,247,240,0.5)' }}>Subtotal</span>
              <span style={{ fontFamily: F, fontSize: '13px', color: 'rgba(251,247,240,0.7)' }}>₹{Number(order.total_amount).toFixed(0)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontFamily: F, fontSize: '13px', color: 'rgba(251,247,240,0.5)' }}>Delivery</span>
              <span style={{ fontFamily: F, fontSize: '13px', color: '#4CAF50', fontWeight: 600 }}>FREE</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid rgba(251,247,240,0.1)' }}>
              <span style={{ fontFamily: F, fontSize: '16px', fontWeight: 700, color: '#fff' }}>Total Paid</span>
              <span style={{ fontFamily: S, fontSize: '22px', fontWeight: 700, color: gold }}>₹{Number(order.total_amount).toFixed(0)}</span>
            </div>
          </div>

          {order.notes && (
            <div style={{ marginTop: '16px', background: 'rgba(212,160,23,0.06)', borderRadius: '10px', padding: '12px 16px', border: '1px solid rgba(212,160,23,0.1)' }}>
              <div style={{ fontFamily: F, fontSize: '10px', color: '#B89B7A', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>Special Instructions</div>
              <div style={{ fontFamily: B, fontSize: '13px', color: dark, fontStyle: 'italic' }}>{order.notes}</div>
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <div style={{ fontFamily: B, fontSize: '12px', color: '#B89B7A', fontStyle: 'italic' }}>Thank you for ordering from Maa's kitchen 🫶</div>
          </div>

          <button onClick={onClose} style={{ width: '100%', marginTop: '16px', fontFamily: F, fontSize: '14px', fontWeight: 700, padding: '13px', borderRadius: '12px', border: 'none', background: `linear-gradient(135deg,${gold},#B8860B)`, color: '#fff', cursor: 'pointer' }}>Close Invoice</button>
        </div>
      </div>
    </div>
  );
}

function ReviewModal({ order, onClose, token, onReviewed }) {
  const [ratings, setRatings] = useState({});
  const [texts, setTexts] = useState({});
  const [submitted, setSubmitted] = useState({});
  const [loading, setLoading] = useState({});
  const [errors, setErrors] = useState({});

  const reviewableItems = order.items?.filter(i => !order.reviewed_item_ids?.includes(i.item_id)) || [];

  const submit = async (item) => {
    const rating = ratings[item.item_id];
    if (!rating) { setErrors(e => ({ ...e, [item.item_id]: 'Please select a rating' })); return; }
    setLoading(l => ({ ...l, [item.item_id]: true }));
    setErrors(e => ({ ...e, [item.item_id]: '' }));
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ order_id: order.id, item_id: item.item_id, item_name: item.item_name, rating, review_text: texts[item.item_id] || '' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSubmitted(s => ({ ...s, [item.item_id]: true }));
      onReviewed(item.item_id);
    } catch (err) {
      setErrors(e => ({ ...e, [item.item_id]: err.message }));
    } finally {
      setLoading(l => ({ ...l, [item.item_id]: false }));
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(42,24,16,0.65)', backdropFilter: 'blur(6px)' }} />
      <div style={{ position: 'relative', background: '#FBF7F0', borderRadius: '20px', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(42,24,16,0.3)', padding: '28px' }}>
        <h2 style={{ fontFamily: S, fontSize: '28px', fontWeight: 700, color: dark, marginBottom: '4px' }}>Review Your Order</h2>
        <p style={{ fontFamily: B, fontSize: '13px', color: '#8B7355', marginBottom: '24px', fontStyle: 'italic' }}>Share your honest experience — it helps others choose!</p>

        {reviewableItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
            <p style={{ fontFamily: F, fontSize: '15px', color: '#8B7355' }}>You've reviewed all items from this order!</p>
          </div>
        ) : (
          reviewableItems.map(item => (
            <div key={item.item_id} style={{ background: '#fff', borderRadius: '14px', padding: '20px', marginBottom: '16px', border: '1px solid rgba(139,90,43,0.08)' }}>
              <div style={{ fontFamily: S, fontSize: '18px', fontWeight: 600, color: dark, marginBottom: '4px' }}>{item.item_name}</div>
              <div style={{ fontFamily: F, fontSize: '12px', color: '#B89B7A', marginBottom: '12px' }}>Qty: {item.quantity} · ₹{Number(item.item_price).toFixed(0)}</div>

              {submitted[item.item_id] ? (
                <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(46,125,50,0.06)', borderRadius: '10px' }}>
                  <div style={{ fontFamily: F, fontSize: '14px', color: '#2E7D32', fontWeight: 700 }}>✓ Review submitted!</div>
                  <div style={{ fontFamily: B, fontSize: '12px', color: '#8B7355', marginTop: '4px', fontStyle: 'italic' }}>Thank you for your feedback 🙏</div>
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontFamily: F, fontSize: '11px', fontWeight: 600, color: '#6B5244', marginBottom: '8px' }}>Rating *</div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <button key={star} onClick={() => setRatings(r => ({ ...r, [item.item_id]: star }))} style={{ fontSize: '24px', background: 'none', border: 'none', cursor: 'pointer', opacity: ratings[item.item_id] >= star ? 1 : 0.25, transform: ratings[item.item_id] >= star ? 'scale(1.2)' : 'scale(1)', transition: 'all 0.15s' }}>★</button>
                      ))}
                      {ratings[item.item_id] && <span style={{ fontFamily: F, fontSize: '12px', color: gold, fontWeight: 700, alignSelf: 'center' }}>{['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent!'][ratings[item.item_id]]}</span>}
                    </div>
                  </div>
                  <textarea value={texts[item.item_id] || ''} onChange={e => setTexts(t => ({ ...t, [item.item_id]: e.target.value }))} placeholder="Tell us what you loved (or didn't)..."
                    style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1.5px solid rgba(139,90,43,0.12)', background: '#FBF7F0', fontFamily: B, fontSize: '13px', outline: 'none', color: dark, resize: 'vertical', minHeight: '70px', boxSizing: 'border-box', marginBottom: '10px' }} />
                  {errors[item.item_id] && <div style={{ fontFamily: F, fontSize: '12px', color: '#C0392B', marginBottom: '8px' }}>{errors[item.item_id]}</div>}
                  <button onClick={() => submit(item)} disabled={loading[item.item_id]} style={{ fontFamily: F, fontSize: '13px', fontWeight: 700, padding: '10px 24px', borderRadius: '50px', border: 'none', background: loading[item.item_id] ? '#ccc' : `linear-gradient(135deg,${gold},#B8860B)`, color: '#fff', cursor: loading[item.item_id] ? 'not-allowed' : 'pointer' }}>
                    {loading[item.item_id] ? 'Submitting...' : 'Submit Review'}
                  </button>
                </>
              )}
            </div>
          ))
        )}

        <button onClick={onClose} style={{ width: '100%', fontFamily: F, fontSize: '14px', fontWeight: 600, padding: '12px', borderRadius: '12px', border: '1.5px solid rgba(139,90,43,0.15)', background: 'transparent', color: '#8B7355', cursor: 'pointer', marginTop: '8px' }}>Close</button>
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedReview, setSelectedReview] = useState(null);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) setOrders(data);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleReviewed = (orderId, itemId) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, reviewed_item_ids: [...(o.reviewed_item_ids || []), itemId] } : o));
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';

  return (
    <div style={{ fontFamily: B, background: '#FBF7F0', minHeight: '100vh', color: dark }}>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Lora:ital,wght@0,400;0,500;1,400&family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

      <div style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(251,247,240,0.97)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(139,90,43,0.08)', padding: '12px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => navigate('/menu')} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#6B5244', padding: '4px 8px' }}>←</button>
          <div>
            <div style={{ fontFamily: S, fontSize: '20px', fontWeight: 700, color: dark }}>My Orders</div>
            <div style={{ fontFamily: F, fontSize: '8px', letterSpacing: '2px', textTransform: 'uppercase', color: '#B8860B', fontWeight: 600 }}>Order History & Invoices</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={() => navigate('/reviews')} style={{ fontFamily: F, fontSize: '12px', fontWeight: 600, color: '#6B5244', background: 'rgba(42,24,16,0.04)', border: 'none', padding: '8px 14px', borderRadius: '50px', cursor: 'pointer' }}>⭐ Reviews</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'rgba(42,24,16,0.04)', borderRadius: '50px' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: `linear-gradient(135deg,#8B5A2B,${gold})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F, fontSize: '10px', fontWeight: 700, color: '#fff' }}>{initials}</div>
            <span style={{ fontFamily: F, fontSize: '12px', fontWeight: 600, color: dark }}>{user?.name?.split(' ')[0]}</span>
          </div>
          <button onClick={() => { logout(); navigate('/'); }} style={{ fontFamily: F, fontSize: '12px', fontWeight: 600, color: '#8B7355', background: 'none', border: '1px solid rgba(139,90,43,0.15)', padding: '7px 14px', borderRadius: '50px', cursor: 'pointer' }}>Sign Out</button>
        </div>
      </div>

      <div style={{ maxWidth: '780px', margin: '0 auto', padding: '32px 28px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>🍽️</div>
            <p style={{ fontFamily: F, fontSize: '15px', color: '#8B7355' }}>Loading your orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>📋</div>
            <h3 style={{ fontFamily: S, fontSize: '28px', fontWeight: 600, color: dark, marginBottom: '8px' }}>No orders yet</h3>
            <p style={{ fontFamily: B, fontSize: '15px', color: '#8B7355', marginBottom: '24px', fontStyle: 'italic' }}>Your first meal from Maa's kitchen awaits!</p>
            <button onClick={() => navigate('/menu')} style={{ fontFamily: F, fontSize: '14px', fontWeight: 700, padding: '13px 32px', borderRadius: '50px', border: 'none', background: `linear-gradient(135deg,${gold},#B8860B)`, color: '#fff', cursor: 'pointer' }}>Browse Menu →</button>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '28px' }}>
              <h2 style={{ fontFamily: S, fontSize: '32px', fontWeight: 700, color: dark, marginBottom: '4px' }}>Your Orders</h2>
              <p style={{ fontFamily: B, fontSize: '14px', color: '#8B7355', fontStyle: 'italic' }}>{orders.length} order{orders.length !== 1 ? 's' : ''} placed — every one made with love 🫶</p>
            </div>

            {orders.map(order => {
              const date = new Date(order.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
              const time = new Date(order.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
              const unreviewedCount = (order.items?.length || 0) - (order.reviewed_item_ids?.length || 0);
              return (
                <div key={order.id} style={{ background: '#fff', borderRadius: '18px', padding: '24px', marginBottom: '16px', border: '1px solid rgba(139,90,43,0.06)', boxShadow: '0 2px 12px rgba(42,24,16,0.04)', transition: 'box-shadow 0.3s' }}
                  onMouseOver={e => e.currentTarget.style.boxShadow = '0 6px 24px rgba(42,24,16,0.08)'}
                  onMouseOut={e => e.currentTarget.style.boxShadow = '0 2px 12px rgba(42,24,16,0.04)'}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                        <span style={{ fontFamily: F, fontSize: '16px', fontWeight: 700, color: dark }}>Order #{String(order.id).padStart(4, '0')}</span>
                        <span style={{ fontFamily: F, fontSize: '11px', fontWeight: 700, color: '#2E7D32', background: 'rgba(46,125,50,0.1)', padding: '2px 10px', borderRadius: '50px' }}>✓ {order.status}</span>
                      </div>
                      <div style={{ fontFamily: F, fontSize: '12px', color: '#B89B7A' }}>{date} at {time}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: S, fontSize: '24px', fontWeight: 700, color: gold }}>₹{Number(order.total_amount).toFixed(0)}</div>
                      <div style={{ fontFamily: F, fontSize: '11px', color: '#B89B7A' }}>{order.items?.length} item{order.items?.length !== 1 ? 's' : ''}</div>
                    </div>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    {order.items?.slice(0, 3).map(item => (
                      <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(139,90,43,0.04)' }}>
                        <span style={{ fontFamily: F, fontSize: '13px', color: dark }}>× {item.quantity} {item.item_name}</span>
                        <span style={{ fontFamily: F, fontSize: '13px', color: '#8B7355' }}>₹{(item.item_price * item.quantity).toFixed(0)}</span>
                      </div>
                    ))}
                    {(order.items?.length || 0) > 3 && <div style={{ fontFamily: F, fontSize: '12px', color: '#B89B7A', marginTop: '6px' }}>+{order.items.length - 3} more items</div>}
                  </div>

                  <div style={{ fontFamily: F, fontSize: '12px', color: '#8B7355', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>📍</span> {order.delivery_address}
                  </div>

                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button onClick={() => setSelectedInvoice(order)} style={{ fontFamily: F, fontSize: '12px', fontWeight: 700, padding: '9px 20px', borderRadius: '50px', border: `1.5px solid ${gold}`, background: 'transparent', color: gold, cursor: 'pointer' }}>🧾 View Invoice</button>
                    {unreviewedCount > 0 && (
                      <button onClick={() => setSelectedReview(order)} style={{ fontFamily: F, fontSize: '12px', fontWeight: 700, padding: '9px 20px', borderRadius: '50px', border: 'none', background: `linear-gradient(135deg,${gold},#B8860B)`, color: '#fff', cursor: 'pointer' }}>
                        ⭐ Review Items ({unreviewedCount})
                      </button>
                    )}
                    {unreviewedCount === 0 && (order.items?.length || 0) > 0 && (
                      <div style={{ fontFamily: F, fontSize: '12px', color: '#2E7D32', display: 'flex', alignItems: 'center', gap: '4px' }}>✓ All items reviewed</div>
                    )}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {selectedInvoice && <InvoiceModal order={selectedInvoice} onClose={() => setSelectedInvoice(null)} />}
      {selectedReview && (
        <ReviewModal
          order={selectedReview}
          token={token}
          onClose={() => { setSelectedReview(null); fetchOrders(); }}
          onReviewed={(itemId) => handleReviewed(selectedReview.id, itemId)}
        />
      )}
    </div>
  );
}
