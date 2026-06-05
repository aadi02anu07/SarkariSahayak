import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { Suspense, useEffect } from 'react';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import ProtectedRoute from './components/common/ProtectedRoute';
import { useAuthStore } from './store/authStore';
import axiosInstance from './api/axiosInstance';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import SchemeSearch from './pages/SchemeSearch';
import SchemeDetailPage from './pages/SchemeDetailPage';
import EligibilityCheck from './pages/EligibilityCheck';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import NotificationsPage from './pages/NotificationsPage';
import AdminDashboard from './pages/admin/AdminDashboard';

// Google OAuth callback handler
function OAuthCallback() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken');

    if (accessToken) {
      axiosInstance.get('/users/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      }).then((res) => {
        setAuth(res.data.data, accessToken, refreshToken);
        navigate('/dashboard', { replace: true });
      }).catch(() => navigate('/login?error=oauth_failed', { replace: true }));
    } else {
      navigate('/login?error=oauth_failed', { replace: true });
    }
  }, []);

  return <div className="loading-page">Completing login...</div>;
}

function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <Navbar />
        <main className="main-content">
          <Suspense fallback={<div className="loading-page">Loading...</div>}>
            <Routes>
              {/* Public */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/schemes" element={<SchemeSearch />} />
              <Route path="/schemes/:slug" element={<SchemeDetailPage />} />
              <Route path="/eligibility" element={<EligibilityCheck />} />
              <Route path="/oauth/callback" element={<OAuthCallback />} />

              {/* Protected */}
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />

              {/* Admin */}
              <Route path="/admin" element={<ProtectedRoute adminOnly={true}><AdminDashboard /></ProtectedRoute>} />

              {/* 404 */}
              <Route path="*" element={
                <div className="not-found">
                  <h1>404 — Page Not Found</h1>
                  <a href="/">Go Home</a>
                </div>
              } />
            </Routes>
          </Suspense>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
