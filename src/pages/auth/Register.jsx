import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { authService } from '@/services/authService';
import { createTranslator } from '@/locales/messages';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Mail, Lock, User, Phone, Building2 } from 'lucide-react';
import styles from './Login.module.css'; // Reuse login styles

const Register = () => {
    const navigate = useNavigate();
    const { setAuth } = useAuthStore();
    const { addToast } = useUIStore();
    const t = createTranslator('ar').t;

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
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

        // Validation
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            const { confirmPassword, ...registerData } = formData;
            const response = await authService.register(registerData);
            setAuth(response);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.leftPanel}>
                <div className={styles.branding}>
                    <img src="/ruknlogo.png" alt={t('layout.logoAlt')} className={styles.logoImage} />
                    <h1>{t('auth.registerBrandingTitle')}</h1>
                    <p>{t('auth.registerBrandingDesc')}</p>
                </div>
            </div>

            <div className={styles.rightPanel}>
                <div className={styles.formContainer}>
                    <div className={styles.header}>
                        <h2>{t('auth.registerTitle')}</h2>
                        <p>{t('auth.registerSub')}</p>
                    </div>

                    <form onSubmit={handleSubmit} className={styles.form}>
                        {error && (
                            <div className={styles.error}>
                                {error}
                            </div>
                        )}

                        <div className="flex gap-4">
                            <Input
                                name="firstName"
                                type="text"
                                label={t('auth.firstNameLabel')}
                                placeholder="John"
                                value={formData.firstName}
                                onChange={handleChange}
                                leftIcon={<User size={18} />}
                                required
                                fullWidth
                            />

                            <Input
                                name="lastName"
                                type="text"
                                label={t('auth.lastNameLabel')}
                                placeholder="Doe"
                                value={formData.lastName}
                                onChange={handleChange}
                                leftIcon={<User size={18} />}
                                required
                                fullWidth
                            />
                        </div>

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
                            name="phone"
                            type="tel"
                            label={t('auth.phoneLabel')}
                            placeholder="+1 (555) 000-0000"
                            value={formData.phone}
                            onChange={handleChange}
                            leftIcon={<Phone size={18} />}
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

                        <Input
                            name="confirmPassword"
                            type="password"
                            label={t('auth.confirmPasswordLabel')}
                            placeholder={t('auth.passwordPlaceholder')}
                            value={formData.confirmPassword}
                            onChange={handleChange}
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
                            {t('auth.createAccountBtn')}
                        </Button>
                    </form>

                    <div className={styles.footer}>
                        <p>
                            {t('auth.alreadyHaveAccount')}{' '}
                            <Link to="/login" className={styles.link}>
                                {t('auth.signInLink')}
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
