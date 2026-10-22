import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { authService } from '@/services/authService';
import { createTranslator } from '@/locales/messages';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Lock, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import styles from './Login.module.css';

const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const { setAuth } = useAuthStore();
    const { addToast } = useUIStore();

    const currentLang = document.documentElement.getAttribute('lang') || 'ar';
    const t = createTranslator(currentLang).t;
    const isRtl = currentLang === 'ar';

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password.length < 6) {
            setError(t('auth.resetSub'));
            return;
        }

        if (password !== confirmPassword) {
            setError(t('auth.passwordMismatch'));
            return;
        }

        setLoading(true);

        try {
            const response = await authService.resetPassword(token, password);
            setSuccess(true);
            addToast({ type: 'success', message: t('auth.resetSuccess') });

            // If the reset endpoint logs the user in and returns tokens, set auth immediately
            if (response?.success && (response?.token || response?.data?.token)) {
                setAuth(response.data || response);
                setTimeout(() => {
                    navigate('/', { replace: true });
                }, 1200);
            } else {
                setTimeout(() => {
                    navigate('/login', { replace: true });
                }, 1500);
            }
        } catch (err) {
            console.error('Reset password error:', err);
            const msg = err.response?.data?.message || err.message || 'Failed to reset password';
            setError(msg);
            addToast({ type: 'error', message: msg });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.leftPanel}>
                <div className={styles.branding}>
                    <img src="/ruknlogo.png" alt={t('layout.logoAlt') || 'Rukn CRM'} className={styles.logoImage} />
                    <h1>Rukn CRM</h1>
                    <p>{t('auth.brandingDesc')}</p>
                </div>
            </div>

            <div className={styles.rightPanel}>
                <div className={styles.formContainer}>
                    <div className={styles.header}>
                        <h2>{t('auth.resetTitle')}</h2>
                        <p>{t('auth.resetSub')}</p>
                    </div>

                    {error && <div className={styles.error}>{error}</div>}

                    {success ? (
                        <div>
                            <div className={styles.successNotice}>
                                <CheckCircle2 size={32} style={{ margin: '0 auto 0.75rem', color: '#10b981' }} />
                                <p>{t('auth.resetSuccess')}</p>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className={styles.form}>
                            <Input
                                name="password"
                                type="password"
                                label={t('auth.newPasswordLabel')}
                                placeholder={t('auth.newPasswordPlaceholder')}
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    setError('');
                                }}
                                leftIcon={<Lock size={18} />}
                                required
                                fullWidth
                                autoFocus
                            />

                            <Input
                                name="confirmPassword"
                                type="password"
                                label={t('auth.confirmPasswordLabel')}
                                placeholder={t('auth.newPasswordPlaceholder')}
                                value={confirmPassword}
                                onChange={(e) => {
                                    setConfirmPassword(e.target.value);
                                    setError('');
                                }}
                                leftIcon={<Lock size={18} />}
                                required
                                fullWidth
                            />

                            <Button
                                type="submit"
                                variant="primary"
                                size="lg"
                                fullWidth
                                loading={loading}
                            >
                                {t('auth.resetPasswordBtn')}
                            </Button>

                            <div className={styles.backLinkContainer}>
                                <Link to="/login" className={styles.backLink}>
                                    {isRtl ? <ArrowRight size={18} /> : <ArrowLeft size={18} />}
                                    <span>{t('auth.backToLogin')}</span>
                                </Link>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
