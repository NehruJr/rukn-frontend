import { useState, useEffect } from 'react';
import { DEAL_STAGES, TRANSACTION_TYPES } from '@/utils/constants';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import styles from './DealForm.module.css';

const DealForm = ({ isOpen, onClose, onSubmit, initialData = null }) => {
    const [formData, setFormData] = useState({
        title: '',
        lead: '',
        property: '',
        transactionType: 'sale',
        dealValue: '',
        currency: 'USD',
        stage: 'negotiation',
        probability: 50,
        expectedCloseDate: '',
        commission: {
            percentage: '',
            amount: ''
        },
        notes: ''
    });

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        }
    }, [initialData]);

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
            currency: 'USD',
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
                            <label>Lead ID *</label>
                            <Input
                                value={formData.lead}
                                onChange={(e) => setFormData({ ...formData, lead: e.target.value })}
                                placeholder="Enter lead ID"
                                required
                            />
                            <small style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-xs)' }}>
                                Get lead ID from the leads page
                            </small>
                        </div>

                        <div className={styles.formGroup}>
                            <label>Property ID *</label>
                            <Input
                                value={formData.property}
                                onChange={(e) => setFormData({ ...formData, property: e.target.value })}
                                placeholder="Enter property ID"
                                required
                            />
                            <small style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-xs)' }}>
                                Get property ID from the properties page
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
                            <label>Currency</label>
                            <select
                                value={formData.currency}
                                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                className={styles.select}
                            >
                                <option value="USD">USD</option>
                                <option value="EUR">EUR</option>
                                <option value="GBP">GBP</option>
                            </select>
                        </div>

                        <div className={styles.formGroup}>
                            <label>Stage</label>
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
                            <label>Expected Close Date</label>
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
                            <label>Notes</label>
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
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
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
