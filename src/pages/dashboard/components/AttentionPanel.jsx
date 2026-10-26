import { Link } from 'react-router-dom';
import {
  Flame,
  Clock3,
  UserPlus,
  ShieldCheck,
  ChevronRight,
  PhoneCall
} from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { formatTimeAgo } from '@/utils/formatters';
import { useDashboardAttention } from '../useDashboardData';
import DashboardCard from './DashboardCard';
import styles from './AttentionPanel.module.css';

const AttentionPanel = ({ scope }) => {
  const { t, locale, dealStage } = useLanguage();
  const { data, isLoading, isError, refetch } = useDashboardAttention(scope);

  const attention = data?.data || { hotLeads: [], staleDeals: [], unassignedLeads: [], totalAlerts: 0 };
  const { hotLeads = [], staleDeals = [], unassignedLeads = [], totalAlerts = 0 } = attention;

  const isEmpty = totalAlerts === 0;

  return (
    <DashboardCard
      title={t('dashboard.needsAttention')}
      subtitle={t('dashboard.needsAttentionSubtitle')}
      icon={Flame}
      badge={totalAlerts > 0 ? totalAlerts : null}
      isLoading={isLoading}
      isError={isError}
      onRetry={refetch}
      isEmpty={isEmpty}
      emptyIcon={<ShieldCheck size={36} color="var(--color-success-500)" />}
      emptyTitle={t('dashboard.noAttentionItems')}
      emptyDescription={t('dashboard.welcomeSub')}
    >
      <div className={styles.attentionContainer}>
        {/* Hot Leads Requiring Contact */}
        {hotLeads.length > 0 && (
          <div className={styles.categoryBlock}>
            <div className={styles.categoryHeader}>
              <Flame size={14} className={styles.flameIcon} />
              <h4>{t('dashboard.hotLeadsUncontacted')} ({hotLeads.length})</h4>
            </div>
            <div className={styles.itemsList}>
              {hotLeads.map((lead) => (
                <div key={lead.id} className={styles.alertCard}>
                  <div className={styles.alertMain}>
                    <Link to={lead.link} className={styles.alertTitle}>
                      {lead.name}
                    </Link>
                    <span className={styles.alertMeta}>
                      <Clock3 size={12} />
                      <span>{formatTimeAgo(lead.lastContactedAt, locale)}</span>
                      {lead.country && <span>• {lead.country}</span>}
                    </span>
                  </div>
                  <div className={styles.alertActions}>
                    {lead.phone && (
                      <a
                        href={`tel:${lead.phone}`}
                        className={styles.callButton}
                        title={`Call ${lead.name}`}
                        aria-label={`Call ${lead.name}`}
                      >
                        <PhoneCall size={13} />
                      </a>
                    )}
                    <Link to={lead.link} className={styles.actionArrow} aria-label="View lead details">
                      <ChevronRight size={16} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stale Active Deals */}
        {staleDeals.length > 0 && (
          <div className={styles.categoryBlock}>
            <div className={styles.categoryHeader}>
              <Clock3 size={14} className={styles.clockIcon} />
              <h4>{t('dashboard.staleDeals')} ({staleDeals.length})</h4>
            </div>
            <div className={styles.itemsList}>
              {staleDeals.map((deal) => (
                <div key={deal.id} className={styles.alertCard}>
                  <div className={styles.alertMain}>
                    <Link to={deal.link} className={styles.alertTitle}>
                      {deal.title}
                    </Link>
                    <span className={styles.alertMeta}>
                      <span>{dealStage(deal.stage)}</span>
                      <span>• {formatTimeAgo(deal.updatedAt, locale)}</span>
                    </span>
                  </div>
                  <Link to={deal.link} className={styles.actionArrow} aria-label="View deal details">
                    <ChevronRight size={16} />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Unassigned Leads */}
        {unassignedLeads.length > 0 && (
          <div className={styles.categoryBlock}>
            <div className={styles.categoryHeader}>
              <UserPlus size={14} className={styles.userIcon} />
              <h4>{t('dashboard.unassignedLeads')} ({unassignedLeads.length})</h4>
            </div>
            <div className={styles.itemsList}>
              {unassignedLeads.map((lead) => (
                <div key={lead.id} className={styles.alertCard}>
                  <div className={styles.alertMain}>
                    <Link to={lead.link} className={styles.alertTitle}>
                      {lead.name}
                    </Link>
                    <span className={styles.alertMeta}>
                      <span>{formatTimeAgo(lead.createdAt, locale)}</span>
                      {lead.country && <span>• {lead.country}</span>}
                    </span>
                  </div>
                  <Link to={lead.link} className={styles.actionArrow} aria-label="Assign lead">
                    <ChevronRight size={16} />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardCard>
  );
};

export default AttentionPanel;
