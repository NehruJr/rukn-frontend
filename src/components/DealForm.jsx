import { useLanguage } from "@/hooks/useLanguage";
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DEAL_STAGES, TRANSACTION_TYPES } from '@/utils/constants';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import leadService from '@/services/leadService';
import styles from './DealForm.module.css';

const DealForm = ({ isOpen, onClose, onSubmit, initialData = null }) => {
    const { t } = useLanguage();

    const [formData, setFormData] = useState({
        title: '',
        lead: '',
        property: '',
        transactionType: 'sale',
        dealValue: '',
        currency: 'EGP',
        stage: 'negotiation',
        probability: 50,
        expectedCloseDate: '',
        commission: {
            percentage: '',
            amount: ''
        },
        notes: ''
    });

    // Fetch leads when modal is open (agents get their assigned leads from backend)
    const { data: leadsResponse } = useQuery({
        queryKey: ['leads-for-deal'],
        queryFn: () => leadService.getLeads({ limit: 200 }),
        enabled: !!isOpen
    });
    const leads = leadsResponse?.data || [];

    const selectedLead = formData.lead
        ? leads.find((l) => (l._id || l.id) === formData.lead)
        : null;
    const assignedProperties = selectedLead?.interestedProperties
        ?.map((i) => i.property)
        .filter(Boolean) || [];

    // When editing, include initial lead/property in options if not in list
    const leadInList = leads.some((l) => (l._id || l.id) === formData.lead);
    const initialLeadLabel = initialData?.lead && typeof initialData.lead === 'object' && initialData.lead.firstName
        ? `${initialData.lead.firstName} ${initialData.lead.lastName}`.trim()
        : null;
    const initialPropertyLabel = initialData?.property && typeof initialData.property === 'object' && initialData.property.title
        ? initialData.property.title
        : null;

    useEffect(() => {
        if (initialData) {
            setFormData({
                ...initialData,
                lead: initialData.lead?._id || initialData.lead || '',
                property: initialData.property?._id || initialData.property || ''
            });
        } else if (isOpen) {
            setFormData({
                title: '',
                lead: '',
                property: '',
                transactionType: 'sale',
                dealValue: '',
                currency: 'EGP',
                stage: 'negotiation',
                probability: 50,
                expectedCloseDate: '',
                commission: { percentage: '', amount: '' },
                notes: ''
            });
        }
    }, [initialData, isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        await onSubmit(formData);
        resetForm();
    };

    const resetForm = () => {
        setFormData({
            title: '',
            lead: '',
            property: '',
            transactionType: 'sale',
            dealValue: '',
            currency: 'EGP',
            stage: 'negotiation',
            probability: 50,
            expectedCloseDate: '',
            commission: { percentage: '', amount: '' },
            notes: ''
        });
    };

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={`${styles.modal} animate-slideInUp`} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2>{initialData ? 'Edit Deal' : 'Create New Deal'}</h2>
                    <button className={styles.closeButton} onClick={onClose}>×</button>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formGrid}>
                        <div className={styles.formGroupFull}>
                            <label>Deal Title *</label>
                            <Input
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Enter deal title"
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Transaction Type *</label>
                            <select
                                value={formData.transactionType}
                                onChange={(e) => setFormData({ ...formData, transactionType: e.target.value })}
                                className={styles.select}
                                required
                            >
                                {TRANSACTION_TYPES.map(type => (
                                    <option key={type.value} value={type.value}>{type.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.formGroup}>
                            <label>Lead *</label>
                            <select
                                value={formData.lead}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    lead: e.target.value,
                                    property: '' // reset property when lead changes
                                })}
                                className={styles.select}
                                required
                            >
                                <option value="">{t('dashboard_extra.select_a_lead')}</option>
                                {!leadInList && formData.lead && initialLeadLabel && (
                                    <option value={formData.lead}>{initialLeadLabel} (current)</option>
                                )}
                                {leads.map((lead) => (
                                    <option key={lead._id} value={lead._id}>
                                        {lead.firstName} {lead.lastName}
                                        {lead.email ? ` · ${lead.email}` : ''}
                                    </option>
                                ))}
                            </select>
                            <small style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-xs)' }}>{t('dashboard_extra.leads_assigned_to_you')}</small>
                        </div>

                        <div className={styles.formGroup}>
                            <label>Property *</label>
                            <select
                                value={formData.property}
                                onChange={(e) => setFormData({ ...formData, property: e.target.value })}
                                className={styles.select}
                                required
                                disabled={!formData.lead}
                            >
                                <option value="">{t('dashboard_extra.select_a_property')}</option>
                                {formData.property && assignedProperties.length === 0 && initialPropertyLabel && (
                                    <option value={formData.property}>{initialPropertyLabel} (current)</option>
                                )}
                                {assignedProperties.map((prop) => (
                                    <option key={prop._id} value={prop._id}>
                                        {prop.title || 'Untitled'}
                                        {prop.price != null ? ` · ${Number(prop.price).toLocaleString()}` : ''}
                                    </option>
                                ))}
                            </select>
                            <small style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-xs)' }}>
                                {!formData.lead
                                    ? 'Select a lead first'
                                    : assignedProperties.length === 0
                                        ? 'No properties assigned to this lead. Assign from the lead detail page.'
                                        : 'Properties assigned to this lead'}
                            </small>
                        </div>

                        <div className={styles.formGroup}>
                            <label>Deal Value *</label>
                            <Input
                                type="number"
                                value={formData.dealValue}
                                onChange={(e) => setFormData({ ...formData, dealValue: e.target.value })}
                                placeholder="0"
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>{t('dashboard_extra.currency')}</label>
                            <select
                                value={formData.currency}
                                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                className={styles.select}
                            >
                                <option value="EGP">EGP</option>
                                <option value="USD">USD</option>
                                <option value="EUR">EUR</option>
                                <option value="GBP">GBP</option>
                                <option value="AED">AED</option>
                            </select>
                        </div>

                        <div className={styles.formGroup}>
                            <label>{t('dashboard_extra.stage')}</label>
                            <select
                                value={formData.stage}
                                onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                                className={styles.select}
                            >
                                {DEAL_STAGES.map(stage => (
                                    <option key={stage.value} value={stage.value}>{stage.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.formGroup}>
                            <label>Probability (%)</label>
                            <Input
                                type="number"
                                min="0"
                                max="100"
                                value={formData.probability}
                                onChange={(e) => setFormData({ ...formData, probability: e.target.value })}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>{t('dashboard_extra.expected_close_date')}</label>
                            <Input
                                type="date"
                                value={formData.expectedCloseDate}
                                onChange={(e) => setFormData({ ...formData, expectedCloseDate: e.target.value })}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Commission %</label>
                            <Input
                                type="number"
                                step="0.01"
                                value={formData.commission.percentage}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    commission: { ...formData.commission, percentage: e.target.value }
                                })}
                                placeholder="0.00"
                            />
                        </div>

                        <div className={styles.formGroupFull}>
                            <label>{t('dashboard_extra.notes')}</label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                className={styles.textarea}
                                rows="3"
                                placeholder="Add any notes about this deal..."
                            />
                        </div>
                    </div>

                    <div className={styles.footer}>
                        <Button type="button" variant="outline" onClick={onClose}>{t('dashboard_extra.cancel')}</Button>
                        <Button type="submit" variant="primary">
                            {initialData ? 'Update Deal' : 'Create Deal'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DealForm;
