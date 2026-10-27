import { useState } from 'react';
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
  AlertTriangle
} from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { getMySubscription } from '@/services/subscriptionService';
import PlanComparisonModal from './PlanComparisonModal';
import styles from './SubscriptionWidget.module.css';

const SubscriptionWidget = () => {
  const { t, language } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: subResponse, isLoading } = useQuery({
    queryKey: ['mySubscription'],
    queryFn: getMySubscription,
    staleTime: 60 * 1000
  });

  if (isLoading || !subResponse?.data) {
    return null; // Silent while loading
  }

  const { subscription, plan, usage, state } = subResponse.data;

  const getPlanDisplayName = () => {
    if (plan?.name) {
      if (typeof plan.name === 'object') {
        return (language === 'ar' ? plan.name.ar : plan.name.en) || plan.name.en;
      }
      return plan.name;
    }
    return subscription?.plan || 'Standard';
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
    return '';
  };

  const getFillClass = (percentage) => {
    if (percentage >= 90) return styles.fillDanger;
    if (percentage >= 75) return styles.fillWarning;
    return styles.fillNormal;
  };

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

  return (
    <>
      <div className={styles.widget}>
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
              </div>
              {state?.daysRemaining !== null && (
                <span className={`${styles.daysPill} ${getDaysClass()}`}>
                  {state.daysRemaining > 0
                    ? `${state.daysRemaining} ${t('subscription.daysRemainingSuffix')}`
                    : t('subscription.expiredBanner')}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            className={styles.upgradeBtn}
            onClick={() => setIsModalOpen(true)}
          >
            <span>{t('subscription.upgradePlan')}</span>
            <ArrowUpRight size={16} />
          </button>
        </div>

        {/* Resource Meters */}
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
                      {meter.current} / {meter.isUnlimited ? '∞' : meter.limit}
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

      <PlanComparisonModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentPlanCode={plan?.code || subscription?.plan}
      />
    </>
  );
};

export default SubscriptionWidget;
