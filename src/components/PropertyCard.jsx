import { MapPin, Bed, Bath, Maximize, Edit2, Trash2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import styles from './PropertyCard.module.css';

const PropertyCard = ({ property, onEdit, onDelete, onClick }) => {
    const { user } = useAuthStore();
    const {
        title,
        price,
        currency,
        location,
        features,
        media,
        status,
        propertyType,
        transactionType
    } = property;

    const primaryImage = media?.images?.find(img => img.isPrimary)?.url || media?.images?.[0]?.url || '/placeholder-property.jpg';

    const formatPrice = (value) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency || 'EGP',
            maximumFractionDigits: 0
        }).format(value);
    };

    const canEdit = user?.role === 'admin' || (user?._id === property.listedBy?._id && user?.permissions?.includes('properties.edit'));
    const canDelete = user?.role === 'admin' || (user?._id === property.listedBy?._id && user?.permissions?.includes('properties.delete'));

    return (
        <div className={styles.card} onClick={onClick}>
            <div className={styles.imageContainer}>
                <img src={primaryImage} alt={title} className={styles.image} />
                <div className={styles.badges}>
                    <span className={`${styles.badge} ${styles[status]}`}>
                        {status}
                    </span>
                    <span className={styles.typeBadge}>
                        {propertyType} • {transactionType}
                    </span>
                </div>
                <div className={styles.priceTag}>
                    {formatPrice(price)}
                </div>
            </div>

            <div className={styles.content}>
                <h3 className={styles.title}>{title}</h3>
                <div className={styles.location}>
                    <MapPin size={16} />
                    <span>{location.area}, {location.city}</span>
                </div>

                <div className={styles.features}>
                    <div className={styles.feature}>
                        <Bed size={18} />
                        <span>{features.bedrooms} Beds</span>
                    </div>
                    <div className={styles.feature}>
                        <Bath size={18} />
                        <span>{features.bathrooms} Baths</span>
                    </div>
                    <div className={styles.feature}>
                        <Maximize size={18} />
                        <span>{features.area.value} {features.area.unit}</span>
                    </div>
                </div>

                {(canEdit || canDelete) && (
                    <div className={styles.actions} onClick={e => e.stopPropagation()}>
                        {canEdit && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onEdit(property); }}
                                className={styles.actionButton}
                                title="Edit Property"
                            >
                                <Edit2 size={16} />
                            </button>
                        )}
                        {canDelete && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onDelete(property._id); }}
                                className={`${styles.actionButton} ${styles.deleteButton}`}
                                title="Delete Property"
                            >
                                <Trash2 size={16} />
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PropertyCard;
