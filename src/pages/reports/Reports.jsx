import { useLanguage } from "@/hooks/useLanguage";
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportService } from '@/services/reportService';
import { useUIStore } from '@/store/uiStore';
import { COUNTRIES, getCountryCurrency } from '@/utils/marketPresets';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, DollarSign, Target, Building2 } from 'lucide-react';
import styles from './Reports.module.css';

const Reports = () => {
    const { t } = useLanguage();
    const { selectedCountry, selectedBranch, setSelectedCountry } = useUIStore();
    const [activeTab, setActiveTab] = useState('overview');
    const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });

    const { data: dashboardData } = useQuery({
        queryKey: ['dashboard-stats', dateRange, selectedCountry, selectedBranch],
        queryFn: () => reportService.getDashboardStats(dateRange.startDate, dateRange.endDate, selectedCountry, selectedBranch)
    });

    const { data: leadData } = useQuery({
        queryKey: ['lead-analytics', dateRange, selectedCountry, selectedBranch],
        queryFn: () => reportService.getLeadAnalytics(dateRange.startDate, dateRange.endDate, selectedCountry, selectedBranch),
        enabled: activeTab === 'leads'
    });

    const { data: dealData } = useQuery({
        queryKey: ['deal-analytics', dateRange, selectedCountry, selectedBranch],
        queryFn: () => reportService.getDealAnalytics(dateRange.startDate, dateRange.endDate, selectedCountry, selectedBranch),
        enabled: activeTab === 'deals'
    });

    const { data: agentData } = useQuery({
        queryKey: ['agent-performance', dateRange, selectedCountry, selectedBranch],
        queryFn: () => reportService.getAgentPerformance(dateRange.startDate, dateRange.endDate, selectedCountry, selectedBranch),
        enabled: activeTab === 'agents'
    });

    const { data: funnelData } = useQuery({
        queryKey: ['conversion-funnel', dateRange, selectedCountry, selectedBranch],
        queryFn: () => reportService.getConversionFunnel(dateRange.startDate, dateRange.endDate, selectedCountry, selectedBranch),
        enabled: activeTab === 'overview'
    });

    const { data: revenueData } = useQuery({
        queryKey: ['revenue-reports', dateRange, selectedCountry, selectedBranch],
        queryFn: () => reportService.getRevenueReports(dateRange.startDate, dateRange.endDate, selectedCountry, selectedBranch),
        enabled: activeTab === 'revenue'
    });

    const stats = dashboardData?.data || {};
    const activeCurrency = stats.currency || (selectedCountry ? getCountryCurrency(selectedCountry) : 'EGP');
    const COLORS = ['#b4562d', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1>
                        Reports &amp; Analytics
                        {selectedCountry ? ` — ${selectedCountry}` : ''}
                    </h1>
                    <p>
                        {selectedCountry
                            ? `Performance metrics and analytics for ${selectedCountry} (${activeCurrency})`
                            : t('dashboard_extra.insights_and_performance_metrics')}
                    </p>
                </div>
                <div className={styles.dateFilter}>
                    <select
                        value={selectedCountry}
                        onChange={(e) => setSelectedCountry(e.target.value)}
                        className={styles.dateInput}
                        aria-label="Filter reports by country"
                    >
                        <option value="">🌍 All Countries</option>
                        {COUNTRIES.map((c) => (
                            <option key={c.value} value={c.value}>
                                {c.flag} {c.shortLabel} ({c.currency})
                            </option>
                        ))}
                    </select>
                    <input
                        type="date"
                        value={dateRange.startDate}
                        onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                        className={styles.dateInput}
                    />
                    <span>to</span>
                    <input
                        type="date"
                        value={dateRange.endDate}
                        onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                        className={styles.dateInput}
                    />
                </div>
            </div>

            <div className={styles.tabs}>
                {['overview', 'leads', 'deals', 'agents', 'revenue'].map(tab => (
                    <button
                        key={tab}
                        className={`${styles.tab} ${activeTab === tab ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            {activeTab === 'overview' && (
                <div className={styles.content}>
                    <div className={styles.metricsGrid}>
                        <MetricCard
                            icon={<Users size={24} />}
                            label="Total Leads"
                            value={stats.leads?.total || 0}
                            subValue={`${stats.leads?.active || 0} active`}
                            color="#3B82F6"
                        />
                        <MetricCard
                            icon={<Building2 size={24} />}
                            label="Active Properties"
                            value={stats.properties?.active || 0}
                            subValue={`${stats.properties?.total || 0} total listed`}
                            color="#059669"
                        />
                        <MetricCard
                            icon={<Target size={24} />}
                            label="Active Deals"
                            value={stats.deals?.active || 0}
                            subValue={`${stats.deals?.won || 0} won`}
                            color="#10B981"
                        />
                        <MetricCard
                            icon={<DollarSign size={24} />}
                            label="Total Revenue"
                            value={`${activeCurrency} ${(stats.revenue?.actual || 0).toLocaleString()}`}
                            subValue={`${activeCurrency} ${(stats.revenue?.expected || 0).toLocaleString()} expected`}
                            color="#F59E0B"
                        />
                        <MetricCard
                            icon={<TrendingUp size={24} />}
                            label="Conversion Rate"
                            value={`${stats.conversionRate || 0}%`}
                            subValue="Lead to Deal"
                            color="#8B5CF6"
                        />
                    </div>

                    {funnelData?.data && (
                        <div className={styles.chartCard}>
                            <h3>{t('dashboard_extra.conversion_funnel')}</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={funnelData.data}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="stage" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="count" fill="#b4562d" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'leads' && leadData?.data && (
                <div className={styles.content}>
                    <div className={styles.chartsGrid}>
                        <div className={styles.chartCard}>
                            <h3>{t('dashboard_extra.leads_by_source')}</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie data={leadData.data.bySource} dataKey="count" nameKey="_id" cx="50%" cy="50%" outerRadius={100} label>
                                        {leadData.data.bySource.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        <div className={styles.chartCard}>
                            <h3>{t('dashboard_extra.leads_by_status')}</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={leadData.data.byStatus}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="_id" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="count" fill="#3B82F6" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className={styles.chartCard}>
                            <h3>{t('dashboard_extra.leads_over_time')}</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={leadData.data.timeline}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="_id.month" />
                                    <YAxis />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="count" stroke="#b4562d" strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'deals' && dealData?.data && (
                <div className={styles.content}>
                    <div className={styles.chartsGrid}>
                        <div className={styles.chartCard}>
                            <h3>{t('dashboard_extra.deals_by_stage')}</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={dealData.data.byStage}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="_id" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="count" fill="#10B981" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className={styles.chartCard}>
                            <h3>{t('dashboard_extra.revenue_by_agent')}</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={dealData.data.byAgent}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="agentName" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="totalRevenue" fill="#F59E0B" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'agents' && agentData?.data && (
                <div className={styles.content}>
                    <div className={styles.tableCard}>
                        <h3>{t('dashboard_extra.agent_performance')}</h3>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>{t('dashboard_extra.agent')}</th>
                                    <th>Leads</th>
                                    <th>{t('dashboard_extra.converted')}</th>
                                    <th>{t('dashboard_extra.conv_rate')}</th>
                                    <th>{t('dashboard_extra.deals')}</th>
                                    <th>{t('dashboard_extra.won')}</th>
                                    <th>{t('dashboard_extra.revenue')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {agentData.data.map(agent => (
                                    <tr key={agent.agentId}>
                                        <td>{agent.agentName}</td>
                                        <td>{agent.leadsAssigned}</td>
                                        <td>{agent.leadsConverted}</td>
                                        <td>{agent.conversionRate}%</td>
                                        <td>{agent.dealsTotal}</td>
                                        <td>{agent.dealsWon}</td>
                                        <td>{activeCurrency} {agent.revenue.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'revenue' && revenueData?.data && (
                <div className={styles.content}>
                    <div className={styles.chartsGrid}>
                        <div className={styles.chartCard}>
                            <h3>{t('dashboard_extra.revenue_timeline')}</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={revenueData.data.revenueTimeline}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="_id.month" />
                                    <YAxis />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const MetricCard = ({ icon, label, value, subValue, color }) => (
    <div className={styles.metricCard}>
        <div className={styles.metricIcon} style={{ backgroundColor: `${color}15`, color }}>
            {icon}
        </div>
        <div className={styles.metricContent}>
            <div className={styles.metricLabel}>{label}</div>
            <div className={styles.metricValue}>{value}</div>
            <div className={styles.metricSubValue}>{subValue}</div>
        </div>
    </div>
);

export default Reports;
