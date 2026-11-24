import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router';
import { useSession } from '../../context/SessionContext.jsx';
import Avatar from '../ui/Avatar.jsx';

export default function SiteHeader() {
  const { member, signOut } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const closeMenu = () => setMenuOpen(false);

  async function handleSignOut() {
    await signOut();
    closeMenu();
    navigate('/');
  }

  return (
    <header className="site-header">
      <div className="container d-flex align-items-center gap-3">
        <Link to="/" className="brand" onClick={closeMenu}>
          <span className="brand-mark">T</span>
          <span className="brand-name">Turgus</span>
        </Link>

        <button
          type="button"
          className="menu-button d-md-none ms-auto"
          aria-expanded={menuOpen}
          aria-controls="site-menu"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? '✕' : '☰'}
          <span className="visually-hidden">Menu</span>
        </button>

        <nav id="site-menu" className={`site-menu${menuOpen ? ' is-open' : ''}`}>
          <NavLink to="/" end className="site-link" onClick={closeMenu}>
            Browse
          </NavLink>
          <NavLink to="/saved" className="site-link" onClick={closeMenu}>
            ★ Saved
          </NavLink>

          <div className="site-menu-actions">
            {member ? (
              <>
                <a href="/admin" className="member-chip" title="Open my account (admin area)">
                  <Avatar name={member.username} size={28} />
                  <span>{member.username}</span>
                </a>
                <button type="button" className="btn btn-link site-link px-0" onClick={handleSignOut}>
                  Sign out
                </button>
              </>
            ) : (
              <>
                <NavLink to="/sign-in" className="site-link" onClick={closeMenu}>
                  Sign in
                </NavLink>
                <NavLink to="/join" className="site-link" onClick={closeMenu}>
                  Join
                </NavLink>
              </>
            )}
            {/* The admin area is a separate server-rendered part, so a normal link is used */}
            <a href="/admin/ads/new" className="btn btn-accent rounded-pill px-3">
              + Sell something
            </a>
          </div>
        </nav>
      </div>
    </header>
  );
}
