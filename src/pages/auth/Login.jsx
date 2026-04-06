import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { authService } from '@/services/authService';
import { createTranslator } from '@/locales/messages';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Mail, Lock, Building2 } from 'lucide-react';
import styles from './Login.module.css';

const Login = () => {
    const navigate = useNavigate();
    const { setAuth } = useAuthStore();
    const { addToast } = useUIStore();
    
    // Default to 'ar' if not specified
    const t = createTranslator('ar').t;

    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            console.log('Attempting login with:', formData.email);
            const response = await authService.login(formData);
            
            console.log('Login Response:', response);
            
            if (response.success || response.token) {
                setAuth(response);
                addToast({ type: 'success', message: 'Logged in successfully!' });
                console.log('Auth set, navigating to dashboard...');
                navigate('/', { replace: true });
            } else {
                setError('Login failed: Invalid server response');
            }
        } catch (err) {
            console.error('Login Error:', err);
            const errorMessage = err.response?.data?.message || err.message || 'Invalid email or password';
            setError(errorMessage);
            addToast({ type: 'error', message: errorMessage });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.leftPanel}>
                <div className={styles.branding}>
                    <img src="/ruknlogo.png" alt={t('layout.logoAlt')} className={styles.logoImage} />
                    <h1>Rukn CRM</h1>
                    <p>{t('auth.brandingDesc')}</p>
                </div>
            </div>

            <div className={styles.rightPanel}>
                <div className={styles.formContainer}>
                    <div className={styles.header}>
                        <h2>{t('auth.loginTitle')}</h2>
                        <p>{t('auth.loginSub')}</p>
                    </div>

                    <form onSubmit={handleSubmit} className={styles.form}>
                        {error && (
                            <div className={styles.error}>
                                {error}
                            </div>
                        )}

                        <Input
                            name="email"
                            type="email"
                            label={t('auth.emailLabel')}
                            placeholder={t('auth.emailPlaceholder')}
                            value={formData.email}
                            onChange={handleChange}
                            leftIcon={<Mail size={18} />}
                            required
                            fullWidth
                        />

                        <Input
                            name="password"
                            type="password"
                            label={t('auth.passwordLabel')}
                            placeholder={t('auth.passwordPlaceholder')}
                            value={formData.password}
                            onChange={handleChange}
                            leftIcon={<Lock size={18} />}
                            required
                            fullWidth
                        />

                        <div className={styles.options}>
                            <label className={styles.checkbox}>
                                <input type="checkbox" />
                                <span>{t('auth.rememberMe')}</span>
                            </label>
                            <Link to="/forgot-password" className={styles.link}>
                                {t('auth.forgotPassword')}
                            </Link>
                        </div>

                        <Button
                            type="submit"
                            variant="primary"
                            size="lg"
                            fullWidth
                            loading={loading}
                        >
                            {t('auth.signInBtn')}
                        </Button>
                    </form>

                    <div className={styles.footer}>
                        <p>
                            {t('auth.noAccount')}{' '}
                            <Link to="/register" className={styles.link}>
                                {t('auth.signUpLink')}
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
