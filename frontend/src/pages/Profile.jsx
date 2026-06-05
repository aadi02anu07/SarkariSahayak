import { useState, useEffect } from 'react';
import { userApi } from '../api/user.api';
import { useAuthStore } from '../store/authStore';

const STATES = ['Andhra Pradesh','Bihar','Chhattisgarh','Delhi','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Odisha','Punjab','Rajasthan','Tamil Nadu','Telangana','Uttar Pradesh','Uttarakhand','West Bengal'];

export default function Profile() {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    userApi.getProfile().then((res) => setProfile(res.data.data || {})).finally(() => setIsLoading(false));
  }, []);

  const update = (field, value) => setProfile((p) => ({ ...p, [field]: value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await userApi.updateProfile(profile);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) { console.error(err); }
    finally { setIsSaving(false); }
  };

  if (isLoading) return <div className="loading-page">Loading profile...</div>;

  return (
    <div className="profile-page">
      <div className="profile-header">
        <h1>My Eligibility Profile</h1>
        <p>This profile powers your scheme matches. Keep it updated for the best results.</p>
        {profile?.profileScore != null && (
          <div className="score-badge">{profile.profileScore}% Complete</div>
        )}
      </div>

      <div className="profile-user-info">
        <p><strong>Name:</strong> {user?.name}</p>
        <p><strong>Email:</strong> {user?.email}</p>
        <p><strong>Account Type:</strong> {user?.isPremium ? '⭐ Premium' : 'Free'}</p>
      </div>

      <form onSubmit={handleSave} className="profile-form">
        <h2>Eligibility Details</h2>

        <div className="form-grid">
          <div className="form-group">
            <label>State</label>
            <select value={profile?.state || ''} onChange={(e) => update('state', e.target.value)}>
              <option value="">Select state</option>
              {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label>Category</label>
            <select value={profile?.category || ''} onChange={(e) => update('category', e.target.value)}>
              <option value="">Select</option>
              {['GENERAL', 'OBC', 'SC', 'ST', 'EWS'].map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label>Age</label>
            <input type="number" value={profile?.age || ''} onChange={(e) => update('age', parseInt(e.target.value))} />
          </div>

          <div className="form-group">
            <label>Gender</label>
            <select value={profile?.gender || ''} onChange={(e) => update('gender', e.target.value)}>
              <option value="">Select</option>
              {['MALE', 'FEMALE', 'OTHER'].map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label>Occupation</label>
            <select value={profile?.occupation || ''} onChange={(e) => update('occupation', e.target.value)}>
              <option value="">Select</option>
              {['FARMER', 'STUDENT', 'BUSINESS', 'LABOURER', 'GOVT_EMPLOYEE', 'OTHER'].map((o) => (
                <option key={o} value={o}>{o.replace('_', ' ')}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Annual Family Income (₹)</label>
            <input type="number" value={profile?.annualIncome || ''} onChange={(e) => update('annualIncome', parseInt(e.target.value))} placeholder="e.g. 150000" />
          </div>

          <div className="form-group">
            <label>Education Level</label>
            <select value={profile?.education || ''} onChange={(e) => update('education', e.target.value)}>
              <option value="">Select</option>
              {[['BELOW_10','Below 10th'],['TENTH','10th'],['TWELFTH','12th'],['GRADUATE','Graduate'],['POSTGRADUATE','Post Graduate'],['DOCTORATE','Doctorate']].map(([v,l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Family Size</label>
            <input type="number" min="1" max="20" value={profile?.familySize || ''} onChange={(e) => update('familySize', parseInt(e.target.value))} />
          </div>
        </div>

        <div className="form-checkboxes">
          {[
            { field: 'isDisabled', label: 'Person with Disability' },
            { field: 'isBpl', label: 'BPL Household' },
            { field: 'hasBankAcct', label: 'Have Bank Account' },
            { field: 'ownsLand', label: 'Own Agricultural Land' },
          ].map(({ field, label }) => (
            <label key={field} className="checkbox-label">
              <input type="checkbox" checked={profile?.[field] || false} onChange={(e) => update(field, e.target.checked)} />
              {label}
            </label>
          ))}
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Profile'}
          </button>
          {saved && <span className="save-success">✓ Profile saved!</span>}
        </div>
      </form>
    </div>
  );
}
