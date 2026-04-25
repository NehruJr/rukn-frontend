import { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '@/store/authStore';
import { dashboardService } from '@/services/dashboardService';
import { useLanguage } from '@/hooks/useLanguage';
import { Link } from 'react-router-dom';
import { Users, Building2, FileText, DollarSign, TrendingUp, Clock } from 'lucide-react';
import styles from './Dashboard.module.css';

const Dashboard = () => {
    const { user } = useAuthStore();
    const { t, locale, leadPriority, taskPriority, leadSource, taskTitle } = useLanguage();
    const [stats, setStats] = useState(null);
    const [recentLeads, setRecentLeads] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [statsData, leadsData, tasksData] = await Promise.all([
                dashboardService.getStats(),
                dashboardService.getRecentLeads(4),
                dashboardService.getTodaysTasks()
            ]);

            setStats(statsData.data);
            setRecentLeads(leadsData.data);
            setTasks(tasksData.data);
            setError(null);
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
            setError(t('dashboard.errorLoad'));
        } finally {
            setLoading(false);
        }
    };

    const getRoleBadge = () => {
        switch (user?.role) {
            case 'admin':
                return { labelKey: 'dashboard.roleAllOrg', color: '#2c3438' };
            case 'manager':
                return { labelKey: 'dashboard.roleMyTeam', color: '#b4562d' };
            case 'agent':
                return { labelKey: 'dashboard.roleMyPerformance', color: '#10B981' };
            case 'team_leader':
                return { labelKey: 'dashboard.roleMyTeam', color: '#b4562d' };
            case 'sales_support':
                return { labelKey: 'dashboard.roleDashboard', color: '#666e73' };
            default:
                return { labelKey: 'dashboard.roleDashboard', color: '#666e73' };
        }
    };

    const timeOptions = useMemo(
        () => ({ hour: 'numeric', minute: 'numeric' }),
        []
    );

    if (loading) {
        return (
            <div className={styles.dashboard}>
                <div className={styles.loading}>{t('dashboard.loading')}</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.dashboard}>
                <div className={styles.error}>{error}</div>
            </div>
        );
    }

    const roleBadge = getRoleBadge();

    const statsDisplay = stats
        ? [
              {
                  title: t('dashboard.statTotalLeads'),
                  value: stats.stats.totalLeads?.value || 0,
                  change: stats.stats.totalLeads?.change || '+0%',
                  trend: stats.stats.totalLeads?.trend || 'up',
                  icon: Users,
                  color: '#b4562d'
              },
              {
                  title: t('dashboard.statActiveProperties'),
                  value: stats.stats.activeProperties?.value || 0,
                  change: stats.stats.activeProperties?.change || '+0%',
                  trend: stats.stats.activeProperties?.trend || 'up',
                  icon: Building2,
                  color: '#10B981'
              },
              {
                  title: t('dashboard.statDealsClosed'),
                  value: stats.stats.dealsClosed?.value || 0,
                  change: stats.stats.dealsClosed?.change || '+0%',
                  trend: stats.stats.dealsClosed?.trend || 'up',
                  icon: FileText,
                  color: '#F59E0B'
              },
              {
                  title: t('dashboard.statRevenue'),
                  value: stats.stats.revenue?.formatted || '$0',
                  change: stats.stats.revenue?.change || '+0%',
                  trend: stats.stats.revenue?.trend || 'up',
                  icon: DollarSign,
                  color: '#2c3438'
              }
          ]
        : [];

    return (
        <div className={styles.dashboard}>
            <div className={styles.welcomeSection}>
                <div>
                    <h1>
                        {t('dashboard.welcome')}, {user?.firstName}! {t('dashboard.welcomeEmoji')}
                    </h1>
                    <p>{t('dashboard.welcomeSub')}</p>
                </div>
                <div
                    className={styles.roleBadge}
                    style={{ backgroundColor: `${roleBadge.color}15`, color: roleBadge.color }}
                >
                    {t(roleBadge.labelKey)}
                </div>
            </div>

            <div className={styles.statsGrid}>
                {statsDisplay.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div key={index} className={styles.statCard}>
                            <div className={styles.statIcon} style={{ backgroundColor: `${stat.color}15` }}>
                                <Icon size={24} color={stat.color} />
                            </div>
                            <div className={styles.statContent}>
                                <p className={styles.statTitle}>{stat.title}</p>
                                <div className={styles.statBottom}>
                                    <h3 className={styles.statValue}>{stat.value}</h3>
                                    <span className={`${styles.statChange} ${styles[stat.trend]}`}>
                                        <TrendingUp size={14} />
                                        {stat.change}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className={styles.contentGrid}>
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h3>{t('dashboard.recentLeads')}</h3>
                        <Link to="/leads" className={styles.viewAll}>
                            {t('dashboard.viewAll')}
                        </Link>
                    </div>
                    <div className={styles.leadList}>
                        {recentLeads.length > 0 ? (
                            recentLeads.map((lead) => (
                                <div key={lead._id} className={styles.leadItem}>
                                    <div className={styles.leadAvatar}>
                                        {(lead.firstName?.[0] || '') + (lead.lastName?.[0] || '')}
                                    </div>
                                    <div className={styles.leadInfo}>
                                        <p className={styles.leadName}>
                                            {lead.firstName} {lead.lastName}
                                        </p>
                                        <p className={styles.leadMeta}>
                                            {leadSource(lead.source)} •{' '}
                                            {new Date(lead.createdAt).toLocaleString(locale, timeOptions)}
                                        </p>
                                    </div>
                                    <span className={`${styles.priority} ${styles[lead.priority]}`}>
                                        {leadPriority(lead.priority)}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <p className={styles.emptyState}>{t('dashboard.noRecentLeads')}</p>
                        )}
                    </div>
                </div>

                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h3>{t('dashboard.todaysTasks')}</h3>
                        <Link to="/calendar" className={styles.viewAll}>
                            {t('dashboard.viewCalendar')}
                        </Link>
                    </div>
                    <div className={styles.taskList}>
                        {tasks.length > 0 ? (
                            tasks.map((task) => (
                                <div key={task.id} className={styles.taskItem}>
                                    <input type="checkbox" className={styles.taskCheckbox} />
                                    <div className={styles.taskInfo}>
                                        <p className={styles.taskTitle}>{taskTitle(task.title)}</p>
                                        <p className={styles.taskTime}>
                                            <Clock size={14} />
                                            {new Date(task.time).toLocaleTimeString(locale, timeOptions)}
                                        </p>
                                    </div>
                                    <span className={`${styles.taskPriority} ${styles[task.priority]}`}>
                                        {taskPriority(task.priority)}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <p className={styles.emptyState}>{t('dashboard.noTasksToday')}</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
