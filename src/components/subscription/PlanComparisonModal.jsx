import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Check,
  X,
  Sparkles,
  Compass,
  ArrowRight,
  ShieldCheck,
  Send,
  Loader2
} from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { useLanguage } from '@/hooks/useLanguage';
import { useUIStore } from '@/store/uiStore';
import { getAvailablePlans, requestPlanChange } from '@/services/subscriptionService';
import styles from './PlanComparisonModal.module.css';

const DEFAULT_PLANS = [
  {
    code: 'starter',
    name: { en: 'Starter', ar: 'البداية' },
    description: {
      en: 'Essential CRM tools for emerging brokerages and independent realtors.',
      ar: 'أدوات إدارة العقارات والعملاء الأساسية للمكاتب الناشئة والوسطاء المستقلين.'
    },
    pricing: {
      monthly: { USD: 49, EGP: 1500, AED: 199, SAR: 199 },
      yearly: { USD: 490, EGP: 15000, AED: 1990, SAR: 1990 }
    },
    limits: {
      users: 5,
      properties: 200,
      leads: 1000,
      aiRequestsMonthly: 500,
      virtualTours: -1
    },
    features: {
      aiCoPilot: true,
      advancedReports: false,
      publicShareLinks: true,
      customBranding: false,
      virtualTours360: true
    }
  },
  {
    code: 'professional',
    name: { en: 'Professional', ar: 'الاحترافية' },
    description: {
      en: 'Full power for growing real estate agencies with multi-branch management.',
      ar: 'القوة الكاملة للوكالات العقارية النامية مع إدارة الفروع المتعددة والتقارير المتقدمة.'
    },
    pricing: {
      monthly: { USD: 129, EGP: 3900, AED: 499, SAR: 499 },
      yearly: { USD: 1290, EGP: 39000, AED: 4990, SAR: 4990 }
    },
    limits: {
      users: 15,
      properties: 1000,
      leads: 5000,
      aiRequestsMonthly: 2000,
      virtualTours: -1
    },
    features: {
      aiCoPilot: true,
      advancedReports: true,
      publicShareLinks: true,
      customBranding: false,
      virtualTours360: true
    }
  },
  {
    code: 'enterprise',
    name: { en: 'Enterprise', ar: 'المؤسسات' },
    description: {
      en: 'Unlimited scale, custom agency branding, dedicated SLAs, and custom colors.',
      ar: 'توسع غير محدود، تخصيص كامل للعلامة التجارية والألوان، ودعم مخصص للشركات الكبرى.'
    },
    pricing: {
      monthly: { USD: 299, EGP: 9500, AED: 1199, SAR: 1199 },
      yearly: { USD: 2990, EGP: 95000, AED: 11990, SAR: 11990 }
    },
    limits: {
      users: -1,
      properties: -1,
      leads: -1,
      aiRequestsMonthly: 10000,
      virtualTours: -1
    },
    features: {
      aiCoPilot: true,
      advancedReports: true,
      publicShareLinks: true,
      customBranding: true,
      virtualTours360: true
    }
  }
];

