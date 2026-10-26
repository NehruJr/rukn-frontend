import { Link } from 'react-router-dom';
import { Filter, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import DashboardCard from './DashboardCard';
import styles from './PipelineFunnel.module.css';

const STAGE_COLORS = {
  new: 'var(--color-info-500)',
  contacted: 'var(--color-primary-500)',
  qualified: 'var(--color-warning-500)',
  viewing_scheduled: '#8B5CF6',
  negotiating: '#EC4899',
  converted: 'var(--color-success-500)'
};

const ORDERED_STAGES = [
  'new',
  'contacted',
  'qualified',
  'viewing_scheduled',
  'negotiating',
  'converted'
];

const PipelineFunnel = ({ leadsByStatus = [] }) => {
  const { t, leadStatus } = useLanguage();

  const statusMap = {};
  leadsByStatus.forEach((s) => {
    statusMap[s.status] = s.count;
  });

  const totalCount = leadsByStatus.reduce((sum, s) => sum + s.count, 0);
  const maxCount = Math.max(...leadsByStatus.map((s) => s.count), 1);

  const stagesData = ORDERED_STAGES.map((st) => ({
    status: st,
    label: leadStatus(st),
    count: statusMap[st] || 0,
    color: STAGE_COLORS[st] || 'var(--color-primary-500)',
    percentageOfMax: Math.round(((statusMap[st] || 0) / maxCount) * 100),
    percentageOfTotal: totalCount > 0 ? Math.round(((statusMap[st] || 0) / totalCount) * 100) : 0
  })).filter((st) => st.count > 0 || ['new', 'contacted', 'qualified', 'converted'].includes(st.status));

  const isEmpty = totalCount === 0;

  return (
    <DashboardCard
      title={t('dashboard.pipelineFunnel')}
      subtitle={t('dashboard.pipelineFunnelSubtitle')}
      icon={Filter}
      action={
        <Link to="/leads/pipeline" className={styles.pipelineLink}>
          <span>{t('layout.navPipeline')}</span>
          <ArrowRight size={14} className={styles.arrowIcon} />
        </Link>
      }
      isEmpty={isEmpty}
      emptyTitle={t('dashboard.noRecentLeads')}
      emptyDescription={t('dashboard.welcomeSub')}
    >
      <div className={styles.funnelList}>
        {stagesData.map((stage) => (
          <Link
            key={stage.status}
            to={`/leads?status=${stage.status}`}
            className={styles.stageRow}
          >
            <div className={styles.stageLabelRow}>
              <span className={styles.stageName}>
                <span
                  className={styles.colorDot}
                  style={{ backgroundColor: stage.color }}
                  aria-hidden="true"
                />
                {stage.label}
              </span>
              <span className={styles.stageCounts}>
                <strong>{stage.count}</strong>
                <span className={styles.pctText}>({stage.percentageOfTotal}%)</span>
              </span>
            </div>

            <div
              className={styles.progressBar}
              role="progressbar"
              aria-valuenow={stage.count}
              aria-valuemin={0}
              aria-valuemax={maxCount}
              aria-label={`${stage.label}: ${stage.count}`}
            >
              <div
                className={styles.progressFill}
                style={{
                  width: `${stage.percentageOfMax}%`,
                  backgroundColor: stage.color
                }}
              />
            </div>
          </Link>
        ))}
      </div>
    </DashboardCard>
  );
};

export default PipelineFunnel;
