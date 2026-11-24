import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../AuthContext.jsx';

const FIELDS = [
  { name: 'username', label: 'Username', type: 'text', autoComplete: 'username' },
  { name: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
  { name: 'password', label: 'Password', type: 'password', autoComplete: 'new-password' },
  { name: 'password2', label: 'Repeat password', type: 'password', autoComplete: 'new-password' },
];

export default function RegisterPage() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const backTo = location.state?.from || '/';

  const [values, setValues] = useState({ username: '', email: '', password: '', password2: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={backTo} replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setErrors({});
    setError('');
    setBusy(true);
    try {
      await register(values); // the server checks everything again
      navigate(backTo, { replace: true });
    } catch (err) {
      setErrors(err.fieldErrors);
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="row justify-content-center">
      <div className="col-sm-10 col-md-6 col-lg-5">
        <form className="card card-body shadow-sm p-4" onSubmit={handleSubmit} noValidate>
          <h1 className="h4 mb-3">Create an account</h1>
          {error && Object.keys(errors).length === 0 && <div className="alert alert-danger py-2">{error}</div>}

          {FIELDS.map((field) => (
            <div className="mb-3" key={field.name}>
              <label className="form-label" htmlFor={field.name}>
                {field.label}
              </label>
              <input
                id={field.name}
                type={field.type}
                autoComplete={field.autoComplete}
                className={`form-control${errors[field.name] ? ' is-invalid' : ''}`}
                value={values[field.name]}
                onChange={(e) => setValues({ ...values, [field.name]: e.target.value })}
              />
              {errors[field.name] && <div className="invalid-feedback">{errors[field.name]}</div>}
            </div>
          ))}

          <button className="btn btn-primary w-100" disabled={busy}>
            {busy ? 'Creating…' : 'Register'}
          </button>
          <p className="text-center small mt-3 mb-0">
            Already registered? <Link to="/login" state={location.state}>Log in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
