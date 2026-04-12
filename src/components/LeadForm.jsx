import { useLanguage } from "@/hooks/useLanguage";
import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { LEAD_STATUSES, LEAD_PRIORITIES } from '@/utils/constants';
import styles from './LeadForm.module.css';

const LeadForm = ({ isOpen, onClose, onSubmit, initialData = null, title = 'Add Lead' }) => {
    const { t } = useLanguage();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        source: 'website',
        status: 'new',
        priority: 'warm',
        transactionType: 'sale',
        budget: { min: '', max: '' },
        notes: ''
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (initialData) {
            setFormData({
                ...initialData,
                budget: initialData.budget || { min: '', max: '' }
            });
        } else {
            setFormData({
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                source: 'website',
                status: 'new',
                priority: 'warm',
                transactionType: 'sale',
                budget: { min: '', max: '' },
                notes: ''
            });
        }
    }, [initialData, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: value
                }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
        // Clear error when user types
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
        if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
        if (!formData.phone.trim()) newErrors.phone = 'Phone is required';

        if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) {
            newErrors.email = 'Invalid email address';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        try {
            await onSubmit(formData);
            onClose();
        } catch (error) {
            console.error('Error submitting form:', error);
            setErrors(prev => ({ ...prev, submit: error.message || 'Failed to save lead' }));
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2>{title}</h2>
                    <button onClick={onClose} className={styles.closeBtn}>
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    {errors.submit && <div className={styles.errorBanner}>{errors.submit}</div>}

                    <div className={styles.section}>
                        <h3>{t('dashboard_extra.basic_information')}</h3>
                        <div className={styles.row}>
                            <Input
                                label={t('dashboard_extra.first_name')}
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                error={errors.firstName}
                                required
                                fullWidth
                            />
                            <Input
                                label={t('dashboard_extra.last_name')}
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                                error={errors.lastName}
                                required
                                fullWidth
                            />
                        </div>
                        <div className={styles.row}>
                            <Input
                                label={t('dashboard_extra.email')}
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                error={errors.email}
                                fullWidth
                            />
                            <Input
                                label={t('dashboard_extra.phone')}
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                error={errors.phone}
                                required
                                fullWidth
                            />
                        </div>
                    </div>

                    <div className={styles.section}>
                        <h3>{t('dashboard_extra.lead_details')}</h3>
                        <div className={styles.row}>
                            <div className={styles.formGroup}>
                                <label>{t('dashboard_extra.source')}</label>
                                <select
                                    name="source"
                                    value={formData.source}
                                    onChange={handleChange}
                                    className={styles.select}
                                >
                                    <option value="website">{t('dashboard_extra.website')}</option>
                                    <option value="facebook">Facebook</option>
                                    <option value="olx">OLX</option>
                                    <option value="referral">Referral</option>
                                    <option value="call">Call</option>
                                    <option value="walk_in">Walk-in</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label>{t('dashboard_extra.status')}</label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    className={styles.select}
                                >
                                    {LEAD_STATUSES.map(status => (
                                        <option key={status.value} value={status.value}>
                                            {status.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className={styles.row}>
                            <div className={styles.formGroup}>
                                <label>{t('dashboard_extra.priority')}</label>
                                <select
                                    name="priority"
                                    value={formData.priority}
                                    onChange={handleChange}
                                    className={styles.select}
                                >
                                    {LEAD_PRIORITIES.map(priority => (
                                        <option key={priority.value} value={priority.value}>
                                            {priority.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label>{t('dashboard_extra.transaction_type')}</label>
                                <select
                                    name="transactionType"
                                    value={formData.transactionType}
                                    onChange={handleChange}
                                    className={styles.select}
                                >
                                    <option value="sale">{t('dashboard_extra.buy')}</option>
                                    <option value="rent">{t('dashboard_extra.rent')}</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className={styles.section}>
                        <h3>Requirements (Optional)</h3>
                        <div className={styles.row}>
                            <Input
                                label="Min Budget"
                                name="budget.min"
                                type="number"
                                value={formData.budget.min}
                                onChange={handleChange}
                                fullWidth
                            />
                            <Input
                                label="Max Budget"
                                name="budget.max"
                                type="number"
                                value={formData.budget.max}
                                onChange={handleChange}
                                fullWidth
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>{t('dashboard_extra.notes')}</label>
                            <textarea
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                className={styles.textarea}
                                rows={3}
                                placeholder="Any specific requirements or notes..."
                            />
                        </div>
                    </div>

                    <div className={styles.footer}>
                        <Button type="button" variant="outline" onClick={onClose}>{t('dashboard_extra.cancel')}</Button>
                        <Button type="submit" variant="primary" loading={loading} leftIcon={<Save size={18} />}>{t('dashboard_extra.save_lead')}</Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LeadForm;
