import { RefreshCw, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import EmptyState from '@/components/ui/EmptyState';
import styles from './DashboardCard.module.css';

const DashboardCard = ({
  title,
  subtitle,
  icon: Icon,
  badge,
  action,
  isLoading,
  isError,
  onRetry,
  isEmpty,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  className = '',
  headerClassName = '',
  children
}) => {
  const { t } = useLanguage();

  return (
    <section className={`${styles.card} ${className}`} aria-busy={isLoading}>
      <header className={`${styles.cardHeader} ${headerClassName}`}>
        <div className={styles.titleGroup}>
          {Icon && (
            <div className={styles.iconWrapper}>
              <Icon size={18} className={styles.icon} aria-hidden="true" />
            </div>
          )}
          <div>
            <div className={styles.titleRow}>
              <h3 className={styles.title}>{title}</h3>
              {badge && <span className={styles.badge}>{badge}</span>}
            </div>
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
        </div>
        {action && <div className={styles.action}>{action}</div>}
      </header>

      <div className={styles.content}>
        {isLoading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.skeletonLine} style={{ width: '80%' }} />
            <div className={styles.skeletonLine} style={{ width: '60%' }} />
            <div className={styles.skeletonLine} style={{ width: '90%' }} />
          </div>
        ) : isError ? (
          <div className={styles.errorState}>
            <AlertCircle size={24} className={styles.errorIcon} />
            <p className={styles.errorMessage}>{t('dashboard.errorLoadingSection')}</p>
            {onRetry && (
              <button
                type="button"
                className={styles.retryButton}
                onClick={onRetry}
              >
                <RefreshCw size={14} />
                <span>{t('dashboard.retry')}</span>
              </button>
            )}
          </div>
        ) : isEmpty ? (
          <div className={styles.emptyContainer}>
            <EmptyState
              icon={emptyIcon}
              title={emptyTitle}
              description={emptyDescription}
            />
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  );
};

export default DashboardCard;
