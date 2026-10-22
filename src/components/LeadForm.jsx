import { useLanguage } from "@/hooks/useLanguage";
import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { LEAD_STATUSES, LEAD_PRIORITIES } from '@/utils/constants';
import {
    COUNTRIES,
    getMarketPreset,
    getCountryBranches,
    getLeadSourceOptions
} from '@/utils/marketPresets';
import { useUIStore } from '@/store/uiStore';
import styles from './LeadForm.module.css';

const LeadForm = ({ isOpen, onClose, onSubmit, initialData = null, title = 'Add Lead' }) => {
    const { t } = useLanguage();
    const selectedCountry = useUIStore((s) => s.selectedCountry);
    const selectedBranch = useUIStore((s) => s.selectedBranch);

    const buildDefaultState = () => {
        const defaultCountry = selectedCountry || 'Egypt';
        const preset = getMarketPreset(defaultCountry);
        const branches = getCountryBranches(defaultCountry);
        return {
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            country: defaultCountry,
            branch: selectedBranch || branches[0] || 'Main Branch',
            source: preset?.leadSources?.[0] || 'website',
            status: 'new',
            priority: 'warm',
            transactionType: 'sale',
            budget: { min: '', max: '', currency: preset?.currency || 'EGP' },
            notes: ''
        };
    };

    const [formData, setFormData] = useState(buildDefaultState);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (initialData) {
            const initCountry = initialData.country || selectedCountry || 'Egypt';
            const preset = getMarketPreset(initCountry);
            const branches = getCountryBranches(initCountry);
            setFormData({
                ...initialData,
                country: initCountry,
                branch: initialData.branch || branches[0] || 'Main Branch',
                budget: {
                    min: initialData.budget?.min ?? '',
                    max: initialData.budget?.max ?? '',
                    currency: initialData.budget?.currency || preset?.currency || 'EGP'
                }
            });
        } else {
            setFormData(buildDefaultState());
        }
    }, [initialData, isOpen, selectedCountry, selectedBranch]);

    const handleCountryChange = (e) => {
        const nextCountry = e.target.value;
        const preset = getMarketPreset(nextCountry);
        const branches = getCountryBranches(nextCountry);
        const allowedSources = preset?.leadSources || ['website'];
        setFormData((prev) => ({
            ...prev,
            country: nextCountry,
            branch: branches[0] || 'Main Branch',
            source: allowedSources.includes(prev.source) ? prev.source : allowedSources[0],
            budget: {
                ...prev.budget,
                currency: preset?.currency || 'EGP'
            }
        }));
    };

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

    const currentPreset = getMarketPreset(formData.country || 'Egypt');
    const availableBranches = getCountryBranches(formData.country || 'Egypt');
    const sourceOptions = getLeadSourceOptions(formData.country || 'Egypt');
    const activeCurrency = formData.budget?.currency || currentPreset?.currency || 'EGP';

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
                        <h3>Country &amp; Regional Market</h3>
                        <div className={styles.row}>
                            <div className={styles.formGroup}>
                                <label>Country / Market</label>
                                <select
                                    name="country"
                                    value={formData.country || 'Egypt'}
                                    onChange={handleCountryChange}
                                    className={styles.select}
                                >
                                    {COUNTRIES.map((c) => (
                                        <option key={c.value} value={c.value}>
                                            {c.flag} {c.label} ({c.currency})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label>Branch</label>
                                <select
                                    name="branch"
                                    value={formData.branch || ''}
                                    onChange={handleChange}
                                    className={styles.select}
                                >
                                    {availableBranches.map((b) => (
                                        <option key={b} value={b}>
                                            {b}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

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
                                label={`${t('dashboard_extra.phone')} (${currentPreset?.phonePrefix || '+20'})`}
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder={`${currentPreset?.phonePrefix || '+20'} 100 000 0000`}
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
                                    {sourceOptions.map((src) => (
                                        <option key={src.value} value={src.value}>
                                            {src.label}
                                        </option>
                                    ))}
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
                                label={`Min Budget (${activeCurrency})`}
                                name="budget.min"
                                type="number"
                                value={formData.budget.min}
                                onChange={handleChange}
                                fullWidth
                            />
                            <Input
                                label={`Max Budget (${activeCurrency})`}
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
