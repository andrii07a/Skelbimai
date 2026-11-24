// One ad: photo, details, ⭐ button and comments.
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { api, formatDate, formatPrice } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import FavoriteButton from '../components/FavoriteButton.jsx';

export default function AdPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [ad, setAd] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [commentError, setCommentError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    api
      .get(`/api/ads/${id}`)
      .then(setAd)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    // the ⭐ flag depends on who is logged in, so reload when the user changes
  }, [id, user?.id]);

  async function handleComment(event) {
    event.preventDefault();
    setCommentError('');
    if (!text.trim()) {
      setCommentError('Write a comment first.');
      return;
    }
    setSending(true);
    try {
      const comment = await api.post(`/api/ads/${id}/comments`, { text });
      setAd((current) => ({ ...current, comments: [...current.comments, comment] }));
      setText('');
    } catch (err) {
      setCommentError(err.message);
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-5">
        <h1 className="h4">{error}</h1>
        <p className="text-muted">The ad may have been removed or blocked.</p>
        <Link className="btn btn-primary" to="/">
          Back to all ads
        </Link>
      </div>
    );
  }

  const isOwner = user && user.username === ad.owner;

  return (
    <>
      {/* Go back to the search results; if the ad was opened directly, go to the home page */}
      <button
        type="button"
        className="btn btn-link btn-sm p-0"
        onClick={() => (location.key === 'default' ? navigate('/') : navigate(-1))}
      >
        ← Back
      </button>

      <div className="row g-4 mt-1">
        <div className="col-lg-7">
          <img src={`/uploads/${ad.image}`} alt={ad.title} className="rounded shadow-sm ad-img-large" />
        </div>

        <div className="col-lg-5">
          <div className="card shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start gap-2">
                <h1 className="h4 mb-1">{ad.title}</h1>
                <FavoriteButton
                  adId={ad.id}
                  isFavorite={ad.is_favorite}
                  onChange={(value) => setAd({ ...ad, is_favorite: value })}
                />
              </div>
              <div className="fs-3 fw-bold text-primary mb-2">{formatPrice(ad.price)}</div>
              <div className="mb-3">
                <Link className="badge text-bg-light border text-decoration-none" to={`/?category=${ad.category_id}`}>
                  {ad.category_name}
                </Link>
              </div>
              <p className="pre-wrap">{ad.description}</p>
              <div className="small text-muted">
                Seller: <strong>{ad.owner}</strong>
                <br />
                Posted: {formatDate(ad.created_at)}
              </div>
              {isOwner && (
                <a className="btn btn-outline-primary btn-sm mt-3" href={`/admin/ads/${ad.id}/edit`}>
                  This is your ad: edit it
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      <section className="mt-4">
        <h2 className="h5">Comments ({ad.comments.length})</h2>

        {ad.comments.length === 0 && <p className="text-muted">No questions yet. Ask the seller something!</p>}

        <ul className="list-group mb-3">
          {ad.comments.map((c) => (
            <li key={c.id} className="list-group-item">
              <div className="small text-muted">
                <strong className="text-body">{c.username}</strong> · {formatDate(c.created_at)}
              </div>
              <div className="pre-wrap">{c.text}</div>
            </li>
          ))}
        </ul>

        {user ? (
          <form onSubmit={handleComment} className="card card-body shadow-sm" noValidate>
            <label className="form-label" htmlFor="comment">
              Ask the seller a question
            </label>
            <textarea
              id="comment"
              className={`form-control${commentError ? ' is-invalid' : ''}`}
              rows="3"
              maxLength={1000}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            {commentError && <div className="invalid-feedback">{commentError}</div>}
            <div className="d-flex justify-content-between align-items-center mt-2">
              <span className="small text-muted">{text.length}/1000</span>
              <button className="btn btn-primary" disabled={sending}>
                {sending ? 'Sending…' : 'Send comment'}
              </button>
            </div>
          </form>
        ) : (
          <div className="alert alert-secondary">
            <Link to="/login" state={{ from: location.pathname }}>
              Log in
            </Link>{' '}
            or <Link to="/register">register</Link> to write a comment.
          </div>
        )}
      </section>
    </>
  );
}
