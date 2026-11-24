import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router';
import { useAuth } from '../AuthContext.jsx';

export default function NavBar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false); // mobile menu
  const navigate = useNavigate();
  const close = () => setOpen(false);

  async function handleLogout() {
    await logout();
    close();
    navigate('/');
  }

  return (
    <nav className="navbar navbar-expand-md navbar-dark bg-primary sticky-top shadow-sm">
      <div className="container">
        <Link className="navbar-brand fw-semibold" to="/" onClick={close}>
          📢 Classifieds
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          aria-controls="mainNav"
          aria-expanded={open}
          aria-label="Menu"
          onClick={() => setOpen(!open)}
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className={`collapse navbar-collapse${open ? ' show' : ''}`} id="mainNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <NavLink className="nav-link" to="/" end onClick={close}>
                All ads
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/favorites" onClick={close}>
                ⭐ Saved
              </NavLink>
            </li>
          </ul>

          <div className="d-flex flex-wrap align-items-center gap-2 py-2 py-md-0">
            {/* The admin area is a separate (server-rendered) part, so a normal link is used */}
            <a className="btn btn-warning btn-sm" href="/admin/ads/new">
              + Post an ad
            </a>
            {user ? (
              <>
                <a className="btn btn-outline-light btn-sm" href="/admin">
                  My account ({user.username})
                </a>
                <button className="btn btn-light btn-sm" onClick={handleLogout}>
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link className="btn btn-outline-light btn-sm" to="/login" onClick={close}>
                  Log in
                </Link>
                <Link className="btn btn-light btn-sm" to="/register" onClick={close}>
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
