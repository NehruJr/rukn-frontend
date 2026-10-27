import { useLanguage } from "@/hooks/useLanguage";
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { propertyService } from '@/services/propertyService';
import { tourService } from '@/services/tourService';
import { leadService } from '@/services/leadService';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import AssignAgentsModal from '@/components/AssignAgentsModal';
import TourViewer from '@/components/tour/TourViewer';
import TourEditor from '@/components/tour/TourEditor';
import PaymentPlanCalculator from '@/components/PaymentPlanCalculator';
import PropertyOfferModal from '@/components/PropertyOfferModal';
import { getWhatsAppPitchUrl } from '@/utils/whatsappPitch';
import {
    MapPin, Bed, Bath, Maximize, Edit2, Trash2, ArrowLeft,
    Calendar, Mail, Phone, CheckCircle, Share2, UserPlus,
    Compass, Sparkles, X, ExternalLink, Copy, Eye, EyeOff, Users,
    MessageSquare, Shield, Building, Globe, Printer
} from 'lucide-react';
import styles from './PropertyDetail.module.css';

const PropertyDetail = () => {
    const { t } = useLanguage();
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, hasPermission, hasRole } = useAuthStore();
    const { addToast } = useUIStore();
    const [property, setProperty] = useState(null);
    const [tour, setTour] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadingTour, setLoadingTour] = useState(false);
    const [matchedLeads, setMatchedLeads] = useState([]);
    const [loadingMatches, setLoadingMatches] = useState(false);
    const [activeImage, setActiveImage] = useState(0);
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [tourViewerOpen, setTourViewerOpen] = useState(false);
    const [tourEditorOpen, setTourEditorOpen] = useState(false);
    const [offerModalOpen, setOfferModalOpen] = useState(false);

    useEffect(() => {
        fetchProperty();
        fetchTour();
        fetchMatchedLeads();
    }, [id]);

    const fetchTour = async () => {
        try {
            setLoadingTour(true);
            const res = await tourService.getTourByProperty(id);
            setTour(res?.data ?? res);
        } catch (err) {
            setTour(null);
        } finally {
            setLoadingTour(false);
        }
    };

    const fetchMatchedLeads = async () => {
        try {
            setLoadingMatches(true);
            const res = await propertyService.getMatchedLeads(id);
            setMatchedLeads(res?.data || []);
        } catch (err) {
            console.error('Error fetching matched leads:', err);
        } finally {
            setLoadingMatches(false);
        }
    };

    const handleCopyTourLink = async () => {
        if (!tour?.shareToken) return;
        const url = `${window.location.origin}/tour/${tour.shareToken}`;
        await navigator.clipboard.writeText(url);
        addToast({ type: 'success', message: '360° Virtual Tour link copied!' });
    };

    const fetchProperty = async () => {
        try {
            setLoading(true);
            const response = await propertyService.getPropertyById(id);
            setProperty(response?.data ?? response);
        } catch (err) {
            console.error('Error fetching property:', err);
            alert('Failed to load property details');
            navigate('/properties');
        } finally {
            setLoading(false);
        }
    };

    const canAssignAgents = hasRole('admin', 'manager', 'team_leader');

    const handleAssignConfirm = async (propertyId, agentIds) => {
        const res = await propertyService.assignAgents(propertyId, agentIds);
        setProperty(res?.data ?? res);
        addToast({ type: 'success', message: 'Agents assigned successfully' });
    };

    const handleShare = async () => {
        try {
            const res = await propertyService.getShareLink(id);
            const shareToken = res?.data?.shareToken || property?.shareToken || id;
            if (res?.data?.shareToken) {
                setProperty(prev => prev ? { ...prev, shareToken: res.data.shareToken } : prev);
            }
            const path = res?.data?.shareUrl ?? `/share/${shareToken}`;
            const url = path.startsWith('http') ? path : `${window.location.origin}${path}`;
            await navigator.clipboard.writeText(url);
            addToast({ type: 'success', message: 'Link copied!' });
        } catch (err) {
            const fallbackToken = property?.shareToken || property?._id || id;
            if (fallbackToken) {
                const url = `${window.location.origin}/share/${fallbackToken}`;
                await navigator.clipboard.writeText(url);
                addToast({ type: 'success', message: 'Link copied!' });
                return;
            }
            console.error('Error generating share link:', err);
            addToast({ type: 'error', message: err?.response?.data?.message || 'Failed to generate share link' });
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

    const handleToggleCatalog = async () => {
        try {
            const nextState = property.showInCatalog === false;
            const res = await propertyService.toggleCatalogVisibility(id, nextState);
            setProperty((prev) => (prev ? { ...prev, showInCatalog: res?.data?.showInCatalog ?? nextState } : prev));
            addToast({
                type: 'success',
                message: nextState ? 'Property shown in Public Catalog' : 'Property hidden from Public Catalog'
            });
        } catch (err) {
            addToast({ type: 'error', message: err?.response?.data?.message || 'Failed to update catalog visibility' });
        }
    };

    const handleSendWhatsAppPitch = async (lead, language = 'en') => {
        const url = getWhatsAppPitchUrl({
            property,
            lead,
            language,
            tourShareToken: tour?.shareToken
        });
        window.open(url, '_blank');

        try {
            await leadService.addActivity(lead._id, {
                type: 'whatsapp',
                title: `WhatsApp Pitch (${language.toUpperCase()}) - ${property.title}`,
                description: `Shared listing "${property.title}" (${property.currency} ${Number(property.price).toLocaleString()}) via WhatsApp.`
            });
            addToast({ type: 'success', message: `WhatsApp opened & activity logged for ${lead.firstName}` });
        } catch (err) {
            console.error('Failed to log WhatsApp activity:', err);
        }
    };

    if (loading) return <div className={styles.loading}>{t('dashboard_extra.loading_property_details')}</div>;
    if (!property) return null;

    const canEdit = user?.role === 'admin' || (user?._id === property.listedBy?._id && hasPermission('properties.edit'));
    const canDelete = user?.role === 'admin' || (user?._id === property.listedBy?._id && hasPermission('properties.delete'));

    const images = property.media?.images?.length > 0
        ? property.media.images
        : [{ url: '/placeholder-property.jpg' }];

    return (
        <div className={styles.container}>
            <button onClick={() => navigate('/properties')} className={styles.backButton}>
                <ArrowLeft size={20} />{t('dashboard_extra.back_to_properties')}
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
                        {property.listingCategory === 'primary_offplan' && (
                            <span className={styles.offplanBadge}>Off-Plan</span>
                        )}
                        {(property.country || property.branch) && (
                            <span className={styles.branchHeaderBadge}>
                                <Globe size={13} />
                                {property.branch ? `${property.country || ''} • ${property.branch}` : property.country}
                            </span>
                        )}
                    </div>
                    <h1 className={styles.title}>{property.title}</h1>
                    {property.developer?.name && (
                        <div className={styles.developerHeading}>
                            <Building size={16} />
                            <span>
                                {property.developer.projectName
                                    ? `${property.developer.projectName} by ${property.developer.name}`
                                    : property.developer.name}
                            </span>
                        </div>
                    )}
                    <div className={styles.location}>
                        <MapPin size={20} />
                        <span>{[property.location?.address, property.location?.area, property.location?.city].filter(Boolean).join(', ')}</span>
                    </div>
                </div>
                <div className={styles.headerActions}>
                    <div className={styles.price}>
                        {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: property.currency || 'EGP',
                            maximumFractionDigits: 0
                        }).format(property.price)}
                    </div>
                    <div className={styles.actionButtons}>
                        <button
                            type="button"
                            onClick={() => setOfferModalOpen(true)}
                            className={styles.iconButton}
                            title="Print / Save Branded PDF Offer"
                        >
                            <Printer size={20} />
                        </button>
                        {canAssignAgents && (
                            <button
                                onClick={() => setAssignModalOpen(true)}
                                className={styles.iconButton}
                                title="Assign Agents"
                            >
                                <UserPlus size={20} />
                            </button>
                        )}
                        {canEdit && (
                            <button
                                type="button"
                                onClick={handleToggleCatalog}
                                className={styles.iconButton}
                                title={property.showInCatalog === false ? 'Show in Public Catalog' : 'Hide from Public Catalog'}
                                style={{ color: property.showInCatalog === false ? '#64748b' : '#16a34a' }}
                            >
                                {property.showInCatalog === false ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        )}
                        <button
                            onClick={handleShare}
                            className={styles.iconButton}
                            title="Share"
                        >
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

            {/* 360° Virtual Tour Banner */}
            {(tour || canEdit) && (
                <div className={styles.tourBanner}>
                    <div className={styles.tourBannerLeft}>
                        <div className={styles.tourBannerIcon}>
                            <Compass size={24} />
                        </div>
                        <div>
                            <div className={styles.tourBannerTitle}>
                                {tour ? '360° Immersive Virtual Walkthrough' : '360° Virtual Tour Available'}
                            </div>
                            <div className={styles.tourBannerDesc}>
                                {tour
                                    ? `${tour.scenes?.length || 0} interactive rooms • Gyroscope mobile support • VR Stereo mode`
                                    : 'Upload 360° photos or mobile phone panoramas to create an interactive tour'}
                            </div>
                        </div>
                    </div>
                    <div className={styles.tourBannerActions}>
                        {tour && (
                            <>
                                <button
                                    onClick={() => setTourViewerOpen(true)}
                                    className={styles.tourBtnPrimary}
                                >
                                    <Eye size={18} />
                                    <span>Launch 360° Tour</span>
                                </button>
                                <button
                                    onClick={() => window.open(`/tour/${tour.shareToken}`, '_blank')}
                                    className={styles.tourBtnSecondary}
                                    title="Open Public Tour in New Tab"
                                >
                                    <ExternalLink size={16} />
                                    <span>Public Link</span>
                                </button>
                                <button
                                    onClick={handleCopyTourLink}
                                    className={styles.tourBtnSecondary}
                                    title="Copy Tour Link"
                                >
                                    <Copy size={16} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setOfferModalOpen(true)}
                                    className={styles.tourBtnSecondary}
                                    title="Generate 1-Page A4 PDF Offer with QR Code"
                                >
                                    <Printer size={16} />
                                    <span>PDF Offer</span>
                                </button>
                            </>
                        )}
                        {canEdit && (
                            <button
                                onClick={() => setTourEditorOpen(true)}
                                className={styles.tourBtnEditor}
                            >
                                <Sparkles size={16} />
                                <span>{tour ? 'Edit 360° Tour' : 'Create 360° Tour'}</span>
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Image Gallery */}
            <div className={styles.gallery}>
                <div className={styles.mainImage}>
                    <img src={images[activeImage]?.url} alt={property.title} />
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
                        <h2>{t('dashboard_extra.overview')}</h2>
                        <div className={styles.features}>
                            <div className={styles.featureItem}>
                                <Bed size={24} />
                                <div>
                                    <span className={styles.featureValue}>{property.features?.bedrooms ?? 'N/A'}</span>
                                    <span className={styles.featureLabel}>{t('dashboard_extra.bedrooms')}</span>
                                </div>
                            </div>
                            <div className={styles.featureItem}>
                                <Bath size={24} />
                                <div>
                                    <span className={styles.featureValue}>{property.features?.bathrooms ?? 'N/A'}</span>
                                    <span className={styles.featureLabel}>{t('dashboard_extra.bathrooms')}</span>
                                </div>
                            </div>
                            <div className={styles.featureItem}>
                                <Maximize size={24} />
                                <div>
                                    <span className={styles.featureValue}>{property.features?.area?.value ?? 'N/A'}</span>
                                    <span className={styles.featureLabel}>{property.features?.area?.unit || 'sqm'}</span>
                                </div>
                            </div>
                            <div className={styles.featureItem}>
                                <Calendar size={24} />
                                <div>
                                    <span className={styles.featureValue}>{property.features?.yearBuilt ?? 'N/A'}</span>
                                    <span className={styles.featureLabel}>{t('dashboard_extra.year_built')}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Developer & Project Specifications Section */}
                    {property.developer?.name && (
                        <div className={styles.section}>
                            <h2>Developer & Project Specifications</h2>
                            <div className={styles.developerGrid}>
                                <div className={styles.devSpecItem}>
                                    <span className={styles.devSpecLabel}>Developer</span>
                                    <span className={styles.devSpecValue}>{property.developer.name}</span>
                                </div>
                                {property.developer.projectName && (
                                    <div className={styles.devSpecItem}>
                                        <span className={styles.devSpecLabel}>Project / Compound</span>
                                        <span className={styles.devSpecValue}>{property.developer.projectName}</span>
                                    </div>
                                )}
                                {property.developer.deliveryDate && (
                                    <div className={styles.devSpecItem}>
                                        <span className={styles.devSpecLabel}>Delivery Date</span>
                                        <span className={styles.devSpecValue}>
                                            {new Date(property.developer.deliveryDate).toLocaleDateString()}
                                        </span>
                                    </div>
                                )}
                                {property.developer.finishingType && (
                                    <div className={styles.devSpecItem}>
                                        <span className={styles.devSpecLabel}>Finishing</span>
                                        <span className={styles.devSpecValue}>
                                            {property.developer.finishingType.replace(/_/g, ' ')}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Off-Plan Payment Plan & Installment Calculator */}
                    {(property.listingCategory === 'primary_offplan' || property.transactionType === 'sale' || property.paymentPlan?.installmentYears > 0) && (
                        <div className={styles.section} style={{ padding: 0, background: 'transparent', border: 'none' }}>
                            <PaymentPlanCalculator
                                price={property.price}
                                currency={property.currency || 'EGP'}
                                paymentPlan={property.paymentPlan}
                                deliveryDate={property.developer?.deliveryDate}
                                developerName={property.developer?.name}
                                projectName={property.developer?.projectName}
                                title="Payment Plan & Installment Calculator"
                            />
                        </div>
                    )}

                    <div className={styles.section}>
                        <h2>{t('dashboard_extra.description')}</h2>
                        <p className={styles.description}>{property.description}</p>
                    </div>

                    {property.features?.amenities?.length > 0 && (
                        <div className={styles.section}>
                            <h2>{t('dashboard_extra.amenities')}</h2>
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

                    {/* Matched Buyers Section */}
                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <h2>
                                <Users size={22} color="#2563eb" />
                                <span>Matched Buyers ({matchedLeads.length})</span>
                            </h2>
                            <span className={styles.subtitle}>AI-ranked active buyers seeking properties like this</span>
                        </div>

                        {loadingMatches ? (
                            <p className={styles.loadingText}>Scoring active buyers...</p>
                        ) : matchedLeads.length === 0 ? (
                            <p className={styles.emptyText}>No active buyers currently match this property's specs.</p>
                        ) : (
                            <div className={styles.matchedBuyersList}>
                                {matchedLeads.map(({ lead, matchScore, matchReasons }) => (
                                    <div key={lead._id} className={styles.matchedBuyerCard}>
                                        <div className={styles.buyerHeader}>
                                            <div>
                                                <Link to={`/leads/${lead._id}`} className={styles.buyerName}>
                                                    {lead.firstName} {lead.lastName}
                                                    <ExternalLink size={14} />
                                                </Link>
                                                <div className={styles.buyerBadges}>
                                                    <span className={`${styles.priorityBadge} ${styles[lead.priority]}`}>
                                                        {lead.priority}
                                                    </span>
                                                    <span className={styles.scoreBadge}>
                                                        {matchScore}% Match
                                                    </span>
                                                </div>
                                            </div>
                                            <div className={styles.pitchButtons}>
                                                <button
                                                    onClick={() => handleSendWhatsAppPitch(lead, 'en')}
                                                    className={styles.pitchBtnEn}
                                                    title="Send English WhatsApp Pitch"
                                                >
                                                    <MessageSquare size={14} /> EN Pitch
                                                </button>
                                                <button
                                                    onClick={() => handleSendWhatsAppPitch(lead, 'ar')}
                                                    className={styles.pitchBtnAr}
                                                    title="Send Arabic WhatsApp Pitch"
                                                >
                                                    <MessageSquare size={14} /> AR Pitch
                                                </button>
                                            </div>
                                        </div>

                                        <div className={styles.scoreBarTrack}>
                                            <div
                                                className={styles.scoreBarFill}
                                                style={{ width: `${matchScore}%` }}
                                            />
                                        </div>

                                        <div className={styles.reasonsList}>
                                            {matchReasons?.map((reason, idx) => (
                                                <span key={idx} className={styles.reasonTag}>✓ {reason}</span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className={styles.sidebar}>
                    {/* Owner Details Card (Masked vs Unmasked) */}
                    <div className={styles.detailsCard}>
                        <h3>Owner Details</h3>
                        {property.owner?.isMasked ? (
                            <div className={styles.maskedOwnerBox}>
                                <div className={styles.maskedHeader}>
                                    <Shield size={18} className={styles.shieldIcon} />
                                    <span className={styles.maskedBadge}>Protected Owner - Blind Inventory</span>
                                </div>
                                <p className={styles.maskedTitle}>{property.owner.name || 'Protected Owner'}</p>
                                <p className={styles.maskedNotice}>
                                    Direct seller contact (phone & email) is protected under agency blind inventory policy. Contact your agency manager or listing agent for direct owner inquiries.
                                </p>
                            </div>
                        ) : (
                            <div className={styles.ownerUnmaskedBox}>
                                <p className={styles.ownerName}>{property.owner?.name || 'Private Seller'}</p>
                                {property.owner?.phone && (
                                    <a href={`tel:${property.owner.phone}`} className={styles.contactLink}>
                                        <Phone size={16} />
                                        {property.owner.phone}
                                    </a>
                                )}
                                {property.owner?.email && (
                                    <a href={`mailto:${property.owner.email}`} className={styles.contactLink}>
                                        <Mail size={16} />
                                        {property.owner.email}
                                    </a>
                                )}
                            </div>
                        )}
                    </div>

                    {canAssignAgents && (property.assignedAgents?.length > 0) && (
                        <div className={styles.detailsCard}>
                            <h3>{t('dashboard_extra.assigned_agents')}</h3>
                            <ul className={styles.assignedList}>
                                {property.assignedAgents.map((agent) => (
                                    <li key={agent._id} className={styles.assignedItem}>
                                        <span className={styles.assignedName}>
                                            {agent.firstName} {agent.lastName}
                                        </span>
                                        {agent.email && (
                                            <span className={styles.assignedEmail}>{agent.email}</span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    <div className={styles.agentCard}>
                        <h3>{t('dashboard_extra.listing_agent')}</h3>
                        <div className={styles.agentInfo}>
                            <div className={styles.agentAvatar}>
                                {property.listedBy?.firstName?.[0]}{property.listedBy?.lastName?.[0]}
                            </div>
                            <div>
                                <h4>{property.listedBy?.firstName} {property.listedBy?.lastName}</h4>
                                <p>{t('dashboard_extra.real_estate_agent')}</p>
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
                        <button className={styles.contactButton}>{t('dashboard_extra.contact_agent')}</button>
                    </div>

                    <div className={styles.detailsCard}>
                        <h3>{t('dashboard_extra.property_details')}</h3>
                        <div className={styles.detailRow}>
                            <span>{t('dashboard_extra.type')}</span>
                            <span className={styles.detailValue}>{property.propertyType}</span>
                        </div>
                        <div className={styles.detailRow}>
                            <span>Category</span>
                            <span className={styles.detailValue}>{property.listingCategory?.replace(/_/g, ' ') || 'Resale'}</span>
                        </div>
                        <div className={styles.detailRow}>
                            <span>Country</span>
                            <span className={styles.detailValue}>{property.country || 'Egypt'}</span>
                        </div>
                        <div className={styles.detailRow}>
                            <span>Branch</span>
                            <span className={styles.detailValue}>{property.branch || 'Main Branch'}</span>
                        </div>
                        <div className={styles.detailRow}>
                            <span>{t('dashboard_extra.status')}</span>
                            <span className={styles.detailValue}>{property.status}</span>
                        </div>
                        <div className={styles.detailRow}>
                            <span>{t('dashboard_extra.furnishing')}</span>
                            <span className={styles.detailValue}>{property.features?.furnished || 'Not specified'}</span>
                        </div>
                        <div className={styles.detailRow}>
                            <span>{t('dashboard_extra.listed')}</span>
                            <span className={styles.detailValue}>
                                {new Date(property.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <AssignAgentsModal
                isOpen={assignModalOpen}
                onClose={() => setAssignModalOpen(false)}
                propertyId={id}
                assignedAgentIds={(property.assignedAgents || []).map(a => a._id || a)}
                onConfirm={handleAssignConfirm}
            />

            {/* 360 Tour Viewer Modal */}
            {tourViewerOpen && tour && (
                <div className={styles.tourModalOverlay} onClick={() => setTourViewerOpen(false)}>
                    <div className={styles.tourModalContent} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.tourModalHeader}>
                            <h3>{tour.title || '360° Virtual Walkthrough'}</h3>
                            <div className={styles.tourModalHeaderActions}>
                                <button
                                    onClick={() => window.open(`/tour/${tour.shareToken}`, '_blank')}
                                    className={styles.tourBtnSecondary}
                                    style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                                >
                                    <ExternalLink size={14} /> Fullscreen
                                </button>
                                <button
                                    onClick={() => setTourViewerOpen(false)}
                                    className={styles.tourModalCloseBtn}
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>
                        <div className={styles.tourModalBody}>
                            <TourViewer tour={tour} height="70vh" />
                        </div>
                    </div>
                </div>
            )}

            {/* 360 Tour Studio Editor Modal */}
            {tourEditorOpen && (
                <div className={styles.tourModalOverlay} onClick={() => setTourEditorOpen(false)}>
                    <div className={styles.tourModalContent} style={{ maxWidth: '1200px' }} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.tourModalHeader}>
                            <h3>360° Virtual Tour Studio</h3>
                            <button
                                onClick={() => setTourEditorOpen(false)}
                                className={styles.tourModalCloseBtn}
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className={styles.tourModalBody} style={{ padding: '1.5rem' }}>
                            <TourEditor
                                propertyId={id}
                                existingTour={tour}
                                onSaved={(savedTour) => {
                                    setTour(savedTour);
                                    setTourEditorOpen(false);
                                    addToast({ type: 'success', message: '360° Virtual Tour saved successfully!' });
                                }}
                            />
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

export default PropertyDetail;
