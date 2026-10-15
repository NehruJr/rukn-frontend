import { useLanguage } from "@/hooks/useLanguage";
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { propertyService } from '@/services/propertyService';
import { tourService } from '@/services/tourService';
import TourViewer from '@/components/tour/TourViewer';
import {
    MapPin, Bed, Bath, Maximize, Calendar, Mail, Phone, CheckCircle, ChevronLeft, ChevronRight,
    Compass, Eye, X, ExternalLink
} from 'lucide-react';
import styles from './PublicProperty.module.css';

const PublicProperty = () => {
    const { t } = useLanguage();
    const { token } = useParams();
    const [property, setProperty] = useState(null);
    const [tour, setTour] = useState(null);
    const [tourModalOpen, setTourModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeImage, setActiveImage] = useState(0);

    useEffect(() => {
        if (token) {
            fetchProperty();
        } else {
            setError(t('publicProp.invalidLink'));
            setLoading(false);
        }
    }, [token]);

    const fetchProperty = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await propertyService.getPublicProperty(token);
            const propData = response?.data ?? response;
            setProperty(propData);

            const tourToken = propData?.media?.virtualTour || propData?.virtualTourToken;
            if (tourToken) {
                try {
                    const tourRes = await tourService.getPublicTour(tourToken);
                    setTour(tourRes?.data ?? tourRes);
                } catch (tErr) {
                    console.warn('Could not load virtual tour:', tErr);
                }
            }
        } catch (err) {
            console.error('Error fetching public property:', err);
            setError(err?.response?.data?.message || t('publicProp.propNotFoundExpired'));
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
                    <span className={styles.brand}>{t('publicProp.poweredBy')}</span>
                </header>
                <div className={styles.loading}>{t('dashboard_extra.loading_property')}</div>
            </div>
        );
    }

    if (error || !property) {
        return (
            <div className={styles.wrapper}>
                <header className={styles.brandHeader}>
                    <span className={styles.brand}>{t('publicProp.poweredBy')}</span>
                </header>
                <div className={styles.error}>
                    <p>{error || t('publicProp.propNotFound')}</p>
                </div>
            </div>
        );
    }

    const agent = property.listedBy;

    return (
        <div className={styles.wrapper}>
            <header className={styles.brandHeader}>
                <span className={styles.brand}>{t('publicProp.poweredBy')}</span>
            </header>

            <main className={styles.main}>
                <div className={styles.gallerySection}>
                    <div className={styles.mainImageWrap}>
                        {tour && (
                            <button
                                type="button"
                                className={styles.tourBadgeOnImage}
                                onClick={() => setTourModalOpen(true)}
                                title="Explore in 360°"
                            >
                                <Compass size={16} />
                                <span>360° Tour</span>
                            </button>
                        )}
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

                        {tour && (
                            <div className={styles.tourActionCard}>
                                <div className={styles.tourActionText}>
                                    <h3>Explore in 360° Virtual Reality</h3>
                                    <p>Walk through {tour.scenes?.length || 0} interactive rooms with gyroscope and VR headset support.</p>
                                </div>
                                <button
                                    type="button"
                                    className={styles.tourLaunchBtn}
                                    onClick={() => setTourModalOpen(true)}
                                >
                                    <Eye size={18} />
                                    <span>Take Virtual Tour</span>
                                </button>
                            </div>
                        )}

                        <section className={styles.section}>
                            <h2>{t('dashboard_extra.overview')}</h2>
                            <div className={styles.features}>
                                <div className={styles.featureItem}>
                                    <Bed size={24} />
                                    <div>
                                        <span className={styles.featureValue}>
                                            {property.features?.bedrooms ?? '—'}
                                        </span>
                                        <span className={styles.featureLabel}>{t('dashboard_extra.bedrooms')}</span>
                                    </div>
                                </div>
                                <div className={styles.featureItem}>
                                    <Bath size={24} />
                                    <div>
                                        <span className={styles.featureValue}>
                                            {property.features?.bathrooms ?? '—'}
                                        </span>
                                        <span className={styles.featureLabel}>{t('dashboard_extra.bathrooms')}</span>
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
                                        <span className={styles.featureLabel}>{t('dashboard_extra.year_built')}</span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {property.description && (
                            <section className={styles.section}>
                                <h2>{t('dashboard_extra.description')}</h2>
                                <p className={styles.description}>{property.description}</p>
                            </section>
                        )}

                        {property.features?.amenities?.length > 0 && (
                            <section className={styles.section}>
                                <h2>{t('dashboard_extra.amenities')}</h2>
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
                                <h3>{t('dashboard_extra.contact_agent')}</h3>
                                <div className={styles.agentInfo}>
                                    <div className={styles.agentAvatar}>
                                        {agent.firstName?.[0]}{agent.lastName?.[0]}
                                    </div>
                                    <div>
                                        <h4>{agent.firstName} {agent.lastName}</h4>
                                        <p>{t('dashboard_extra.real_estate_agent')}</p>
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
                                    >{t('dashboard_extra.contact_agent')}</a>
                                )}
                            </div>
                        )}
                    </aside>
                </div>
            </main>

            <footer className={styles.footer}>
                <span className={styles.brand}>{t('publicProp.poweredBy')}</span>
            </footer>

            {/* 360 Virtual Tour Modal */}
            {tourModalOpen && tour && (
                <div className={styles.tourModalOverlay} onClick={() => setTourModalOpen(false)}>
                    <div className={styles.tourModalContent} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.tourModalHeader}>
                            <h3>{tour.title || '360° Virtual Walkthrough'}</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <a
                                    href={`/tour/${tour.shareToken}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.4rem',
                                        fontSize: '0.85rem',
                                        color: '#3b82f6',
                                        textDecoration: 'none',
                                        fontWeight: 600
                                    }}
                                >
                                    <ExternalLink size={14} /> Fullscreen
                                </a>
                                <button
                                    type="button"
                                    onClick={() => setTourModalOpen(false)}
                                    className={styles.tourModalCloseBtn}
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>
                        <div style={{ flex: 1, height: '70vh' }}>
                            <TourViewer tour={tour} height="70vh" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PublicProperty;
