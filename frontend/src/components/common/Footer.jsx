export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div>
          <strong>🇮🇳 SarkariSahayak</strong>
          <p>Government Scheme Eligibility Navigator</p>
        </div>
        <div className="footer-links">
          <a href="/schemes">Browse Schemes</a>
          <a href="/eligibility">Check Eligibility</a>
        </div>
      </div>
      <p className="disclaimer">
        ⚠️ SarkariSahayak is not affiliated with any government body.
        Always verify scheme details on the official portal before applying.
      </p>
    </footer>
  );
}
