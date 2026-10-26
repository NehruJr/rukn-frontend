import { Link } from 'react-router-dom';
import { Award, ArrowRight, DollarSign, Users, Briefcase } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { useTeamLeaderboard } from '../useDashboardData';
import DashboardCard from './DashboardCard';
import styles from './TeamLeaderboard.module.css';

const TeamLeaderboard = ({ scope }) => {
  const { t } = useLanguage();
  const { data, isLoading, isError, refetch } = useTeamLeaderboard(scope);

  const leaderboard = data?.data?.leaderboard || [];
  const isEmpty = leaderboard.length === 0;

  return (
    <DashboardCard
      title={t('dashboard.teamLeaderboard')}
      subtitle={t('dashboard.teamLeaderboardSubtitle')}
      icon={Award}
      action={
        <Link to="/team" className={styles.teamLink}>
          <span>{t('layout.navTeam')}</span>
          <ArrowRight size={14} className={styles.arrowIcon} />
        </Link>
      }
      isLoading={isLoading}
      isError={isError}
      onRetry={refetch}
      isEmpty={isEmpty}
      emptyTitle={t('dashboard.noAttentionItems')}
      emptyDescription={t('dashboard.welcomeSub')}
    >
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>{t('dashboard.agent')}</th>
              <th>{t('dashboard.dealsCount')}</th>
              <th>{t('dashboard.revenueEarned')}</th>
              <th>{t('dashboard.leadsCount')}</th>
              <th>{t('dashboard.pendingTasks')}</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((member, index) => {
              const initials = member.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase();

              return (
                <tr key={member.id} className={styles.row}>
                  <td className={styles.agentCell}>
                    <span className={styles.rankBadge}>{index + 1}</span>
                    <div className={styles.avatar}>
                      {member.avatar ? (
                        <img src={member.avatar} alt={member.name} />
                      ) : (
                        initials
                      )}
                    </div>
                    <div className={styles.agentDetails}>
                      <span className={styles.agentName}>{member.name}</span>
                      <span className={styles.agentEmail}>{member.email}</span>
                    </div>
                  </td>
                  <td>
                    <span className={styles.statMetric}>
                      <Briefcase size={13} className={styles.metricIcon} />
                      <strong>{member.dealsCount}</strong>
                    </span>
                  </td>
                  <td>
                    <span className={styles.revenueMetric}>
                      <strong>{member.revenueFormatted}</strong>
                    </span>
                  </td>
                  <td>
                    <span className={styles.statMetric}>
                      <Users size={13} className={styles.metricIcon} />
                      <span>{member.leadsCount}</span>
                    </span>
                  </td>
                  <td>
                    <span
                      className={`${styles.tasksCount} ${
                        member.pendingTasksCount > 5 ? styles.tasksHigh : ''
                      }`}
                    >
                      {member.pendingTasksCount}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </DashboardCard>
  );
};

export default TeamLeaderboard;
