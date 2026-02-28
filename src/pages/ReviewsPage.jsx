import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const gold = '#D4A017';
const dark = '#2A1810';
const F = "'Outfit', sans-serif";
const S = "'Cormorant Garamond', serif";
const B = "'Lora', serif";

function CommentSection({ reviewId, token, currentUserName }) {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingComments, setLoadingComments] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/reviews/${reviewId}/comments`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) setComments(await res.json());
      } finally {
        setLoadingComments(false);
      }
    };
    load();
  }, [reviewId]);

  const submit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/reviews/${reviewId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ comment_text: text.trim() }),
      });
      const data = await res.json();
      if (res.ok) { setComments(c => [...c, data]); setText(''); }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid rgba(139,90,43,0.08)' }}>
      {loadingComments ? (
        <div style={{ fontFamily: F, fontSize: '12px', color: '#B89B7A' }}>Loading comments...</div>
      ) : (
        <>
          {comments.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              {comments.map(c => {
                const initials = c.user_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';
                const date = new Date(c.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
                return (
                  <div key={c.id} style={{ display: 'flex', gap: '10px', marginBottom: '10px', padding: '10px 12px', background: 'rgba(42,24,16,0.02)', borderRadius: '10px', border: '1px solid rgba(139,90,43,0.05)' }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: `linear-gradient(135deg,#8B5A2B,${gold})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F, fontSize: '9px', fontWeight: 700, color: '#fff', flexShrink: 0, marginTop: '2px' }}>{initials}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                        <span style={{ fontFamily: F, fontSize: '12px', fontWeight: 700, color: dark }}>{c.user_name}</span>
                        <span style={{ fontFamily: F, fontSize: '10px', color: '#C4A57B' }}>{date}</span>
                      </div>
                      <p style={{ fontFamily: B, fontSize: '13px', color: '#6B5244', lineHeight: 1.5, margin: 0 }}>{c.comment_text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <form onSubmit={submit} style={{ display: 'flex', gap: '8px' }}>
            <input
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Add a comment..."
              style={{ flex: 1, padding: '9px 14px', borderRadius: '50px', border: '1.5px solid rgba(139,90,43,0.12)', background: '#fff', fontFamily: B, fontSize: '13px', outline: 'none', color: dark }}
            />
            <button type="submit" disabled={loading || !text.trim()} style={{ fontFamily: F, fontSize: '12px', fontWeight: 700, padding: '9px 18px', borderRadius: '50px', border: 'none', background: text.trim() && !loading ? `linear-gradient(135deg,${gold},#B8860B)` : '#ccc', color: '#fff', cursor: text.trim() && !loading ? 'pointer' : 'not-allowed', whiteSpace: 'nowrap' }}>
              {loading ? '...' : 'Post'}
            </button>
          </form>
        </>
      )}
    </div>
  );
}

