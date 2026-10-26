import { NavLink } from 'react-router-dom';
import { usePlatformAuthStore } from '@/store/platformAuthStore';
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  Calculator,
  Sparkles,
  ShieldAlert,
  ArrowLeft,
  X
} from 'lucide-react';
import styles from './PlatformSidebar.module.css';

const PlatformSidebar = ({ isOpen, onToggle }) => {
  const { platformUser, hasRole } = usePlatformAuthStore();

  const navItems = [
    { name: 'Dashboard', path: '/platform/dashboard', icon: LayoutDashboard },
    { name: 'Organizations', path: '/platform/organizations', icon: Building2 },
    { name: 'Plans & Pricing', path: '/platform/plans', icon: CreditCard },
    { name: 'Cost Calculator', path: '/platform/calculator', icon: Calculator },
    { name: 'AI Analytics', path: '/platform/ai-analytics', icon: Sparkles },
    {
      name: 'Staff Management',
      path: '/platform/staff',
      icon: ShieldAlert,
      ownerOnly: false
    }
  ];

  return (
    <aside className={`${styles.sidebar} ${!isOpen ? styles.collapsed : ''}`}>
      <div className={styles.header}>
        <div className={styles.brand}>
          <img src="/ruknlogo.png" alt="Rukn Logo" className={styles.logo} />
          {isOpen && (
            <div className={styles.brandText}>
              <span className={styles.brandTitle}>Rukn</span>
              <span className={styles.brandSubtitle}>Super-Admin</span>
            </div>
          )}
        </div>
        {isOpen && (
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onToggle}
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <nav className={styles.nav}>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.active : ''}`
              }
              title={!isOpen ? item.name : undefined}
            >
              <Icon size={20} className={styles.navIcon} />
              {isOpen && <span className={styles.navLabel}>{item.name}</span>}
            </NavLink>
          );
        })}
      </nav>

      <div className={styles.footer}>
        <NavLink to="/" className={styles.backLink} title="Exit to Tenant CRM">
          <ArrowLeft size={18} />
          {isOpen && <span>Exit to Agency CRM</span>}
        </NavLink>
        {isOpen && (
          <div className={styles.versionBadge}>
            Platform Plane v1.0.0
          </div>
        )}
      </div>
    </aside>
  );
};

export default PlatformSidebar;
