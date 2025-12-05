import { useState, useEffect } from 'react';
import { userService } from '@/services/userService';
import { useAuthStore } from '@/store/authStore';
import UserForm from '@/components/UserForm';
import { Plus, Search, Edit2, Trash2, Shield, Mail, Phone, MoreVertical } from 'lucide-react';
import styles from './UserManagement.module.css';

const UserManagement = () => {
    const { user: currentUser } = useAuthStore();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [formLoading, setFormLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await userService.getAllUsers();
            setUsers(response.data);
            setError(null);
        } catch (err) {
            console.error('Error fetching users:', err);
            setError('Failed to load users. You may not have permission.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (userData) => {
        try {
            setFormLoading(true);
            await userService.createUser(userData);
            await fetchUsers();
            setShowForm(false);
        } catch (err) {
            console.error('Error creating user:', err);
            alert(err.response?.data?.message || 'Failed to create user');
        } finally {
            setFormLoading(false);
        }
    };

    const handleUpdateUser = async (userData) => {
        try {
            setFormLoading(true);
            await userService.updateUser(selectedUser._id, userData);
            await fetchUsers();
            setShowForm(false);
            setSelectedUser(null);
        } catch (err) {
            console.error('Error updating user:', err);
            alert(err.response?.data?.message || 'Failed to update user');
        } finally {
            setFormLoading(false);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (window.confirm('Are you sure you want to deactivate this user?')) {
            try {
                await userService.deleteUser(userId);
                await fetchUsers();
            } catch (err) {
                console.error('Error deleting user:', err);
                alert(err.response?.data?.message || 'Failed to delete user');
            }
        }
    };

    const openEditModal = (user) => {
        setSelectedUser(user);
        setShowForm(true);
    };

    const openCreateModal = () => {
        setSelectedUser(null);
        setShowForm(true);
    };

    const filteredUsers = users.filter(user =>
        user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getRoleBadgeColor = (role) => {
        switch (role) {
            case 'admin': return '#2c3438'; // Secondary
            case 'manager': return '#b4562d'; // Primary
            case 'team_leader': return '#10B981'; // Success
            case 'agent': return '#F59E0B'; // Warning
            default: return '#666e73'; // Neutral
        }
    };

    if (loading) return <div className={styles.loading}>Loading users...</div>;
    if (error) return <div className={styles.error}>{error}</div>;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1>Team Management</h1>
                    <p>Manage your team members and permissions</p>
                </div>
                <button onClick={openCreateModal} className={styles.addButton}>
                    <Plus size={20} />
                    Add Member
                </button>
            </div>

            <div className={styles.controls}>
                <div className={styles.searchBar}>
                    <Search size={20} className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Search team members..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className={styles.grid}>
                {filteredUsers.map(user => (
                    <div key={user._id} className={`${styles.card} ${!user.isActive ? styles.inactive : ''}`}>
                        <div className={styles.cardHeader}>
                            <div className={styles.avatar}>
                                {user.firstName[0]}{user.lastName[0]}
                            </div>
                            <div className={styles.userInfo}>
                                <h3>{user.firstName} {user.lastName}</h3>
                                <span
                                    className={styles.roleBadge}
                                    style={{
                                        backgroundColor: `${getRoleBadgeColor(user.role)}15`,
                                        color: getRoleBadgeColor(user.role)
                                    }}
                                >
                                    {user.role.replace('_', ' ')}
                                </span>
                            </div>
                            <div className={styles.actions}>
                                <button onClick={() => openEditModal(user)} className={styles.iconButton}>
                                    <Edit2 size={18} />
                                </button>
                                {currentUser.role === 'admin' && user._id !== currentUser._id && (
                                    <button onClick={() => handleDeleteUser(user._id)} className={`${styles.iconButton} ${styles.deleteButton}`}>
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className={styles.cardBody}>
                            <div className={styles.infoItem}>
                                <Mail size={16} />
                                <span>{user.email}</span>
                            </div>
                            <div className={styles.infoItem}>
                                <Phone size={16} />
                                <span>{user.phone || 'No phone'}</span>
                            </div>
                            <div className={styles.infoItem}>
                                <Shield size={16} />
                                <span>{user.permissions?.length || 0} Permissions</span>
                            </div>
                        </div>

                        {!user.isActive && (
                            <div className={styles.inactiveOverlay}>
                                <span>Inactive</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {showForm && (
                <UserForm
                    user={selectedUser}
                    onClose={() => setShowForm(false)}
                    onSave={selectedUser ? handleUpdateUser : handleCreateUser}
                    loading={formLoading}
                />
            )}
        </div>
    );
};

export default UserManagement;
