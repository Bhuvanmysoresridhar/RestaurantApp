import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LandingPage } from '../../stones-final.jsx';
import { useAuth } from '../context/AuthContext';

export default function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [liveReviews, setLiveReviews] = useState([]);

  useEffect(() => {
    fetch('/api/reviews/recent')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const transformed = data.map(r => ({
            name: r.user_name,
            loc: r.item_name,
            text: r.review_text || '',
            av: r.user_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??',
            rating: r.rating,
          })).filter(r => r.text);
          if (transformed.length > 0) setLiveReviews(transformed);
        }
      })
      .catch(() => {});
  }, []);

  const handleOrder = () => {
    if (isAuthenticated) navigate('/menu');
    else navigate('/auth');
  };

  return <LandingPage onOrder={handleOrder} liveReviews={liveReviews} />;
}
