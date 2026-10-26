import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Phone,
  Eye,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { useDashboardAgenda, useCompleteTaskMutation } from '../useDashboardData';
import DashboardCard from './DashboardCard';
import styles from './AgendaPanel.module.css';

const getItemIcon = (kind, type) => {
  if (kind === 'viewing') return Eye;
  if (type === 'call') return Phone;
  if (type === 'viewing') return Eye;
  return Clock;
};

const AgendaPanel = ({ scope }) => {
  const { t, locale, taskPriority } = useLanguage();
  const { data, isLoading, isError, refetch } = useDashboardAgenda(scope);
  const completeMutation = useCompleteTaskMutation();
  const [completingIds, setCompletingIds] = useState(new Set());

  const agenda = data?.data || { overdue: [], today: [], totalCount: 0 };
  const { overdue = [], today = [] } = agenda;

  const handleTaskComplete = async (taskId) => {
    setCompletingIds((prev) => new Set(prev).add(taskId));
    try {
      await completeMutation.mutateAsync({ taskId });
    } finally {
      setCompletingIds((prev) => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
    }
  };

  const renderItem = (item) => {
    const Icon = getItemIcon(item.kind, item.type);
    const isTask = item.kind === 'task';
    const isCompleting = completingIds.has(item.id);

    const formattedTime = item.time
      ? new Date(item.time).toLocaleTimeString(locale, { hour: 'numeric', minute: 'numeric' })
      : item.dueTime || '';

    return (
      <div
        key={`${item.kind}-${item.id}`}
        className={`${styles.item} ${item.isOverdue ? styles.itemOverdue : ''} ${isCompleting ? styles.itemCompleting : ''}`}
      >
        <div className={styles.checkboxWrapper}>
          {isTask ? (
            <input
              type="checkbox"
              className={styles.checkbox}
              checked={isCompleting}
              onChange={() => handleTaskComplete(item.id)}
              disabled={isCompleting}
              aria-label={`${t('dashboard.markComplete')}: ${item.title}`}
            />
          ) : (
            <div className={styles.nonTaskIcon}>
              <Icon size={14} aria-hidden="true" />
            </div>
          )}
        </div>

        <div className={styles.itemMain}>
          <div className={styles.itemTitleRow}>
            {item.link ? (
              <Link to={item.link} className={styles.itemTitle}>
                {item.title}
              </Link>
            ) : (
              <span className={styles.itemTitle}>{item.title}</span>
            )}
            {item.isOverdue && (
              <span className={styles.overdueBadge}>
                <AlertTriangle size={11} />
                <span>{t('dashboard.overdue')}</span>
              </span>
            )}
          </div>

          <div className={styles.itemMeta}>
            <span className={styles.itemTime}>
              <Clock size={12} />
              <span>{formattedTime}</span>
            </span>

            {item.lead && (
              <span className={styles.metaDivider}>•</span>
            )}
            {item.lead && (
              <span className={styles.leadName}>{item.lead.name}</span>
            )}

            {item.property && (
              <span className={styles.metaDivider}>•</span>
            )}
            {item.property && (
              <span className={styles.propTitle}>{item.property.title}</span>
            )}
          </div>
        </div>

        {item.priority && (
          <span className={`${styles.priorityBadge} ${styles[item.priority]}`}>
            {taskPriority(item.priority)}
          </span>
        )}
      </div>
    );
  };

  const isEmpty = overdue.length === 0 && today.length === 0;

  return (
    <DashboardCard
      title={t('dashboard.agenda')}
      subtitle={t('dashboard.agendaSubtitle')}
      icon={Calendar}
      badge={agenda.totalCount > 0 ? agenda.totalCount : null}
      action={
        <Link to="/calendar" className={styles.viewCalendarLink}>
          {t('dashboard.viewCalendar')} →
        </Link>
      }
      isLoading={isLoading}
      isError={isError}
      onRetry={refetch}
      isEmpty={isEmpty}
      emptyIcon={<CheckCircle2 size={36} color="var(--color-success-500)" />}
      emptyTitle={t('dashboard.noAgendaItems')}
      emptyDescription={t('dashboard.welcomeSub')}
    >
      <div className={styles.agendaContainer}>
        {/* Overdue Section */}
        {overdue.length > 0 && (
          <div className={styles.sectionGroup}>
            <div className={styles.sectionHeaderOverdue}>
              <AlertTriangle size={14} />
              <h4>{t('dashboard.overdue')} ({overdue.length})</h4>
            </div>
            <div className={styles.itemList}>
              {overdue.map(renderItem)}
            </div>
          </div>
        )}

        {/* Today Section */}
        {today.length > 0 && (
          <div className={styles.sectionGroup}>
            {overdue.length > 0 && (
              <div className={styles.sectionHeader}>
                <h4>{t('dashboard.today')} ({today.length})</h4>
              </div>
            )}
            <div className={styles.itemList}>
              {today.map(renderItem)}
            </div>
          </div>
        )}
      </div>
    </DashboardCard>
  );
};

export default AgendaPanel;
