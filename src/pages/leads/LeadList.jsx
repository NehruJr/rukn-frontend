import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/useLanguage';
import { Link } from 'react-router-dom';
import { leadService } from '@/services/leadService';
import LeadForm from '@/components/LeadForm';
import { Plus, Filter, Search } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { formatTimeAgo } from '@/utils/formatters';
import { LEAD_STATUSES, LEAD_PRIORITIES } from '@/utils/constants';
import styles from './LeadList.module.css';

const LeadList = () => {
    const { t, leadStatus, leadPriority, leadSource } = useLanguage();
    const [filters, setFilters] = useState({
        search: '',
        status: '',
        priority: '',
        page: 1,
        limit: 20
    });

    const { data, isLoading, error } = useQuery({
        queryKey: ['leads', filters],
        queryFn: () => leadService.getLeads(filters)
    });

    const leads = data?.data || [];

    const getPriorityColor = (priority) => {
        return LEAD_PRIORITIES.find(p => p.value === priority)?.color || '#6B7280';
    };

    const getStatusColor = (status) => {
        return LEAD_STATUSES.find(s => s.value === status)?.color || '#6B7280';
    };

    const [isModalOpen, setIsModalOpen] = useState(false);
    const queryClient = useQueryClient();

    const handleCreateLead = async (leadData) => {
        await leadService.createLead(leadData);
        queryClient.invalidateQueries(['leads']);
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1>{t('leads.title')}</h1>
                    <p>{t('leads.pipeline')}</p>
                </div>
                <Button variant="primary" leftIcon={<Plus size={18} />} onClick={() => setIsModalOpen(true)}>
                    {t('leads.addLead')}
                </Button>
            </div>

            <div className={styles.toolbar}>
                <Input
                    placeholder={t('layout.searchPlaceholder')}
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
                        <option value="">{t('common.allStatuses')}</option>
                        {LEAD_STATUSES.map(status => (
                            <option key={status.value} value={status.value}>{leadStatus(status.value)}</option>
                        ))}
                    </select>

                    <select
                        value={filters.priority}
                        onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                        className={styles.select}
                    >
                        <option value="">{t('common.allPriorities')}</option>
                        {LEAD_PRIORITIES.map(priority => (
                            <option key={priority.value} value={priority.value}>{leadPriority(priority.value)}</option>
                        ))}
                    </select>

                    <Button variant="outline" leftIcon={<Filter size={18} />}>
                        {t('common.moreFilters')}
                    </Button>
                </div>
            </div>

            {isLoading && <div className={styles.loading}>{t('dashboard_extra.loading_leads')}</div>}

            {error && <div className={styles.error}>{t('dashboard_extra.error_loading_leads_please_try_again')}</div>}

            {!isLoading && !error && leads.length === 0 && (
                <div className={styles.empty}>
                    <h3>{t('dashboard_extra.no_leads_found')}</h3>
                    <p>{t('dashboard_extra.get_started_by_adding_your_first_lead')}</p>
                    <Button variant="primary" onClick={() => setIsModalOpen(true)}>{t('dashboard_extra.add_lead')}</Button>
                </div>
            )}

            {!isLoading && leads.length > 0 && (
                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>{t('common.name')}</th>
                                <th>{t('common.contact')}</th>
                                <th>{t('leads.source')}</th>
                                <th>{t('leads.status')}</th>
                                <th>{t('leads.priority')}</th>
                                <th>{t('leads.assignedTo')}</th>
                                <th>{t('common.created')}</th>
                                <th>{t('common.actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leads.map(lead => (
                                <tr key={lead._id}>
                                    <td>
                                        <div className={styles.leadName}>
                                            <div className={styles.avatar}>
                                                {lead.firstName?.[0]}{lead.lastName?.[0]}
                                            </div>
                                            <div>
                                                <div className={styles.name}>{lead.firstName} {lead.lastName}</div>
                                                {lead.latestNote && (
                                                    <div className={styles.note}>{lead.latestNote}</div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className={styles.contact}>
                                            <div>{lead.email || '-'}</div>
                                            <div className={styles.phone}>{lead.phone}</div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={styles.source}>{lead.source}</span>
                                    </td>
                                    <td>
                                        <span
                                            className={styles.badge}
                                            style={{ backgroundColor: `${getStatusColor(lead.status)}15`, color: getStatusColor(lead.status) }}
                                        >
                                            {leadStatus(lead.status)}
                                        </span>
                                    </td>
                                    <td>
                                        <span
                                            className={styles.badge}
                                            style={{ backgroundColor: `${getPriorityColor(lead.priority)}15`, color: getPriorityColor(lead.priority) }}
                                        >
                                            {leadPriority(lead.priority)}
                                        </span>
                                    </td>
                                    <td>
                                        {lead.assignedTo ? (
                                            <div className={styles.agent}>
                                                {lead.assignedTo.firstName} {lead.assignedTo.lastName}
                                            </div>
                                        ) : (
                                            <span className={styles.unassigned}>{t('common.unassigned')}</span>
                                        )}
                                    </td>
                                    <td className={styles.date}>{formatTimeAgo(lead.createdAt)}</td>
                                    <td>
                                        <Link to={`/leads/${lead._id}`} className={styles.viewLink}>
                                            {t('common.view')}
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <LeadForm
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleCreateLead}
            />
        </div>
    );
};

export default LeadList;
