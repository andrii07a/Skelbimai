// Form for a new comment. Sends it to the API and gives the saved comment back to the page.
import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { api, http } from '../../lib/http.js';
import { useSession } from '../../context/SessionContext.jsx';

const MAX_LENGTH = 1000;

export default function CommentComposer({ listingId, onPosted }) {
  const { member } = useSession();
  const location = useLocation();
  const [text, setText] = useState('');
  const [problem, setProblem] = useState('');
  const [sending, setSending] = useState(false);

  if (!member) {
    return (
      <div className="composer-locked">
        Want to ask something?{' '}
        <Link to="/sign-in" state={{ returnTo: location.pathname }}>
          Sign in
        </Link>{' '}
        or <Link to="/join">create an account</Link>.
      </div>
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!text.trim()) {
      setProblem('Write something first.');
      return;
    }
    setProblem('');
    setSending(true);
    try {
      const comment = await http.post(api.comments(listingId), { text });
      onPosted(comment);
      setText('');
    } catch (err) {
      setProblem(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <form className="composer" onSubmit={handleSubmit} noValidate>
      <label htmlFor="comment-text" className="visually-hidden">
        Your comment
      </label>
      <textarea
        id="comment-text"
        className={`form-control${problem ? ' is-invalid' : ''}`}
        rows={3}
        maxLength={MAX_LENGTH}
        placeholder="Write a comment or ask the seller something…"
        value={text}
        onChange={(event) => setText(event.target.value)}
      />
      {problem && <div className="invalid-feedback d-block">{problem}</div>}
      <div className="d-flex justify-content-between align-items-center mt-2">
        <small className="text-muted">
          {text.length} / {MAX_LENGTH}
        </small>
        <button type="submit" className="btn btn-brand rounded-pill px-4" disabled={sending}>
          {sending ? 'Sending…' : 'Post comment'}
        </button>
      </div>
    </form>
  );
}
