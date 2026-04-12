import { useLanguage } from "@/hooks/useLanguage";
import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    ArrowLeft,
    Mail,
    Phone,
    Building2,
    Calendar,
    Plus,
    Trash2,
    ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';
import leadService from '@/services/leadService';
import { taskService } from '@/services/taskService';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { LEAD_STATUSES, LEAD_PRIORITIES } from '@/utils/constants';
import Button from '@/components/ui/Button';
import TaskForm from '@/components/TaskForm';
import AssignPropertyModal from '@/components/AssignPropertyModal';
import styles from './LeadDetails.module.css';

const LeadDetails = () => {
    const { t } = useLanguage();
    const { id } = useParams();
    const queryClient = useQueryClient();
    const user = useAuthStore((s) => s.user);
    const addToast = useUIStore((s) => s.addToast);

    const [propertyModalOpen, setPropertyModalOpen] = useState(false);
    const [meetingModalOpen, setMeetingModalOpen] = useState(false);

    const { data: leadRes, isLoading, error } = useQuery({
        queryKey: ['lead', id],
        queryFn: () => leadService.getLead(id),
        enabled: !!id
    });

    const lead = leadRes?.data || null;
    const activities = lead?.activities || [];
    const interestedProperties = lead?.interestedProperties || [];

    const updateLeadMutation = useMutation({
        mutationFn: (data) => leadService.updateLead(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['lead', id]);
            queryClient.invalidateQueries(['leads']);
            addToast({ type: 'success', message: 'Lead updated' });
        },
        onError: (err) => {
            addToast({
                type: 'error',
                message: err.response?.data?.message || 'Failed to update lead'
            });
        }
    });

    const createTaskMutation = useMutation({
        mutationFn: (taskData) => taskService.createTask(taskData),
        onSuccess: () => {
            queryClient.invalidateQueries(['calendar-tasks']);
            queryClient.invalidateQueries(['lead', id]);
            queryClient.invalidateQueries(['tasks']);
            setMeetingModalOpen(false);
            addToast({ type: 'success', message: 'Meeting added to calendar' });
        },
        onError: (err) => {
            addToast({
                type: 'error',
                message: err.response?.data?.message || 'Failed to schedule meeting'
            });
        }
    });

    const addPropertyMutation = useMutation({
        mutationFn: ({ leadId, propertyId }) =>
            leadService.addPropertyToLead(leadId, propertyId),
        onSuccess: () => {
            queryClient.invalidateQueries(['lead', id]);
            setPropertyModalOpen(false);
            addToast({ type: 'success', message: 'Property assigned to lead' });
        },
        onError: (err) => {
            addToast({
                type: 'error',
                message: err.response?.data?.message || 'Failed to assign property'
            });
        }
    });

    const removePropertyMutation = useMutation({
        mutationFn: ({ leadId, propertyId }) =>
            leadService.removePropertyFromLead(leadId, propertyId),
        onSuccess: () => {
            queryClient.invalidateQueries(['lead', id]);
            addToast({ type: 'success', message: 'Property removed from lead' });
        }
    });

    const handleStatusChange = (e) => {
        const status = e.target.value;
        updateLeadMutation.mutate({ status });
    };

    const handleScheduleMeeting = (formData) => {
        const payload = {
            ...formData,
            type: formData.type || 'viewing',
            relatedLead: id,
            assignedTo: lead?.assignedTo?._id || user?._id,
            dueDate: formData.dueDate,
            dueTime: formData.dueTime || undefined
        };
        createTaskMutation.mutate(payload);
        updateLeadMutation.mutate({ status: 'viewing_scheduled' });
    };

    const getStatusColor = (status) =>
        LEAD_STATUSES.find((s) => s.value === status)?.color || '#6B7280';
    const getPriorityColor = (priority) =>
        LEAD_PRIORITIES.find((p) => p.value === priority)?.color || '#6B7280';

    if (isLoading || !lead) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>
                    {isLoading ? 'Loading lead...' : 'Lead not found'}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.container}>
                <div className={styles.error}>{t('dashboard_extra.failed_to_load_lead')}<Link to="/leads">{t('dashboard_extra.back_to_leads')}</Link>
                </div>
            </div>
        );
    }

    const assignedPropertyIds = interestedProperties.map(
        (i) => i.property?._id || i.property
    );

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <Link to="/leads" className={styles.backLink}>
                    <ArrowLeft size={20} />{t('dashboard_extra.back_to_leads')}</Link>
                <div className={styles.headerMain}>
                    <div>
                        <h1 className={styles.title}>
                            {lead.firstName} {lead.lastName}
                        </h1>
                        <div className={styles.badges}>
                            <span
                                className={styles.badge}
                                style={{
                                    backgroundColor: `${getStatusColor(lead.status)}20`,
                                    color: getStatusColor(lead.status)
                                }}
                            >
                                {LEAD_STATUSES.find((s) => s.value === lead.status)?.label ||
                                    lead.status}
                            </span>
                            <span
                                className={styles.badge}
                                style={{
                                    backgroundColor: `${getPriorityColor(lead.priority)}20`,
                                    color: getPriorityColor(lead.priority)
                                }}
                            >
                                {LEAD_PRIORITIES.find((p) => p.value === lead.priority)?.label ||
                                    lead.priority}
                            </span>
                        </div>
                    </div>
                    <div className={styles.headerActions}>
                        <label className={styles.statusLabel}>
                            <span>{t('dashboard_extra.status')}</span>
                            <select
                                value={lead.status}
                                onChange={handleStatusChange}
                                className={styles.select}
                                disabled={updateLeadMutation.isPending}
                            >
                                {LEAD_STATUSES.map((s) => (
                                    <option key={s.value} value={s.value}>
                                        {s.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <Button
                            variant="primary"
                            leftIcon={<Calendar size={18} />}
                            onClick={() => setMeetingModalOpen(true)}
                        >{t('dashboard_extra.schedule_meeting')}</Button>
                    </div>
                </div>
            </div>

            <div className={styles.grid}>
                <section className={styles.section}>
                    <h3 className={styles.sectionTitle}>{t('dashboard_extra.contact')}</h3>
                    <div className={styles.contactList}>
                        {lead.email && (
                            <a href={`mailto:${lead.email}`} className={styles.contactItem}>
                                <Mail size={18} />
                                {lead.email}
                            </a>
                        )}
                        {lead.phone && (
                            <a href={`tel:${lead.phone}`} className={styles.contactItem}>
                                <Phone size={18} />
                                {lead.phone}
                            </a>
                        )}
                    </div>
                    <div className={styles.meta}>
                        <span>Source: {lead.source || '—'}</span>
                        {lead.assignedTo && (
                            <span>
                                Assigned: {lead.assignedTo.firstName} {lead.assignedTo.lastName}
                            </span>
                        )}
                    </div>
                </section>

                <section className={styles.section}>
                    <h3 className={styles.sectionTitle}>{t('dashboard_extra.requirements')}</h3>
                    <div className={styles.meta}>
                        {lead.transactionType && (
                            <span>Type: {lead.transactionType}</span>
                        )}
                        {lead.propertyType && (
                            <span>Property: {lead.propertyType}</span>
                        )}
                        {lead.budget && (lead.budget.min || lead.budget.max) && (
                            <span>
                                Budget:{' '}
                                {[lead.budget.min, lead.budget.max]
                                    .filter(Boolean)
                                    .map((n) => (n && Number(n).toLocaleString()) || '')
                                    .join(' – ')}
                                {lead.budget.currency && ` ${lead.budget.currency}`}
                            </span>
                        )}
                        {lead.requirements?.notes && (
                            <p className={styles.notes}>{lead.requirements.notes}</p>
                        )}
                    </div>
                </section>

                <section className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h3 className={styles.sectionTitle}>{t('dashboard_extra.assigned_properties')}</h3>
                        <Button
                            size="sm"
                            variant="outline"
                            leftIcon={<Plus size={16} />}
                            onClick={() => setPropertyModalOpen(true)}
                        >{t('dashboard_extra.assign_property')}</Button>
                    </div>
                    {interestedProperties.length === 0 ? (
                        <p className={styles.emptyText}>
                            No properties assigned. Click &quot;Assign property&quot; to add one or
                            more.
                        </p>
                    ) : (
                        <ul className={styles.propertyList}>
                            {interestedProperties.map((item) => {
                                const prop = item.property;
                                if (!prop) return null;
                                const propId = prop._id?.toString?.() || prop._id;
                                return (
                                    <li key={propId} className={styles.propertyItem}>
                                        <div className={styles.propertyInfo}>
                                            <Building2 size={18} />
                                            <div>
                                                <Link
                                                    to={`/properties/${propId}`}
                                                    className={styles.propertyLink}
                                                >
                                                    {prop.title || 'Untitled'}
                                                    <ExternalLink size={14} />
                                                </Link>
                                                {prop.price != null && (
                                                    <span className={styles.propertyPrice}>
                                                        ${Number(prop.price).toLocaleString()}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            className={styles.removeBtn}
                                            onClick={() =>
                                                removePropertyMutation.mutate({
                                                    leadId: id,
                                                    propertyId: propId
                                                })
                                            }
                                            disabled={removePropertyMutation.isPending}
                                            title="Remove from lead"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </section>

                <section className={styles.section}>
                    <h3 className={styles.sectionTitle}>{t('dashboard_extra.activity')}</h3>
                    {activities.length === 0 ? (
                        <p className={styles.emptyText}>{t('dashboard_extra.no_activity_yet')}</p>
                    ) : (
                        <ul className={styles.activityList}>
                            {activities.slice(0, 10).map((act) => (
                                <li key={act._id} className={styles.activityItem}>
                                    <span className={styles.activityTitle}>
                                        {act.title}
                                    </span>
                                    {act.description && (
                                        <span className={styles.activityDesc}>
                                            {act.description}
                                        </span>
                                    )}
                                    <span className={styles.activityDate}>
                                        {act.createdAt &&
                                            format(new Date(act.createdAt), 'MMM d, yyyy HH:mm')}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>

            <AssignPropertyModal
                isOpen={propertyModalOpen}
                onClose={() => setPropertyModalOpen(false)}
                leadId={id}
                assignedPropertyIds={assignedPropertyIds}
                onConfirm={(leadId, propertyId) =>
                    addPropertyMutation.mutateAsync({ leadId, propertyId })
                }
            />

            <TaskForm
                isOpen={meetingModalOpen}
                onClose={() => setMeetingModalOpen(false)}
                onSubmit={handleScheduleMeeting}
                initialDate={new Date()}
                initialData={{
                    title: `Viewing with ${lead.firstName} ${lead.lastName}`,
                    type: 'viewing',
                    priority: 'high',
                    dueDate: format(new Date(), 'yyyy-MM-dd')
                }}
            />
        </div>
    );
};

export default LeadDetails;
