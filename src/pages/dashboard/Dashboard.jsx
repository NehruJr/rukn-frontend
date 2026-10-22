import { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { dashboardService } from '@/services/dashboardService';
import { leadService } from '@/services/leadService';
import { useLanguage } from '@/hooks/useLanguage';
import { Link, useNavigate } from 'react-router-dom';
import {
    Users,
    Building2,
    FileText,
    DollarSign,
    TrendingUp,
    Clock,
    Globe,
    Plus,
    MapPin,
    BarChart3,
    Layers
} from 'lucide-react';
import {
    COUNTRIES,
    LEAD_SOURCE_LABELS,
    getMarketPreset,
    getCountryBranches,
    formatCountryCurrency
} from '@/utils/marketPresets';
import LeadForm from '@/components/LeadForm';
import styles from './Dashboard.module.css';

const CATEGORY_LABELS = {
    primary_offplan: 'Primary / Off-Plan',
    resale: 'Resale',
    rental: 'Rental'
};

const Dashboard = () => {
    const { user, hasPermission } = useAuthStore();
    const { selectedCountry, selectedBranch, setSelectedCountry, setSelectedBranch, addToast } = useUIStore();
    const { t, locale, leadPriority, taskPriority, leadSource, taskTitle } = useLanguage();
    const navigate = useNavigate();

    const [stats, setStats] = useState(null);
    const [recentLeads, setRecentLeads] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);

    useEffect(() => {
        fetchDashboardData();
    }, [selectedCountry, selectedBranch]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const queryParams = {
                country: selectedCountry || undefined,
                branch: selectedBranch || undefined
            };
            const [statsData, leadsData, tasksData] = await Promise.all([
                dashboardService.getStats(queryParams),
                dashboardService.getRecentLeads(5, queryParams),
                dashboardService.getTodaysTasks(queryParams)
            ]);

            setStats(statsData.data);
            setRecentLeads(leadsData.data || []);
            setTasks(tasksData.data || []);
            setError(null);
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
            setError(t('dashboard.errorLoad'));
        } finally {
            setLoading(false);
        }
    };

    const handleCreateLeadFromDashboard = async (leadData) => {
        await leadService.createLead({
            ...leadData,
            country: leadData.country || selectedCountry || 'Egypt',
            branch: leadData.branch || selectedBranch || 'Main Branch'
        });
        addToast({
            type: 'success',
            message: `Lead added to ${leadData.country || selectedCountry || 'Egypt'} successfully`
        });
        fetchDashboardData();
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

    const activePreset = useMemo(
        () => (selectedCountry ? getMarketPreset(selectedCountry) : null),
        [selectedCountry]
    );

    const availableBranches = useMemo(
        () => (selectedCountry ? getCountryBranches(selectedCountry) : []),
        [selectedCountry]
    );

    const roleBadge = getRoleBadge();
    const activeCurrency = stats?.currency || activePreset?.currency || 'EGP';
    const countryAnalytics = stats?.countryAnalytics || {};

    const statsDisplay = stats
        ? [
              {
                  title: t('dashboard.statTotalLeads'),
                  value: stats.stats.totalLeads?.value || 0,
                  subText: selectedCountry ? `In ${selectedCountry}` : 'All markets',
                  change: stats.stats.totalLeads?.change || '+0%',
                  trend: stats.stats.totalLeads?.trend || 'up',
                  icon: Users,
                  color: '#b4562d'
              },
              {
                  title: t('dashboard.statActiveProperties'),
                  value: stats.stats.activeProperties?.value || 0,
                  subText: stats.stats.activeProperties?.portfolioFormatted
                      ? `Portfolio: ${stats.stats.activeProperties.portfolioFormatted}`
                      : `${stats.stats.activeProperties?.total || 0} total listed`,
                  change: stats.stats.activeProperties?.change || '+0%',
                  trend: stats.stats.activeProperties?.trend || 'up',
                  icon: Building2,
                  color: '#10B981'
              },
              {
                  title: t('dashboard.statDealsClosed'),
                  value: stats.stats.dealsClosed?.value || 0,
                  subText: `${stats.stats.dealsClosed?.total || 0} total deals`,
                  change: stats.stats.dealsClosed?.change || '+0%',
                  trend: stats.stats.dealsClosed?.trend || 'up',
                  icon: FileText,
                  color: '#F59E0B'
              },
              {
                  title: t('dashboard.statRevenue'),
                  value: stats.stats.revenue?.formatted || `${activeCurrency} 0`,
                  subText: `Currency: ${activeCurrency}`,
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
                    <p>
                        {selectedCountry
                            ? `Showing dashboard, inventory, analytics, and leads for ${selectedCountry}${selectedBranch ? ` • ${selectedBranch}` : ''}`
                            : t('dashboard.welcomeSub')}
                    </p>
                </div>
                <div className={styles.headerRightActions}>
                    <button
                        type="button"
                        className={styles.quickActionBtn}
                        onClick={() => navigate('/properties/new')}
                    >
                        <Plus size={16} />
                        <span>
                            {selectedCountry ? `Add Property (${selectedCountry})` : t('dashboard_extra.add_property')}
                        </span>
                    </button>
                    <button
                        type="button"
                        className={styles.quickActionBtnSecondary}
                        onClick={() => setIsLeadModalOpen(true)}
                    >
                        <Plus size={16} />
                        <span>
                            {selectedCountry ? `Add Lead (${selectedCountry})` : t('leads.addLead')}
                        </span>
                    </button>
                    <div
                        className={styles.roleBadge}
                        style={{ backgroundColor: `${roleBadge.color}15`, color: roleBadge.color }}
                    >
                        {t(roleBadge.labelKey)}
                    </div>
                </div>
            </div>

            {/* Country Market Switcher Bar */}
            <div className={styles.marketBar}>
                <div className={styles.countryTabs}>
                    <button
                        type="button"
                        className={`${styles.countryTab} ${!selectedCountry ? styles.countryTabActive : ''}`}
                        onClick={() => setSelectedCountry('')}
                    >
                        <Globe size={16} />
                        <span>All Countries</span>
                    </button>
                    {COUNTRIES.map((c) => (
                        <button
                            key={c.value}
                            type="button"
                            className={`${styles.countryTab} ${selectedCountry === c.value ? styles.countryTabActive : ''}`}
                            onClick={() => setSelectedCountry(c.value)}
                        >
                            <span className={styles.countryFlag}>{c.flag}</span>
                            <span>{c.shortLabel}</span>
                            <span className={styles.currencyBadge}>{c.currency}</span>
                        </button>
                    ))}
                </div>

                {activePreset && (
                    <div className={styles.marketMeta}>
                        <span className={styles.metaPill}>
                            <strong>Currency:</strong> {activePreset.currency}
                        </span>
                        <span className={styles.metaPill}>
                            <strong>Area Unit:</strong> {activePreset.areaUnit}
                        </span>
                        <span className={styles.metaPill}>
                            <strong>VAT:</strong> {activePreset.vatRate}%
                        </span>
                        <span className={styles.metaPill}>
                            <strong>Dial Code:</strong> {activePreset.phonePrefix}
                        </span>
                    </div>
                )}

                {availableBranches.length > 0 && (
                    <div className={styles.branchFilterRow}>
                        <span className={styles.branchFilterLabel}>
                            <MapPin size={14} /> Branches:
                        </span>
                        <button
                            type="button"
                            className={`${styles.branchPill} ${!selectedBranch ? styles.branchPillActive : ''}`}
                            onClick={() => setSelectedBranch('')}
                        >
                            All {selectedCountry}
                        </button>
                        {availableBranches.map((branchName) => (
                            <button
                                key={branchName}
                                type="button"
                                className={`${styles.branchPill} ${selectedBranch === branchName ? styles.branchPillActive : ''}`}
                                onClick={() => setSelectedBranch(selectedBranch === branchName ? '' : branchName)}
                            >
                                {branchName}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {loading ? (
                <div className={styles.loading}>{t('dashboard.loading')}</div>
            ) : error ? (
                <div className={styles.error}>{error}</div>
            ) : (
                <>
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
                                        {stat.subText && (
                                            <p className={styles.statSubText}>{stat.subText}</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Country Analytics Section */}
                    <div className={styles.analyticsSection}>
                        <div className={styles.sectionHeaderRow}>
                            <div className={styles.sectionTitleGroup}>
                                <BarChart3 size={20} color="#b4562d" />
                                <h2>
                                    {selectedCountry
                                        ? `${selectedCountry} Market Analytics & Inventory`
                                        : 'Regional Market Analytics & Inventory'}
                                </h2>
                            </div>
                            <Link to="/reports" className={styles.viewAll}>
                                Full Analytics & Reports →
                            </Link>
                        </div>

                        <div className={styles.analyticsGrid}>
                            {/* Properties by Branch */}
                            <div className={styles.analyticsCard}>
                                <div className={styles.analyticsCardHeader}>
                                    <h4>
                                        <MapPin size={16} /> Properties by Branch
                                    </h4>
                                    <Link to="/properties" className={styles.viewAll}>
                                        {t('dashboard.viewAll')}
                                    </Link>
                                </div>
                                {countryAnalytics.propertiesByBranch?.length > 0 ? (
                                    <div className={styles.breakdownList}>
                                        {countryAnalytics.propertiesByBranch.map((item) => {
                                            const maxCount = Math.max(
                                                ...countryAnalytics.propertiesByBranch.map((b) => b.count),
                                                1
                                            );
                                            const pct = Math.round((item.count / maxCount) * 100);
                                            return (
                                                <div key={item.branch} className={styles.breakdownItem}>
                                                    <div className={styles.breakdownTop}>
                                                        <span className={styles.breakdownName}>{item.branch}</span>
                                                        <span className={styles.breakdownMeta}>
                                                            <strong>{item.count}</strong> props ({item.activeCount} active) •{' '}
                                                            {formatCountryCurrency(item.totalValue, activeCurrency)}
                                                        </span>
                                                    </div>
                                                    <div className={styles.progressBar}>
                                                        <div
                                                            className={styles.progressFill}
                                                            style={{ width: `${pct}%`, backgroundColor: '#10B981' }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className={styles.emptyState}>
                                        No properties listed for {selectedCountry || 'any market'} yet.
                                    </p>
                                )}
                            </div>

                            {/* Leads by Source */}
                            <div className={styles.analyticsCard}>
                                <div className={styles.analyticsCardHeader}>
                                    <h4>
                                        <Users size={16} /> Leads by Portal / Source
                                    </h4>
                                    <Link to="/leads" className={styles.viewAll}>
                                        {t('dashboard.viewAll')}
                                    </Link>
                                </div>
                                {countryAnalytics.leadsBySource?.length > 0 ? (
                                    <div className={styles.breakdownList}>
                                        {countryAnalytics.leadsBySource.map((item) => {
                                            const maxCount = Math.max(
                                                ...countryAnalytics.leadsBySource.map((s) => s.count),
                                                1
                                            );
                                            const pct = Math.round((item.count / maxCount) * 100);
                                            return (
                                                <div key={item.source} className={styles.breakdownItem}>
                                                    <div className={styles.breakdownTop}>
                                                        <span className={styles.breakdownName}>
                                                            {LEAD_SOURCE_LABELS[item.source] || leadSource(item.source)}
                                                        </span>
                                                        <span className={styles.breakdownMeta}>
                                                            <strong>{item.count}</strong> leads
                                                        </span>
                                                    </div>
                                                    <div className={styles.progressBar}>
                                                        <div
                                                            className={styles.progressFill}
                                                            style={{ width: `${pct}%`, backgroundColor: '#b4562d' }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className={styles.emptyState}>
                                        No leads recorded for {selectedCountry || 'this selection'} yet.
                                    </p>
                                )}
                            </div>

                            {/* Inventory Category & Top Developers */}
                            <div className={styles.analyticsCard}>
                                <div className={styles.analyticsCardHeader}>
                                    <h4>
                                        <Layers size={16} /> Inventory Mix & Developers
                                    </h4>
                                    <Link to="/properties/new" className={styles.viewAll}>
                                        + Insert Property
                                    </Link>
                                </div>
                                {countryAnalytics.propertiesByCategory?.length > 0 ? (
                                    <div className={styles.categoryMixContainer}>
                                        <div className={styles.categoryPills}>
                                            {countryAnalytics.propertiesByCategory.map((cat) => (
                                                <div key={cat.category} className={styles.categoryStatBox}>
                                                    <span className={styles.categoryLabel}>
                                                        {CATEGORY_LABELS[cat.category] || cat.category}
                                                    </span>
                                                    <strong className={styles.categoryCount}>{cat.count}</strong>
                                                </div>
                                            ))}
                                        </div>
                                        {countryAnalytics.topDevelopers?.length > 0 && (
                                            <div className={styles.topDevSection}>
                                                <p className={styles.subHeading}>Top Developers</p>
                                                {countryAnalytics.topDevelopers.map((dev) => (
                                                    <div key={dev.name} className={styles.devRow}>
                                                        <span>{dev.name}</span>
                                                        <span className={styles.devCount}>{dev.count} units</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p className={styles.emptyState}>
                                        Add properties in {selectedCountry || 'your market'} to see category & developer breakdown.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className={styles.contentGrid}>
                        <div className={styles.card}>
                            <div className={styles.cardHeader}>
                                <h3>
                                    {t('dashboard.recentLeads')}
                                    {selectedCountry ? ` (${selectedCountry})` : ''}
                                </h3>
                                <Link to="/leads" className={styles.viewAll}>
                                    {t('dashboard.viewAll')}
                                </Link>
                            </div>
                            <div className={styles.leadList}>
                                {recentLeads.length > 0 ? (
                                    recentLeads.map((lead) => (
                                        <Link
                                            to={`/leads/${lead._id}`}
                                            key={lead._id}
                                            className={styles.leadItem}
                                            style={{ textDecoration: 'none' }}
                                        >
                                            <div className={styles.leadAvatar}>
                                                {(lead.firstName?.[0] || '') + (lead.lastName?.[0] || '')}
                                            </div>
                                            <div className={styles.leadInfo}>
                                                <p className={styles.leadName}>
                                                    {lead.firstName} {lead.lastName}
                                                </p>
                                                <p className={styles.leadMeta}>
                                                    {LEAD_SOURCE_LABELS[lead.source] || leadSource(lead.source)}
                                                    {lead.country ? ` • ${lead.country}` : ''}
                                                    {lead.branch ? ` (${lead.branch})` : ''} •{' '}
                                                    {new Date(lead.createdAt).toLocaleString(locale, timeOptions)}
                                                </p>
                                            </div>
                                            <span className={`${styles.priority} ${styles[lead.priority]}`}>
                                                {leadPriority(lead.priority)}
                                            </span>
                                        </Link>
                                    ))
                                ) : (
                                    <p className={styles.emptyState}>{t('dashboard.noRecentLeads')}</p>
                                )}
                            </div>
                        </div>

                        <div className={styles.card}>
                            <div className={styles.cardHeader}>
                                <h3>
                                    {t('dashboard.todaysTasks')}
                                    {selectedCountry ? ` (${selectedCountry})` : ''}
                                </h3>
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
                                                    {task.country ? ` • ${task.country}` : ''}
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
                </>
            )}

            <LeadForm
                isOpen={isLeadModalOpen}
                onClose={() => setIsLeadModalOpen(false)}
                onSubmit={handleCreateLeadFromDashboard}
                title={selectedCountry ? `Add Lead (${selectedCountry})` : 'Add Lead'}
            />
        </div>
    );
};

export default Dashboard;
