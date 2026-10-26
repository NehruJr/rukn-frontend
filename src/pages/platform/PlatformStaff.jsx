import { useState, useEffect } from 'react';
import { usePlatformAuthStore } from '@/store/platformAuthStore';
import { platformStaffService } from '@/services/platformStaffService';
import {
  ShieldAlert,
  Plus,
  Search,
  UserCheck,
  UserX,
  Trash2,
  Mail,
  Clock,
  Shield,
  X,
  AlertCircle
} from 'lucide-react';
import styles from './PlatformStaff.module.css';

const PlatformStaff = () => {
  const { platformUser, hasRole } = usePlatformAuthStore();
  const isOwner = hasRole('owner');

  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');
  const [newStaff, setNewStaff] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'support'
  });

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await platformStaffService.getStaffList();
      setStaffList(res.data || []);
    } catch (err) {
      console.error('Failed to load platform staff:', err);
      setError(err.response?.data?.error || err.message || 'Failed to load staff list');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (staff) => {
    if (staff._id === platformUser?.id || staff._id === platformUser?._id) {
      alert('You cannot deactivate your own account.');
      return;
    }
    const newStatus = !staff.isActive;
    const confirmMsg = `Are you sure you want to ${newStatus ? 'activate' : 'deactivate'} ${staff.firstName} ${staff.lastName}?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      await platformStaffService.updateStaff(staff._id, { isActive: newStatus });
      await fetchStaff();
    } catch (err) {
      alert(err.response?.data?.error || err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDeleteStaff = async (staff) => {
    if (staff._id === platformUser?.id || staff._id === platformUser?._id) {
      alert('You cannot delete your own account.');
      return;
    }
    if (!window.confirm(`Are you sure you want to remove staff member ${staff.firstName} ${staff.lastName}? This action cannot be undone.`)) {
      return;
    }

    try {
      await platformStaffService.deleteStaff(staff._id);
      await fetchStaff();
    } catch (err) {
      alert(err.response?.data?.error || err.response?.data?.message || 'Failed to remove staff member');
    }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setModalError('');
    if (!newStaff.email || !newStaff.password || !newStaff.firstName || !newStaff.lastName) {
      setModalError('All fields are required.');
      return;
    }

    try {
      setFormSubmitting(true);
      await platformStaffService.createStaff(newStaff);
      setShowAddModal(false);
      setNewStaff({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: 'support'
      });
      await fetchStaff();
    } catch (err) {
      setModalError(err.response?.data?.error || err.response?.data?.message || 'Failed to create staff member');
    } finally {
      setFormSubmitting(false);
    }
  };

  const filteredStaff = staffList.filter((s) => {
    const fullName = `${s.firstName || ''} ${s.lastName || ''}`.toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || s.role === roleFilter;
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' ? s.isActive : !s.isActive);
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleBadgeStyle = (role) => {
    if (role === 'owner') return styles.badgeOwner;
    if (role === 'admin') return styles.badgeAdmin;
    return styles.badgeSupport;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.titleWrapper}>
            <ShieldAlert size={26} className={styles.titleIcon} />
            <h1 className={styles.title}>Platform Staff Management</h1>
          </div>
          <p className={styles.subtitle}>
            Super-admin accounts, role-based access control, and platform operations security
          </p>
        </div>

        {isOwner && (
          <button
            type="button"
            className={styles.addBtn}
            onClick={() => setShowAddModal(true)}
          >
            <Plus size={18} />
            <span>Add Staff Member</span>
          </button>
        )}
      </div>

      {/* Controls Bar */}
      <div className={styles.controlsBar}>
        <div className={styles.searchWrapper}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className={styles.filterGroup}>
          <select
            className={styles.filterSelect}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">All Roles</option>
            <option value="owner">Owner</option>
            <option value="admin">Admin</option>
            <option value="support">Support</option>
          </select>

          <select
            className={styles.filterSelect}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {error && (
        <div className={styles.errorBanner}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Staff Table */}
      <div className={styles.tableCard}>
        {loading ? (
          <div className={styles.loadingBox}>Loading platform staff accounts...</div>
        ) : filteredStaff.length === 0 ? (
          <div className={styles.emptyBox}>No platform staff found matching your criteria.</div>
        ) : (
          <div className={styles.tableResponsive}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Staff Member</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Last Login</th>
                  <th className={styles.thRight}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff.map((staff) => (
                  <tr key={staff._id} className={!staff.isActive ? styles.rowInactive : ''}>
                    <td>
                      <div className={styles.memberCell}>
                        <div className={styles.avatar}>
                          {staff.firstName?.[0] || 'S'}
                          {staff.lastName?.[0] || ''}
                        </div>
                        <div className={styles.memberMeta}>
                          <span className={styles.memberName}>
                            {staff.firstName} {staff.lastName}
                            {(staff._id === platformUser?.id || staff._id === platformUser?._id) && (
                              <span className={styles.selfTag}>You</span>
                            )}
                          </span>
                          <span className={styles.memberEmail}>
                            <Mail size={12} />
                            {staff.email}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`${styles.roleBadge} ${getRoleBadgeStyle(staff.role)}`}>
                        <Shield size={12} />
                        {staff.role.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <span className={staff.isActive ? styles.statusActive : styles.statusInactive}>
                        <span className={styles.statusDot} />
                        {staff.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <span className={styles.dateText}>
                        <Clock size={13} />
                        {formatDate(staff.lastLoginAt)}
                      </span>
                    </td>
                    <td className={styles.tdRight}>
                      {isOwner && (
                        <div className={styles.actionBtns}>
                          <button
                            type="button"
                            className={styles.statusBtn}
                            onClick={() => handleToggleStatus(staff)}
                            title={staff.isActive ? 'Deactivate' : 'Activate'}
                            disabled={staff._id === platformUser?.id || staff._id === platformUser?._id}
                          >
                            {staff.isActive ? <UserX size={16} /> : <UserCheck size={16} />}
                          </button>
                          <button
                            type="button"
                            className={styles.deleteBtn}
                            onClick={() => handleDeleteStaff(staff)}
                            title="Remove Staff"
                            disabled={staff._id === platformUser?.id || staff._id === platformUser?._id}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Add Platform Staff Member</h3>
              <button
                type="button"
                className={styles.modalClose}
                onClick={() => setShowAddModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            {modalError && (
              <div className={styles.modalError}>
                <AlertCircle size={16} />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateStaff} className={styles.modalForm}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>First Name</label>
                  <input
                    type="text"
                    required
                    value={newStaff.firstName}
                    onChange={(e) => setNewStaff({ ...newStaff, firstName: e.target.value })}
                    placeholder="e.g. Sarah"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Last Name</label>
                  <input
                    type="text"
                    required
                    value={newStaff.lastName}
                    onChange={(e) => setNewStaff({ ...newStaff, lastName: e.target.value })}
                    placeholder="e.g. Jenkins"
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Email Address</label>
                <input
                  type="email"
                  required
                  value={newStaff.email}
                  onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                  placeholder="s.jenkins@rukn.com"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Initial Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newStaff.password}
                  onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                  placeholder="Minimum 6 characters"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Staff Role</label>
                <select
                  value={newStaff.role}
                  onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                >
                  <option value="support">Support (Operations & View Only)</option>
                  <option value="admin">Admin (Manage Orgs & Subscriptions)</option>
                  <option value="owner">Owner (Full Super-Admin RBAC)</option>
                </select>
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={formSubmitting}
                >
                  {formSubmitting ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlatformStaff;
