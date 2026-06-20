import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const { login } = useAuth();
  const navigate   = useNavigate();

  const [tab, setTab]         = useState('staff'); // 'staff' | 'viewer'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]     = useState('');
  const [busy, setBusy]       = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const data = await login(username.trim().toLowerCase(), password);

      // Block viewer-tab users from staff accounts, and vice versa
      if (tab === 'staff' && data.role === 'viewer') {
        setError('This account is a Viewer account. Use the Viewer Login tab.');
        setBusy(false);
        return;
      }
      if (tab === 'viewer' && data.role !== 'viewer') {
        setError('This is a staff account. Use the Staff Login tab.');
        setBusy(false);
        return;
      }

      toast.success(`Welcome, ${data.fullName}!`);
      navigate(data.role === 'viewer' ? '/dashboard' : '/entry');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid username or password');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div id="page-login" style={{ display: 'flex' }}>
      <div className="login-bg-pattern"></div>

      <div className="login-header">
        <div className="login-header-icon">🐄</div>
        <div>
          <div className="login-header-title">L&amp;DD KPK</div>
          <div className="login-header-sub">Livestock Management System</div>
        </div>
      </div>

      <div className="login-body">
        <div className="login-wrap">

          {/* LEFT */}
          <div className="login-left">
            <div className="login-eyebrow">Sub-National Area Development Programme</div>
            <div className="login-headline">Livestock Data<br /><span>Management Portal</span></div>
            <div className="login-desc">
              Centralized system for farmer registration, livestock tracking,
              and district-level analytics across Khyber Pakhtunkhwa.
            </div>
            <div className="login-roles">
              <div className="login-role-pill">
                <div className="login-role-icon green">📝</div>
                <div>
                  <div className="login-role-name">Data Entry Operator</div>
                  <div className="login-role-desc">Register farmers, enter livestock &amp; farm data</div>
                </div>
              </div>
              <div className="login-role-pill">
                <div className="login-role-icon gold">👔</div>
                <div>
                  <div className="login-role-name">Manager / Admin</div>
                  <div className="login-role-desc">Full access — entry, dashboard, user management</div>
                </div>
              </div>
              <div className="login-role-pill">
                <div className="login-role-icon blue">👁️</div>
                <div>
                  <div className="login-role-name">Viewer</div>
                  <div className="login-role-desc">Read-only dashboard &amp; analytics access</div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT CARD */}
          <div className="login-card">
            <div className="login-card-tabs">
              <button
                className={`login-card-tab ${tab === 'staff' ? 'active' : ''}`}
                onClick={() => { setTab('staff'); setError(''); }}
              >
                Staff Login
              </button>
              <button
                className={`login-card-tab ${tab === 'viewer' ? 'active' : ''}`}
                onClick={() => { setTab('viewer'); setError(''); }}
              >
                Viewer Login
              </button>
            </div>

            <form className="login-form-wrap" onSubmit={handleLogin}>
              <div className="login-form-title">
                {tab === 'staff' ? 'Welcome back' : 'Dashboard Access'}
              </div>
              <div className="login-form-sub">
                {tab === 'staff'
                  ? 'Sign in with your staff credentials'
                  : 'Viewers can see analytics & reports only'}
              </div>

              {error && (
                <div className="login-error" style={{ display: 'flex' }}>
                  ⚠️ &nbsp; {error}
                </div>
              )}

              <div className="login-field">
                <label>Username</label>
                <div className="login-input-wrap">
                  <svg className="login-input-icon" viewBox="0 0 24 24">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Enter username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="login-field">
                <label>Password</label>
                <div className="login-input-wrap">
                  <svg className="login-input-icon" viewBox="0 0 24 24">
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <input
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              {tab === 'viewer' && (
                <div style={{
                  background: 'var(--gold-50)', border: '1px solid var(--gold-200)',
                  borderRadius: 10, padding: '12px 14px', marginBottom: 20,
                  fontSize: 12, color: '#8a6200',
                }}>
                  👁️ &nbsp; <strong>Viewer access</strong> is read-only. You can see the
                  dashboard, charts, and data table — but cannot add or edit records.
                </div>
              )}

              <button
                type="submit"
                className="login-btn"
                style={tab === 'viewer' ? { background: 'var(--gold-500)' } : {}}
                disabled={busy}
              >
                {busy ? 'Signing in...' : tab === 'staff' ? 'Sign In' : 'View Dashboard'}
              </button>

              <div className="login-divider">demo credentials</div>
              <div className="demo-creds">
                <strong>Test Accounts</strong>
                {tab === 'staff' ? (
                  <>
                    <div className="demo-row"><span>Operator</span><span>operator / 1234</span></div>
                    <div className="demo-row"><span>Manager</span><span>manager / 1234</span></div>
                  </>
                ) : (
                  <div className="demo-row"><span>Viewer</span><span>viewer / 1234</span></div>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>

      <div style={{
        textAlign: 'center', padding: 16, fontSize: 12, color: 'var(--green-300)',
        borderTop: '1px solid rgba(255,255,255,0.06)', position: 'relative', zIndex: 2,
      }}>
        Livestock &amp; Dairy Development Department (Extension) — Khyber Pakhtunkhwa
      </div>
    </div>
  );
};

export default Login;
