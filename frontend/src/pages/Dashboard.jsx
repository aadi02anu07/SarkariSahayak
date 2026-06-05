import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { userApi } from '../api/user.api';
import { notificationApi } from '../api/notification.api';
import { useAuthStore } from '../store/authStore';

const STATUS_LABELS = {
  SAVED: { label: 'Saved', color: '#3498db' },
  INTERESTED: { label: 'Interested', color: '#9b59b6' },
  APPLIED: { label: 'Applied', color: '#e67e22' },
  DOCS_SUBMITTED: { label: 'Docs Submitted', color: '#f39c12' },
  APPROVED: { label: '✅ Approved', color: '#27ae60' },
  REJECTED: { label: 'Rejected', color: '#e74c3c' },
};

export default function Dashboard() {
  const { user } = useAuthStore();
  const [savedSchemes, setSavedSchemes] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      userApi.getSavedSchemes(),
      notificationApi.getAll({ limit: 1 }),
      userApi.getProfile(),
    ]).then(([savedRes, notifRes, profileRes]) => {
      setSavedSchemes(savedRes.data.data);
      setUnreadCount(notifRes.data.data.unreadCount || 0);
      setProfile(profileRes.data.data);
    }).catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const updateStatus = async (schemeId, status) => {
    try {
      await userApi.updateSavedScheme(schemeId, { status });
      setSavedSchemes((prev) =>
        prev.map((s) => s.schemeId === schemeId ? { ...s, status } : s)
      );
    } catch (err) { console.error(err); }
  };

  const removeScheme = async (schemeId) => {
    try {
      await userApi.removeSavedScheme(schemeId);
      setSavedSchemes((prev) => prev.filter((s) => s.schemeId !== schemeId));
    } catch (err) { console.error(err); }
  };

  if (isLoading) return <div className="loading-page">Loading dashboard...</div>;

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1>Welcome back, {user?.name?.split(' ')[0] || 'there'}! 👋</h1>
        <div className="dashboard-quick-links">
          <Link to="/eligibility" className="quick-link">🔍 Check Eligibility</Link>
          <Link to="/schemes" className="quick-link">📋 Browse Schemes</Link>
          <Link to="/notifications" className="quick-link">
            🔔 Notifications {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
          </Link>
        </div>
      </div>

      {/* Profile Completeness */}
      {profile && (
        <div className="profile-completeness-card">
          <div className="completeness-header">
            <div>
              <h3>Profile Completeness: {profile.profileScore}%</h3>
              <p>
                {profile.profileScore < 100
                  ? `Complete your profile to unlock more matching schemes`
                  : '✅ Profile complete!'}
              </p>
            </div>
            <Link to="/profile" className="btn-outline">Update Profile</Link>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${profile.profileScore}%` }} />
          </div>
        </div>
      )}

      {/* Saved Schemes */}
      <div className="saved-schemes-section">
        <div className="section-header">
          <h2>My Schemes ({savedSchemes.length})</h2>
          <Link to="/schemes" className="btn-outline">+ Find More Schemes</Link>
        </div>

        {savedSchemes.length === 0 ? (
          <div className="empty-state">
            <p>You haven't saved any schemes yet.</p>
            <Link to="/eligibility" className="btn-primary">Check Your Eligibility →</Link>
          </div>
        ) : (
          <div className="saved-list">
            {savedSchemes.map(({ schemeId, status, scheme }) => (
              <div key={schemeId} className="saved-card">
                <div className="saved-card-header">
                  <Link to={`/schemes/${scheme.slug}`}><h3>{scheme.name}</h3></Link>
                  <span className="status-pill" style={{ background: STATUS_LABELS[status]?.color }}>
                    {STATUS_LABELS[status]?.label}
                  </span>
                </div>
                <p className="saved-ministry">{scheme.ministry}</p>
                {scheme.closeDate && (
                  <p className="saved-deadline">
                    ⏰ Deadline: {new Date(scheme.closeDate).toLocaleDateString('en-IN')}
                  </p>
                )}

                <div className="saved-actions">
                  <select
                    value={status}
                    onChange={(e) => updateStatus(schemeId, e.target.value)}
                    className="status-select"
                  >
                    {Object.keys(STATUS_LABELS).map((s) => (
                      <option key={s} value={s}>{STATUS_LABELS[s].label}</option>
                    ))}
                  </select>
                  {scheme.applyUrl && (
                    <a href={scheme.applyUrl} target="_blank" rel="noopener noreferrer" className="btn-primary btn-sm">
                      Apply →
                    </a>
                  )}
                  <button className="btn-danger btn-sm" onClick={() => removeScheme(schemeId)}>Remove</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
