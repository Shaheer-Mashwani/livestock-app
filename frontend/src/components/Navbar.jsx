import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout, canEdit } = useAuth();
  const location = useLocation();
  const navigate  = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Don't show navbar on the login page
  if (!user) return null;

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="nav">
      <Link className="nav-logo" to="/dashboard">
        <div className="nav-logo-icon">🐄</div>
        <div>
          <div className="nav-logo-text">L&amp;DD KPK</div>
          <div className="nav-logo-sub">Livestock Management System</div>
        </div>
      </Link>

      <div className="nav-tabs">
        {/* Only operator/manager can see Data Entry tab */}
        {canEdit && (
          <Link
            to="/entry"
            className={`nav-tab ${isActive('/entry') ? 'active' : ''}`}
          >
            📝 Data Entry
          </Link>
        )}
        <Link
          to="/dashboard"
          className={`nav-tab ${isActive('/dashboard') ? 'active' : ''}`}
        >
          📊 Dashboard
        </Link>
      </div>

      <div className="nav-user">
        <div className="nav-avatar">
          {(user.fullName?.[0] || user.username?.[0] || '?').toUpperCase()}
        </div>
        <span>{user.fullName}</span>
        <span className={`nav-role-badge ${user.role === 'viewer' ? 'viewer' : 'full'}`}>
          {user.role}
        </span>
        <button className="nav-logout" onClick={handleLogout}>Sign Out</button>
      </div>
    </nav>
  );
};

export default Navbar;