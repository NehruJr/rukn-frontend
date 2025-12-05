import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { dashboardService } from '@/services/dashboardService';
import { Users, Building2, FileText, DollarSign, TrendingUp, Clock } from 'lucide-react';
import styles from './Dashboard.module.css';

const Dashboard = () => {
    const { user } = useAuthStore();
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
            setError('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const getRoleBadge = () => {
        switch (user?.role) {
            case 'admin':
                return { label: 'All Organization', color: '#2c3438' }; // Secondary
            case 'manager':
                return { label: 'My Team', color: '#b4562d' }; // Primary
            case 'agent':
                return { label: 'My Performance', color: '#10B981' }; // Success
            default:
                return { label: 'Dashboard', color: '#666e73' }; // Neutral
        }
    };

    if (loading) {
        return (
            <div className={styles.dashboard}>
                <div className={styles.loading}>Loading dashboard...</div>
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

    const statsDisplay = stats ? [
        {
            title: 'Total Leads',
            value: stats.stats.totalLeads?.value || 0,
            change: stats.stats.totalLeads?.change || '+0%',
            trend: stats.stats.totalLeads?.trend || 'up',
            icon: Users,
            color: '#b4562d' // Primary
        },
        {
            title: 'Active Properties',
            value: stats.stats.activeProperties?.value || 0,
            change: stats.stats.activeProperties?.change || '+0%',
            trend: stats.stats.activeProperties?.trend || 'up',
            icon: Building2,
            color: '#10B981' // Success
        },
        {
            title: 'Deals Closed',
            value: stats.stats.dealsClosed?.value || 0,
            change: stats.stats.dealsClosed?.change || '+0%',
            trend: stats.stats.dealsClosed?.trend || 'up',
            icon: FileText,
            color: '#F59E0B' // Warning
        },
        {
            title: 'Revenue',
            value: stats.stats.revenue?.formatted || '$0',
            change: stats.stats.revenue?.change || '+0%',
            trend: stats.stats.revenue?.trend || 'up',
            icon: DollarSign,
            color: '#2c3438' // Secondary
        }
    ] : [];

    return (
        <div className={styles.dashboard}>
            <div className={styles.welcomeSection}>
                <div>
                    <h1>Welcome back, {user?.firstName}! 👋</h1>
                    <p>Here's what's happening with your business today</p>
                </div>
                <div
                    className={styles.roleBadge}
                    style={{ backgroundColor: `${roleBadge.color}15`, color: roleBadge.color }}
                >
                    {roleBadge.label}
                </div>
            </div>

            {/* Stats Grid */}
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

            {/* Content Grid */}
            <div className={styles.contentGrid}>
                {/* Recent Leads */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h3>Recent Leads</h3>
                        <a href="/leads" className={styles.viewAll}>View all</a>
                    </div>
                    <div className={styles.leadList}>
                        {recentLeads.length > 0 ? (
                            recentLeads.map(lead => (
                                <div key={lead._id} className={styles.leadItem}>
                                    <div className={styles.leadAvatar}>
                                        {(lead.firstName?.[0] || '') + (lead.lastName?.[0] || '')}
                                    </div>
                                    <div className={styles.leadInfo}>
                                        <p className={styles.leadName}>{lead.firstName} {lead.lastName}</p>
                                        <p className={styles.leadMeta}>
                                            {lead.source} • {new Date(lead.createdAt).toLocaleString('en-US', {
                                                hour: 'numeric',
                                                minute: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                    <span className={`${styles.priority} ${styles[lead.priority]}`}>
                                        {lead.priority}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <p className={styles.emptyState}>No recent leads</p>
                        )}
                    </div>
                </div>

                {/* Today's Tasks */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h3>Today's Tasks</h3>
                        <a href="/calendar" className={styles.viewAll}>View calendar</a>
                    </div>
                    <div className={styles.taskList}>
                        {tasks.length > 0 ? (
                            tasks.map(task => (
                                <div key={task.id} className={styles.taskItem}>
                                    <input type="checkbox" className={styles.taskCheckbox} />
                                    <div className={styles.taskInfo}>
                                        <p className={styles.taskTitle}>{task.title}</p>
                                        <p className={styles.taskTime}>
                                            <Clock size={14} />
                                            {new Date(task.time).toLocaleTimeString('en-US', {
                                                hour: 'numeric',
                                                minute: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                    <span className={`${styles.taskPriority} ${styles[task.priority]}`}>
                                        {task.priority}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <p className={styles.emptyState}>No tasks for today</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
