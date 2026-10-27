import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usePlatformAuthStore } from '@/store/platformAuthStore';
import { platformOrgService } from '@/services/platformOrgService';
import { platformPlanService } from '@/services/platformPlanService';
import {
  Building2,
  Search,
  Plus,
  ExternalLink,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  X,
  AlertCircle,
  KeyRound,
  Filter
} from 'lucide-react';
import styles from './OrganizationsList.module.css';

const COUNTRY_NAMES = {
  EG: 'Egypt 🇪🇬',
  eg: 'Egypt 🇪🇬',
  egypt: 'Egypt 🇪🇬',
  AE: 'UAE 🇦🇪',
  ae: 'UAE 🇦🇪',
  uae: 'UAE 🇦🇪',
  SA: 'Saudi Arabia 🇸🇦',
  sa: 'Saudi Arabia 🇸🇦',
  saudi: 'Saudi Arabia 🇸🇦',
  saudi_arabia: 'Saudi Arabia 🇸🇦',
  QA: 'Qatar 🇶🇦',
  qa: 'Qatar 🇶🇦',
  qatar: 'Qatar 🇶🇦',
  KW: 'Kuwait 🇰🇼',
  kw: 'Kuwait 🇰🇼',
  kuwait: 'Kuwait 🇰🇼',
  BH: 'Bahrain 🇧🇭',
  bh: 'Bahrain 🇧🇭',
  bahrain: 'Bahrain 🇧🇭',
  OM: 'Oman 🇴🇲',
  om: 'Oman 🇴🇲',
  oman: 'Oman 🇴🇲'
};

