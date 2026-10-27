import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePlatformAuthStore } from '@/store/platformAuthStore';
import { platformOrgService } from '@/services/platformOrgService';
import { platformPlanService } from '@/services/platformPlanService';
import {
  ArrowLeft,
  Building2,
  KeyRound,
  ShieldAlert,
  ShieldCheck,
  FileText,
  CreditCard,
  Users,
  Compass,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  X,
  Sparkles,
  Calendar
} from 'lucide-react';
import styles from './OrganizationDetail.module.css';

const OrganizationDetail = () => {
  const { id } = useParams();
  const { hasRole } = usePlatformAuthStore();
  const canManage = hasRole(['owner', 'admin']);

  const [org, setOrg] = useState(null);
  const [plans, setPlans] = useState([]);
  const [payments, setPayments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState('overview');

  // Modals
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [planForm, setPlanForm] = useState({ planCode: '', extendMonths: 1, billingCycle: 'monthly' });

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: 1500,
    currency: 'EGP',
    paymentMethod: 'bank_transfer',
    invoiceReference: '',
    notes: '',
    autoExtendMonths: 1
  });

  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  useEffect(() => {
    fetchOrgData();
  }, [id]);

  const fetchOrgData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [orgRes, plansRes, paymentsRes, usersRes] = await Promise.all([
        platformOrgService.getOrganization(id),
        platformPlanService.getPlans(),
        platformOrgService.getPayments(id).catch(() => ({ data: [] })),
        platformOrgService.getUsers(id).catch(() => ({ data: [] }))
      ]);

      const rawData = orgRes.data || {};
      const orgDoc = rawData.organization || rawData;
      const combinedOrg = {
        ...orgDoc,
        plan: rawData.plan || orgDoc.plan,
        usage: rawData.usage || orgDoc.usage,
        limits: rawData.limits || orgDoc.limits,
        settings: rawData.settings || orgDoc.settings
      };

      setOrg(combinedOrg);
      setPlans(plansRes.data || []);
      setPayments(paymentsRes.data || []);
      setUsers(usersRes.data || []);

      const activePlanCode = combinedOrg.subscription?.plan || combinedOrg.plan?.code || 'starter';
      const activeCycle = combinedOrg.subscription?.billingCycle || 'monthly';
      setPlanForm({
        planCode: activePlanCode,
        extendMonths: 1,
        billingCycle: activeCycle
      });
    } catch (err) {
      console.error('Failed to load agency details:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load organization details');
    } finally {
      setLoading(false);
    }
  };

  const handlePlanSubmit = async (e) => {
    e.preventDefault();
    setModalSubmitting(true);
    setModalError('');

    try {
      await platformOrgService.assignPlan(id, planForm);
      setShowPlanModal(false);
      await fetchOrgData();
    } catch (err) {
      setModalError(err.response?.data?.message || err.message || 'Failed to update plan');
    } finally {
      setModalSubmitting(false);
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setModalSubmitting(true);
    setModalError('');

    try {
      await platformOrgService.recordPayment(id, {
        amount: Number(paymentForm.amount),
        currency: paymentForm.currency,
        paymentMethod: paymentForm.paymentMethod,
        invoiceReference: paymentForm.invoiceReference,
        notes: paymentForm.notes,
        autoExtendMonths: Number(paymentForm.autoExtendMonths)
      });
      setShowPaymentModal(false);
      await fetchOrgData();
    } catch (err) {
      setModalError(err.response?.data?.message || err.message || 'Failed to record payment');
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleToggleUserStatus = async (user) => {
    try {
      await platformOrgService.toggleUserStatus(id, user._id, { isActive: !user.isActive });
      await fetchOrgData();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to toggle user status');
    }
  };

  const handleImpersonate = async () => {
    if (!window.confirm(`Launch administrative impersonation for "${org.name}"?`)) return;
    try {
      const res = await platformOrgService.impersonate(id);
      if (res.data?.token) {
        sessionStorage.setItem('token', res.data.token);
        sessionStorage.setItem('impersonatedOrgId', org._id);
        window.open('/', '_blank');
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to impersonate');
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: '#8a9195' }}>
        Loading organization details...
      </div>
    );
  }

  if (error || !org) {
    return (
      <div className={styles.container}>
        <Link to="/platform/organizations" className={styles.backLink}>
          <ArrowLeft size={16} /> Back to Organizations
        </Link>
        <div className={styles.errorBanner}>{error || 'Organization not found'}</div>
      </div>
    );
  }

  const sub = org.subscription || {};
  const limits = sub.limits || org.limits || org.plan?.limits || {};
  const usage = org.usage || {};

  const calculatePct = (used = 0, max = 100) => {
    if (max === -1) return 100;
    if (max <= 0) return 0;
    return Math.min(100, Math.round((used / max) * 100));
  };

  return (
    <div className={styles.container}>
      {/* Back Link */}
      <Link to="/platform/organizations" className={styles.backLink}>
        <ArrowLeft size={16} /> Back to Organizations
      </Link>

      {/* Banner */}
      <div className={styles.banner}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h1 className={styles.bannerTitle}>{org.name}</h1>
            {org.isActive ? (
              <span className={`${styles.badge} ${styles.badgeActive}`}>Active</span>
            ) : (
              <span className={`${styles.badge} ${styles.badgeSuspended}`}>Suspended</span>
            )}
          </div>
          <div className={styles.bannerMeta}>
            <span>Slug: <strong>/{org.slug}</strong></span>
            <span>Country: <strong>{org.country}</strong></span>
            <span>Plan: <strong style={{ textTransform: 'capitalize' }}>{sub.plan || 'starter'}</strong></span>
            <span>Cycle: <strong>{sub.billingCycle || 'monthly'}</strong></span>
          </div>
        </div>

        {canManage && (
          <div className={styles.bannerActions}>
            <button
              type="button"
              className={styles.btnAction}
              onClick={handleImpersonate}
            >
              <KeyRound size={14} /> Impersonate Agency
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className={styles.tabsBar}>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'overview' ? styles.active : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview & Quota Usage
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'subscription' ? styles.active : ''}`}
          onClick={() => setActiveTab('subscription')}
        >
          Subscription & Plan
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'payments' ? styles.active : ''}`}
          onClick={() => setActiveTab('payments')}
        >
          Payments Ledger ({payments.length})
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'users' ? styles.active : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Agency Users ({users.length})
        </button>
      </div>

      {/* Tab 1: Overview & Quota Usage */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Subscription & Plan Status Highlight Card */}
          <div className={styles.card} style={{ borderLeft: '4px solid #d97448' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: 'rgba(217, 116, 72, 0.15)',
                  color: '#d97448',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <CreditCard size={22} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0, color: '#f7f8f8', fontSize: '1.15rem', textTransform: 'capitalize' }}>
                      {org.plan?.name?.en || org.plan?.name || sub.plan || 'Professional'} Plan
                    </h3>
                    <span className={`${styles.badge} ${sub.status === 'expired' ? styles.badgeSuspended : styles.badgeActive}`}>
                      {sub.status || 'Active'}
                    </span>
                    <span style={{
                      fontSize: '0.75rem',
                      background: '#1d2326',
                      border: '1px solid #2c3438',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '4px',
                      color: '#8a9195',
                      textTransform: 'capitalize'
                    }}>
                      {sub.billingCycle || 'monthly'} billing
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#8a9195', marginTop: '0.25rem' }}>
                    {sub.endDate
                      ? `Renewal Date: ${new Date(sub.endDate).toLocaleDateString()} (${Math.ceil((new Date(sub.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days left)`
                      : 'No fixed expiry date'}
                  </div>
                </div>
              </div>

              {canManage && (
                <button
                  type="button"
                  className={styles.btnAction}
                  onClick={() => {
                    setModalError('');
                    setShowPlanModal(true);
                  }}
                >
                  <CreditCard size={14} /> Change Plan / Extend
                </button>
              )}
            </div>

            {/* Plan Feature Inclusions */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              flexWrap: 'wrap',
              paddingTop: '0.85rem',
              borderTop: '1px solid #2c3438',
              fontSize: '0.78rem'
            }}>
              <span style={{ color: '#8a9195', fontWeight: 600 }}>Plan Inclusions:</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: org.plan?.features?.aiCoPilot ? '#34d399' : '#8a9195' }}>
                <Sparkles size={12} /> AI CoPilot ({org.plan?.features?.aiCoPilot ? 'Active' : 'Locked'})
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: '#34d399' }}>
                <Compass size={12} /> 360° Virtual Tours (Unlimited Free)
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: org.plan?.features?.customBranding ? '#34d399' : '#8a9195' }}>
                <ShieldCheck size={12} /> Custom Branding ({org.plan?.features?.customBranding ? 'Active' : 'Locked'})
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: org.plan?.features?.advancedReports ? '#34d399' : '#8a9195' }}>
                <FileText size={12} /> Advanced Reports ({org.plan?.features?.advancedReports ? 'Active' : 'Locked'})
              </span>
            </div>
          </div>

          <div className={styles.quotaGrid}>
          {/* Users */}
          <div className={styles.quotaCard}>
            <div className={styles.quotaHeader}>
              <span className={styles.quotaTitle}>Staff Users</span>
              <Users size={18} color="#d97448" />
            </div>
            <div className={styles.quotaNums}>
              {usage.users ?? users.length} / {limits.users === -1 ? '∞' : limits.users ?? 5}
            </div>
            <div className={styles.progressBarTrack}>
              <div
                className={`${styles.progressBarFill} ${limits.users === -1 ? styles.unlimited : ''}`}
                style={{ width: `${calculatePct(usage.users ?? users.length, limits.users ?? 5)}%` }}
              />
            </div>
          </div>

          {/* Properties */}
          <div className={styles.quotaCard}>
            <div className={styles.quotaHeader}>
              <span className={styles.quotaTitle}>Active Properties</span>
              <Building2 size={18} color="#d97448" />
            </div>
            <div className={styles.quotaNums}>
              {usage.properties ?? 0} / {limits.properties === -1 ? '∞' : limits.properties ?? 200}
            </div>
            <div className={styles.progressBarTrack}>
              <div
                className={`${styles.progressBarFill} ${limits.properties === -1 ? styles.unlimited : ''}`}
                style={{ width: `${calculatePct(usage.properties ?? 0, limits.properties ?? 200)}%` }}
              />
            </div>
          </div>

          {/* Leads */}
          <div className={styles.quotaCard}>
            <div className={styles.quotaHeader}>
              <span className={styles.quotaTitle}>Total Leads</span>
              <Users size={18} color="#d97448" />
            </div>
            <div className={styles.quotaNums}>
              {usage.leads ?? 0} / {limits.leads === -1 ? '∞' : limits.leads ?? 1000}
            </div>
            <div className={styles.progressBarTrack}>
              <div
                className={`${styles.progressBarFill} ${limits.leads === -1 ? styles.unlimited : ''}`}
                style={{ width: `${calculatePct(usage.leads ?? 0, limits.leads ?? 1000)}%` }}
              />
            </div>
          </div>

          {/* AI Requests */}
          <div className={styles.quotaCard}>
            <div className={styles.quotaHeader}>
              <span className={styles.quotaTitle}>AI Requests This Month</span>
              <Sparkles size={18} color="#d97448" />
            </div>
            <div className={styles.quotaNums}>
              {usage.aiRequests ?? 0} / {limits.aiRequestsMonthly === -1 ? '∞' : limits.aiRequestsMonthly ?? 500}
            </div>
            <div className={styles.progressBarTrack}>
              <div
                className={`${styles.progressBarFill} ${limits.aiRequestsMonthly === -1 ? styles.unlimited : ''}`}
                style={{ width: `${calculatePct(usage.aiRequests ?? 0, limits.aiRequestsMonthly ?? 500)}%` }}
              />
            </div>
          </div>

          {/* 360 Tours Mandate Card */}
          <div className={styles.quotaCard} style={{ gridColumn: '1 / -1', borderLeft: '4px solid #34d399' }}>
            <div className={styles.quotaHeader}>
              <span className={styles.quotaTitle} style={{ color: '#34d399' }}>360° Virtual Tours</span>
              <Compass size={20} color="#34d399" />
            </div>
            <div style={{ fontSize: '1rem', color: '#f7f8f8', fontWeight: 600 }}>
              Unlimited & Free (Policy Exempt)
            </div>
            <div style={{ fontSize: '0.8125rem', color: '#8a9195' }}>
              Three.js virtual tours run on client-side compute without third-party licensing costs and are exempt from quota restrictions across all subscription tiers.
            </div>
          </div>
        </div>
        </div>
      )}

      {/* Tab 2: Subscription & Plan */}
      {activeTab === 'subscription' && (
        <div className={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ margin: 0, color: '#f7f8f8' }}>Subscription Details</h3>
            {canManage && (
              <button
                type="button"
                className={styles.btnAction}
                onClick={() => {
                  setModalError('');
                  setShowPlanModal(true);
                }}
              >
                Change Plan / Extend
              </button>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', color: '#c5cacd' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#8a9195' }}>PLAN CODE</div>
              <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#f7f8f8', textTransform: 'capitalize' }}>
                {sub.plan || 'starter'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#8a9195' }}>BILLING CYCLE</div>
              <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#f7f8f8', textTransform: 'capitalize' }}>
                {sub.billingCycle || 'monthly'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#8a9195' }}>STATUS</div>
              <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#34d399', textTransform: 'uppercase' }}>
                {sub.status || 'active'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#8a9195' }}>START DATE</div>
              <div style={{ fontSize: '0.9rem', color: '#f7f8f8' }}>
                {sub.startDate ? new Date(sub.startDate).toLocaleDateString() : '—'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#8a9195' }}>END DATE</div>
              <div style={{ fontSize: '0.9rem', color: '#f7f8f8' }}>
                {sub.endDate ? new Date(sub.endDate).toLocaleDateString() : '—'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Payments Ledger */}
      {activeTab === 'payments' && (
        <div className={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ margin: 0, color: '#f7f8f8' }}>Invoices & Payments</h3>
            {canManage && (
              <button
                type="button"
                className={styles.btnAction}
                onClick={() => {
                  setModalError('');
                  setShowPaymentModal(true);
                }}
              >
                <Plus size={14} /> Record Manual Payment
              </button>
            )}
          </div>

          {payments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#8a9195' }}>
              No payments recorded for this organization yet.
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Invoice Ref</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p, idx) => (
                  <tr key={p._id || idx}>
                    <td style={{ fontWeight: 700, color: '#f7f8f8' }}>
                      {p.currency || 'USD'} {Number(p.amount).toLocaleString()}
                    </td>
                    <td style={{ textTransform: 'capitalize' }}>
                      {p.paymentMethod?.replace('_', ' ') || 'Manual'}
                    </td>
                    <td>{p.invoiceReference || '—'}</td>
                    <td>
                      <span className={`${styles.badge} ${styles.badgeActive}`}>
                        {p.status || 'Paid'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.75rem', color: '#8a9195' }}>
                      {new Date(p.paidAt || p.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab 4: Agency Users */}
      {activeTab === 'users' && (
        <div className={styles.card}>
          <h3 style={{ margin: '0 0 1.25rem 0', color: '#f7f8f8' }}>Staff Users ({users.length})</h3>
          {users.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#8a9195' }}>
              No users registered in this tenant organization.
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id}>
                    <td style={{ fontWeight: 700, color: '#f7f8f8' }}>
                      {u.firstName} {u.lastName}
                    </td>
                    <td>{u.email}</td>
                    <td style={{ textTransform: 'capitalize' }}>{u.role}</td>
                    <td>
                      {u.isActive ? (
                        <span className={`${styles.badge} ${styles.badgeActive}`}>Active</span>
                      ) : (
                        <span className={`${styles.badge} ${styles.badgeSuspended}`}>Inactive</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {canManage && (
                        <button
                          type="button"
                          className={styles.btnAction}
                          onClick={() => handleToggleUserStatus(u)}
                        >
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Change Plan Modal */}
      {showPlanModal && (
        <div className={styles.modalBackdrop} onClick={() => setShowPlanModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Change Plan / Extend Subscription</h2>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setShowPlanModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            {modalError && <div className={styles.errorBanner}>{modalError}</div>}

            <form onSubmit={handlePlanSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Select Plan Tier *</label>
                <select
                  className={styles.input}
                  value={planForm.planCode}
                  onChange={(e) => setPlanForm({ ...planForm, planCode: e.target.value })}
                >
                  {plans.map((p) => (
                    <option key={p.code} value={p.code}>
                      {typeof p.name === 'object' ? p.name.en : p.name} ({p.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Billing Cycle *</label>
                <select
                  className={styles.input}
                  value={planForm.billingCycle}
                  onChange={(e) => setPlanForm({ ...planForm, billingCycle: e.target.value })}
                >
                  <option value="monthly">Monthly</option>
                  <option value="annual">Annual (Yearly)</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Extend Duration (Months) *</label>
                <input
                  type="number"
                  min="1"
                  max="36"
                  required
                  className={styles.input}
                  value={planForm.extendMonths}
                  onChange={(e) => setPlanForm({ ...planForm, extendMonths: e.target.value })}
                />
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setShowPlanModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting}
                  className={styles.submitBtn}
                >
                  {modalSubmitting ? 'Updating...' : 'Update Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showPaymentModal && (
        <div className={styles.modalBackdrop} onClick={() => setShowPaymentModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Record Manual Payment</h2>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setShowPaymentModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            {modalError && <div className={styles.errorBanner}>{modalError}</div>}

            <form onSubmit={handlePaymentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Amount Paid *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    className={styles.input}
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Currency *</label>
                  <select
                    className={styles.input}
                    value={paymentForm.currency}
                    onChange={(e) => setPaymentForm({ ...paymentForm, currency: e.target.value })}
                  >
                    <option value="EGP">EGP</option>
                    <option value="USD">USD</option>
                    <option value="AED">AED</option>
                    <option value="SAR">SAR</option>
                  </select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Payment Method *</label>
                <select
                  className={styles.input}
                  value={paymentForm.paymentMethod}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                >
                  <option value="bank_transfer">Bank Wire Transfer</option>
                  <option value="credit_card">Credit Card (POS/Gateway)</option>
                  <option value="cash">Cash / Cheque</option>
                  <option value="stripe">Stripe</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Invoice Reference #</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="e.g. INV-2026-081"
                  value={paymentForm.invoiceReference}
                  onChange={(e) => setPaymentForm({ ...paymentForm, invoiceReference: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Auto-Extend Subscription (Months)</label>
                <input
                  type="number"
                  min="0"
                  max="36"
                  className={styles.input}
                  value={paymentForm.autoExtendMonths}
                  onChange={(e) => setPaymentForm({ ...paymentForm, autoExtendMonths: e.target.value })}
                />
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setShowPaymentModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting}
                  className={styles.submitBtn}
                >
                  {modalSubmitting ? 'Recording...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizationDetail;
