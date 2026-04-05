import { Bell, Search, LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/authService';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/hooks/useLanguage';
import styles from './Header.module.css';

const Header = () => {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const { t } = useLanguage();

    const handleLogout = async () => {
        await authService.logout();
        navigate('/login');
    };

    return (
        <header className={styles.header}>
            <div className={styles.searchContainer}>
                <Search size={18} className={styles.searchIcon} />
                <input
                    type="text"
                    placeholder={t('layout.searchPlaceholder')}
                    className={styles.searchInput}
                />
            </div>

            <div className={styles.actions}>
                <button type="button" className={styles.iconButton}>
                    <Bell size={20} />
                    <span className={styles.badge}>3</span>
                </button>

                <div className={styles.userMenu}>
                    <button type="button" className={styles.userButton}>
                        <div className={styles.avatar}>
                            {user?.firstName?.[0]}
                            {user?.lastName?.[0]}
                        </div>
                        <span className={styles.userName}>
                            {user?.firstName} {user?.lastName}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={handleLogout}
                        className={styles.logoutBtn}
                        title={t('layout.logout')}
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;
