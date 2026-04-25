import { useLanguage } from "@/hooks/useLanguage";
import { useState, useEffect } from 'react';
import { propertyService } from '@/services/propertyService';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Search, Building2, Plus } from 'lucide-react';
import styles from './AssignPropertyModal.module.css';

const AssignPropertyModal = ({
    isOpen,
    onClose,
    leadId,
    assignedPropertyIds = [],
    onConfirm
}) => {
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(false);
    const [savingId, setSavingId] = useState(null);
    const [search, setSearch] = useState('');

    const { t } = useLanguage();

    const assignedSet = new Set(assignedPropertyIds.map((id) => id?.toString?.() || id));

    useEffect(() => {
        if (isOpen) {
            fetchProperties();
        }
    }, [isOpen, search]);

    const fetchProperties = async () => {
        setLoading(true);
        try {
            const res = await propertyService.getProperties({
                search: search || undefined,
                limit: 50
            });
            setProperties(res.data || []);
        } catch (err) {
            console.error('Error fetching properties:', err);
            setProperties([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (propertyId) => {
        if (!leadId) return;
        setSavingId(propertyId);
        try {
            await onConfirm(leadId, propertyId);
            onClose();
        } catch (err) {
            console.error('Error assigning property:', err);
            throw err;
        } finally {
            setSavingId(null);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Assign property to lead" size="md">
            <div className={styles.content}>
                <Input
                    placeholder="Search properties..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    leftIcon={<Search size={18} />}
                    className={styles.searchInput}
                />
                {loading ? (
                    <p className={styles.loading}>{t('dashboard_extra.loading_properties')}</p>
                ) : properties.length === 0 ? (
                    <p className={styles.empty}>{t('dashboard_extra.no_properties_found_1')}</p>
                ) : (
                    <ul className={styles.list}>
                        {properties.map((property) => {
                            const id = property._id?.toString?.() || property._id;
                            const isAssigned = assignedSet.has(id);
                            const isSaving = savingId === id;
                            return (
                                <li key={property._id} className={styles.item}>
                                    <div className={styles.propertyInfo}>
                                        <Building2 size={18} className={styles.icon} />
                                        <div>
                                            <span className={styles.title}>
                                                {property.title || 'Untitled'}
                                            </span>
                                            <span className={styles.meta}>
                                                {[property.location?.city, property.price && `$${Number(property.price).toLocaleString()}`]
                                                    .filter(Boolean)
                                                    .join(' · ')}
                                            </span>
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="primary"
                                        leftIcon={<Plus size={14} />}
                                        onClick={() => handleAdd(property._id)}
                                        disabled={isAssigned || isSaving}
                                        loading={isSaving}
                                    >
                                        {isAssigned ? 'Assigned' : 'Add'}
                                    </Button>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </Modal>
    );
};

export default AssignPropertyModal;
