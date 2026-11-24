import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../AuthContext.jsx';

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const backTo = location.state?.from || '/';

  const [loginName, setLoginName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={backTo} replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(loginName, password);
      navigate(backTo, { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="row justify-content-center">
      <div className="col-sm-10 col-md-6 col-lg-4">
        <form className="card card-body shadow-sm p-4" onSubmit={handleSubmit} noValidate>
          <h1 className="h4 mb-3">Log in</h1>
          {error && <div className="alert alert-danger py-2">{error}</div>}
          <div className="mb-3">
            <label className="form-label" htmlFor="login">
              Username or email
            </label>
            <input
              id="login"
              className="form-control"
              value={loginName}
              onChange={(e) => setLoginName(e.target.value)}
              autoComplete="username"
              autoFocus
            />
          </div>
          <div className="mb-3">
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <button className="btn btn-primary w-100" disabled={busy}>
            {busy ? 'Logging in…' : 'Log in'}
          </button>
          <p className="text-center small mt-3 mb-0">
            No account? <Link to="/register" state={location.state}>Register</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
