import { Bell, Search, LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/authService';
import { useNavigate } from 'react-router-dom';
import styles from './Header.module.css';

const Header = () => {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();

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
                    placeholder="Search leads, properties..."
                    className={styles.searchInput}
                />
            </div>

            <div className={styles.actions}>
                <button className={styles.iconButton}>
                    <Bell size={20} />
                    <span className={styles.badge}>3</span>
                </button>

                <div className={styles.userMenu}>
                    <button className={styles.userButton}>
                        <div className={styles.avatar}>
                            {user?.firstName?.[0]}{user?.lastName?.[0]}
                        </div>
                        <span className={styles.userName}>
                            {user?.firstName} {user?.lastName}
                        </span>
                    </button>

                    <button onClick={handleLogout} className={styles.logoutBtn} title="Logout">
                        <LogOut size={18} />
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;
