import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { schemeApi } from '../api/scheme.api';
import { userApi } from '../api/user.api';
import { useAuthStore } from '../store/authStore';

const CONFIDENCE_LABELS = {
  DEFINITELY_ELIGIBLE: { label: '✅ Definitely Eligible', color: '#27ae60' },
  LIKELY_ELIGIBLE: { label: '🟡 Likely Eligible', color: '#f39c12' },
  CHECK_MANUALLY: { label: '🔍 Check Manually', color: '#e67e22' },
  NOT_ELIGIBLE: { label: '❌ Not Eligible', color: '#e74c3c' },
};

export default function SchemeDetailPage() {
  const { slug } = useParams();
  const { isAuthenticated } = useAuthStore();
  const [scheme, setScheme] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

  useEffect(() => {
    schemeApi.getBySlug(slug)
      .then((res) => setScheme(res.data.data))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [slug]);

  if (isLoading) return <div className="loading-page">Loading scheme details...</div>;
  if (!scheme) return <div className="error-page">Scheme not found. <Link to="/schemes">Browse all schemes →</Link></div>;

  const handleSave = async () => {
    if (!isAuthenticated) { window.location.href = '/login'; return; }
    try {
      if (isSaved) {
        await userApi.removeSavedScheme(scheme.id);
        setIsSaved(false);
        setSaveStatus('Removed from saved');
      } else {
        await userApi.saveScheme(scheme.id);
        setIsSaved(true);
        setSaveStatus('Saved!');
      }
    } catch (err) { setSaveStatus(err.response?.data?.error?.message || 'Error'); }
  };

  return (
    <div className="scheme-detail-page">
      <div className="scheme-detail-header">
        <Link to="/schemes" className="back-link">← Back to Schemes</Link>
        <div className="scheme-badges">
          <span className={`benefit-badge benefit-${scheme.benefitType?.toLowerCase()}`}>{scheme.benefitType}</span>
          <span className={`status-badge status-${scheme.status?.toLowerCase()}`}>{scheme.status}</span>
          {scheme.isCentral && <span className="central-badge">Central Scheme</span>}
        </div>
        <h1>{scheme.name}</h1>
        {scheme.nameHindi && <p className="hindi-name">{scheme.nameHindi}</p>}
        <p className="ministry-name">🏛️ {scheme.ministry}</p>
      </div>

      <div className="scheme-detail-grid">
        {/* Main Info */}
        <div className="scheme-main">
          <section className="detail-section">
            <h2>About This Scheme</h2>
            <p>{scheme.description}</p>
          </section>

          {scheme.documentsNeeded?.length > 0 && (
            <section className="detail-section">
              <h2>📁 Documents Required</h2>
              <ul className="documents-list">
                {scheme.documentsNeeded.map((doc) => (
                  <li key={doc}>✓ {doc}</li>
                ))}
              </ul>
            </section>
          )}

          {scheme.eligibilityJson && (
            <section className="detail-section">
              <h2>📋 Eligibility Criteria</h2>
              <div className="eligibility-list">
                {scheme.eligibilityJson.states?.[0] !== 'ALL' && (
                  <div className="crit">🗺️ <strong>States:</strong> {scheme.eligibilityJson.states.join(', ')}</div>
                )}
                {scheme.eligibilityJson.categories?.[0] !== 'ALL' && (
                  <div className="crit">👥 <strong>Category:</strong> {scheme.eligibilityJson.categories.join(', ')}</div>
                )}
                {scheme.eligibilityJson.minAge && (
                  <div className="crit">🎂 <strong>Age:</strong> {scheme.eligibilityJson.minAge}–{scheme.eligibilityJson.maxAge || '∞'} years</div>
                )}
                {scheme.eligibilityJson.maxIncome && (
                  <div className="crit">💵 <strong>Max Income:</strong> ₹{scheme.eligibilityJson.maxIncome.toLocaleString('en-IN')}/year</div>
                )}
                {scheme.eligibilityJson.occupations?.[0] !== 'ALL' && (
                  <div className="crit">💼 <strong>Occupation:</strong> {scheme.eligibilityJson.occupations.join(', ')}</div>
                )}
                {scheme.eligibilityJson.requiresBPL && (
                  <div className="crit">📉 <strong>BPL:</strong> Below Poverty Line card required</div>
                )}
                {scheme.eligibilityJson.customCriteria && (
                  <div className="crit crit-custom">ℹ️ {scheme.eligibilityJson.customCriteria}</div>
                )}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <aside className="scheme-sidebar">
          <div className="sidebar-card">
            <h3>Benefit Details</h3>
            {scheme.benefitAmount && <p className="benefit-big">💰 {scheme.benefitAmount}</p>}
            {scheme.processingDays && <p>⏳ Processing: ~{scheme.processingDays} days</p>}
          </div>

          {(scheme.openDate || scheme.closeDate) && (
            <div className="sidebar-card">
              <h3>Application Window</h3>
              {scheme.openDate && <p>📅 Opens: {new Date(scheme.openDate).toLocaleDateString('en-IN')}</p>}
              {scheme.closeDate && <p>⏰ Closes: {new Date(scheme.closeDate).toLocaleDateString('en-IN')}</p>}
              {scheme.isRolling && <p className="rolling-tag">🔄 Rolling application (no fixed deadline)</p>}
            </div>
          )}

          <div className="sidebar-actions">
            {scheme.applyUrl && (
              <a href={scheme.applyUrl} target="_blank" rel="noopener noreferrer" className="btn-primary btn-full">
                Apply on Official Portal →
              </a>
            )}
            <button onClick={handleSave} className={`btn-save btn-full ${isSaved ? 'saved' : ''}`}>
              {isSaved ? '✓ Saved to Dashboard' : '+ Save This Scheme'}
            </button>
            {saveStatus && <p className="save-status">{saveStatus}</p>}
          </div>

          <div className="sidebar-card">
            <h3>Tags</h3>
            <div className="tags">
              {scheme.tags?.map((tag) => <span key={tag} className="tag">#{tag}</span>)}
            </div>
          </div>

          <div className="disclaimer-box">
            ⚠️ SarkariSahayak is not affiliated with any government body.
            Always verify on the official portal before applying.
          </div>
        </aside>
      </div>

      <div className="cta-banner">
        <Link to="/eligibility" className="btn-primary">
          Check if You Qualify for More Schemes →
        </Link>
      </div>
    </div>
  );
}
