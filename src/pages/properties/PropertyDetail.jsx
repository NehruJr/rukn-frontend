import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { propertyService } from '@/services/propertyService';
import { useAuthStore } from '@/store/authStore';
import {
    MapPin, Bed, Bath, Maximize, Edit2, Trash2, ArrowLeft,
    Calendar, User, Mail, Phone, CheckCircle, Share2
} from 'lucide-react';
import styles from './PropertyDetail.module.css';

const PropertyDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, hasPermission } = useAuthStore();
    const [property, setProperty] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeImage, setActiveImage] = useState(0);

    useEffect(() => {
        fetchProperty();
    }, [id]);

    const fetchProperty = async () => {
        try {
            setLoading(true);
            const response = await propertyService.getPropertyById(id);
            setProperty(response.data);
        } catch (err) {
            console.error('Error fetching property:', err);
            alert('Failed to load property details');
            navigate('/properties');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this property?')) {
            try {
                await propertyService.deleteProperty(id);
                navigate('/properties');
            } catch (err) {
                console.error('Error deleting property:', err);
                alert('Failed to delete property');
            }
        }
    };

    if (loading) return <div className={styles.loading}>Loading property details...</div>;
    if (!property) return null;

    const canEdit = user?.role === 'admin' || (user?._id === property.listedBy?._id && hasPermission('properties.edit'));
    const canDelete = user?.role === 'admin' || (user?._id === property.listedBy?._id && hasPermission('properties.delete'));

    const images = property.media?.images?.length > 0
        ? property.media.images
        : [{ url: '/placeholder-property.jpg' }];

    return (
        <div className={styles.container}>
            <button onClick={() => navigate('/properties')} className={styles.backButton}>
                <ArrowLeft size={20} /> Back to Properties
            </button>

            <div className={styles.header}>
                <div>
                    <div className={styles.badges}>
                        <span className={`${styles.badge} ${styles[property.status]}`}>
                            {property.status}
                        </span>
                        <span className={styles.typeBadge}>
                            {property.propertyType} • {property.transactionType}
                        </span>
                    </div>
                    <h1 className={styles.title}>{property.title}</h1>
                    <div className={styles.location}>
                        <MapPin size={20} />
                        <span>{property.location.address}, {property.location.city}</span>
                    </div>
                </div>
                <div className={styles.headerActions}>
                    <div className={styles.price}>
                        {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: property.currency || 'USD',
                            maximumFractionDigits: 0
                        }).format(property.price)}
                    </div>
                    <div className={styles.actionButtons}>
                        <button className={styles.iconButton} title="Share">
                            <Share2 size={20} />
                        </button>
                        {canEdit && (
                            <button
                                onClick={() => navigate(`/properties/${id}/edit`)}
                                className={styles.iconButton}
                                title="Edit"
                            >
                                <Edit2 size={20} />
                            </button>
                        )}
                        {canDelete && (
                            <button
                                onClick={handleDelete}
                                className={`${styles.iconButton} ${styles.deleteButton}`}
                                title="Delete"
                            >
                                <Trash2 size={20} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className={styles.gallery}>
                <div className={styles.mainImage}>
                    <img src={images[activeImage].url} alt={property.title} />
                </div>
                <div className={styles.thumbnails}>
                    {images.map((img, index) => (
                        <div
                            key={index}
                            className={`${styles.thumbnail} ${activeImage === index ? styles.activeThumbnail : ''}`}
                            onClick={() => setActiveImage(index)}
                        >
                            <img src={img.url} alt={`Thumbnail ${index + 1}`} />
                        </div>
                    ))}
                </div>
            </div>

            <div className={styles.contentGrid}>
                <div className={styles.mainContent}>
                    <div className={styles.section}>
                        <h2>Overview</h2>
                        <div className={styles.features}>
                            <div className={styles.featureItem}>
                                <Bed size={24} />
                                <div>
                                    <span className={styles.featureValue}>{property.features.bedrooms}</span>
                                    <span className={styles.featureLabel}>Bedrooms</span>
                                </div>
                            </div>
                            <div className={styles.featureItem}>
                                <Bath size={24} />
                                <div>
                                    <span className={styles.featureValue}>{property.features.bathrooms}</span>
                                    <span className={styles.featureLabel}>Bathrooms</span>
                                </div>
                            </div>
                            <div className={styles.featureItem}>
                                <Maximize size={24} />
                                <div>
                                    <span className={styles.featureValue}>{property.features.area.value}</span>
                                    <span className={styles.featureLabel}>{property.features.area.unit}</span>
                                </div>
                            </div>
                            <div className={styles.featureItem}>
                                <Calendar size={24} />
                                <div>
                                    <span className={styles.featureValue}>{property.features.yearBuilt || 'N/A'}</span>
                                    <span className={styles.featureLabel}>Year Built</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={styles.section}>
                        <h2>Description</h2>
                        <p className={styles.description}>{property.description}</p>
                    </div>

                    {property.features.amenities?.length > 0 && (
                        <div className={styles.section}>
                            <h2>Amenities</h2>
                            <div className={styles.amenities}>
                                {property.features.amenities.map((amenity, index) => (
                                    <div key={index} className={styles.amenity}>
                                        <CheckCircle size={16} />
                                        <span>{amenity}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className={styles.sidebar}>
                    <div className={styles.agentCard}>
                        <h3>Listing Agent</h3>
                        <div className={styles.agentInfo}>
                            <div className={styles.agentAvatar}>
                                {property.listedBy?.firstName?.[0]}{property.listedBy?.lastName?.[0]}
                            </div>
                            <div>
                                <h4>{property.listedBy?.firstName} {property.listedBy?.lastName}</h4>
                                <p>Real Estate Agent</p>
                            </div>
                        </div>
                        <div className={styles.agentContact}>
                            <a href={`mailto:${property.listedBy?.email}`} className={styles.contactLink}>
                                <Mail size={18} />
                                {property.listedBy?.email}
                            </a>
                            {property.listedBy?.phone && (
                                <a href={`tel:${property.listedBy?.phone}`} className={styles.contactLink}>
                                    <Phone size={18} />
                                    {property.listedBy?.phone}
                                </a>
                            )}
                        </div>
                        <button className={styles.contactButton}>
                            Contact Agent
                        </button>
                    </div>

                    <div className={styles.detailsCard}>
                        <h3>Property Details</h3>
                        <div className={styles.detailRow}>
                            <span>Type</span>
                            <span className={styles.detailValue}>{property.propertyType}</span>
                        </div>
                        <div className={styles.detailRow}>
                            <span>Status</span>
                            <span className={styles.detailValue}>{property.status}</span>
                        </div>
                        <div className={styles.detailRow}>
                            <span>Furnishing</span>
                            <span className={styles.detailValue}>{property.features.furnished || 'Not specified'}</span>
                        </div>
                        <div className={styles.detailRow}>
                            <span>Listed</span>
                            <span className={styles.detailValue}>
                                {new Date(property.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PropertyDetail;
