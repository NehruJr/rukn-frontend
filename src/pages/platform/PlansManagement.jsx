import { useState, useEffect } from 'react';
import { usePlatformAuthStore } from '@/store/platformAuthStore';
import { platformPlanService } from '@/services/platformPlanService';
import {
  CreditCard,
  Plus,
  Check,
  X,
  Compass,
  Edit2,
  Trash2,
  AlertCircle,
  Sparkles,
  Users,
  Building,
  UserCheck,
  RefreshCw
} from 'lucide-react';
import styles from './PlansManagement.module.css';

const CURRENCY_SYMBOLS = {
  USD: '$',
  EGP: 'EGP',
  AED: 'AED',
  SAR: 'SAR'
};

const PlansManagement = () => {
  const { hasRole } = usePlatformAuthStore();
  const canManagePlans = hasRole(['owner', 'admin']);

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // View state
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [billingCycle, setBillingCycle] = useState('monthly');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');
  const [seeding, setSeeding] = useState(false);

  // Form State
  const initialForm = {
    code: '',
    nameEn: '',
    nameAr: '',
    descriptionEn: '',
    descriptionAr: '',
    monthlyUSD: 49,
    monthlyEGP: 1500,
    monthlyAED: 199,
    monthlySAR: 199,
    yearlyUSD: 490,
    yearlyEGP: 15000,
    yearlyAED: 1990,
    yearlySAR: 1990,
    users: 5,
    properties: 200,
    leads: 1000,
    aiRequestsMonthly: 500,
    aiCoPilot: true,
    advancedReports: false,
    publicShareLinks: true,
    customBranding: false,
    trialDays: 14,
    isActive: true,
    isDefault: false
  };

  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await platformPlanService.getPlans();
      setPlans(res.data || []);
    } catch (err) {
      console.error('Failed to load plans:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch subscription plans');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingPlan(null);
    setFormData(initialForm);
    setModalError('');
    setShowModal(true);
  };

  const handleOpenEdit = (plan) => {
    setEditingPlan(plan);
    setFormData({
      code: plan.code,
      nameEn: typeof plan.name === 'object' ? plan.name?.en || '' : plan.name || '',
      nameAr: typeof plan.name === 'object' ? plan.name?.ar || '' : plan.name || '',
      descriptionEn: typeof plan.description === 'object' ? plan.description?.en || '' : plan.description || '',
      descriptionAr: typeof plan.description === 'object' ? plan.description?.ar || '' : '',
      monthlyUSD: plan.pricing?.monthly?.USD || 0,
      monthlyEGP: plan.pricing?.monthly?.EGP || 0,
      monthlyAED: plan.pricing?.monthly?.AED || 0,
      monthlySAR: plan.pricing?.monthly?.SAR || 0,
      yearlyUSD: plan.pricing?.yearly?.USD || 0,
      yearlyEGP: plan.pricing?.yearly?.EGP || 0,
      yearlyAED: plan.pricing?.yearly?.AED || 0,
      yearlySAR: plan.pricing?.yearly?.SAR || 0,
      users: plan.limits?.users ?? 5,
      properties: plan.limits?.properties ?? 200,
      leads: plan.limits?.leads ?? 1000,
      aiRequestsMonthly: plan.limits?.aiRequestsMonthly ?? 500,
      aiCoPilot: Boolean(plan.features?.aiCoPilot),
      advancedReports: Boolean(plan.features?.advancedReports),
      publicShareLinks: Boolean(plan.features?.publicShareLinks),
      customBranding: Boolean(plan.features?.customBranding),
      trialDays: plan.trialDays ?? 14,
      isActive: plan.isActive !== false,
      isDefault: Boolean(plan.isDefault)
    });
    setModalError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    setModalError('');

    try {
      const payload = {
        code: formData.code.toLowerCase().trim(),
        name: {
          en: formData.nameEn.trim(),
          ar: formData.nameAr.trim() || formData.nameEn.trim()
        },
        description: {
          en: formData.descriptionEn.trim(),
          ar: formData.descriptionAr.trim()
        },
        pricing: {
          monthly: {
            USD: Number(formData.monthlyUSD),
            EGP: Number(formData.monthlyEGP),
            AED: Number(formData.monthlyAED),
            SAR: Number(formData.monthlySAR)
          },
          yearly: {
            USD: Number(formData.yearlyUSD),
            EGP: Number(formData.yearlyEGP),
            AED: Number(formData.yearlyAED),
            SAR: Number(formData.yearlySAR)
          }
        },
        limits: {
          users: Number(formData.users),
          properties: Number(formData.properties),
          leads: Number(formData.leads),
          aiRequestsMonthly: Number(formData.aiRequestsMonthly),
          virtualTours: -1 // Mandatory: Free & Unlimited
        },
        features: {
          aiCoPilot: formData.aiCoPilot,
          advancedReports: formData.advancedReports,
          publicShareLinks: formData.publicShareLinks,
          customBranding: formData.customBranding,
          virtualTours360: true // Mandatory: Free & Unlimited
        },
        trialDays: Number(formData.trialDays),
        isActive: formData.isActive,
        isDefault: formData.isDefault
      };

      if (editingPlan) {
        await platformPlanService.updatePlan(editingPlan._id || editingPlan.code, payload);
      } else {
        await platformPlanService.createPlan(payload);
      }

      setShowModal(false);
      await fetchPlans();
    } catch (err) {
      console.error('Save plan error:', err);
      setModalError(err.response?.data?.message || err.message || 'Failed to save subscription plan');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (plan) => {
    if (!window.confirm(`Are you sure you want to delete the plan "${plan.name?.en || plan.name || plan.code}"?`)) {
      return;
    }

    try {
      await platformPlanService.deletePlan(plan._id || plan.code);
      await fetchPlans();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to delete plan');
    }
  };

  const handleSeedPlans = async () => {
    if (!window.confirm('Restore / seed the standard plans (Starter, Professional, Enterprise)? Existing plans with the same code will be preserved or refreshed.')) {
      return;
    }
    try {
      setSeeding(true);
      await platformPlanService.seedStandardPlans();
      await fetchPlans();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to seed standard plans');
    } finally {
      setSeeding(false);
    }
  };

  const getPlanPrice = (plan) => {
    const cyclePrices = plan.pricing?.[billingCycle] || plan.pricing?.monthly || {};
    return cyclePrices[selectedCurrency] ?? cyclePrices.USD ?? 0;
  };

  const formatQuota = (val) => {
    if (val === -1 || val === '-1') return 'Unlimited';
    return Number(val).toLocaleString();
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.titleWrapper}>
          <CreditCard className={styles.titleIcon} size={28} />
          <div>
            <h1 className={styles.title}>Subscription Plans & Pricing</h1>
            <p className={styles.subtitle}>
              Manage platform tiers, regional pricing, resource quotas, and feature flags
            </p>
          </div>
        </div>

        <div className={styles.headerActions}>
          {/* Currency Toggle */}
          <div className={styles.toggleGroup}>
            {['USD', 'EGP', 'AED', 'SAR'].map((cur) => (
              <button
                key={cur}
                type="button"
                className={`${styles.toggleBtn} ${selectedCurrency === cur ? styles.active : ''}`}
                onClick={() => setSelectedCurrency(cur)}
              >
                {cur}
              </button>
            ))}
          </div>

          {/* Billing Cycle Toggle */}
          <div className={styles.toggleGroup}>
            <button
              type="button"
              className={`${styles.toggleBtn} ${billingCycle === 'monthly' ? styles.active : ''}`}
              onClick={() => setBillingCycle('monthly')}
            >
              Monthly
            </button>
            <button
              type="button"
              className={`${styles.toggleBtn} ${billingCycle === 'yearly' ? styles.active : ''}`}
              onClick={() => setBillingCycle('yearly')}
            >
              Yearly
            </button>
          </div>

          {canManagePlans && (
            <>
              <button
                type="button"
                className={styles.seedBtn}
                onClick={handleSeedPlans}
                disabled={seeding}
                title="Restore default Starter, Professional, and Enterprise plans"
              >
                <RefreshCw size={15} className={seeding ? 'animate-spin' : ''} />
                {seeding ? 'Restoring...' : 'Restore Standard Plans'}
              </button>

              <button type="button" className={styles.addBtn} onClick={handleOpenCreate}>
                <Plus size={16} />
                Create Custom Plan
              </button>
            </>
          )}
        </div>
      </div>

      {/* Free 360 Tours Mandate Banner */}
      <div className={styles.toursNoticeBanner}>
        <Compass size={20} />
        <div>
          <strong>Platform Policy Guarantee:</strong> 360° Virtual Tours are 100% Free and Unlimited across all plan tiers with zero quota restrictions.
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className={styles.errorBanner}>
          <AlertCircle size={18} style={{ display: 'inline', marginRight: '0.5rem' }} />
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#8a9195' }}>
          Loading subscription plans...
        </div>
      ) : (
        /* Plans Grid */
        <div className={styles.plansGrid}>
          {plans.map((plan) => {
            const planName = typeof plan.name === 'object' ? plan.name?.en : plan.name;
            const price = getPlanPrice(plan);

            return (
              <div
                key={plan._id || plan.code}
                className={`${styles.planCard} ${plan.isDefault ? styles.defaultPlan : ''}`}
              >
                {/* Card Header */}
                <div className={styles.cardHeader}>
                  <div>
                    <h3 className={styles.planName}>{planName}</h3>
                    <div className={styles.planCode}>{plan.code}</div>
                  </div>
                  <div className={styles.badgeStack}>
                    {plan.isDefault && <span className={`${styles.badge} ${styles.badgeDefault}`}>Default</span>}
                    {plan.isActive ? (
                      <span className={`${styles.badge} ${styles.badgeActive}`}>Active</span>
                    ) : (
                      <span className={`${styles.badge} ${styles.badgeInactive}`}>Inactive</span>
                    )}
                  </div>
                </div>

                {/* Price Display */}
                <div className={styles.priceSection}>
                  <span className={styles.priceAmount}>
                    {CURRENCY_SYMBOLS[selectedCurrency]} {price.toLocaleString()}
                  </span>
                  <span className={styles.pricePeriod}>
                    / {billingCycle === 'yearly' ? 'year' : 'month'}
                  </span>
                </div>

                {/* Resource Limits */}
                <div>
                  <div className={styles.sectionTitle}>Resource Quotas</div>
                  <div className={styles.quotaList}>
                    <div className={styles.quotaItem}>
                      <span>Staff Users</span>
                      <span className={styles.quotaValue}>{formatQuota(plan.limits?.users)}</span>
                    </div>
                    <div className={styles.quotaItem}>
                      <span>Properties</span>
                      <span className={styles.quotaValue}>{formatQuota(plan.limits?.properties)}</span>
                    </div>
                    <div className={styles.quotaItem}>
                      <span>Leads</span>
                      <span className={styles.quotaValue}>{formatQuota(plan.limits?.leads)}</span>
                    </div>
                    <div className={styles.quotaItem}>
                      <span>AI Requests / mo</span>
                      <span className={styles.quotaValue}>{formatQuota(plan.limits?.aiRequestsMonthly)}</span>
                    </div>
                    <div className={styles.quotaItem}>
                      <span>360° Virtual Tours</span>
                      <span className={styles.quotaTourFree}>
                        <Check size={12} /> Unlimited (Free)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div>
                  <div className={styles.sectionTitle}>Features Included</div>
                  <div className={styles.featureList}>
                    <div className={`${styles.featureItem} ${plan.features?.aiCoPilot ? styles.enabled : ''}`}>
                      {plan.features?.aiCoPilot ? <Check size={14} color="#34d399" /> : <X size={14} />}
                      AI Co-Pilot & Descriptions
                    </div>
                    <div className={`${styles.featureItem} ${plan.features?.advancedReports ? styles.enabled : ''}`}>
                      {plan.features?.advancedReports ? <Check size={14} color="#34d399" /> : <X size={14} />}
                      Advanced Reporting & Exports
                    </div>
                    <div className={`${styles.featureItem} ${plan.features?.publicShareLinks ? styles.enabled : ''}`}>
                      {plan.features?.publicShareLinks ? <Check size={14} color="#34d399" /> : <X size={14} />}
                      Public Shareable Links
                    </div>
                    <div className={`${styles.featureItem} ${plan.features?.customBranding ? styles.enabled : ''}`}>
                      {plan.features?.customBranding ? <Check size={14} color="#34d399" /> : <X size={14} />}
                      Custom Agency Branding
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className={styles.cardFooter}>
                  <div className={styles.orgCountBadge}>
                    {plan.activeOrgsCount || 0} organizations
                  </div>
                  {canManagePlans && (
                    <div className={styles.cardActions}>
                      <button
                        type="button"
                        className={styles.actionBtn}
                        onClick={() => handleOpenEdit(plan)}
                      >
                        <Edit2 size={13} /> Edit
                      </button>
                      <button
                        type="button"
                        className={`${styles.actionBtn} ${styles.danger}`}
                        onClick={() => handleDelete(plan)}
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Plan Modal */}
      {showModal && (
        <div className={styles.modalBackdrop} onClick={() => setShowModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {editingPlan ? `Edit Plan: ${formData.code}` : 'Create Custom Subscription Plan'}
              </h2>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setShowModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            {modalError && (
              <div className={styles.errorBanner}>{modalError}</div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Plan Code (Unique Identifier) *</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingPlan}
                    className={styles.input}
                    value={formData.code}
                    placeholder="e.g. enterprise_plus"
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Trial Days</label>
                  <input
                    type="number"
                    min="0"
                    className={styles.input}
                    value={formData.trialDays}
                    onChange={(e) => setFormData({ ...formData, trialDays: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Plan Name (English) *</label>
                  <input
                    type="text"
                    required
                    className={styles.input}
                    value={formData.nameEn}
                    placeholder="e.g. Enterprise Plus"
                    onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Plan Name (Arabic)</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={formData.nameAr}
                    placeholder="مثال: المؤسسات بلس"
                    dir="rtl"
                    onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                  />
                </div>

                {/* Monthly Pricing */}
                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label className={styles.label} style={{ color: '#d97448', fontWeight: 700 }}>
                    Monthly Pricing (USD / EGP / AED / SAR)
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                    <input
                      type="number"
                      min="0"
                      className={styles.input}
                      placeholder="USD"
                      value={formData.monthlyUSD}
                      onChange={(e) => setFormData({ ...formData, monthlyUSD: e.target.value })}
                    />
                    <input
                      type="number"
                      min="0"
                      className={styles.input}
                      placeholder="EGP"
                      value={formData.monthlyEGP}
                      onChange={(e) => setFormData({ ...formData, monthlyEGP: e.target.value })}
                    />
                    <input
                      type="number"
                      min="0"
                      className={styles.input}
                      placeholder="AED"
                      value={formData.monthlyAED}
                      onChange={(e) => setFormData({ ...formData, monthlyAED: e.target.value })}
                    />
                    <input
                      type="number"
                      min="0"
                      className={styles.input}
                      placeholder="SAR"
                      value={formData.monthlySAR}
                      onChange={(e) => setFormData({ ...formData, monthlySAR: e.target.value })}
                    />
                  </div>
                </div>

                {/* Annual Pricing */}
                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label className={styles.label} style={{ color: '#d97448', fontWeight: 700 }}>
                    Yearly Pricing (USD / EGP / AED / SAR)
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                    <input
                      type="number"
                      min="0"
                      className={styles.input}
                      placeholder="USD"
                      value={formData.yearlyUSD}
                      onChange={(e) => setFormData({ ...formData, yearlyUSD: e.target.value })}
                    />
                    <input
                      type="number"
                      min="0"
                      className={styles.input}
                      placeholder="EGP"
                      value={formData.yearlyEGP}
                      onChange={(e) => setFormData({ ...formData, yearlyEGP: e.target.value })}
                    />
                    <input
                      type="number"
                      min="0"
                      className={styles.input}
                      placeholder="AED"
                      value={formData.yearlyAED}
                      onChange={(e) => setFormData({ ...formData, yearlyAED: e.target.value })}
                    />
                    <input
                      type="number"
                      min="0"
                      className={styles.input}
                      placeholder="SAR"
                      value={formData.yearlySAR}
                      onChange={(e) => setFormData({ ...formData, yearlySAR: e.target.value })}
                    />
                  </div>
                </div>

                {/* Resource Limits */}
                <div className={styles.formGroup}>
                  <label className={styles.label}>Staff Users Limit (-1 = unlimited)</label>
                  <input
                    type="number"
                    className={styles.input}
                    value={formData.users}
                    onChange={(e) => setFormData({ ...formData, users: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Properties Limit (-1 = unlimited)</label>
                  <input
                    type="number"
                    className={styles.input}
                    value={formData.properties}
                    onChange={(e) => setFormData({ ...formData, properties: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Leads Limit (-1 = unlimited)</label>
                  <input
                    type="number"
                    className={styles.input}
                    value={formData.leads}
                    onChange={(e) => setFormData({ ...formData, leads: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>AI Requests / mo (-1 = unlimited)</label>
                  <input
                    type="number"
                    className={styles.input}
                    value={formData.aiRequestsMonthly}
                    onChange={(e) => setFormData({ ...formData, aiRequestsMonthly: e.target.value })}
                  />
                </div>

                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <div style={{
                    padding: '0.75rem',
                    background: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    borderRadius: '6px',
                    fontSize: '0.8125rem',
                    color: '#34d399'
                  }}>
                    ✓ 360° Virtual Tours are locked as Free & Unlimited (-1) across all plans.
                  </div>
                </div>

                {/* Feature Toggles */}
                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label className={styles.label}>Features Enabled</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginTop: '0.25rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#c5cacd', fontSize: '0.875rem' }}>
                      <input
                        type="checkbox"
                        checked={formData.aiCoPilot}
                        onChange={(e) => setFormData({ ...formData, aiCoPilot: e.target.checked })}
                      />
                      AI Co-Pilot Assistant
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#c5cacd', fontSize: '0.875rem' }}>
                      <input
                        type="checkbox"
                        checked={formData.advancedReports}
                        onChange={(e) => setFormData({ ...formData, advancedReports: e.target.checked })}
                      />
                      Advanced Reports & Analytics
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#c5cacd', fontSize: '0.875rem' }}>
                      <input
                        type="checkbox"
                        checked={formData.publicShareLinks}
                        onChange={(e) => setFormData({ ...formData, publicShareLinks: e.target.checked })}
                      />
                      Public Shareable Links
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#c5cacd', fontSize: '0.875rem' }}>
                      <input
                        type="checkbox"
                        checked={formData.customBranding}
                        onChange={(e) => setFormData({ ...formData, customBranding: e.target.checked })}
                      />
                      Custom Agency Branding
                    </label>
                  </div>
                </div>

                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#c5cacd', fontSize: '0.875rem' }}>
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    />
                    Plan is Active and available for subscription
                  </label>
                </div>
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className={styles.submitBtn}
                >
                  {formSubmitting ? 'Saving...' : editingPlan ? 'Save Changes' : 'Create Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlansManagement;
