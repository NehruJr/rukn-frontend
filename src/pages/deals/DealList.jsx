import { useLanguage } from "@/hooks/useLanguage";
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
    const { t } = useLanguage();
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

    const formatCurrency = (value, currency = 'EGP') => {
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
                    <h1>{t('dashboard_extra.deals')}</h1>
                    <p>{t('dashboard_extra.manage_and_track_all_your_deals')}</p>
                </div>
                <div className={styles.headerActions}>
                    <Button variant="outline" onClick={() => window.location.href = '/deals/pipeline'}>{t('dashboard_extra.pipeline_view')}</Button>
                    <Button variant="primary" leftIcon={<Plus size={18} />} onClick={() => setIsModalOpen(true)}>{t('dashboard_extra.add_deal')}</Button>
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
                        <option value="">{t('dashboard_extra.all_statuses')}</option>
                        {DEAL_STATUSES.map(status => (
                            <option key={status.value} value={status.value}>{status.label}</option>
                        ))}
                    </select>

                    <select
                        value={filters.stage}
                        onChange={(e) => setFilters({ ...filters, stage: e.target.value })}
                        className={styles.select}
                    >
                        <option value="">{t('dashboard_extra.all_stages')}</option>
                        {DEAL_STAGES.map(stage => (
                            <option key={stage.value} value={stage.value}>{stage.label}</option>
                        ))}
                    </select>

                    <Button variant="outline" leftIcon={<Filter size={18} />}>{t('dashboard_extra.more_filters')}</Button>
                </div>
            </div>

            {isLoading && <div className={styles.loading}>{t('dashboard_extra.loading_deals')}</div>}

            {error && <div className={styles.error}>{t('dashboard_extra.error_loading_deals_please_try_again')}</div>}

            {!isLoading && !error && deals.length === 0 && (
                <div className={styles.empty}>
                    <h3>{t('dashboard_extra.no_deals_found')}</h3>
                    <p>{t('dashboard_extra.get_started_by_adding_your_first_deal')}</p>
                    <Button variant="primary" onClick={() => setIsModalOpen(true)}>{t('dashboard_extra.add_deal')}</Button>
                </div>
            )}

            {!isLoading && deals.length > 0 && (
                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Deal #</th>
                                <th>{t('dashboard_extra.title')}</th>
                                <th>{t('dashboard_extra.lead')}</th>
                                <th>{t('dashboard_extra.value')}</th>
                                <th>{t('dashboard_extra.stage')}</th>
                                <th>{t('dashboard_extra.probability')}</th>
                                <th>{t('dashboard_extra.status')}</th>
                                <th>{t('dashboard_extra.agent')}</th>
                                <th>{t('dashboard_extra.expected_close')}</th>
                                <th>{t('dashboard_extra.created')}</th>
                                <th>{t('dashboard_extra.actions')}</th>
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
                                        <a href={`/deals/${deal._id}`} className={styles.viewLink}>{t('dashboard_extra.view')}</a>
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
