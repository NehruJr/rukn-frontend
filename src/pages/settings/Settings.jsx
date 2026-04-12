import { useLanguage } from "@/hooks/useLanguage";
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, Users, Bell, Settings as SettingsIcon, Save } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useUIStore } from '@/store/uiStore';
import { getSettings, updateSettings } from '@/services/settingsService';
import styles from './Settings.module.css';

const Settings = () => {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState('agency');
    const queryClient = useQueryClient();
    const addToast = useUIStore((s) => s.addToast);

    const { data: settingsData, isLoading } = useQuery({
        queryKey: ['settings'],
        queryFn: getSettings
    });

    const updateSettingsMutation = useMutation({
        mutationFn: updateSettings,
        onSuccess: (response) => {
            // Update cache immediately so currency and other fields show correctly after save
            if (response?.data) {
                queryClient.setQueryData(['settings'], response);
            }
            queryClient.invalidateQueries(['settings']);
            addToast({ type: 'success', message: 'Settings saved successfully' });
        },
        onError: (err) => {
            addToast({
                type: 'error',
                message: err.response?.data?.message || err.message || 'Failed to save settings'
            });
        }
    });

    const settings = settingsData?.data || {};

    const tabs = [
        { id: 'agency', label: 'Agency Info', icon: <Building2 size={18} /> },
        { id: 'users', label: 'User Management', icon: <Users size={18} /> },
        { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
        { id: 'system', label: 'System', icon: <SettingsIcon size={18} /> }
    ];

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1>{t('dashboard_extra.settings')}</h1>
                    <p>{t('dashboard_extra.manage_your_agency_settings_and_configur')}</p>
                </div>
            </div>

            <div className={styles.content}>
                <div className={styles.tabs}>
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            className={`${styles.tab} ${activeTab === tab.id ? styles.activeTab : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.icon}
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                <div className={styles.tabContent}>
                    {isLoading && <div className={styles.loading}>{t('dashboard_extra.loading_settings')}</div>}

                    {!isLoading && activeTab === 'agency' && (
                        <AgencySettings
                            settings={settings}
                            onUpdate={(data) => updateSettingsMutation.mutate(data)}
                            isSaving={updateSettingsMutation.isPending}
                        />
                    )}

                    {!isLoading && activeTab === 'users' && (
                        <UserSettings />
                    )}

                    {!isLoading && activeTab === 'notifications' && (
                        <NotificationSettings
                            settings={settings}
                            onUpdate={(data) => updateSettingsMutation.mutate(data)}
                            isSaving={updateSettingsMutation.isPending}
                        />
                    )}

                    {!isLoading && activeTab === 'system' && (
                        <SystemSettings
                            settings={settings}
                            onUpdate={(data) => updateSettingsMutation.mutate(data)}
                            isSaving={updateSettingsMutation.isPending}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

// Agency Settings Tab
const AgencySettings = ({ settings, onUpdate, isSaving }) => {
    const [formData, setFormData] = useState({
        agencyName: settings.agencyName || '',
        agencyEmail: settings.agencyEmail || '',
        agencyPhone: settings.agencyPhone || '',
        agencyAddress: settings.agencyAddress || '',
        agencyWebsite: settings.agencyWebsite || '',
        agencyLogo: settings.agencyLogo || '',
        primaryColor: settings.primaryColor || '#b4562d',
        secondaryColor: settings.secondaryColor || '#2c3438'
    });

    useEffect(() => {
        setFormData({
            agencyName: settings.agencyName || '',
            agencyEmail: settings.agencyEmail || '',
            agencyPhone: settings.agencyPhone || '',
            agencyAddress: settings.agencyAddress || '',
            agencyWebsite: settings.agencyWebsite || '',
            agencyLogo: settings.agencyLogo || '',
            primaryColor: settings.primaryColor || '#b4562d',
            secondaryColor: settings.secondaryColor || '#2c3438'
        });
    }, [settings]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onUpdate({ ...settings, ...formData });
    };

    return (
        <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.section}>
                <h3>{t('dashboard_extra.agency_information')}</h3>
                <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                        <label>Agency Name *</label>
                        <Input
                            value={formData.agencyName}
                            onChange={(e) => setFormData({ ...formData, agencyName: e.target.value })}
                            placeholder="Enter agency name"
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Email *</label>
                        <Input
                            type="email"
                            value={formData.agencyEmail}
                            onChange={(e) => setFormData({ ...formData, agencyEmail: e.target.value })}
                            placeholder="agency@example.com"
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>{t('dashboard_extra.phone')}</label>
                        <Input
                            type="tel"
                            value={formData.agencyPhone}
                            onChange={(e) => setFormData({ ...formData, agencyPhone: e.target.value })}
                            placeholder="+1 234 567 8900"
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>{t('dashboard_extra.website')}</label>
                        <Input
                            type="url"
                            value={formData.agencyWebsite}
                            onChange={(e) => setFormData({ ...formData, agencyWebsite: e.target.value })}
                            placeholder="https://yourwebsite.com"
                        />
                    </div>

                    <div className={styles.formGroupFull}>
                        <label>{t('dashboard_extra.address')}</label>
                        <textarea
                            value={formData.agencyAddress}
                            onChange={(e) => setFormData({ ...formData, agencyAddress: e.target.value })}
                            className={styles.textarea}
                            rows="3"
                            placeholder="Enter agency address"
                        />
                    </div>
                </div>
            </div>

            <div className={styles.section}>
                <h3>{t('dashboard_extra.branding')}</h3>
                <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                        <label>{t('dashboard_extra.primary_color')}</label>
                        <div className={styles.colorInput}>
                            <input
                                type="color"
                                value={formData.primaryColor}
                                onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                            />
                            <Input
                                value={formData.primaryColor}
                                onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                                placeholder="#b4562d"
                            />
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label>{t('dashboard_extra.secondary_color')}</label>
                        <div className={styles.colorInput}>
                            <input
                                type="color"
                                value={formData.secondaryColor}
                                onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                            />
                            <Input
                                value={formData.secondaryColor}
                                onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                                placeholder="#2c3438"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.formActions}>
                <Button type="submit" variant="primary" leftIcon={<Save size={18} />} disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
            </div>
        </form>
    );
};

// User Settings Tab
const UserSettings = () => {
    return (
        <div className={styles.section}>
            <h3>User & Role Management</h3>
            <p className={styles.sectionDescription}>{t('dashboard_extra.manage_user_permissions_and_roles_from_t')}</p>
            <Button variant="outline" onClick={() => window.location.href = '/team'}>{t('dashboard_extra.go_to_team_management')}</Button>
        </div>
    );
};

// Notification Settings Tab
const NotificationSettings = ({ settings, onUpdate, isSaving }) => {
    const [formData, setFormData] = useState({
        emailNotifications: settings.emailNotifications ?? true,
        newLeadNotification: settings.newLeadNotification ?? true,
        dealUpdateNotification: settings.dealUpdateNotification ?? true,
        taskReminderNotification: settings.taskReminderNotification ?? true,
        reportNotification: settings.reportNotification ?? false
    });

    useEffect(() => {
        setFormData({
            emailNotifications: settings.emailNotifications ?? true,
            newLeadNotification: settings.newLeadNotification ?? true,
            dealUpdateNotification: settings.dealUpdateNotification ?? true,
            taskReminderNotification: settings.taskReminderNotification ?? true,
            reportNotification: settings.reportNotification ?? false
        });
    }, [settings]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onUpdate({ ...settings, ...formData });
    };

    return (
        <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.section}>
                <h3>{t('dashboard_extra.email_notifications')}</h3>
                <div className={styles.checkboxGroup}>
                    <label className={styles.checkbox}>
                        <input
                            type="checkbox"
                            checked={formData.emailNotifications}
                            onChange={(e) => setFormData({ ...formData, emailNotifications: e.target.checked })}
                        />
                        <span>{t('dashboard_extra.enable_email_notifications')}</span>
                    </label>

                    <label className={styles.checkbox}>
                        <input
                            type="checkbox"
                            checked={formData.newLeadNotification}
                            onChange={(e) => setFormData({ ...formData, newLeadNotification: e.target.checked })}
                            disabled={!formData.emailNotifications}
                        />
                        <span>{t('dashboard_extra.new_lead_notifications')}</span>
                    </label>

                    <label className={styles.checkbox}>
                        <input
                            type="checkbox"
                            checked={formData.dealUpdateNotification}
                            onChange={(e) => setFormData({ ...formData, dealUpdateNotification: e.target.checked })}
                            disabled={!formData.emailNotifications}
                        />
                        <span>{t('dashboard_extra.deal_update_notifications')}</span>
                    </label>

                    <label className={styles.checkbox}>
                        <input
                            type="checkbox"
                            checked={formData.taskReminderNotification}
                            onChange={(e) => setFormData({ ...formData, taskReminderNotification: e.target.checked })}
                            disabled={!formData.emailNotifications}
                        />
                        <span>{t('dashboard_extra.task_reminder_notifications')}</span>
                    </label>

                    <label className={styles.checkbox}>
                        <input
                            type="checkbox"
                            checked={formData.reportNotification}
                            onChange={(e) => setFormData({ ...formData, reportNotification: e.target.checked })}
                            disabled={!formData.emailNotifications}
                        />
                        <span>{t('dashboard_extra.weekly_report_notifications')}</span>
                    </label>
                </div>
            </div>

            <div className={styles.formActions}>
                <Button type="submit" variant="primary" leftIcon={<Save size={18} />} disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
            </div>
        </form>
    );
};

// System Settings Tab
const SystemSettings = ({ settings, onUpdate, isSaving }) => {
    const [formData, setFormData] = useState({
        currency: settings.currency || 'EGP',
        dateFormat: settings.dateFormat || 'MM/DD/YYYY',
        timezone: settings.timezone || 'UTC',
        language: settings.language || 'ar'
    });

    useEffect(() => {
        setFormData({
            currency: settings.currency || 'EGP',
            dateFormat: settings.dateFormat || 'MM/DD/YYYY',
            timezone: settings.timezone || 'UTC',
            language: settings.language || 'ar'
        });
    }, [settings]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onUpdate({ ...settings, ...formData });
    };

    return (
        <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.section}>
                <h3>{t('dashboard_extra.regional_settings')}</h3>
                <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                        <label>{t('dashboard_extra.default_currency')}</label>
                        <select
                            value={formData.currency}
                            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                            className={styles.select}
                        >
                            <option value="EGP">EGP - Egyptian Pound</option>
                            <option value="USD">USD - US Dollar</option>
                            <option value="EUR">EUR - Euro</option>
                            <option value="GBP">GBP - British Pound</option>
                            <option value="AED">AED - UAE Dirham</option>
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label>{t('dashboard_extra.date_format')}</label>
                        <select
                            value={formData.dateFormat}
                            onChange={(e) => setFormData({ ...formData, dateFormat: e.target.value })}
                            className={styles.select}
                        >
                            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label>{t('dashboard_extra.timezone')}</label>
                        <select
                            value={formData.timezone}
                            onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                            className={styles.select}
                        >
                            <option value="UTC">UTC</option>
                            <option value="America/New_York">Eastern Time</option>
                            <option value="America/Los_Angeles">Pacific Time</option>
                            <option value="Europe/London">London</option>
                            <option value="Asia/Dubai">Dubai</option>
                            <option value="Africa/Cairo">Egypt (Cairo)</option>
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label>{t('dashboard_extra.language')}</label>
                        <select
                            value={formData.language}
                            onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                            className={styles.select}
                        >
                            <option value="ar">العربية (Arabic)</option>
                            <option value="en">English</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className={styles.formActions}>
                <Button type="submit" variant="primary" leftIcon={<Save size={18} />} disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
            </div>
        </form>
    );
};

export default Settings;
