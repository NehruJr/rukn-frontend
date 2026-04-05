import { NavLink } from 'react-router-dom';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { useLanguage } from '@/hooks/useLanguage';
import {
    Home, Users, Building2, FileText, Calendar,
    BarChart3, Settings, Menu, X, Sun, Moon
} from 'lucide-react';
import styles from './Sidebar.module.css';

const Sidebar = () => {
    const { sidebarOpen, toggleSidebar, theme, toggleTheme } = useUIStore();
    const { user, hasPermission } = useAuthStore();
    const { t, userRole } = useLanguage();

    const navItems = [
        { nameKey: 'layout.navDashboard', path: '/', icon: Home, permission: null },
        { nameKey: 'layout.navLeads', path: '/leads', icon: Users, permission: 'leads.view' },
        { nameKey: 'layout.navPipeline', path: '/leads/pipeline', icon: FileText, permission: 'leads.view' },
        { nameKey: 'layout.navProperties', path: '/properties', icon: Building2, permission: 'properties.view' },
        { nameKey: 'layout.navDeals', path: '/deals', icon: FileText, permission: 'deals.view' },
        { nameKey: 'layout.navCalendar', path: '/calendar', icon: Calendar, permission: null },
        { nameKey: 'layout.navTeam', path: '/team', icon: Users, permission: 'team.view' },
        { nameKey: 'layout.navReports', path: '/reports', icon: BarChart3, permission: 'reports.view' },
        { nameKey: 'layout.navSettings', path: '/settings', icon: Settings, permission: null }
    ];

    const visibleItems = navItems.filter(
        (item) => !item.permission || hasPermission(item.permission)
    );

    const themeLabel = theme === 'light' ? t('layout.darkMode') : t('layout.lightMode');
    const themeTitle = theme === 'light' ? t('layout.switchToDark') : t('layout.switchToLight');

    return (
        <aside className={`${styles.sidebar} ${!sidebarOpen ? styles.collapsed : ''}`}>
            <div className={styles.header}>
                {sidebarOpen && (
                    <div className={styles.logoContainer}>
                        <img src="/ruknlogo.png" alt={t('layout.logoAlt')} className={styles.logoImage} />
                        <h1 className={styles.logoText}>Rukn</h1>
                    </div>
                )}
                <button type="button" onClick={toggleSidebar} className={styles.toggleBtn}>
                    {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
            </div>

            <nav className={styles.nav}>
                {visibleItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === '/'}
                            className={({ isActive }) =>
                                `${styles.navItem} ${isActive ? styles.active : ''}`
                            }
                        >
                            <Icon size={20} />
                            {sidebarOpen && <span>{t(item.nameKey)}</span>}
                        </NavLink>
                    );
                })}
            </nav>

            <div className={styles.footer}>
                <button
                    type="button"
                    className={styles.themeToggle}
                    onClick={toggleTheme}
                    title={themeTitle}
                >
                    {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                    {sidebarOpen && <span>{themeLabel}</span>}
                </button>

                <div className={styles.user}>
                    <div className={styles.avatar}>
                        {user?.firstName?.[0]}
                        {user?.lastName?.[0]}
                    </div>
                    {sidebarOpen && (
                        <div className={styles.userInfo}>
                            <div className={styles.userName}>
                                {user?.firstName} {user?.lastName}
                            </div>
                            <div className={styles.userRole}>{userRole(user?.role)}</div>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