const PlanComparisonModal = ({
  isOpen,
  onClose,
  currentPlanCode = 'starter',
  defaultCurrency = 'USD'
}) => {
  const { t, isRTL, language } = useLanguage();
  const addToast = useUIStore((s) => s.addToast);
  const queryClient = useQueryClient();

  const [billingCycle, setBillingCycle] = useState('monthly');
  const [currency, setCurrency] = useState(defaultCurrency || 'USD');
  const [selectedPlanForUpgrade, setSelectedPlanForUpgrade] = useState(null);
  const [notes, setNotes] = useState('');

  const { data: plansResponse, isLoading } = useQuery({
    queryKey: ['availablePlans'],
    queryFn: getAvailablePlans,
    enabled: isOpen,
    staleTime: 5 * 60 * 1000
  });

  const plans = (plansResponse?.data && plansResponse.data.length > 0)
    ? plansResponse.data
    : DEFAULT_PLANS;

  const upgradeMutation = useMutation({
    mutationFn: requestPlanChange,
    onSuccess: () => {
      addToast({
        type: 'success',
        message: t('subscription.requestUpgradeSuccess')
      });
      setSelectedPlanForUpgrade(null);
      setNotes('');
      queryClient.invalidateQueries(['mySubscription']);
      onClose();
    },
    onError: (err) => {
      addToast({
        type: 'error',
        message: err.response?.data?.message || t('subscription.requestUpgradeError')
      });
    }
  });

  const handleStartUpgrade = (plan) => {
    setSelectedPlanForUpgrade(plan);
  };

  const handleConfirmUpgrade = (e) => {
    e.preventDefault();
    if (!selectedPlanForUpgrade) return;
    upgradeMutation.mutate({
      targetPlanCode: selectedPlanForUpgrade.code,
      billingCycle,
      notes
    });
  };

  const getPlanName = (plan) => {
    if (typeof plan.name === 'object') {
      return (language === 'ar' ? plan.name.ar : plan.name.en) || plan.name.en || plan.code;
    }
    return plan.name || plan.code;
  };

  const getPlanDesc = (plan) => {
    if (typeof plan.description === 'object') {
      return (language === 'ar' ? plan.description.ar : plan.description.en) || plan.description.en || '';
    }
    return plan.description || '';
  };

  const formatQuota = (val) => {
    if (val === -1 || val === '-1') return t('subscription.unlimited');
    return Number(val).toLocaleString();
  };

  const getPrice = (plan) => {
    const cyclePrices = plan.pricing?.[billingCycle] || plan.pricing?.monthly || {};
    return cyclePrices[currency] ?? cyclePrices.USD ?? 0;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('subscription.upgradePlan')}
      size="xl"
    >
      <div className={styles.container}>
        {/* Top Controls: Currency & Billing Cycle */}
        <div className={styles.topControls}>
          <div className={styles.toggles}>
            <div className={styles.cycleToggle}>
              <button
                type="button"
                className={`${styles.cycleBtn} ${billingCycle === 'monthly' ? styles.active : ''}`}
                onClick={() => setBillingCycle('monthly')}
              >
                {t('subscription.monthly')}
              </button>
              <button
                type="button"
                className={`${styles.cycleBtn} ${billingCycle === 'yearly' ? styles.active : ''}`}
                onClick={() => setBillingCycle('yearly')}
              >
                {t('subscription.yearly')}
                <span className={styles.discountBadge}>-20%</span>
              </button>
            </div>

            <div className={styles.currencySelect}>
              {['USD', 'EGP', 'AED', 'SAR'].map((curr) => (
                <button
                  key={curr}
                  type="button"
                  className={`${styles.currBtn} ${currency === curr ? styles.active : ''}`}
                  onClick={() => setCurrency(curr)}
                >
                  {curr}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.toursBanner}>
            <Compass size={18} />
            <span>
              <strong>360° Virtual Tours:</strong> {t('subscription.free360Banner')}
            </span>
          </div>
        </div>

        {/* Plans Grid */}
        <div className={styles.plansGrid}>
          {plans.map((plan) => {
            const isCurrent = plan.code.toLowerCase() === (currentPlanCode || '').toLowerCase();
            const isPopular = plan.code.toLowerCase() === 'professional';
            const price = getPrice(plan);

            return (
              <div
                key={plan.code}
                className={`${styles.planCard} ${isPopular ? styles.popular : ''}`}
              >
                {isPopular && (
                  <div className={styles.popularBadge}>
                    <Sparkles size={13} />
                    {t('subscription.mostPopular')}
                  </div>
                )}

                {isCurrent && (
                  <div className={styles.currentBadge}>
                    {t('subscription.currentPlanBadge')}
                  </div>
                )}

                <div className={styles.planHeader}>
                  <h4 className={styles.planName}>{getPlanName(plan)}</h4>
                  <p className={styles.planDesc}>{getPlanDesc(plan)}</p>
                </div>

                <div className={styles.priceWrapper}>
                  <span className={styles.priceAmount}>{price.toLocaleString()}</span>
                  <span className={styles.priceCurrency}>{currency}</span>
                  <span className={styles.pricePeriod}>
                    {billingCycle === 'monthly' ? t('subscription.perMonth') : t('subscription.perYear')}
                  </span>
                </div>

                <ul className={styles.featuresList}>
                  <li className={styles.featureItem}>
                    <Check size={16} className={`${styles.featureIcon} ${styles.featureIconCheck}`} />
                    <span>
                      <strong>{formatQuota(plan.limits?.users)}</strong> {t('subscription.usersQuota')}
                    </span>
                  </li>

                  <li className={styles.featureItem}>
                    <Check size={16} className={`${styles.featureIcon} ${styles.featureIconCheck}`} />
                    <span>
                      <strong>{formatQuota(plan.limits?.properties)}</strong> {t('subscription.propertiesQuota')}
                    </span>
                  </li>

                  <li className={styles.featureItem}>
                    <Check size={16} className={`${styles.featureIcon} ${styles.featureIconCheck}`} />
                    <span>
                      <strong>{formatQuota(plan.limits?.leads)}</strong> {t('subscription.leadsQuota')}
                    </span>
                  </li>

                  <li className={styles.featureItem}>
                    <Check size={16} className={`${styles.featureIcon} ${styles.featureIconCheck}`} />
                    <span>
                      <strong>{formatQuota(plan.limits?.aiRequestsMonthly)}</strong> {t('subscription.aiQuota')}
                    </span>
                  </li>

                  {/* 360 Tours: Free & Unlimited highlight */}
                  <li className={styles.featureItem}>
                    <Compass size={16} className={`${styles.featureIcon} ${styles.featureHighlight}`} />
                    <span className={styles.featureHighlight}>
                      <strong>{t('subscription.freeAndUnlimited')}</strong> {t('subscription.virtualToursQuota')}
                    </span>
                  </li>

                  {/* AI Assistant */}
                  <li className={styles.featureItem}>
                    {plan.features?.aiCoPilot ? (
                      <Check size={16} className={`${styles.featureIcon} ${styles.featureIconCheck}`} />
                    ) : (
                      <X size={16} className={`${styles.featureIcon} ${styles.featureIconCross}`} />
                    )}
                    <span>{t('subscription.aiCoPilot')}</span>
                  </li>

                  {/* Advanced Analytics */}
                  <li className={`${styles.featureItem} ${!plan.features?.advancedReports ? styles.disabled : ''}`}>
                    {plan.features?.advancedReports ? (
                      <Check size={16} className={`${styles.featureIcon} ${styles.featureIconCheck}`} />
                    ) : (
                      <X size={16} className={`${styles.featureIcon} ${styles.featureIconCross}`} />
                    )}
                    <span>{t('subscription.advancedReports')}</span>
                  </li>

                  {/* Custom Branding & Whitelabel Colors */}
                  <li className={`${styles.featureItem} ${!plan.features?.customBranding ? styles.disabled : styles.brandingHighlight}`}>
                    {plan.features?.customBranding ? (
                      <Sparkles size={16} className={`${styles.featureIcon} ${styles.featureHighlight}`} />
                    ) : (
                      <X size={16} className={`${styles.featureIcon} ${styles.featureIconCross}`} />
                    )}
                    <span>
                      <strong>{t('subscription.customBranding')}</strong>
                    </span>
                  </li>
                </ul>

                <div className={styles.planAction}>
                  {isCurrent ? (
                    <button type="button" className={`${styles.planBtn} ${styles.planBtnCurrent}`} disabled>
                      <ShieldCheck size={16} />
                      {t('subscription.currentPlanBadge')}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={`${styles.planBtn} ${isPopular ? styles.planBtnPrimary : styles.planBtnOutline}`}
                      onClick={() => handleStartUpgrade(plan)}
                    >
                      {t('subscription.requestUpgrade')}
                      <ArrowRight size={16} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Confirmation Sheet for upgrade request */}
        {selectedPlanForUpgrade && (
          <form onSubmit={handleConfirmUpgrade} className={styles.confirmSheet}>
            <div className={styles.confirmTitle}>
              {t('subscription.confirmUpgradeTitle')}
            </div>
            <div className={styles.confirmDesc}>
              {t('subscription.confirmUpgradeDesc', {
                planName: getPlanName(selectedPlanForUpgrade),
                billingCycle: billingCycle === 'monthly' ? t('subscription.monthly') : t('subscription.yearly')
              })}
            </div>

            <textarea
              className={styles.confirmTextarea}
              rows={2}
              placeholder={t('subscription.notesPlaceholder')}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />

            <div className={styles.confirmActions}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedPlanForUpgrade(null)}
                disabled={upgradeMutation.isPending}
              >
                {t('subscription.cancel')}
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                leftIcon={upgradeMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                disabled={upgradeMutation.isPending}
              >
                {upgradeMutation.isPending ? t('subscription.submitting') : t('subscription.confirm')}
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};

export default PlanComparisonModal;
