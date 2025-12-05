import { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { dealService } from '@/services/dealService';
import { DEAL_STAGES, DEAL_STATUSES } from '@/utils/constants';
import { formatTimeAgo } from '@/utils/formatters';
import { Plus, Filter, Search } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import DealForm from '@/components/DealForm';
import styles from './DealList.module.css';

const DealList = () => {
    const [filters, setFilters] = useState({
        search: '',
        status: '',
        stage: '',
        page: 1,
        limit: 20
    });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const queryClient = useQueryClient();

    const { data, isLoading, error } = useQuery({
        queryKey: ['deals', filters],
        queryFn: () => dealService.getDeals(filters)
    });

    const deals = data?.data || [];

    const handleCreateDeal = async (dealData) => {
        await dealService.createDeal(dealData);
        queryClient.invalidateQueries(['deals']);
        setIsModalOpen(false);
    };

    const getStageColor = (stage) => {
        const stageColors = {
            negotiation: '#F59E0B',
            contract_sent: '#3B82F6',
            contract_signed: '#8B5CF6',
            payment_pending: '#EF4444',
            completed: '#10B981',
            cancelled: '#6B7280'
        };
        return stageColors[stage] || '#6B7280';
    };

    const getStatusColor = (status) => {
        return DEAL_STATUSES.find(s => s.value === status)?.color || '#6B7280';
    };

    const formatCurrency = (value, currency = 'USD') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0
        }).format(value);
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1>Deals</h1>
                    <p>Manage and track all your deals</p>
                </div>
                <div className={styles.headerActions}>
                    <Button variant="outline" onClick={() => window.location.href = '/deals/pipeline'}>
                        Pipeline View
                    </Button>
                    <Button variant="primary" leftIcon={<Plus size={18} />} onClick={() => setIsModalOpen(true)}>
                        Add Deal
                    </Button>
                </div>
            </div>

            <div className={styles.toolbar}>
                <Input
                    placeholder="Search deals..."
                    leftIcon={<Search size={18} />}
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className={styles.searchInput}
                />

                <div className={styles.filters}>
                    <select
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        className={styles.select}
                    >
                        <option value="">All Statuses</option>
                        {DEAL_STATUSES.map(status => (
                            <option key={status.value} value={status.value}>{status.label}</option>
                        ))}
                    </select>

                    <select
                        value={filters.stage}
                        onChange={(e) => setFilters({ ...filters, stage: e.target.value })}
                        className={styles.select}
                    >
                        <option value="">All Stages</option>
                        {DEAL_STAGES.map(stage => (
                            <option key={stage.value} value={stage.value}>{stage.label}</option>
                        ))}
                    </select>

                    <Button variant="outline" leftIcon={<Filter size={18} />}>
                        More Filters
                    </Button>
                </div>
            </div>

            {isLoading && <div className={styles.loading}>Loading deals...</div>}

            {error && <div className={styles.error}>Error loading deals. Please try again.</div>}

            {!isLoading && !error && deals.length === 0 && (
                <div className={styles.empty}>
                    <h3>No deals found</h3>
                    <p>Get started by adding your first deal</p>
                    <Button variant="primary" onClick={() => setIsModalOpen(true)}>Add Deal</Button>
                </div>
            )}

            {!isLoading && deals.length > 0 && (
                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Deal #</th>
                                <th>Title</th>
                                <th>Lead</th>
                                <th>Value</th>
                                <th>Stage</th>
                                <th>Probability</th>
                                <th>Status</th>
                                <th>Agent</th>
                                <th>Expected Close</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {deals.map(deal => (
                                <tr key={deal._id}>
                                    <td>
                                        <span className={styles.dealNumber}>{deal.dealNumber}</span>
                                    </td>
                                    <td>
                                        <div className={styles.dealTitle}>{deal.title}</div>
                                    </td>
                                    <td>
                                        {deal.lead ? (
                                            <div className={styles.lead}>
                                                <div>{deal.lead.firstName} {deal.lead.lastName}</div>
                                                <div className={styles.leadPhone}>{deal.lead.phone}</div>
                                            </div>
                                        ) : '-'}
                                    </td>
                                    <td>
                                        <div className={styles.value}>{formatCurrency(deal.dealValue, deal.currency)}</div>
                                    </td>
                                    <td>
                                        <span
                                            className={styles.badge}
                                            style={{ backgroundColor: `${getStageColor(deal.stage)}15`, color: getStageColor(deal.stage) }}
                                        >
                                            {DEAL_STAGES.find(s => s.value === deal.stage)?.label}
                                        </span>
                                    </td>
                                    <td>
                                        <div className={styles.probability}>
                                            <div className={styles.probabilityBar}>
                                                <div
                                                    className={styles.probabilityFill}
                                                    style={{ width: `${deal.probability}%` }}
                                                ></div>
                                            </div>
                                            <span>{deal.probability}%</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span
                                            className={styles.badge}
                                            style={{ backgroundColor: `${getStatusColor(deal.status)}15`, color: getStatusColor(deal.status) }}
                                        >
                                            {DEAL_STATUSES.find(s => s.value === deal.status)?.label}
                                        </span>
                                    </td>
                                    <td>
                                        {deal.agent ? (
                                            <div className={styles.agent}>
                                                {deal.agent.firstName} {deal.agent.lastName}
                                            </div>
                                        ) : '-'}
                                    </td>
                                    <td className={styles.date}>
                                        {deal.expectedCloseDate
                                            ? new Date(deal.expectedCloseDate).toLocaleDateString()
                                            : '-'}
                                    </td>
                                    <td className={styles.date}>{formatTimeAgo(deal.createdAt)}</td>
                                    <td>
                                        <a href={`/deals/${deal._id}`} className={styles.viewLink}>
                                            View
                                        </a>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <DealForm
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleCreateDeal}
            />
        </div>
    );
};

export default DealList;