export default function ReviewsPage() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedComments, setExpandedComments] = useState({});
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/reviews', { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) setReviews(await res.json());
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const toggleComments = (id) => setExpandedComments(e => ({ ...e, [id]: !e[id] }));

  const filtered = filter === 'all' ? reviews : reviews.filter(r => {
    if (filter === '5') return r.rating === 5;
    if (filter === '4') return r.rating === 4;
    if (filter === 'mine') return r.user_id === user?.id;
    return true;
  });

  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';

  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;

  return (
    <div style={{ fontFamily: B, background: '#FBF7F0', minHeight: '100vh', color: dark }}>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Lora:ital,wght@0,400;0,500;1,400&family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

      <div style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(251,247,240,0.97)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(139,90,43,0.08)', padding: '12px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => navigate('/menu')} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#6B5244', padding: '4px 8px' }}>←</button>
          <div>
            <div style={{ fontFamily: S, fontSize: '20px', fontWeight: 700, color: dark }}>Reviews</div>
            <div style={{ fontFamily: F, fontSize: '8px', letterSpacing: '2px', textTransform: 'uppercase', color: '#B8860B', fontWeight: 600 }}>Community Voices</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={() => navigate('/orders')} style={{ fontFamily: F, fontSize: '12px', fontWeight: 600, color: '#6B5244', background: 'rgba(42,24,16,0.04)', border: 'none', padding: '8px 14px', borderRadius: '50px', cursor: 'pointer' }}>📋 My Orders</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'rgba(42,24,16,0.04)', borderRadius: '50px' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: `linear-gradient(135deg,#8B5A2B,${gold})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F, fontSize: '10px', fontWeight: 700, color: '#fff' }}>{initials}</div>
            <span style={{ fontFamily: F, fontSize: '12px', fontWeight: 600, color: dark }}>{user?.name?.split(' ')[0]}</span>
          </div>
          <button onClick={() => { logout(); navigate('/'); }} style={{ fontFamily: F, fontSize: '12px', fontWeight: 600, color: '#8B7355', background: 'none', border: '1px solid rgba(139,90,43,0.15)', padding: '7px 14px', borderRadius: '50px', cursor: 'pointer' }}>Sign Out</button>
        </div>
      </div>

      <div style={{ maxWidth: '820px', margin: '0 auto', padding: '32px 28px' }}>
        {reviews.length > 0 && (
          <div style={{ background: `linear-gradient(135deg,${dark},#3D2215)`, borderRadius: '20px', padding: '28px', marginBottom: '32px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', textAlign: 'center' }}>
            <div>
              <div style={{ fontFamily: S, fontSize: '40px', fontWeight: 700, color: gold, lineHeight: 1 }}>{avgRating}</div>
              <div style={{ fontFamily: F, fontSize: '10px', color: 'rgba(251,247,240,0.4)', letterSpacing: '2px', textTransform: 'uppercase', marginTop: '4px' }}>Avg Rating</div>
              <div style={{ color: gold, fontSize: '16px', marginTop: '4px' }}>{'★'.repeat(Math.round(parseFloat(avgRating || 0)))}</div>
            </div>
            <div>
              <div style={{ fontFamily: S, fontSize: '40px', fontWeight: 700, color: gold, lineHeight: 1 }}>{reviews.length}</div>
              <div style={{ fontFamily: F, fontSize: '10px', color: 'rgba(251,247,240,0.4)', letterSpacing: '2px', textTransform: 'uppercase', marginTop: '4px' }}>Total Reviews</div>
            </div>
            <div>
              <div style={{ fontFamily: S, fontSize: '40px', fontWeight: 700, color: gold, lineHeight: 1 }}>{reviews.filter(r => r.rating >= 4).length}</div>
              <div style={{ fontFamily: F, fontSize: '10px', color: 'rgba(251,247,240,0.4)', letterSpacing: '2px', textTransform: 'uppercase', marginTop: '4px' }}>Happy Customers</div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {[['all', 'All Reviews'], ['5', '⭐⭐⭐⭐⭐ 5 Star'], ['4', '⭐⭐⭐⭐ 4 Star'], ['mine', '👤 My Reviews']].map(([v, l]) => (
            <button key={v} onClick={() => setFilter(v)} style={{
              fontFamily: F, fontSize: '12px', fontWeight: 600, padding: '8px 16px', borderRadius: '50px', cursor: 'pointer',
              border: filter === v ? `2px solid ${gold}` : '1.5px solid rgba(139,90,43,0.12)',
              background: filter === v ? `${gold}12` : '#fff', color: filter === v ? gold : '#8B7355',
            }}>{l}</button>
          ))}
          <div style={{ marginLeft: 'auto', fontFamily: F, fontSize: '12px', color: '#B89B7A', alignSelf: 'center' }}>{filtered.length} review{filtered.length !== 1 ? 's' : ''}</div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>⭐</div>
            <p style={{ fontFamily: F, fontSize: '15px', color: '#8B7355' }}>Loading reviews...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🌟</div>
            <h3 style={{ fontFamily: S, fontSize: '28px', fontWeight: 600, color: dark, marginBottom: '8px' }}>No reviews yet</h3>
            <p style={{ fontFamily: B, fontSize: '15px', color: '#8B7355', marginBottom: '24px', fontStyle: 'italic' }}>
              {filter === 'mine' ? 'Order food and share your experience!' : 'Be the first to share your experience!'}
            </p>
            {filter === 'mine' && <button onClick={() => navigate('/orders')} style={{ fontFamily: F, fontSize: '14px', fontWeight: 700, padding: '13px 32px', borderRadius: '50px', border: 'none', background: `linear-gradient(135deg,${gold},#B8860B)`, color: '#fff', cursor: 'pointer' }}>Go to Orders</button>}
          </div>
        ) : (
          filtered.map(review => {
            const initials2 = review.user_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';
            const date = new Date(review.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
            const isExpanded = expandedComments[review.id];
            return (
              <div key={review.id} style={{ background: '#fff', borderRadius: '18px', padding: '24px', marginBottom: '16px', border: '1px solid rgba(139,90,43,0.06)', boxShadow: '0 2px 12px rgba(42,24,16,0.03)', transition: 'box-shadow 0.3s' }}
                onMouseOver={e => e.currentTarget.style.boxShadow = '0 6px 24px rgba(42,24,16,0.07)'}
                onMouseOut={e => e.currentTarget.style.boxShadow = '0 2px 12px rgba(42,24,16,0.03)'}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: `linear-gradient(135deg,#8B5A2B,${gold})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F, fontSize: '12px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>{initials2}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
                      <div>
                        <div style={{ fontFamily: F, fontSize: '14px', fontWeight: 700, color: dark }}>{review.user_name}</div>
                        <div style={{ fontFamily: F, fontSize: '11px', color: '#B89B7A' }}>{date}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ color: gold, fontSize: '14px' }}>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</div>
                        <span style={{ fontFamily: F, fontSize: '12px', fontWeight: 700, color: gold }}>{review.rating}.0</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ background: `${gold}08`, borderRadius: '10px', padding: '8px 14px', marginBottom: '10px', display: 'inline-block' }}>
                  <span style={{ fontFamily: F, fontSize: '12px', fontWeight: 600, color: '#8B5A2B' }}>🍛 {review.item_name}</span>
                </div>

                {review.review_text && (
                  <p style={{ fontFamily: B, fontSize: '14px', color: '#6B5244', lineHeight: 1.7, fontStyle: 'italic', margin: '10px 0' }}>"{review.review_text}"</p>
                )}

                <button onClick={() => toggleComments(review.id)} style={{ fontFamily: F, fontSize: '12px', fontWeight: 600, color: '#8B7355', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px' }}>
                  💬 {isExpanded ? 'Hide' : 'Show'} Comments {review.comment_count > 0 ? `(${review.comment_count})` : ''}
                </button>

                {isExpanded && <CommentSection reviewId={review.id} token={token} currentUserName={user?.name} />}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
