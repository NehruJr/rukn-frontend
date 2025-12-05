import { useState, useEffect } from 'react';
import { TASK_TYPES, TASK_PRIORITIES, TASK_STATUSES } from '@/utils/constants';
import { format } from 'date-fns';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import styles from './DealForm.module.css';

const TaskForm = ({ isOpen, onClose, onSubmit, initialData = null, initialDate = null }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'follow_up',
        priority: 'medium',
        status: 'pending',
        assignedTo: '',
        dueDate: initialDate ? format(initialDate, 'yyyy-MM-dd') : '',
        dueTime: '',
        notes: ''
    });

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        } else if (initialDate) {
            setFormData(prev => ({ ...prev, dueDate: format(initialDate, 'yyyy-MM-dd') }));
        }
    }, [initialData, initialDate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        await onSubmit(formData);
    };

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={`${styles.modal} animate-slideInUp`} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2>{initialData ? 'Edit Task' : 'Create New Task'}</h2>
                    <button className={styles.closeButton} onClick={onClose}>×</button>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formGrid}>
                        <div className={styles.formGroupFull}>
                            <label>Task Title *</label>
                            <Input
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Enter task title"
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Type</label>
                            <select
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                className={styles.select}
                            >
                                {TASK_TYPES.map(type => (
                                    <option key={type.value} value={type.value}>{type.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.formGroup}>
                            <label>Priority</label>
                            <select
                                value={formData.priority}
                                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                className={styles.select}
                            >
                                {TASK_PRIORITIES.map(priority => (
                                    <option key={priority.value} value={priority.value}>{priority.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.formGroup}>
                            <label>Due Date *</label>
                            <Input
                                type="date"
                                value={formData.dueDate}
                                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Due Time</label>
                            <Input
                                type="time"
                                value={formData.dueTime}
                                onChange={(e) => setFormData({ ...formData, dueTime: e.target.value })}
                            />
                        </div>

                        <div className={styles.formGroupFull}>
                            <label>Description</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className={styles.textarea}
                                rows="3"
                                placeholder="Add task description..."
                            />
                        </div>

                        <div className={styles.formGroupFull}>
                            <label>Notes</label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                className={styles.textarea}
                                rows="2"
                                placeholder="Add any additional notes..."
                            />
                        </div>
                    </div>

                    <div className={styles.footer}>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary">
                            {initialData ? 'Update Task' : 'Create Task'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TaskForm;
