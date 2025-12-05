import { useState, useEffect } from 'react';
import { X, Save, Shield, User } from 'lucide-react';
import styles from './UserForm.module.css';

const UserForm = ({ user, onClose, onSave, loading }) => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        role: 'agent',
        permissions: [],
        isActive: true
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (user) {
            setFormData({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                email: user.email || '',
                phone: user.phone || '',
                password: '', // Don't populate password on edit
                role: user.role || 'agent',
                permissions: user.permissions || [],
                isActive: user.isActive ?? true
            });
        }
    }, [user]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        // Clear error when field is edited
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const handlePermissionChange = (permission) => {
        setFormData(prev => {
            const permissions = prev.permissions.includes(permission)
                ? prev.permissions.filter(p => p !== permission)
                : [...prev.permissions, permission];
            return { ...prev, permissions };
        });
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
        if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
        if (!formData.email.trim()) newErrors.email = 'Email is required';
        if (!user && !formData.password) newErrors.password = 'Password is required for new users';
        if (formData.password && formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validate()) {
            onSave(formData);
        }
    };

    const availablePermissions = [
        { id: 'leads.view', label: 'View Leads' },
        { id: 'leads.create', label: 'Create Leads' },
        { id: 'leads.edit', label: 'Edit Leads' },
        { id: 'leads.delete', label: 'Delete Leads' },
        { id: 'leads.assign', label: 'Assign Leads' },
        { id: 'properties.view', label: 'View Properties' },
        { id: 'properties.create', label: 'Create Properties' },
        { id: 'properties.edit', label: 'Edit Properties' },
        { id: 'properties.delete', label: 'Delete Properties' },
        { id: 'deals.view', label: 'View Deals' },
        { id: 'deals.create', label: 'Create Deals' },
        { id: 'deals.edit', label: 'Edit Deals' },
        { id: 'team.view', label: 'View Team' },
        { id: 'reports.view', label: 'View Reports' }
    ];

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2>{user ? 'Edit User' : 'Add New User'}</h2>
                    <button onClick={onClose} className={styles.closeButton}>
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.section}>
                        <h3><User size={18} /> Basic Information</h3>
                        <div className={styles.grid}>
                            <div className={styles.formGroup}>
                                <label>First Name</label>
                                <input
                                    type="text"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    className={errors.firstName ? styles.errorInput : ''}
                                />
                                {errors.firstName && <span className={styles.errorText}>{errors.firstName}</span>}
                            </div>
                            <div className={styles.formGroup}>
                                <label>Last Name</label>
                                <input
                                    type="text"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    className={errors.lastName ? styles.errorInput : ''}
                                />
                                {errors.lastName && <span className={styles.errorText}>{errors.lastName}</span>}
                            </div>
                            <div className={styles.formGroup}>
                                <label>Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className={errors.email ? styles.errorInput : ''}
                                />
                                {errors.email && <span className={styles.errorText}>{errors.email}</span>}
                            </div>
                            <div className={styles.formGroup}>
                                <label>Phone</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Password {user && '(Leave blank to keep current)'}</label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className={errors.password ? styles.errorInput : ''}
                                />
                                {errors.password && <span className={styles.errorText}>{errors.password}</span>}
                            </div>
                            <div className={styles.formGroup}>
                                <label>Role</label>
                                <select
                                    name="role"
                                    value={formData.role}
                                    onChange={handleChange}
                                >
                                    <option value="agent">Agent</option>
                                    <option value="team_leader">Team Leader</option>
                                    <option value="manager">Manager</option>
                                    <option value="sales_support">Sales Support</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className={styles.section}>
                        <h3><Shield size={18} /> Permissions</h3>
                        <div className={styles.permissionsGrid}>
                            {availablePermissions.map(perm => (
                                <label key={perm.id} className={styles.permissionItem}>
                                    <input
                                        type="checkbox"
                                        checked={formData.permissions.includes(perm.id)}
                                        onChange={() => handlePermissionChange(perm.id)}
                                        disabled={formData.role === 'admin'} // Admin has all permissions
                                    />
                                    <span>{perm.label}</span>
                                </label>
                            ))}
                        </div>
                        {formData.role === 'admin' && (
                            <p className={styles.note}>Admin users have full access to all features.</p>
                        )}
                    </div>

                    <div className={styles.section}>
                        <label className={styles.toggleLabel}>
                            <input
                                type="checkbox"
                                name="isActive"
                                checked={formData.isActive}
                                onChange={handleChange}
                            />
                            <span>Active Account</span>
                        </label>
                    </div>

                    <div className={styles.actions}>
                        <button type="button" onClick={onClose} className={styles.cancelButton}>
                            Cancel
                        </button>
                        <button type="submit" className={styles.saveButton} disabled={loading}>
                            {loading ? 'Saving...' : (
                                <>
                                    <Save size={18} />
                                    Save User
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserForm;