const OrganizationsList = () => {
  const navigate = useNavigate();
  const { hasRole } = usePlatformAuthStore();
  const canManage = hasRole(['owner', 'admin']);

  const [organizations, setOrganizations] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [statusReason, setStatusReason] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  // Create Form State
  const initialForm = {
    name: '',
    slug: '',
    country: 'EG',
    city: 'Cairo',
    phone: '',
    planCode: 'starter',
    billingCycle: 'monthly',
    adminFirstName: '',
    adminLastName: '',
    adminEmail: '',
    adminPassword: ''
  };
  const [createForm, setCreateForm] = useState(initialForm);

  useEffect(() => {
    fetchData();
  }, [countryFilter, statusFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (countryFilter) params.country = countryFilter;
      if (statusFilter) params.status = statusFilter;

      const [orgsRes, plansRes] = await Promise.all([
        platformOrgService.getOrganizations(params),
        platformPlanService.getPlans()
      ]);

      setOrganizations(orgsRes.data || []);
      setPlans(plansRes.data || []);
    } catch (err) {
      console.error('Failed to load organizations:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch organizations');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    setModalError('');

    try {
      await platformOrgService.createOrganization({
        ...createForm,
        ownerFirstName: createForm.adminFirstName,
        ownerLastName: createForm.adminLastName,
        ownerEmail: createForm.adminEmail,
        ownerPassword: createForm.adminPassword
      });
      setShowCreateModal(false);
      setCreateForm(initialForm);
      await fetchData();
    } catch (err) {
      console.error('Failed to create organization:', err);
      setModalError(err.response?.data?.message || err.message || 'Failed to create organization');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleOpenStatusModal = (org) => {
    setSelectedOrg(org);
    setStatusReason('');
    setModalError('');
    setShowStatusModal(true);
  };

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    if (!statusReason.trim()) {
      setModalError('A reason is required for suspension or status changes');
      return;
    }

    setFormSubmitting(true);
    try {
      const nextActive = !selectedOrg.isActive;
      await platformOrgService.toggleStatus(selectedOrg._id, {
        isActive: nextActive,
        reason: statusReason.trim()
      });
      setShowStatusModal(false);
      await fetchData();
    } catch (err) {
      setModalError(err.response?.data?.message || err.message || 'Failed to update organization status');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleImpersonate = async (org) => {
    if (!window.confirm(`Launch 15-minute administrative impersonation session into "${org.name}"?`)) {
      return;
    }

    try {
      const res = await platformOrgService.impersonate(org._id);
      if (res.data?.token) {
        // Store impersonation token in sessionStorage for tenant CRM access
        sessionStorage.setItem('token', res.data.token);
        sessionStorage.setItem('impersonatedOrgId', org._id);
        window.open('/', '_blank');
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to impersonate organization');
    }
  };

  const filteredOrgs = organizations.filter((org) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      org.name?.toLowerCase().includes(term) ||
      org.slug?.toLowerCase().includes(term) ||
      org.adminEmail?.toLowerCase().includes(term)
    );
  });

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.titleWrapper}>
          <Building2 className={styles.titleIcon} size={28} />
          <div>
            <h1 className={styles.title}>Organizations Directory</h1>
            <p className={styles.subtitle}>
              Manage customer real estate agencies, subscription status, and quotas
            </p>
          </div>
        </div>

        {canManage && (
          <button
            type="button"
            className={styles.addBtn}
            onClick={() => {
              setModalError('');
              setShowCreateModal(true);
            }}
          >
            <Plus size={16} />
            Onboard New Agency
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className={styles.filterBar}>
        <div className={styles.searchWrapper}>
          <Search size={16} color="#8a9195" />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search agencies by name, slug, or admin email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          className={styles.select}
          value={countryFilter}
          onChange={(e) => setCountryFilter(e.target.value)}
        >
          <option value="">All Countries</option>
          <option value="EG">Egypt (EG)</option>
          <option value="AE">UAE (AE)</option>
          <option value="SA">Saudi Arabia (SA)</option>
          <option value="QA">Qatar (QA)</option>
          <option value="KW">Kuwait (KW)</option>
          <option value="BH">Bahrain (BH)</option>
          <option value="OM">Oman (OM)</option>
        </select>

        <select
          className={styles.select}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="trial">Trial</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      {/* Error state */}
      {error && (
        <div className={styles.errorBanner}>
          <AlertCircle size={18} style={{ display: 'inline', marginRight: '0.5rem' }} />
          {error}
        </div>
      )}

      {/* Table Card */}
      <div className={styles.tableCard}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#8a9195' }}>
            Loading organizations directory...
          </div>
        ) : filteredOrgs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#8a9195' }}>
            No organizations found matching the criteria.
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Agency</th>
                <th>Country</th>
                <th>Plan & Cycle</th>
                <th>Resource Quotas</th>
                <th>Status</th>
                <th>Created</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrgs.map((org) => {
                const planCode = org.subscription?.plan || 'starter';
                const billingCycle = org.subscription?.billingCycle || 'monthly';
                const subStatus = org.subscription?.status || (org.isActive ? 'active' : 'suspended');

                return (
                  <tr key={org._id}>
                    <td>
                      <div className={styles.orgName}>{org.name}</div>
                      <div className={styles.orgSlug}>/{org.slug}</div>
                    </td>
                    <td>
                      <span>{COUNTRY_NAMES[org.country] || org.country}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#f7f8f8', textTransform: 'capitalize' }}>
                        {planCode}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#8a9195' }}>
                        {billingCycle}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.8125rem' }}>
                        Users: {org.subscription?.limits?.users === -1 ? 'Unlimited' : (org.subscription?.limits?.users ?? 5)}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#8a9195' }}>
                        Properties: {org.subscription?.limits?.properties === -1 ? 'Unlimited' : (org.subscription?.limits?.properties ?? 200)}
                      </div>
                    </td>
                    <td>
                      {org.isActive ? (
                        <span className={`${styles.badge} ${styles.badgeActive}`}>Active</span>
                      ) : (
                        <span className={`${styles.badge} ${styles.badgeSuspended}`}>Suspended</span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.75rem', color: '#8a9195' }}>
                      {new Date(org.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <div className={styles.actionsCell} style={{ justifyContent: 'flex-end' }}>
                        <Link
                          to={`/platform/organizations/${org._id}`}
                          className={styles.btnAction}
                        >
                          Details
                        </Link>

                        {canManage && (
                          <>
                            <button
                              type="button"
                              className={`${styles.btnAction} ${styles.impersonate}`}
                              title="15-min administrative impersonation"
                              onClick={() => handleImpersonate(org)}
                            >
                              <KeyRound size={12} /> Impersonate
                            </button>

                            <button
                              type="button"
                              className={`${styles.btnAction} ${org.isActive ? styles.suspend : styles.activate}`}
                              onClick={() => handleOpenStatusModal(org)}
                            >
                              {org.isActive ? 'Suspend' : 'Activate'}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Onboard New Organization Modal */}
      {showCreateModal && (
        <div className={styles.modalBackdrop} onClick={() => setShowCreateModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Onboard Real Estate Agency</h2>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setShowCreateModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            {modalError && (
              <div className={styles.errorBanner}>{modalError}</div>
            )}

            <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Agency Legal Name *</label>
                  <input
                    type="text"
                    required
                    className={styles.input}
                    placeholder="e.g. Rukn Cairo Realty"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Subdomain Slug *</label>
                  <input
                    type="text"
                    required
                    className={styles.input}
                    placeholder="e.g. rukn-cairo"
                    value={createForm.slug}
                    onChange={(e) => setCreateForm({ ...createForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Country *</label>
                  <select
                    className={styles.input}
                    value={createForm.country}
                    onChange={(e) => setCreateForm({ ...createForm, country: e.target.value })}
                  >
                    <option value="EG">Egypt (EG)</option>
                    <option value="AE">UAE (AE)</option>
                    <option value="SA">Saudi Arabia (SA)</option>
                    <option value="QA">Qatar (QA)</option>
                    <option value="KW">Kuwait (KW)</option>
                    <option value="BH">Bahrain (BH)</option>
                    <option value="OM">Oman (OM)</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>City *</label>
                  <input
                    type="text"
                    required
                    className={styles.input}
                    value={createForm.city}
                    onChange={(e) => setCreateForm({ ...createForm, city: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Initial Plan *</label>
                  <select
                    className={styles.input}
                    value={createForm.planCode}
                    onChange={(e) => setCreateForm({ ...createForm, planCode: e.target.value })}
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
                    value={createForm.billingCycle}
                    onChange={(e) => setCreateForm({ ...createForm, billingCycle: e.target.value })}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="annual">Annual (Yearly)</option>
                  </select>
                </div>

                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label className={styles.label} style={{ color: '#d97448', fontWeight: 700 }}>
                    Primary Administrator Account
                  </label>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>First Name *</label>
                  <input
                    type="text"
                    required
                    className={styles.input}
                    value={createForm.adminFirstName}
                    onChange={(e) => setCreateForm({ ...createForm, adminFirstName: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Last Name *</label>
                  <input
                    type="text"
                    required
                    className={styles.input}
                    value={createForm.adminLastName}
                    onChange={(e) => setCreateForm({ ...createForm, adminLastName: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Admin Email *</label>
                  <input
                    type="email"
                    required
                    className={styles.input}
                    value={createForm.adminEmail}
                    onChange={(e) => setCreateForm({ ...createForm, adminEmail: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Initial Password *</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    className={styles.input}
                    value={createForm.adminPassword}
                    onChange={(e) => setCreateForm({ ...createForm, adminPassword: e.target.value })}
                  />
                </div>
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className={styles.submitBtn}
                >
                  {formSubmitting ? 'Onboarding...' : 'Onboard Agency'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Suspend / Activate Status Modal */}
      {showStatusModal && selectedOrg && (
        <div className={styles.modalBackdrop} onClick={() => setShowStatusModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {selectedOrg.isActive ? `Suspend "${selectedOrg.name}"` : `Activate "${selectedOrg.name}"`}
              </h2>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setShowStatusModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            {modalError && (
              <div className={styles.errorBanner}>{modalError}</div>
            )}

            <form onSubmit={handleStatusSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p style={{ color: '#c5cacd', fontSize: '0.875rem', margin: 0 }}>
                {selectedOrg.isActive
                  ? 'Suspending this organization will immediately lock out all tenant users from accessing the CRM, rejecting all auth tokens and API requests with ORG_SUSPENDED.'
                  : 'Activating this organization will restore immediate access for all active tenant agents and administrators.'}
              </p>

              <div className={styles.formGroup}>
                <label className={styles.label}>Mandatory Reason (Recorded in Platform Audit Log) *</label>
                <textarea
                  required
                  rows={3}
                  className={styles.input}
                  placeholder="e.g. Non-payment of invoice #INV-4921 / Resolved overdue payment"
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                />
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setShowStatusModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className={styles.submitBtn}
                  style={{
                    background: selectedOrg.isActive
                      ? 'linear-gradient(135deg, #b91c1c, #ef4444)'
                      : 'linear-gradient(135deg, #047857, #10b981)'
                  }}
                >
                  {formSubmitting
                    ? 'Updating...'
                    : selectedOrg.isActive
                    ? 'Confirm Suspension'
                    : 'Confirm Activation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizationsList;
