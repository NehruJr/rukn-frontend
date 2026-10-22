import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useUIStore } from '@/store/uiStore';
import { authService } from '@/services/authService';
import { createTranslator } from '@/locales/messages';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Mail, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import styles from './Login.module.css';

const ForgotPassword = () => {
    const { addToast } = useUIStore();
    
    // Determine language from HTML document or default to Arabic
    const currentLang = document.documentElement.getAttribute('lang') || 'ar';
    const t = createTranslator(currentLang).t;
    const isRtl = currentLang === 'ar';

    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [directResetUrl, setDirectResetUrl] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setDirectResetUrl('');
        setLoading(true);

        try {
            const data = await authService.forgotPassword(email.trim());
            setSuccessMessage(data.message || t('auth.resetLinkSent'));
            if (data.resetUrl) {
                // If backend provided a direct simulated reset URL (e.g. SMTP not configured or dev mode)
                setDirectResetUrl(data.resetUrl);
            }
            addToast({ type: 'success', message: data.message || t('auth.resetLinkSent') });
        } catch (err) {
            console.error('Forgot password error:', err);
            const msg = err.response?.data?.message || err.message || 'Failed to process request';
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
                        <h2>{t('auth.forgotTitle')}</h2>
                        <p>{t('auth.forgotSub')}</p>
                    </div>

                    {error && <div className={styles.error}>{error}</div>}

                    {successMessage ? (
                        <div>
                            <div className={styles.successNotice}>
                                <CheckCircle2 size={32} style={{ margin: '0 auto 0.75rem', color: '#10b981' }} />
                                <p>{successMessage}</p>
                                
                                {directResetUrl && (
                                    <div className={styles.devNotice}>
                                        <p style={{ fontWeight: 600 }}>{t('auth.directResetNotice')}</p>
                                        <a
                                            href={directResetUrl}
                                            className={styles.devLinkBtn}
                                        >
                                            {t('auth.clickToReset')}
                                        </a>
                                    </div>
                                )}
                            </div>

                            <div className={styles.backLinkContainer}>
                                <Link to="/login" className={styles.backLink}>
                                    {isRtl ? <ArrowRight size={18} /> : <ArrowLeft size={18} />}
                                    <span>{t('auth.backToLogin')}</span>
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className={styles.form}>
                            <Input
                                name="email"
                                type="email"
                                label={t('auth.emailLabel')}
                                placeholder={t('auth.emailPlaceholder')}
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    setError('');
                                }}
                                leftIcon={<Mail size={18} />}
                                required
                                fullWidth
                                autoFocus
                            />

                            <Button
                                type="submit"
                                variant="primary"
                                size="lg"
                                fullWidth
                                loading={loading}
                            >
                                {t('auth.sendResetLink')}
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

export default ForgotPassword;
