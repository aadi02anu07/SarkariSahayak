import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { schemeApi } from '../api/scheme.api';

const LIFE_EVENTS = [
  { slug: 'starting-a-business', label: '🏪 Starting a Business' },
  { slug: 'going-to-college', label: '🎓 Going to College' },
  { slug: 'lost-job', label: '💼 Lost a Job' },
  { slug: 'had-a-baby', label: '👶 Had a Baby' },
  { slug: 'disability-diagnosis', label: '♿ Disability Diagnosis' },
  { slug: 'buying-agricultural-equipment', label: '🚜 Buying Farm Equipment' },
];

export default function Home() {
  const [search, setSearch] = useState('');
  const [trending, setTrending] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    schemeApi.trending().then((res) => setTrending(res.data.data || [])).catch(() => {});
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/schemes?search=${encodeURIComponent(search)}`);
  };

  return (
    <div className="home-page">
      {/* Hero */}
      <section className="hero">
        <h1>Find Government Schemes You Qualify For</h1>
        <p>India has 2000+ welfare schemes worth ₹15+ lakh crore. Most eligible citizens never claim them. We fix that.</p>
        <form onSubmit={handleSearch} className="search-bar">
          <input
            type="text"
            placeholder="Search schemes... (e.g. PM-KISAN, Mudra Loan, OBC scholarship)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit">Search</button>
        </form>
        <div className="hero-ctas">
          <Link to="/eligibility" className="btn-primary btn-large">Check My Eligibility →</Link>
          <Link to="/schemes" className="btn-outline btn-large">Browse All Schemes</Link>
        </div>
        <p className="hero-stats">
          <strong>500+</strong> schemes · <strong>10+</strong> states · <strong>Free</strong> to use
        </p>
      </section>

      {/* Life Events */}
      <section className="life-events">
        <h2>Browse by Life Event</h2>
        <div className="life-events-grid">
          {LIFE_EVENTS.map((event) => (
            <Link key={event.slug} to={`/schemes/life-event/${event.slug}`} className="life-event-card">
              {event.label}
            </Link>
          ))}
        </div>
      </section>

      {/* Trending */}
      {trending.length > 0 && (
        <section className="trending">
          <h2>🔥 Trending Schemes This Week</h2>
          <div className="schemes-grid">
            {trending.map((scheme) => (
              <Link key={scheme.id} to={`/schemes/${scheme.slug}`} className="scheme-card">
                <span className="benefit-badge">{scheme.benefitType}</span>
                <h3>{scheme.name}</h3>
                <p className="benefit-amount">{scheme.benefitAmount}</p>
                <div className="tags">
                  {scheme.tags?.slice(0, 3).map((tag) => (
                    <span key={tag} className="tag">#{tag}</span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
          <Link to="/schemes" className="view-all">View All Schemes →</Link>
        </section>
      )}

      {/* How it works */}
      <section className="how-it-works">
        <h2>How It Works</h2>
        <div className="steps">
          <div className="step">
            <div className="step-num">1</div>
            <h3>Tell Us About Yourself</h3>
            <p>Fill in a quick 2-minute quiz about your state, income, occupation, and more.</p>
          </div>
          <div className="step">
            <div className="step-num">2</div>
            <h3>See Your Matches</h3>
            <p>We instantly show you all schemes you qualify for with clear eligibility explanations.</p>
          </div>
          <div className="step">
            <div className="step-num">3</div>
            <h3>Apply & Track</h3>
            <p>Save schemes, track your applications, and get reminders before deadlines close.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
