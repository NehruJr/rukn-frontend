import { Link } from 'react-router-dom';
import { Users, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { formatTimeAgo } from '@/utils/formatters';
import { LEAD_SOURCE_LABELS } from '@/utils/marketPresets';
import { useRecentLeads } from '../useDashboardData';
import DashboardCard from './DashboardCard';
import styles from './RecentLeadsPanel.module.css';

const RecentLeadsPanel = ({ scope, showAssignee = false }) => {
  const { t, locale, leadPriority, leadSource } = useLanguage();
  const { data, isLoading, isError, refetch } = useRecentLeads(5, scope);

  const leads = data?.data || [];
  const isEmpty = leads.length === 0;

  return (
    <DashboardCard
      title={t('dashboard.recentLeads')}
      subtitle={t('dashboard.recentLeadsSubtitle')}
      icon={Users}
      action={
        <Link to="/leads" className={styles.viewAllLink}>
          <span>{t('dashboard.viewAll')}</span>
          <ArrowRight size={14} className={styles.arrowIcon} />
        </Link>
      }
      isLoading={isLoading}
      isError={isError}
      onRetry={refetch}
      isEmpty={isEmpty}
      emptyTitle={t('dashboard.noRecentLeads')}
      emptyDescription={t('dashboard.welcomeSub')}
    >
      <div className={styles.leadsList}>
        {leads.map((lead) => {
          const initials = `${lead.firstName?.[0] || ''}${lead.lastName?.[0] || ''}`.toUpperCase();
          const sourceLabel = LEAD_SOURCE_LABELS[lead.source] || leadSource(lead.source);
          const relativeTime = formatTimeAgo(lead.createdAt, locale);

          return (
            <Link
              key={lead._id}
              to={`/leads/${lead._id}`}
              className={styles.leadCard}
            >
              <div className={styles.avatar}>
                {initials}
              </div>

              <div className={styles.info}>
                <div className={styles.nameRow}>
                  <p className={styles.name}>
                    {lead.firstName} {lead.lastName}
                  </p>
                  <span className={`${styles.priority} ${styles[lead.priority]}`}>
                    {leadPriority(lead.priority)}
                  </span>
                </div>

                <p className={styles.meta}>
                  <span>{sourceLabel}</span>
                  {lead.country && <span>• {lead.country}</span>}
                  {lead.branch && <span>({lead.branch})</span>}
                  <span>• {relativeTime}</span>
                  {showAssignee && lead.assignedTo && (
                    <span className={styles.assignee}>
                      • {lead.assignedTo.firstName} {lead.assignedTo.lastName}
                    </span>
                  )}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </DashboardCard>
  );
};

export default RecentLeadsPanel;
