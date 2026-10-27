import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { usePlatformAuthStore } from '@/store/platformAuthStore';
import { ShieldCheck, Mail, Lock, AlertCircle, ArrowLeft } from 'lucide-react';
import styles from './PlatformLogin.module.css';

const PlatformLogin = () => {
  const navigate = useNavigate();
  const { login, isPlatformAuthenticated, loading, error } = usePlatformAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');

  // If already authenticated with platform, redirect to dashboard
  if (isPlatformAuthenticated) {
    return <Navigate to="/platform/dashboard" replace />;
  }

  const handlePreFillOwner = () => {
    setEmail('');
    setPassword('');
    setLocalError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (!email || !password) {
      setLocalError('Please enter both email and password.');
      return;
    }

    try {
      await login(email, password);
      navigate('/platform/dashboard', { replace: true });
    } catch (err) {
      // Error handled in store and displayed below
    }
  };

  const displayError = localError || error;

  return (
    <div className={styles.container} data-theme="dark">
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logoBadge}>
            <img src="/ruknlogo.png" alt="Rukn" className={styles.logo} />
            <div className={styles.badge}>
              <ShieldCheck size={14} />
              <span>SUPER-ADMIN</span>
            </div>
          </div>
          <h1 className={styles.title}>Platform Console</h1>
          <p className={styles.subtitle}>
            Authorized Rukn staff authentication plane
          </p>
        </div>


        {displayError && (
          <div className={styles.errorBox}>
            <AlertCircle size={18} className={styles.errorIcon} />
            <span>{displayError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="platform-email">Staff Email</label>
            <div className={styles.inputWrapper}>
              <Mail size={18} className={styles.inputIcon} />
              <input
                id="platform-email"
                type="email"
                className={styles.input}
                placeholder="staff@rukn.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="platform-password">Password</label>
            <div className={styles.inputWrapper}>
              <Lock size={18} className={styles.inputIcon} />
              <input
                id="platform-password"
                type="password"
                className={styles.input}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In to Platform Console'}
          </button>
        </form>

        <div className={styles.footer}>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className={styles.returnLink}
          >
            <ArrowLeft size={16} />
            <span>Return to Agency CRM Login</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlatformLogin;
