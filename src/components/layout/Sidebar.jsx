import { NavLink } from 'react-router-dom';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import {
    Home, Users, Building2, FileText, Calendar,
    BarChart3, Settings, Menu, X
} from 'lucide-react';
import styles from './Sidebar.module.css';

const Sidebar = () => {
    const { sidebarOpen, toggleSidebar } = useUIStore();
    const { user, hasPermission } = useAuthStore();

    const navItems = [
        { name: 'Dashboard', path: '/', icon: Home, permission: null },
        { name: 'Leads', path: '/leads', icon: Users, permission: 'leads.view' },
        { name: 'Pipeline', path: '/leads/pipeline', icon: FileText, permission: 'leads.view' },
        { name: 'Properties', path: '/properties', icon: Building2, permission: 'properties.view' },
        { name: 'Deals', path: '/deals', icon: FileText, permission: 'deals.view' },
        { name: 'Calendar', path: '/calendar', icon: Calendar, permission: null },
        { name: 'Team', path: '/team', icon: Users, permission: 'team.view' },
        { name: 'Reports', path: '/reports', icon: BarChart3, permission: 'reports.view' },
        { name: 'Settings', path: '/settings', icon: Settings, permission: null }
    ];

    const visibleItems = navItems.filter(item =>
        !item.permission || hasPermission(item.permission)
    );

    return (
        <aside className={`${styles.sidebar} ${!sidebarOpen ? styles.collapsed : ''}`}>
            <div className={styles.header}>
                {sidebarOpen && (
                    <div className={styles.logoContainer}>
                        <img src="/ruknlogo.png" alt="Rukn" className={styles.logoImage} />
                        <h1 className={styles.logoText}>Rukn</h1>
                    </div>
                )}
                <button onClick={toggleSidebar} className={styles.toggleBtn}>
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
                            {sidebarOpen && <span>{item.name}</span>}
                        </NavLink>
                    );
                })}
            </nav>

            <div className={styles.footer}>
                <div className={styles.user}>
                    <div className={styles.avatar}>
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </div>
                    {sidebarOpen && (
                        <div className={styles.userInfo}>
                            <div className={styles.userName}>{user?.firstName} {user?.lastName}</div>
                            <div className={styles.userRole}>{user?.role}</div>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
