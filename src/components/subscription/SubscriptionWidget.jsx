import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  CreditCard,
  Users,
  Building2,
  FileText,
  Sparkles,
  Compass,
  ArrowUpRight,
  ShieldCheck,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Settings as SettingsIcon,
  CheckCircle2,
  Lock,
  Calendar,
  Layers
} from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuthStore } from '@/store/authStore';
import { getMySubscription } from '@/services/subscriptionService';
import PlanComparisonModal from './PlanComparisonModal';
import styles from './SubscriptionWidget.module.css';

const SubscriptionWidget = () => {
  const { t, language } = useLanguage();
  const { user } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const canManageSubscription = user?.role === 'admin' || user?.role === 'manager';

  const { data: subResponse, isLoading } = useQuery({
    queryKey: ['mySubscription'],
    queryFn: getMySubscription,
    staleTime: 60 * 1000
  });

  if (isLoading || !subResponse?.data) {
    return null;
  }

  const { subscription, plan, usage, state, features } = subResponse.data;

  const getPlanDisplayName = () => {
    if (plan?.name) {
      if (typeof plan.name === 'object') {
        return (language === 'ar' ? plan.name.ar : plan.name.en) || plan.name.en;
      }
      return plan.name;
    }
    return subscription?.plan || 'Professional';
  };

  const getStatusClass = () => {
    if (state?.isExpired) return styles.statusExpired;
    if (state?.isGracePeriod) return styles.statusGrace;
    if (state?.isTrial) return styles.statusTrial;
    return styles.statusActive;
  };

  const getDaysClass = () => {
    if (state?.daysRemaining <= 3) return styles.daysDanger;
    if (state?.daysRemaining <= 7) return styles.daysWarning;
    return styles.daysNormal;
  };

  const getFillClass = (percentage) => {
    if (percentage >= 90) return styles.fillDanger;
    if (percentage >= 75) return styles.fillWarning;
    return styles.fillNormal;
  };

  const billingCycle = subscription?.billingCycle || 'monthly';
  const isYearly = billingCycle === 'yearly' || billingCycle === 'annual';

  const formattedEndDate = subscription?.endDate
    ? new Date(subscription.endDate).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    : null;

  const currency = user?.organization?.currency || 'EGP';
  const cycleKey = isYearly ? 'yearly' : 'monthly';
  const planPrice = plan?.pricing?.[cycleKey]?.[currency] ?? subscription?.priceSnapshot;

  const meters = [
    {
      id: 'users',
      label: t('subscription.usersQuota'),
      icon: Users,
      current: usage?.users?.current ?? 0,
      limit: usage?.users?.limit,
      percentage: usage?.users?.percentage ?? 0,
      isUnlimited: usage?.users?.isUnlimited
    },
    {
      id: 'properties',
      label: t('subscription.propertiesQuota'),
      icon: Building2,
      current: usage?.properties?.current ?? 0,
      limit: usage?.properties?.limit,
      percentage: usage?.properties?.percentage ?? 0,
      isUnlimited: usage?.properties?.isUnlimited
    },
    {
      id: 'leads',
      label: t('subscription.leadsQuota'),
      icon: FileText,
      current: usage?.leads?.current ?? 0,
      limit: usage?.leads?.limit,
      percentage: usage?.leads?.percentage ?? 0,
      isUnlimited: usage?.leads?.isUnlimited
    },
    {
      id: 'ai',
      label: t('subscription.aiQuota'),
      icon: Sparkles,
      current: usage?.aiRequests?.current ?? 0,
      limit: usage?.aiRequests?.limit,
      percentage: usage?.aiRequests?.percentage ?? 0,
      isUnlimited: usage?.aiRequests?.isUnlimited
    },
    {
      id: 'tours',
      label: t('subscription.virtualToursQuota'),
      icon: Compass,
      current: usage?.virtualTours?.current ?? 0,
      limit: -1,
      percentage: 0,
      isUnlimited: true,
      isFreeTag: true
    }
  ];

  const nearQuotaMeters = meters.filter((m) => !m.isUnlimited && m.percentage >= 80);

  const featureItems = [
    {
      key: 'aiCoPilot',
      label: t('subscription.aiCoPilot'),
      enabled: Boolean(features?.aiCoPilot),
      icon: Sparkles
    },
    {
      key: 'virtualTours360',
      label: t('subscription.virtualToursQuota'),
      enabled: true,
      isFree: true,
      icon: Compass
    },
    {
      key: 'advancedReports',
      label: t('subscription.advancedReports'),
      enabled: Boolean(features?.advancedReports),
      icon: FileText
    },
    {
      key: 'customBranding',
      label: t('subscription.customBranding'),
      enabled: Boolean(features?.customBranding),
      icon: ShieldCheck
    },
    {
      key: 'publicShareLinks',
      label: t('subscription.publicShareLinks'),
      enabled: Boolean(features?.publicShareLinks),
      icon: ArrowUpRight
    }
  ];

  return (
    <>
      <div className={styles.widget} role="region" aria-label={t('subscription.mySubscription')}>
        {/* Urgent State Banners */}
        {state?.isExpired && (
          <div className={`${styles.alertBanner} ${styles.alertExpired}`}>
            <AlertTriangle size={18} />
            <div className={styles.alertContent}>
              <strong>{t('subscription.expiredBanner')}</strong>
            </div>
            {canManageSubscription && (
              <button
                type="button"
                className={styles.alertActionBtn}
                onClick={() => setIsModalOpen(true)}
              >
                {t('subscription.renewNow')}
              </button>
            )}
          </div>
        )}

        {state?.isGracePeriod && !state?.isExpired && (
          <div className={`${styles.alertBanner} ${styles.alertGrace}`}>
            <AlertTriangle size={18} />
            <div className={styles.alertContent}>
              <strong>
                {t('subscription.gracePeriodBanner', { days: state.daysRemaining ?? 7 })}
              </strong>
            </div>
            {canManageSubscription && (
              <button
                type="button"
                className={styles.alertActionBtn}
                onClick={() => setIsModalOpen(true)}
              >
                {t('subscription.renewNow')}
              </button>
            )}
          </div>
        )}

        {state?.isTrial && !state?.isExpired && (
          <div className={`${styles.alertBanner} ${styles.alertTrial}`}>
            <Sparkles size={18} />
            <div className={styles.alertContent}>
              <span>{t('subscription.trialBanner', { days: state.daysRemaining ?? 14 })}</span>
            </div>
            {canManageSubscription && (
              <button
                type="button"
                className={styles.alertActionBtn}
                onClick={() => setIsModalOpen(true)}
              >
                {t('subscription.upgradePlan')}
              </button>
            )}
          </div>
        )}

        {/* Primary Subscription Card Header */}
        <div className={styles.header}>
          <div className={styles.planInfo}>
            <div className={styles.planIconWrapper}>
              <CreditCard size={22} />
            </div>
            <div className={styles.planTitleGroup}>
              <div className={styles.planTitleRow}>
                <span className={styles.planName}>{getPlanDisplayName()}</span>
                <span className={`${styles.statusBadge} ${getStatusClass()}`}>
                  {state?.status}
                </span>
                <span className={styles.cycleBadge}>
                  {isYearly ? t('subscription.yearlyBilling') : t('subscription.monthlyBilling')}
                </span>
              </div>

              {/* Metadata Subtitle Row */}
              <div className={styles.metaRow}>
                {formattedEndDate && (
                  <span className={styles.metaItem}>
                    <Calendar size={13} />
                    <span>
                      {state?.isExpired
                        ? t('subscription.expiresOn', { date: formattedEndDate })
                        : t('subscription.renewsOn', { date: formattedEndDate })}
                    </span>
                  </span>
                )}

                {state?.daysRemaining !== null && (
                  <span className={`${styles.daysPill} ${getDaysClass()}`}>
                    {state.daysRemaining > 0
                      ? `${state.daysRemaining} ${t('subscription.daysRemainingSuffix')}`
                      : t('subscription.expiredBanner')}
                  </span>
                )}

                {planPrice !== undefined && planPrice !== null && (
                  <span className={styles.metaPrice}>
                    <strong>{currency} {Number(planPrice).toLocaleString()}</strong>
                    <small>{isYearly ? t('subscription.perYear') : t('subscription.perMonth')}</small>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className={styles.actionsGroup}>
            {canManageSubscription && (
              <>
                <button
                  type="button"
                  className={styles.upgradeBtn}
                  onClick={() => setIsModalOpen(true)}
                >
                  <span>{state?.isExpired || state?.isGracePeriod ? t('subscription.renewPlan') : t('subscription.upgradePlan')}</span>
                  <ArrowUpRight size={15} />
                </button>
                <Link to="/settings" className={styles.settingsBtn} title={t('subscription.viewSettings')}>
                  <SettingsIcon size={15} />
                  <span>{t('subscription.manageSubscription')}</span>
                </Link>
              </>
            )}

            <button
              type="button"
              className={styles.toggleBtn}
              onClick={() => setIsExpanded(!isExpanded)}
              aria-expanded={isExpanded}
              aria-label={isExpanded ? t('subscription.hideDetails') : t('subscription.viewDetails')}
            >
              <span>{isExpanded ? t('subscription.hideDetails') : t('subscription.viewDetails')}</span>
              {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
          </div>
        </div>

        {/* Expandable Section: Quota Warning, Features Strip & Resource Meters */}
        {isExpanded && (
          <div className={styles.expandedContent}>
            {/* Near-Quota Warning if any quota exceeds 80% */}
            {nearQuotaMeters.length > 0 && (
              <div className={styles.quotaWarningStrip}>
                <AlertTriangle size={15} className={styles.warningIcon} />
                <span>
                  {t('subscription.highUsageNotice', {
                    percent: Math.max(...nearQuotaMeters.map((m) => m.percentage))
                  })}
                </span>
                {canManageSubscription && (
                  <button
                    type="button"
                    className={styles.warningActionBtn}
                    onClick={() => setIsModalOpen(true)}
                  >
                    {t('subscription.upgradePlan')}
                  </button>
                )}
              </div>
            )}

            {/* Plan Features Inclusions Strip */}
            <div className={styles.featuresStrip}>
              <div className={styles.featuresStripTitle}>
                <Layers size={13} />
                <span>{t('subscription.activeFeatures')}:</span>
              </div>
              <div className={styles.featuresList}>
                {featureItems.map((feat) => {
                  const Icon = feat.icon;
                  return (
                    <span
                      key={feat.key}
                      className={`${styles.featureChip} ${
                        feat.isFree
                          ? styles.chipFree
                          : feat.enabled
                          ? styles.chipActive
                          : styles.chipLocked
                      }`}
                    >
                      {feat.enabled ? <CheckCircle2 size={12} /> : <Lock size={12} />}
                      <span>{feat.label}</span>
                      {feat.isFree && <span className={styles.freeTinyBadge}>Free</span>}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Resource Meters Grid */}
            <div className={styles.metersGrid}>
              {meters.map((meter) => {
                const Icon = meter.icon;
                return (
                  <div key={meter.id} className={styles.meterCard}>
                    <div className={styles.meterHeader}>
                      <div className={styles.meterLabel}>
                        <Icon size={14} />
                        <span>{meter.label}</span>
                      </div>
                      {meter.isFreeTag ? (
                        <span className={styles.freeTag}>{t('subscription.unlimited')} (FREE)</span>
                      ) : (
                        <span className={styles.meterNumbers}>
                          <strong>{meter.current}</strong> / {meter.isUnlimited ? '∞' : meter.limit}
                          {!meter.isUnlimited && (
                            <span className={styles.meterPct}>({meter.percentage}%)</span>
                          )}
                        </span>
                      )}
                    </div>

                    {!meter.isFreeTag && (
                      <div className={styles.progressTrack}>
                        <div
                          className={`${styles.progressFill} ${getFillClass(meter.percentage)}`}
                          style={{ width: `${meter.percentage}%` }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <PlanComparisonModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentPlanCode={plan?.code || subscription?.plan}
      />
    </>
  );
};

export default SubscriptionWidget;
