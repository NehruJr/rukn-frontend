import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { usePlatformAuthStore } from '@/store/platformAuthStore';
import PlatformSidebar from './PlatformSidebar';
import { ShieldCheck, LogOut, Menu } from 'lucide-react';
import styles from './PlatformLayout.module.css';

const PlatformLayout = () => {
  const { platformUser, logout } = usePlatformAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Auto-close on small screens
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth <= 1024) {
      setSidebarOpen(false);
    }
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/platform/login');
  };

  const getRoleBadgeClass = (role) => {
    if (role === 'owner') return styles.roleOwner;
    if (role === 'admin') return styles.roleAdmin;
    return styles.roleSupport;
  };

  return (
    <div className={styles.container} data-theme="dark">
      <PlatformSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((prev) => !prev)}
      />

      {sidebarOpen && typeof window !== 'undefined' && window.innerWidth <= 1024 && (
        <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />
      )}

      <div className={`${styles.main} ${!sidebarOpen ? styles.mainExpanded : ''}`}>
        <header className={styles.topbar}>
          <div className={styles.left}>
            <button
              type="button"
              className={styles.menuToggle}
              onClick={() => setSidebarOpen((prev) => !prev)}
              aria-label="Toggle navigation"
            >
              <Menu size={20} />
            </button>
            <div className={styles.consoleBadge}>
              <ShieldCheck size={16} />
              <span>PLATFORM SUPER-ADMIN CONSOLE</span>
            </div>
          </div>

          <div className={styles.right}>
            <div className={styles.profile}>
              <div className={styles.avatar}>
                {platformUser?.firstName?.[0] || 'S'}
                {platformUser?.lastName?.[0] || 'A'}
              </div>
              <div className={styles.profileMeta}>
                <span className={styles.name}>
                  {platformUser?.firstName} {platformUser?.lastName}
                </span>
                <span className={`${styles.roleBadge} ${getRoleBadgeClass(platformUser?.role)}`}>
                  {platformUser?.role?.toUpperCase() || 'SUPPORT'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className={styles.logoutBtn}
              title="Sign Out of Platform Console"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </header>

        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default PlatformLayout;
