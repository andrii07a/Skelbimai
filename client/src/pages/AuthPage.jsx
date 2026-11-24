// One page for both "Sign in" (/sign-in) and "Join" (/join), switched with tabs.
import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import { useSession } from '../context/SessionContext.jsx';

const JOIN_FIELDS = [
  { name: 'username', label: 'Username', type: 'text', autoComplete: 'username', hint: '3-30 letters, numbers or _' },
  { name: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
  { name: 'password', label: 'Password', type: 'password', autoComplete: 'new-password', hint: 'At least 6 characters' },
  { name: 'password2', label: 'Repeat password', type: 'password', autoComplete: 'new-password' },
];

const SIGN_IN_FIELDS = [
  { name: 'login', label: 'Username or email', type: 'text', autoComplete: 'username' },
  { name: 'password', label: 'Password', type: 'password', autoComplete: 'current-password' },
];

export default function AuthPage({ mode }) {
  const isJoin = mode === 'join';
  const fields = isJoin ? JOIN_FIELDS : SIGN_IN_FIELDS;
  const { member, signIn, join } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = location.state?.returnTo || '/';

  const [form, setForm] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [problem, setProblem] = useState('');
  const [busy, setBusy] = useState(false);

  if (member) return <Navigate to={returnTo} replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setProblem('');
    setFieldErrors({});
    setBusy(true);
    try {
      if (isJoin) await join(form);
      else await signIn(form.login ?? '', form.password ?? '');
      navigate(returnTo, { replace: true });
    } catch (err) {
      setFieldErrors(err.fieldErrors || {});
      if (!err.fieldErrors || Object.keys(err.fieldErrors).length === 0) setProblem(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="container py-5">
      <div className="auth-card">
        <div className="auth-aside">
          <span className="brand-mark brand-mark--large">T</span>
          <h1 className="h3 mt-3">{isJoin ? 'Join Turgus' : 'Welcome back'}</h1>
          <p className="mb-0">
            {isJoin
              ? 'Post ads with photos, comment on listings and save the things you like.'
              : 'Sign in to comment, save ads and manage your own listings.'}
          </p>
        </div>

        <div className="auth-main">
          <div className="auth-tabs" role="tablist">
            <Link to="/sign-in" state={location.state} role="tab" aria-selected={!isJoin} className={!isJoin ? 'is-active' : ''}>
              Sign in
            </Link>
            <Link to="/join" state={location.state} role="tab" aria-selected={isJoin} className={isJoin ? 'is-active' : ''}>
              Create account
            </Link>
          </div>

          <form onSubmit={handleSubmit} noValidate key={mode}>
            {problem && <div className="alert alert-danger py-2">{problem}</div>}
            {fields.map((field) => (
              <div className="mb-3" key={field.name}>
                <label htmlFor={field.name} className="form-label">
                  {field.label}
                </label>
                <input
                  id={field.name}
                  type={field.type}
                  autoComplete={field.autoComplete}
                  className={`form-control form-control-lg${fieldErrors[field.name] ? ' is-invalid' : ''}`}
                  value={form[field.name] ?? ''}
                  onChange={(event) => setForm({ ...form, [field.name]: event.target.value })}
                />
                {fieldErrors[field.name] ? (
                  <div className="invalid-feedback">{fieldErrors[field.name]}</div>
                ) : (
                  field.hint && <div className="form-text">{field.hint}</div>
                )}
              </div>
            ))}
            <button type="submit" className="btn btn-brand btn-lg w-100 rounded-pill" disabled={busy}>
              {busy ? 'Please wait…' : isJoin ? 'Create account' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
