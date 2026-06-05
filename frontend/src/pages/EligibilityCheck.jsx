import { useState } from 'react';
import { schemeApi } from '../api/scheme.api';
import { userApi } from '../api/user.api';
import { useAuthStore } from '../store/authStore';
import { Link } from 'react-router-dom';

const STEPS = [
  { id: 1, title: 'Location', fields: ['state'] },
  { id: 2, title: 'Background', fields: ['category', 'gender', 'age'] },
  { id: 3, title: 'Work & Income', fields: ['occupation', 'annualIncome', 'familySize'] },
  { id: 4, title: 'Education', fields: ['education'] },
  { id: 5, title: 'Other Details', fields: ['isDisabled', 'isBpl', 'hasBankAcct', 'ownsLand'] },
];

const STATES = ['Andhra Pradesh','Bihar','Chhattisgarh','Delhi','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal'];

const CONFIDENCE_META = {
  DEFINITELY_ELIGIBLE: { icon: '✅', label: 'Definitely Eligible', color: '#27ae60', bg: '#e8f8f0' },
  LIKELY_ELIGIBLE: { icon: '🟡', label: 'Likely Eligible', color: '#f39c12', bg: '#fef9e7' },
  CHECK_MANUALLY: { icon: '🔍', label: 'Check Manually', color: '#e67e22', bg: '#fdf2e9' },
};

