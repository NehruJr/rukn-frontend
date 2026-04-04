import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { propertyService } from '@/services/propertyService';
import {
    MapPin, Bed, Bath, Maximize, Calendar, Mail, Phone, CheckCircle, ChevronLeft, ChevronRight
} from 'lucide-react';
import styles from './PublicProperty.module.css';

const PublicProperty = () => {
    const { token } = useParams();
    const [property, setProperty] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeImage, setActiveImage] = useState(0);

    useEffect(() => {
        if (token) {
            fetchProperty();
        } else {
            setError('Invalid link');
            setLoading(false);
        }
    }, [token]);

    const fetchProperty = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await propertyService.getPublicProperty(token);
            setProperty(response?.data ?? response);
        } catch (err) {
            console.error('Error fetching public property:', err);
            setError(err?.response?.data?.message || 'Property not found or link has expired');
        } finally {
            setLoading(false);
        }
    };

    const images = property?.media?.images?.length > 0
        ? property.media.images
        : [{ url: '/placeholder-property.jpg' }];

    const goPrev = () => setActiveImage((i) => (i <= 0 ? images.length - 1 : i - 1));
    const goNext = () => setActiveImage((i) => (i >= images.length - 1 ? 0 : i + 1));

    if (loading) {
        return (
            <div className={styles.wrapper}>
                <header className={styles.brandHeader}>
                    <span className={styles.brand}>Powered by Realy</span>
                </header>
                <div className={styles.loading}>Loading property...</div>
            </div>
        );
    }

    if (error || !property) {
        return (
            <div className={styles.wrapper}>
                <header className={styles.brandHeader}>
                    <span className={styles.brand}>Powered by Realy</span>
                </header>
                <div className={styles.error}>
                    <p>{error || 'Property not found'}</p>
                </div>
            </div>
        );
    }

    const agent = property.listedBy;

    return (
        <div className={styles.wrapper}>
            <header className={styles.brandHeader}>
                <span className={styles.brand}>Powered by Realy</span>
            </header>

            <main className={styles.main}>
                <div className={styles.gallerySection}>
                    <div className={styles.mainImageWrap}>
                        <img
                            src={images[activeImage].url}
                            alt={property.title}
                            className={styles.mainImage}
                        />
                        {images.length > 1 && (
                            <>
                                <button
                                    type="button"
                                    className={styles.galleryNav}
                                    aria-label="Previous image"
                                    onClick={goPrev}
                                >
                                    <ChevronLeft size={28} />
                                </button>
                                <button
                                    type="button"
                                    className={`${styles.galleryNav} ${styles.galleryNavRight}`}
                                    aria-label="Next image"
                                    onClick={goNext}
                                >
                                    <ChevronRight size={28} />
                                </button>
                            </>
                        )}
                    </div>
                    {images.length > 1 && (
                        <div className={styles.thumbnails}>
                            {images.map((img, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    className={`${styles.thumbnail} ${activeImage === index ? styles.activeThumbnail : ''}`}
                                    onClick={() => setActiveImage(index)}
                                >
                                    <img src={img.url} alt={`Thumbnail ${index + 1}`} />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className={styles.content}>
                    <div className={styles.primary}>
                        <div className={styles.badges}>
                            <span className={styles.badge}>{property.status}</span>
                            <span className={styles.typeBadge}>
                                {property.propertyType} • {property.transactionType}
                            </span>
                        </div>
                        <h1 className={styles.title}>{property.title}</h1>
                        <div className={styles.location}>
                            <MapPin size={20} />
                            <span>
                                {property.location?.address}, {property.location?.city}
                            </span>
                        </div>
                        <div className={styles.price}>
                            {new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: property.currency || 'EGP',
                                maximumFractionDigits: 0
                            }).format(property.price)}
                        </div>

                        <section className={styles.section}>
                            <h2>Overview</h2>
                            <div className={styles.features}>
                                <div className={styles.featureItem}>
                                    <Bed size={24} />
                                    <div>
                                        <span className={styles.featureValue}>
                                            {property.features?.bedrooms ?? '—'}
                                        </span>
                                        <span className={styles.featureLabel}>Bedrooms</span>
                                    </div>
                                </div>
                                <div className={styles.featureItem}>
                                    <Bath size={24} />
                                    <div>
                                        <span className={styles.featureValue}>
                                            {property.features?.bathrooms ?? '—'}
                                        </span>
                                        <span className={styles.featureLabel}>Bathrooms</span>
                                    </div>
                                </div>
                                <div className={styles.featureItem}>
                                    <Maximize size={24} />
                                    <div>
                                        <span className={styles.featureValue}>
                                            {property.features?.area?.value ?? '—'}
                                        </span>
                                        <span className={styles.featureLabel}>
                                            {property.features?.area?.unit ?? 'sqft'}
                                        </span>
                                    </div>
                                </div>
                                <div className={styles.featureItem}>
                                    <Calendar size={24} />
                                    <div>
                                        <span className={styles.featureValue}>
                                            {property.features?.yearBuilt ?? 'N/A'}
                                        </span>
                                        <span className={styles.featureLabel}>Year Built</span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {property.description && (
                            <section className={styles.section}>
                                <h2>Description</h2>
                                <p className={styles.description}>{property.description}</p>
                            </section>
                        )}

                        {property.features?.amenities?.length > 0 && (
                            <section className={styles.section}>
                                <h2>Amenities</h2>
                                <div className={styles.amenities}>
                                    {property.features.amenities.map((amenity, index) => (
                                        <div key={index} className={styles.amenity}>
                                            <CheckCircle size={16} />
                                            <span>{amenity}</span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>

                    <aside className={styles.sidebar}>
                        {agent && (
                            <div className={styles.agentCard}>
                                <h3>Contact Agent</h3>
                                <div className={styles.agentInfo}>
                                    <div className={styles.agentAvatar}>
                                        {agent.firstName?.[0]}{agent.lastName?.[0]}
                                    </div>
                                    <div>
                                        <h4>{agent.firstName} {agent.lastName}</h4>
                                        <p>Real Estate Agent</p>
                                    </div>
                                </div>
                                <div className={styles.agentContact}>
                                    {agent.email && (
                                        <a href={`mailto:${agent.email}`} className={styles.contactLink}>
                                            <Mail size={18} />
                                            {agent.email}
                                        </a>
                                    )}
                                    {agent.phone && (
                                        <a href={`tel:${agent.phone}`} className={styles.contactLink}>
                                            <Phone size={18} />
                                            {agent.phone}
                                        </a>
                                    )}
                                </div>
                                {agent.email && (
                                    <a
                                        href={`mailto:${agent.email}`}
                                        className={styles.contactButton}
                                    >
                                        Contact Agent
                                    </a>
                                )}
                            </div>
                        )}
                    </aside>
                </div>
            </main>

            <footer className={styles.footer}>
                <span className={styles.brand}>Powered by Realy</span>
            </footer>
        </div>
    );
};

export default PublicProperty;
