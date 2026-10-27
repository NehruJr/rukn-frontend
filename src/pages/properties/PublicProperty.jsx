import { useLanguage } from "@/hooks/useLanguage";
import { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { propertyService } from '@/services/propertyService';
import { catalogService } from '@/services/catalogService';
import { tourService } from '@/services/tourService';
import TourViewer from '@/components/tour/TourViewer';
import PaymentPlanCalculator from '@/components/PaymentPlanCalculator';
import PropertyOfferModal from '@/components/PropertyOfferModal';
import {
    MapPin, Bed, Bath, Maximize, Calendar, Mail, Phone, CheckCircle, ChevronLeft, ChevronRight,
    Compass, Eye, X, ExternalLink, Printer, MessageCircle, Send, Building2
} from 'lucide-react';
import styles from './PublicProperty.module.css';

const PublicProperty = () => {
    const { t } = useLanguage();
    const { token } = useParams();
    const [searchParams] = useSearchParams();
    const [property, setProperty] = useState(null);
    const [tour, setTour] = useState(null);
    const [tourModalOpen, setTourModalOpen] = useState(false);
    const [offerModalOpen, setOfferModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeImage, setActiveImage] = useState(0);

    // Lead inquiry form state
    const [inquiryData, setInquiryData] = useState({ name: '', phone: '', email: '', message: '' });
    const [sendingInquiry, setSendingInquiry] = useState(false);
    const [inquirySuccess, setInquirySuccess] = useState(false);
    const [inquiryError, setInquiryError] = useState('');

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
    const agency = property.agency;
    const catalogSlug = searchParams.get('catalog') || (agency?.catalogEnabled !== false ? agency?.slug : '');
    const contactPhone = agent?.phone || agency?.whatsapp || agency?.phone || '';
    const cleanWaPhone = String(contactPhone).replace(/[^0-9]/g, '');

    const handleSendInquiry = async (e) => {
        e.preventDefault();
        setInquiryError('');
        setSendingInquiry(true);
        try {
            await catalogService.submitInquiry(catalogSlug || agency?.slug || 'property', {
                name: inquiryData.name,
                phone: inquiryData.phone,
                email: inquiryData.email,
                message: inquiryData.message,
                propertyId: property._id,
                shareToken: property.shareToken || token,
                propertyType: property.propertyType,
                transactionType: property.transactionType
            });
            setInquirySuccess(true);
        } catch (err) {
            setInquiryError(err?.response?.data?.message || 'Could not submit inquiry');
        } finally {
            setSendingInquiry(false);
        }
    };

    return (
        <div className={styles.wrapper}>
            <header className={styles.brandHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                <span className={styles.brand}>
                    {agency?.name ? `${agency.name} • ` : ''}{t('publicProp.poweredBy')}
                </span>
                {catalogSlug && (
                    <Link
                        to={`/catalog/${catalogSlug}`}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            fontSize: '0.88rem',
                            fontWeight: 600,
                            color: agency?.primaryColor || '#2563eb',
                            textDecoration: 'none'
                        }}
                    >
                        <Building2 size={16} />
                        <span>Browse All Agency Properties</span>
                    </Link>
                )}
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

                        {/* Off-Plan Payment Plan & Installment Calculator */}
                        {(property.listingCategory === 'primary_offplan' || property.transactionType === 'sale' || property.paymentPlan?.installmentYears > 0) && (
                            <section className={styles.section} style={{ padding: 0, background: 'transparent', border: 'none' }}>
                                <PaymentPlanCalculator
                                    price={property.price}
                                    currency={property.currency || 'EGP'}
                                    paymentPlan={property.paymentPlan}
                                    deliveryDate={property.developer?.deliveryDate}
                                    developerName={property.developer?.name}
                                    projectName={property.developer?.projectName}
                                    title="Payment Plan & Installment Calculator"
                                />
                            </section>
                        )}

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
                                {cleanWaPhone && (
                                    <a
                                        href={`https://wa.me/${cleanWaPhone}?text=${encodeURIComponent(`Hello, I am interested in "${property.title}" (${window.location.href})`)}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className={styles.contactButton}
                                        style={{ marginTop: '0.6rem', background: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', textDecoration: 'none' }}
                                    >
                                        <MessageCircle size={16} />
                                        <span>WhatsApp Agent</span>
                                    </a>
                                )}
                                <button
                                    type="button"
                                    onClick={() => setOfferModalOpen(true)}
                                    className={styles.contactButton}
                                    style={{ marginTop: '0.6rem', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer' }}
                                >
                                    <Printer size={16} />
                                    <span>Print / PDF Brochure</span>
                                </button>
                            </div>
                        )}

                        {/* Public Lead Inquiry Form */}
                        <div className={styles.agentCard} style={{ marginTop: '1.25rem' }}>
                            <h3 style={{ marginBottom: '0.5rem' }}>Request More Info / Viewing</h3>
                            {inquirySuccess ? (
                                <div style={{ padding: '0.85rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', color: '#166534', fontSize: '0.9rem' }}>
                                    <strong>Inquiry sent!</strong> Our team has received your request and will contact you shortly.
                                </div>
                            ) : (
                                <form onSubmit={handleSendInquiry} style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                                    {inquiryError && (
                                        <div style={{ padding: '0.5rem', background: '#fef2f2', color: '#dc2626', borderRadius: '6px', fontSize: '0.82rem' }}>
                                            {inquiryError}
                                        </div>
                                    )}
                                    <input
                                        type="text"
                                        required
                                        placeholder="Your Full Name *"
                                        value={inquiryData.name}
                                        onChange={(e) => setInquiryData({ ...inquiryData, name: e.target.value })}
                                        style={{ padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                                    />
                                    <input
                                        type="tel"
                                        required
                                        placeholder="Phone / WhatsApp Number *"
                                        value={inquiryData.phone}
                                        onChange={(e) => setInquiryData({ ...inquiryData, phone: e.target.value })}
                                        style={{ padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                                    />
                                    <input
                                        type="email"
                                        placeholder="Email Address (Optional)"
                                        value={inquiryData.email}
                                        onChange={(e) => setInquiryData({ ...inquiryData, email: e.target.value })}
                                        style={{ padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                                    />
                                    <textarea
                                        rows={3}
                                        placeholder="I would like to schedule a viewing or get more details..."
                                        value={inquiryData.message}
                                        onChange={(e) => setInquiryData({ ...inquiryData, message: e.target.value })}
                                        style={{ padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', fontFamily: 'inherit' }}
                                    />
                                    <button
                                        type="submit"
                                        disabled={sendingInquiry}
                                        className={styles.contactButton}
                                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem', cursor: 'pointer', border: 'none' }}
                                    >
                                        <Send size={15} />
                                        <span>{sendingInquiry ? 'Sending...' : 'Send Inquiry'}</span>
                                    </button>
                                </form>
                            )}
                        </div>
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

            {/* Branded PDF Offer Brochure Modal */}
            <PropertyOfferModal
                isOpen={offerModalOpen}
                onClose={() => setOfferModalOpen(false)}
                property={property}
                tour={tour}
            />
        </div>
    );
};

export default PublicProperty;