export default function EligibilityCheck() {
  const { isAuthenticated } = useAuthStore();
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState({});
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const update = (field, value) => setProfile((p) => ({ ...p, [field]: value }));

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const res = await schemeApi.match(profile);
      setResults(res.data.data);

      // If logged in, also save profile
      if (isAuthenticated) {
        await userApi.updateProfile(profile).catch(() => {});
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (results) {
    return (
      <div className="eligibility-results">
        <h1>Your Eligibility Results</h1>
        <p className="results-subtitle">
          Found <strong>{results.length}</strong> schemes you may qualify for.
        </p>
        {!isAuthenticated && (
          <div className="login-prompt">
            💡 <Link to="/register">Create a free account</Link> to save these results and get deadline reminders!
          </div>
        )}

        <div className="results-list">
          {results.map(({ scheme, confidence, breakdown, passCount }) => {
            const meta = CONFIDENCE_META[confidence];
            return (
              <div key={scheme.id} className="result-card" style={{ borderLeftColor: meta?.color }}>
                <div className="result-header">
                  <div>
                    <span className="confidence-badge" style={{ background: meta?.bg, color: meta?.color }}>
                      {meta?.icon} {meta?.label}
                    </span>
                    <Link to={`/schemes/${scheme.slug}`}><h3>{scheme.name}</h3></Link>
                    <p className="result-ministry">{scheme.ministry}</p>
                  </div>
                  <p className="result-amount">{scheme.benefitAmount}</p>
                </div>

                <div className="criteria-breakdown">
                  {breakdown.map((c) => (
                    <div key={c.label} className={`criterion ${c.result.toLowerCase()}`}>
                      <span className="crit-icon">
                        {c.result === 'PASS' ? '✓' : c.result === 'FAIL' ? '✗' : c.result === 'N/A' ? '—' : '?'}
                      </span>
                      <span className="crit-label">{c.label}</span>
                      <span className="crit-detail">{c.detail}</span>
                    </div>
                  ))}
                </div>

                <div className="result-actions">
                  <Link to={`/schemes/${scheme.slug}`} className="btn-outline">View Details</Link>
                  {scheme.applyUrl && (
                    <a href={scheme.applyUrl} target="_blank" rel="noopener noreferrer" className="btn-primary">
                      Apply Now →
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <button className="btn-outline" onClick={() => { setResults(null); setStep(1); setProfile({}); }}>
          ← Start Over
        </button>
      </div>
    );
  }

  return (
    <div className="eligibility-page">
      <div className="quiz-container">
        <div className="quiz-header">
          <h1>Check Your Eligibility</h1>
          <p>Answer a few questions to see which government schemes you qualify for.</p>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${(step / STEPS.length) * 100}%` }} />
          </div>
          <p className="step-label">Step {step} of {STEPS.length}: {STEPS[step - 1].title}</p>
        </div>

        <div className="quiz-body">
          {step === 1 && (
            <div className="form-group">
              <label>Which state are you from?</label>
              <select value={profile.state || ''} onChange={(e) => update('state', e.target.value)}>
                <option value="">Select your state</option>
                {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}

          {step === 2 && (
            <>
              <div className="form-group">
                <label>Category</label>
                <select value={profile.category || ''} onChange={(e) => update('category', e.target.value)}>
                  <option value="">Select category</option>
                  {['GENERAL', 'OBC', 'SC', 'ST', 'EWS'].map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Gender</label>
                <div className="radio-group">
                  {['MALE', 'FEMALE', 'OTHER'].map((g) => (
                    <label key={g} className="radio-label">
                      <input type="radio" name="gender" value={g} checked={profile.gender === g} onChange={() => update('gender', g)} />
                      {g}
                    </label>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>Age</label>
                <input type="number" min="1" max="120" value={profile.age || ''} onChange={(e) => update('age', parseInt(e.target.value))} placeholder="Your age" />
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="form-group">
                <label>Occupation</label>
                <select value={profile.occupation || ''} onChange={(e) => update('occupation', e.target.value)}>
                  <option value="">Select occupation</option>
                  {['FARMER', 'STUDENT', 'BUSINESS', 'LABOURER', 'GOVT_EMPLOYEE', 'OTHER'].map((o) => (
                    <option key={o} value={o}>{o.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Annual Family Income (₹)</label>
                <input type="number" min="0" value={profile.annualIncome || ''} onChange={(e) => update('annualIncome', parseInt(e.target.value))} placeholder="e.g. 150000" />
              </div>
              <div className="form-group">
                <label>Family Size</label>
                <input type="number" min="1" max="20" value={profile.familySize || ''} onChange={(e) => update('familySize', parseInt(e.target.value))} placeholder="Number of family members" />
              </div>
            </>
          )}

          {step === 4 && (
            <div className="form-group">
              <label>Highest Education Level</label>
              {[
                { value: 'BELOW_10', label: 'Below 10th' },
                { value: 'TENTH', label: '10th Pass' },
                { value: 'TWELFTH', label: '12th Pass' },
                { value: 'GRADUATE', label: 'Graduate' },
                { value: 'POSTGRADUATE', label: 'Post Graduate' },
                { value: 'DOCTORATE', label: 'Doctorate' },
              ].map((opt) => (
                <label key={opt.value} className="radio-label">
                  <input type="radio" name="education" value={opt.value} checked={profile.education === opt.value} onChange={() => update('education', opt.value)} />
                  {opt.label}
                </label>
              ))}
            </div>
          )}

          {step === 5 && (
            <>
              {[
                { field: 'isDisabled', label: 'Do you have a disability?' },
                { field: 'isBpl', label: 'Are you a BPL (Below Poverty Line) household?' },
                { field: 'hasBankAcct', label: 'Do you have a bank account?' },
                { field: 'ownsLand', label: 'Do you own agricultural land?' },
              ].map(({ field, label }) => (
                <div key={field} className="form-group">
                  <label>{label}</label>
                  <div className="radio-group">
                    <label className="radio-label"><input type="radio" name={field} checked={profile[field] === true} onChange={() => update(field, true)} /> Yes</label>
                    <label className="radio-label"><input type="radio" name={field} checked={profile[field] === false} onChange={() => update(field, false)} /> No</label>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        <div className="quiz-nav">
          {step > 1 && <button className="btn-outline" onClick={() => setStep((s) => s - 1)}>← Back</button>}
          {step < STEPS.length ? (
            <button className="btn-primary" onClick={() => setStep((s) => s + 1)}>Next →</button>
          ) : (
            <button className="btn-primary" onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? 'Finding schemes...' : '🔍 Find My Schemes'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
