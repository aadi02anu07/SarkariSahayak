import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../../store/authStore';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export default function AdminDashboard() {
  const { accessToken } = useAuthStore();
  const [analytics, setAnalytics] = useState(null);
  const [schemes, setSchemes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const headers = { Authorization: `Bearer ${accessToken}` };

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/admin/analytics`, { headers }),
      axios.get(`${API}/admin/schemes?limit=20`, { headers }),
    ]).then(([analyticsRes, schemesRes]) => {
      setAnalytics(analyticsRes.data.data);
      setSchemes(schemesRes.data.data);
    }).catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const handlePublish = async (id) => {
    try {
      await axios.patch(`${API}/admin/schemes/${id}/publish`, {}, { headers });
      setSchemes((prev) => prev.map((s) => s.id === id ? { ...s, status: 'ACTIVE' } : s));
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this scheme?')) return;
    try {
      await axios.delete(`${API}/admin/schemes/${id}`, { headers });
      setSchemes((prev) => prev.filter((s) => s.id !== id));
    } catch (err) { console.error(err); }
  };

  if (isLoading) return <div className="loading-page">Loading admin dashboard...</div>;

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>⚙️ Admin Dashboard</h1>
        <Link to="/admin/schemes/new" className="btn-primary">+ Add Scheme</Link>
      </div>

      {/* Stats */}
      {analytics && (
        <div className="stats-grid">
          {[
            { label: 'Total Users', value: analytics.totalUsers, icon: '👥' },
            { label: 'Active Schemes', value: analytics.activeSchemes, icon: '📋' },
            { label: 'Total Saved', value: analytics.totalSaved, icon: '🔖' },
            { label: 'Premium Users', value: analytics.premiumUsers, icon: '⭐' },
          ].map(({ label, value, icon }) => (
            <div key={label} className="stat-card">
              <span className="stat-icon">{icon}</span>
              <div>
                <div className="stat-value">{value?.toLocaleString('en-IN')}</div>
                <div className="stat-label">{label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Schemes Table */}
      <div className="admin-schemes">
        <h2>Schemes</h2>
        <div className="schemes-table-wrapper">
          <table className="schemes-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {schemes.map((scheme) => (
                <tr key={scheme.id}>
                  <td>
                    <Link to={`/schemes/${scheme.slug}`}>{scheme.name}</Link>
                  </td>
                  <td>{scheme.benefitType}</td>
                  <td>
                    <span className={`status-pill status-${scheme.status.toLowerCase()}`}>
                      {scheme.status}
                    </span>
                  </td>
                  <td className="table-actions">
                    <Link to={`/admin/schemes/${scheme.id}/edit`} className="btn-outline btn-sm">Edit</Link>
                    {scheme.status === 'DRAFT' && (
                      <button className="btn-primary btn-sm" onClick={() => handlePublish(scheme.id)}>Publish</button>
                    )}
                    <button className="btn-danger btn-sm" onClick={() => handleDelete(scheme.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
