import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useNotifStore } from '../../store/notifStore';
import { authApi } from '../../api/auth.api';

export default function Navbar() {
  const { isAuthenticated, user, refreshToken, logout } = useAuthStore();
  const { unreadCount } = useNotifStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await authApi.logout(refreshToken);
    } catch {
      // swallow errors — log out locally regardless
    }
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">🇮🇳 SarkariSahayak</Link>
      </div>

      <div className="navbar-links">
        <Link to="/schemes">Browse Schemes</Link>
        <Link to="/eligibility">Check Eligibility</Link>

        {isAuthenticated ? (
          <>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/notifications" className="notif-link">
              🔔{unreadCount > 0 && <span className="badge">{unreadCount}</span>}
            </Link>
            <div className="dropdown">
              <span className="user-name">{user?.name || user?.email}</span>
              <div className="dropdown-menu">
                <Link to="/profile">Profile</Link>
                {user?.role === 'ADMIN' && <Link to="/admin">Admin Panel</Link>}
                <button onClick={handleLogout}>Logout</button>
              </div>
            </div>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register" className="btn-primary">Get Started</Link>
          </>
        )}
      </div>
    </nav>
  );
}
