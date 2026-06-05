import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { schemeApi } from '../api/scheme.api';
import { userApi } from '../api/user.api';
import { useAuthStore } from '../store/authStore';

const BENEFIT_TYPES = ['CASH', 'LOAN', 'SUBSIDY', 'SCHOLARSHIP', 'INSURANCE', 'OTHER'];
const STATES = ['All States', 'Uttar Pradesh', 'Maharashtra', 'Bihar', 'Madhya Pradesh', 'Rajasthan', 'West Bengal', 'Tamil Nadu', 'Karnataka', 'Gujarat', 'Delhi'];

export default function SchemeSearch() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated } = useAuthStore();

  const [schemes, setSchemes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    state: '',
    benefitType: '',
    sort: 'newest',
  });
  const [savedSchemes, setSavedSchemes] = useState(new Set());

  const fetchSchemes = useCallback(async (reset = true) => {
    setIsLoading(true);
    try {
      const params = { ...filters, limit: 20 };
      if (!reset && nextCursor) params.cursor = nextCursor;
      if (params.state === 'All States') delete params.state;

      const res = await schemeApi.list(params);
      const data = res.data.data;
      const newCursor = res.data.meta?.nextCursor;

      if (reset) setSchemes(data);
      else setSchemes((prev) => [...prev, ...data]);
      setNextCursor(newCursor);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [filters, nextCursor]);

  useEffect(() => { fetchSchemes(true); }, [filters]);

  useEffect(() => {
    if (isAuthenticated) {
      userApi.getSavedSchemes().then((res) => {
        setSavedSchemes(new Set(res.data.data.map((s) => s.schemeId)));
      }).catch(() => {});
    }
  }, [isAuthenticated]);

  const handleSave = async (schemeId) => {
    if (!isAuthenticated) { window.location.href = '/login'; return; }
    try {
      if (savedSchemes.has(schemeId)) {
        await userApi.removeSavedScheme(schemeId);
        setSavedSchemes((prev) => { const s = new Set(prev); s.delete(schemeId); return s; });
      } else {
        await userApi.saveScheme(schemeId);
        setSavedSchemes((prev) => new Set(prev).add(schemeId));
      }
    } catch (err) { console.error(err); }
  };

  return (
    <div className="scheme-search-page">
      <div className="search-header">
        <h1>Browse Government Schemes</h1>
        <div className="search-bar-inline">
          <input
            type="text"
            placeholder="Search by name, ministry..."
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          />
        </div>
      </div>

      <div className="search-layout">
        {/* Filters Sidebar */}
        <aside className="filters-sidebar">
          <h3>Filters</h3>

          <div className="filter-group">
            <label>State</label>
            <select value={filters.state} onChange={(e) => setFilters((f) => ({ ...f, state: e.target.value }))}>
              {STATES.map((s) => <option key={s} value={s === 'All States' ? '' : s}>{s}</option>)}
            </select>
          </div>

          <div className="filter-group">
            <label>Benefit Type</label>
            <select value={filters.benefitType} onChange={(e) => setFilters((f) => ({ ...f, benefitType: e.target.value }))}>
              <option value="">All Types</option>
              {BENEFIT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="filter-group">
            <label>Sort By</label>
            <select value={filters.sort} onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value }))}>
              <option value="newest">Newest First</option>
              <option value="deadline_asc">Deadline (Soon)</option>
              <option value="views_desc">Most Popular</option>
            </select>
          </div>

          <Link to="/eligibility" className="btn-primary btn-full" style={{ marginTop: '16px', display: 'block', textAlign: 'center' }}>
            Check My Eligibility
          </Link>
        </aside>

        {/* Results */}
        <div className="schemes-list">
          {isLoading && schemes.length === 0 ? (
            <p className="loading">Loading schemes...</p>
          ) : schemes.length === 0 ? (
            <p className="no-results">No schemes found matching your filters.</p>
          ) : (
            <>
              {schemes.map((scheme) => (
                <div key={scheme.id} className="scheme-list-card">
                  <div className="scheme-card-header">
                    <span className={`benefit-badge benefit-${scheme.benefitType.toLowerCase()}`}>{scheme.benefitType}</span>
                    {scheme.closeDate && (
                      <span className="deadline-badge">
                        Deadline: {new Date(scheme.closeDate).toLocaleDateString('en-IN')}
                      </span>
                    )}
                    {scheme.isRolling && <span className="rolling-badge">Rolling</span>}
                  </div>

                  <Link to={`/schemes/${scheme.slug}`}>
                    <h3>{scheme.name}</h3>
                  </Link>
                  <p className="ministry">{scheme.ministry}</p>
                  {scheme.benefitAmount && <p className="benefit-amount">💰 {scheme.benefitAmount}</p>}

                  <div className="scheme-tags">
                    {scheme.tags?.slice(0, 4).map((tag) => (
                      <span key={tag} className="tag">#{tag}</span>
                    ))}
                  </div>

                  <div className="scheme-card-actions">
                    <Link to={`/schemes/${scheme.slug}`} className="btn-outline">View Details</Link>
                    <button
                      className={`btn-save ${savedSchemes.has(scheme.id) ? 'saved' : ''}`}
                      onClick={() => handleSave(scheme.id)}
                    >
                      {savedSchemes.has(scheme.id) ? '✓ Saved' : '+ Save'}
                    </button>
                  </div>
                </div>
              ))}

              {nextCursor && (
                <button className="btn-load-more" onClick={() => fetchSchemes(false)} disabled={isLoading}>
                  {isLoading ? 'Loading...' : 'Load More Schemes'}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
