import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportService } from '@/services/reportService';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, DollarSign, Target } from 'lucide-react';
import styles from './Reports.module.css';

const Reports = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });

    const { data: dashboardData } = useQuery({
        queryKey: ['dashboard-stats', dateRange],
        queryFn: () => reportService.getDashboardStats(dateRange.startDate, dateRange.endDate)
    });

    const { data: leadData } = useQuery({
        queryKey: ['lead-analytics', dateRange],
        queryFn: () => reportService.getLeadAnalytics(dateRange.startDate, dateRange.endDate),
        enabled: activeTab === 'leads'
    });

    const { data: dealData } = useQuery({
        queryKey: ['deal-analytics', dateRange],
        queryFn: () => reportService.getDealAnalytics(dateRange.startDate, dateRange.endDate),
        enabled: activeTab === 'deals'
    });

    const { data: agentData } = useQuery({
        queryKey: ['agent-performance', dateRange],
        queryFn: () => reportService.getAgentPerformance(dateRange.startDate, dateRange.endDate),
        enabled: activeTab === 'agents'
    });

    const { data: funnelData } = useQuery({
        queryKey: ['conversion-funnel', dateRange],
        queryFn: () => reportService.getConversionFunnel(dateRange.startDate, dateRange.endDate),
        enabled: activeTab === 'overview'
    });

    const { data: revenueData } = useQuery({
        queryKey: ['revenue-reports', dateRange],
        queryFn: () => reportService.getRevenueReports(dateRange.startDate, dateRange.endDate),
        enabled: activeTab === 'revenue'
    });

    const stats = dashboardData?.data || {};
    const COLORS = ['#b4562d', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1>Reports &amp; Analytics</h1>
                    <p>Insights and performance metrics</p>
                </div>
                <div className={styles.dateFilter}>
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
                            icon={<Target size={24} />}
                            label="Active Deals"
                            value={stats.deals?.active || 0}
                            subValue={`${stats.deals?.won || 0} won`}
                            color="#10B981"
                        />
                        <MetricCard
                            icon={<DollarSign size={24} />}
                            label="Total Revenue"
                            value={`$${(stats.revenue?.actual || 0).toLocaleString()}`}
                            subValue={`$${(stats.revenue?.expected || 0).toLocaleString()} expected`}
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
                            <h3>Conversion Funnel</h3>
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
                            <h3>Leads by Source</h3>
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
                            <h3>Leads by Status</h3>
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
                            <h3>Leads Over Time</h3>
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
                            <h3>Deals by Stage</h3>
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
                            <h3>Revenue by Agent</h3>
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
                        <h3>Agent Performance</h3>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Agent</th>
                                    <th>Leads</th>
                                    <th>Converted</th>
                                    <th>Conv. Rate</th>
                                    <th>Deals</th>
                                    <th>Won</th>
                                    <th>Revenue</th>
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
                                        <td>${agent.revenue.toLocaleString()}</td>
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
                            <h3>Revenue Timeline</h3>
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
