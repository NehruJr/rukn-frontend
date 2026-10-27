import { useLanguage } from "@/hooks/useLanguage";
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Building2,
    Users,
    Bell,
    Settings as SettingsIcon,
    Save,
    CreditCard,
    Lock,
    Sparkles,
    Compass,
    Check,
    X,
    ArrowUpRight,
    RotateCcw
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '@/store/uiStore';
import { getSettings, updateSettings } from '@/services/settingsService';
import { getMySubscription } from '@/services/subscriptionService';
import PlanComparisonModal from '@/components/subscription/PlanComparisonModal';
import styles from './Settings.module.css';

const Settings = () => {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState('agency');
    const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
    const queryClient = useQueryClient();
    const addToast = useUIStore((s) => s.addToast);

    const { data: settingsData, isLoading } = useQuery({
        queryKey: ['settings'],
        queryFn: getSettings
    });

    const { data: subResponse } = useQuery({
        queryKey: ['mySubscription'],
        queryFn: getMySubscription
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
    const subscriptionData = subResponse?.data || null;

    const tabs = [
        { id: 'agency', label: t('settings.tabAgencyInfo'), icon: <Building2 size={18} /> },
        { id: 'subscription', label: t('settings.tabSubscription'), icon: <CreditCard size={18} /> },
        { id: 'users', label: t('settings.tabUserMgmt'), icon: <Users size={18} /> },
        { id: 'notifications', label: t('settings.tabNotifications'), icon: <Bell size={18} /> },
        { id: 'system', label: t('settings.tabSystem'), icon: <SettingsIcon size={18} /> }
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
                            subscriptionData={subscriptionData}
                            onOpenUpgrade={() => setIsPlanModalOpen(true)}
                            onUpdate={(data) => updateSettingsMutation.mutate(data)}
                            isSaving={updateSettingsMutation.isPending}
                        />
                    )}

                    {!isLoading && activeTab === 'subscription' && (
                        <SubscriptionSettings
                            subscriptionData={subscriptionData}
                            onOpenUpgrade={() => setIsPlanModalOpen(true)}
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

            <PlanComparisonModal
                isOpen={isPlanModalOpen}
                onClose={() => setIsPlanModalOpen(false)}
                currentPlanCode={subscriptionData?.plan?.code || subscriptionData?.subscription?.plan}
            />
        </div>
    );
};

// Agency Settings Tab
const AgencySettings = ({ settings, subscriptionData, onOpenUpgrade, onUpdate, isSaving }) => {
    const { t } = useLanguage();
    const isBrandingUnlocked = Boolean(subscriptionData?.features?.customBranding);

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

    const handleResetDefaults = () => {
        setFormData((prev) => ({
            ...prev,
            primaryColor: '#b4562d',
            secondaryColor: '#2c3438'
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const payload = { ...settings, ...formData };
        // If custom branding is not unlocked by subscription tier, do not send branding fields to avoid 403
        if (!isBrandingUnlocked) {
            delete payload.primaryColor;
            delete payload.secondaryColor;
            delete payload.customBranding;
        }
        onUpdate(payload);
    };

    return (
        <form onSubmit={handleSubmit} className={styles.form}>
            {/* Branding Gating Banner */}
            {!isBrandingUnlocked ? (
                <div className={styles.brandingLockAlert}>
                    <div className={styles.brandingLockContent}>
                        <Lock size={20} className={styles.brandingLockIcon} />
                        <div>
                            <div className={styles.brandingLockTitle}>
                                {t('subscription.brandingLockedTitle')}
                            </div>
                            <div className={styles.brandingLockText}>
                                {t('subscription.brandingLockedDesc')}
                            </div>
                        </div>
                    </div>
                    <button
                        type="button"
                        className={styles.upgradeButtonSmall}
                        onClick={onOpenUpgrade}
                    >
                        <Sparkles size={14} />
                        <span>{t('subscription.upgradePlan')}</span>
                    </button>
                </div>
            ) : (
                <div className={styles.brandingUnlockedBadge}>
                    <Sparkles size={16} />
                    <span>{t('subscription.brandingUnlockedBadge')} (Enterprise)</span>
                </div>
            )}

            <div className={styles.section}>
                <h3>{t('dashboard_extra.agency_information')}</h3>
                <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                        <label>{t('settings.agencyNameStar')}</label>
                        <Input
                            value={formData.agencyName}
                            onChange={(e) => setFormData({ ...formData, agencyName: e.target.value })}
                            placeholder={t('settings.enterAgencyName')}
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>{t('settings.emailStar')}</label>
                        <Input
                            type="email"
                            value={formData.agencyEmail}
                            onChange={(e) => setFormData({ ...formData, agencyEmail: e.target.value })}
                            placeholder={t('settings.agencyEmailEx')}
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

            {/* Branding Section */}
            <div className={styles.section}>
                <h3>{t('dashboard_extra.branding')}</h3>
                <p className={styles.sectionDescription}>
                    {isBrandingUnlocked
                        ? t('subscription.brandingUnlockedBadge')
                        : t('subscription.brandingLockedDesc')}
                </p>

                <div className={styles.formGrid}>
                    {/* Agency Logo (Whitelabel) */}
                    <div className={`${styles.formGroupFull} ${!isBrandingUnlocked ? styles.lockedField : ''}`}>
                        <label>
                            {t('dashboard_extra.logo') || 'Agency Logo URL'}
                            {!isBrandingUnlocked && (
                                <span className={styles.lockedFieldBadge}>
                                    <Lock size={12} /> Enterprise Only
                                </span>
                            )}
                        </label>
                        <Input
                            value={formData.agencyLogo}
                            onChange={(e) => setFormData({ ...formData, agencyLogo: e.target.value })}
                            placeholder="https://example.com/logo.png"
                            disabled={!isBrandingUnlocked}
                        />
                    </div>

                    {/* Primary Brand Color */}
                    <div className={`${styles.formGroup} ${!isBrandingUnlocked ? styles.lockedField : ''}`}>
                        <label>
                            {t('subscription.primaryColorLabel')}
                            {!isBrandingUnlocked && (
                                <span className={styles.lockedFieldBadge}>
                                    <Lock size={12} /> Enterprise
                                </span>
                            )}
                        </label>
                        <div className={styles.colorInput}>
                            <input
                                type="color"
                                value={formData.primaryColor}
                                onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                                disabled={!isBrandingUnlocked}
                            />
                            <Input
                                value={formData.primaryColor}
                                onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                                placeholder="#b4562d"
                                disabled={!isBrandingUnlocked}
                            />
                        </div>
                    </div>

                    {/* Secondary Brand Color */}
                    <div className={`${styles.formGroup} ${!isBrandingUnlocked ? styles.lockedField : ''}`}>
                        <label>
                            {t('subscription.secondaryColorLabel')}
                            {!isBrandingUnlocked && (
                                <span className={styles.lockedFieldBadge}>
                                    <Lock size={12} /> Enterprise
                                </span>
                            )}
                        </label>
                        <div className={styles.colorInput}>
                            <input
                                type="color"
                                value={formData.secondaryColor}
                                onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                                disabled={!isBrandingUnlocked}
                            />
                            <Input
                                value={formData.secondaryColor}
                                onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                                placeholder="#2c3438"
                                disabled={!isBrandingUnlocked}
                            />
                        </div>
                    </div>
                </div>

                {/* Live Preview & Theme Reset when Branding is Unlocked */}
                {isBrandingUnlocked && (
                    <div className={styles.colorPreviewBox}>
                        <div className={styles.colorPreviewHeader}>
                            {t('subscription.brandingLivePreview')}
                        </div>
                        <div className={styles.colorPreviewSwatches}>
                            <div
                                className={styles.colorSwatchSample}
                                style={{ background: formData.primaryColor }}
                            >
                                <span>{formData.primaryColor} (Primary Button)</span>
                            </div>
                            <div
                                className={styles.colorSwatchSample}
                                style={{ background: formData.secondaryColor }}
                            >
                                <span>{formData.secondaryColor} (Text / Nav)</span>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleResetDefaults}
                                leftIcon={<RotateCcw size={14} />}
                            >
                                {t('subscription.restoreDefaults')}
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            <div className={styles.formActions}>
                <Button type="submit" variant="primary" leftIcon={<Save size={18} />} disabled={isSaving}>
                    {isSaving ? t('settings.saving') : t('settings.saveChanges')}
                </Button>
            </div>
        </form>
    );
};

// Subscription Settings Tab
const SubscriptionSettings = ({ subscriptionData, onOpenUpgrade }) => {
    const { t, language } = useLanguage();
    if (!subscriptionData) return null;

    const { subscription, plan, usage, state, features } = subscriptionData;

    const getPlanDisplayName = () => {
        if (plan?.name) {
            if (typeof plan.name === 'object') {
                return (language === 'ar' ? plan.name.ar : plan.name.en) || plan.name.en;
            }
            return plan.name;
        }
        return subscription?.plan || 'Standard';
    };

    const quotaList = [
        {
            id: 'users',
            label: t('subscription.usersQuota'),
            current: usage?.users?.current ?? 0,
            limit: usage?.users?.limit,
            isUnlimited: usage?.users?.isUnlimited,
            percentage: usage?.users?.percentage ?? 0
        },
        {
            id: 'properties',
            label: t('subscription.propertiesQuota'),
            current: usage?.properties?.current ?? 0,
            limit: usage?.properties?.limit,
            isUnlimited: usage?.properties?.isUnlimited,
            percentage: usage?.properties?.percentage ?? 0
        },
        {
            id: 'leads',
            label: t('subscription.leadsQuota'),
            current: usage?.leads?.current ?? 0,
            limit: usage?.leads?.limit,
            isUnlimited: usage?.leads?.isUnlimited,
            percentage: usage?.leads?.percentage ?? 0
        },
        {
            id: 'ai',
            label: t('subscription.aiQuota'),
            current: usage?.aiRequests?.current ?? 0,
            limit: usage?.aiRequests?.limit,
            isUnlimited: usage?.aiRequests?.isUnlimited,
            percentage: usage?.aiRequests?.percentage ?? 0
        },
        {
            id: 'tours',
            label: t('subscription.virtualToursQuota'),
            current: usage?.virtualTours?.current ?? 0,
            limit: -1,
            isUnlimited: true,
            isFree: true
        }
    ];

    const featureRows = [
        { label: t('subscription.aiCoPilot'), enabled: Boolean(features?.aiCoPilot) },
        { label: t('subscription.advancedReports'), enabled: Boolean(features?.advancedReports) },
        { label: t('subscription.publicShareLinks'), enabled: Boolean(features?.publicShareLinks) },
        { label: t('subscription.customBranding'), enabled: Boolean(features?.customBranding) },
        { label: `${t('subscription.virtualToursQuota')} (360°)`, enabled: true, freeHighlight: true }
    ];

    return (
        <div className={styles.section}>
            <h3>{t('subscription.mySubscription')}</h3>
            <p className={styles.sectionDescription}>{t('subscription.manageSubscription')}</p>

            <div className={styles.subOverviewGrid}>
                <div className={styles.subCard}>
                    <div>
                        <div className={styles.subCardHeader}>
                            <span className={styles.subCardTitle}>{t('subscription.activePlan')}</span>
                            <span className={`${styles.statusBadge} ${state?.isExpired ? styles.statusGrace : styles.statusActive}`}>
                                {state?.status}
                            </span>
                        </div>
                        <div className={styles.subCardValue}>{getPlanDisplayName()}</div>
                    </div>
                    <div style={{ marginTop: '1.25rem' }}>
                        <Button variant="primary" size="sm" onClick={onOpenUpgrade} leftIcon={<ArrowUpRight size={16} />}>
                            {t('subscription.upgradePlan')}
                        </Button>
                    </div>
                </div>

                <div className={styles.subCard}>
                    <div>
                        <div className={styles.subCardHeader}>
                            <span className={styles.subCardTitle}>{t('subscription.daysRemaining')}</span>
                            <CreditCard size={18} color="var(--color-primary-500)" />
                        </div>
                        <div className={styles.subCardValue}>
                            {state?.daysRemaining !== null ? `${state.daysRemaining} ${t('subscription.daysRemainingSuffix')}` : '—'}
                        </div>
                    </div>
                    <div style={{ marginTop: '1.25rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                        {subscription?.billingCycle ? `${subscription.billingCycle.toUpperCase()} Billing` : 'Active'}
                    </div>
                </div>
            </div>

            <div className={styles.section} style={{ marginTop: '1.5rem' }}>
                <h4>{t('subscription.usageQuotas')}</h4>
                <div className={styles.subQuotaList}>
                    {quotaList.map((item) => (
                        <div key={item.id} className={styles.subQuotaItem}>
                            <div className={styles.subQuotaLabelRow}>
                                <span>{item.label}</span>
                                <span>
                                    {item.isFree ? (
                                        <strong style={{ color: '#059669' }}>{t('subscription.freeAndUnlimited')}</strong>
                                    ) : (
                                        `${item.current} / ${item.isUnlimited ? '∞' : item.limit}`
                                    )}
                                </span>
                            </div>
                            {!item.isFree && (
                                <div className={styles.subProgressTrack}>
                                    <div
                                        className={styles.subProgressFill}
                                        style={{
                                            width: `${item.percentage}%`,
                                            background: item.percentage > 85 ? '#ef4444' : 'var(--color-primary-500)'
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className={styles.section} style={{ marginTop: '2rem' }}>
                <h4>{t('subscription.manageSubscription')}</h4>
                <div className={styles.formGrid} style={{ marginTop: '0.75rem' }}>
                    {featureRows.map((feat, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                            {feat.enabled ? <Check size={18} color="#10b981" /> : <X size={18} color="#9ca3af" />}
                            <span style={{ fontWeight: feat.freeHighlight ? 700 : 500, color: feat.freeHighlight ? '#059669' : 'inherit' }}>
                                {feat.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// User Settings Tab
const UserSettings = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    return (
        <div className={styles.section}>
            <h3>{t('settings.userRoleAuth')}</h3>
            <p className={styles.sectionDescription}>{t('dashboard_extra.manage_user_permissions_and_roles_from_t')}</p>
            <Button variant="outline" onClick={() => navigate('/team')}>{t('dashboard_extra.go_to_team_management')}</Button>
        </div>
    );
};

// Notification Settings Tab
const NotificationSettings = ({ settings, onUpdate, isSaving }) => {
    const { t } = useLanguage();
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
    const { t } = useLanguage();
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
