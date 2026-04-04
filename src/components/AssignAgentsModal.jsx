import { useState, useEffect } from 'react';
import { userService } from '@/services/userService';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import styles from './AssignAgentsModal.module.css';

const AssignAgentsModal = ({
    isOpen,
    onClose,
    propertyId,
    assignedAgentIds = [],
    onConfirm
}) => {
    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [selectedIds, setSelectedIds] = useState(new Set(assignedAgentIds.map(id => id?.toString?.() || id)));

    useEffect(() => {
        if (isOpen) {
            setSelectedIds(new Set(assignedAgentIds.map(id => id?.toString?.() || id)));
            fetchAgents();
        }
    }, [isOpen, propertyId]);

    useEffect(() => {
        if (isOpen && assignedAgentIds.length) {
            setSelectedIds(new Set(assignedAgentIds.map(id => id?.toString?.() || id)));
        }
    }, [assignedAgentIds, isOpen]);

    const fetchAgents = async () => {
        setLoading(true);
        try {
            const res = await userService.getAgents();
            setAgents(res.data || []);
        } catch (err) {
            console.error('Error fetching agents:', err);
            setAgents([]);
        } finally {
            setLoading(false);
        }
    };

    const toggleAgent = (agentId) => {
        const id = agentId?.toString?.() || agentId;
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleConfirm = async () => {
        if (!propertyId) return;
        setSaving(true);
        try {
            const agentIds = Array.from(selectedIds);
            await onConfirm(propertyId, agentIds);
            onClose();
        } catch (err) {
            console.error('Error assigning agents:', err);
            throw err;
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Assign Agents" size="md">
            <div className={styles.content}>
                {loading ? (
                    <p className={styles.loading}>Loading agents...</p>
                ) : agents.length === 0 ? (
                    <p className={styles.empty}>No agents available.</p>
                ) : (
                    <ul className={styles.list}>
                        {agents.map((agent) => {
                            const id = agent._id?.toString?.() || agent._id;
                            const name = [agent.firstName, agent.lastName].filter(Boolean).join(' ');
                            const isChecked = selectedIds.has(id);
                            return (
                                <li key={agent._id} className={styles.item}>
                                    <label className={styles.label}>
                                        <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={() => toggleAgent(agent._id)}
                                            className={styles.checkbox}
                                        />
                                        <span className={styles.name}>{name || agent.email}</span>
                                        {agent.agentProfile?.locations?.length > 0 && (
                                            <span className={styles.meta}>
                                                {agent.agentProfile.locations.join(', ')}
                                            </span>
                                        )}
                                    </label>
                                </li>
                            );
                        })}
                    </ul>
                )}
                <div className={styles.actions}>
                    <Button variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleConfirm}
                        disabled={loading || saving || agents.length === 0}
                        loading={saving}
                    >
                        Confirm
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default AssignAgentsModal;
