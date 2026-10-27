import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { catalogService } from '@/services/catalogService';
import { PROPERTY_TYPES } from '@/utils/constants';
import {
    MapPin, Bed, Bath, Maximize, Phone, Mail, Globe, Search,
    X, Building2, MessageCircle, Send, CheckCircle2, ExternalLink, Sparkles
} from 'lucide-react';
import styles from './PublicCatalog.module.css';

const LABELS = {
    en: {
        all: 'All Listings',
        forSale: 'For Sale',
        forRent: 'For Rent',
        searchPlaceholder: 'Search by title, project, developer, city, or area...',
        propertyType: 'Property Type',
        allTypes: 'All Types',
        cityLocation: 'City / Area',
        allCities: 'All Cities',
        bedrooms: 'Bedrooms',
        anyBeds: 'Any',
        minPrice: 'Min Price',
        maxPrice: 'Max Price',
        sortBy: 'Sort By',
        sortNewest: 'Featured & Newest',
        sortPriceAsc: 'Price: Low to High',
        sortPriceDesc: 'Price: High to Low',
        clearFilters: 'Clear',
        showingCount: 'Showing',
        of: 'of',
        propertiesAvailable: 'properties available',
        activeListings: 'Active Properties',
        viewDetails: 'View Details',
        inquire: 'Inquire',
        whatsapp: 'WhatsApp',
        callUs: 'Call',
        emailUs: 'Email',
        sendInquiry: 'Send Inquiry',
        beds: 'Beds',
        baths: 'Baths',
        offPlan: 'Off-Plan',
        featured: 'Featured',
        hotDeal: 'Hot Deal',
        downPayment: 'Down',
        yrs: 'Yrs',
        noPropertiesTitle: 'No matching properties found',
        noPropertiesSub: 'Try adjusting your search filters or contact us directly for off-market listings.',
        loadingCatalog: 'Loading agency catalog...',
        notFoundTitle: 'Catalog Not Found',
        notFoundSub: 'This agency catalog link may be invalid or currently unavailable.',
        prev: 'Previous',
        next: 'Next',
        page: 'Page',
        inquiryModalTitleProp: 'Inquire About This Property',
        inquiryModalTitleGeneral: 'Contact Our Agency',
        yourName: 'Full Name *',
        nameHint: 'Enter your first and last name',
        nameError: 'Please enter your full name.',
        yourPhone: 'Phone / WhatsApp Number *',
        phoneHint: 'Include country code (e.g. +20 100 000 0000)',
        phoneError: 'Please enter a valid phone number.',
        yourEmail: 'Email Address (Optional)',
        emailHint: 'Format: name@example.com',
        emailError: 'Please enter a valid email address.',
        yourMessage: 'Message / Requirements',
        messagePlaceholder: 'I am interested in scheduling a viewing or receiving payment plan details...',
        submitInquiry: 'Send Inquiry',
        submitting: 'Sending...',
        inquirySentTitle: 'Inquiry Received!',
        inquirySentSub: 'Thank you! Your inquiry has been logged directly with our agency team and an agent will reach out shortly.',
        continueWhatsApp: 'Continue on WhatsApp',
        close: 'Close',
        poweredBy: 'Powered by Rukn Real Estate CRM'
    },
    ar: {
        all: 'جميع العقارات',
        forSale: 'للبيع',
        forRent: 'للإيجار',
        searchPlaceholder: 'ابحث بالعنوان، المشروع، المطور، المدينة أو المنطقة...',
        propertyType: 'نوع العقار',
        allTypes: 'كل الأنواع',
        cityLocation: 'المدينة / المنطقة',
        allCities: 'كل المدن',
        bedrooms: 'غرف النوم',
        anyBeds: 'الكل',
        minPrice: 'أقل سعر',
        maxPrice: 'أعلى سعر',
        sortBy: 'ترتيب حسب',
        sortNewest: 'المميزة والأحدث',
        sortPriceAsc: 'السعر: من الأقل للأعلى',
        sortPriceDesc: 'السعر: من الأعلى للأقل',
        clearFilters: 'مسح',
        showingCount: 'عرض',
        of: 'من',
        propertiesAvailable: 'عقار متاح',
        activeListings: 'عقار متاح',
        viewDetails: 'التفاصيل',
        inquire: 'استفسر الآن',
        whatsapp: 'واتساب',
        callUs: 'اتصال',
        emailUs: 'البريد',
        sendInquiry: 'طلب تواصل',
        beds: 'غرف',
        baths: 'حمام',
        offPlan: 'تحت الإنشاء',
        featured: 'مميز',
        hotDeal: 'فرصة مميزة',
        downPayment: 'مقدم',
        yrs: 'سنوات',
        noPropertiesTitle: 'لا توجد عقارات مطابقة للبحث',
        noPropertiesSub: 'جرب تعديل الفلاتر أو تواصل معنا مباشرة للحصول على عروض إضافية.',
        loadingCatalog: 'جاري تحميل كتالوج العقارات...',
        notFoundTitle: 'الكتالوج غير متوفر',
        notFoundSub: 'رابط الكتالوج غير صحيح أو غير متاح حالياً.',
        prev: 'السابق',
        next: 'التالي',
        page: 'صفحة',
        inquiryModalTitleProp: 'استفسر عن هذا العقار',
        inquiryModalTitleGeneral: 'تواصل مع الشركة',
        yourName: 'الاسم الكامل *',
        nameHint: 'أدخل الاسم الأول واسم العائلة',
        nameError: 'يرجى إدخال الاسم الكامل.',
        yourPhone: 'رقم الهاتف / واتساب *',
        phoneHint: 'مثال: +20 100 000 0000',
        phoneError: 'يرجى إدخال رقم هاتف صحيح.',
        yourEmail: 'البريد الإلكتروني (اختياري)',
        emailHint: 'مثال: name@example.com',
        emailError: 'يرجى إدخال بريد إلكتروني صحيح.',
        yourMessage: 'رسالتك / متطلباتك',
        messagePlaceholder: 'أود الاستفسار عن التفاصيل أو تحديد موعد للمعاينة...',
        submitInquiry: 'إرسال الاستفسار',
        submitting: 'جاري الإرسال...',
        inquirySentTitle: 'تم إرسال استفسارك بنجاح!',
        inquirySentSub: 'شكراً لتواصلك معنا! تم تسجيل طلبك لدى فريق المبيعات وسيتواصل معك أحد المستشارين قريباً.',
        continueWhatsApp: 'متابعة عبر واتساب',
        close: 'إغلاق',
        poweredBy: 'مدعوم بواسطة نظام ركن العقاري'
    }
};

function cleanPhoneForWhatsApp(phone) {
    if (!phone) return '';
    return String(phone).replace(/[^0-9]/g, '');
}

const PublicCatalog = () => {
    const { slug } = useParams();
    const [agency, setAgency] = useState(null);
    const [properties, setProperties] = useState([]);
    const [facets, setFacets] = useState({ cities: [], propertyTypes: [], developers: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lang, setLang] = useState('en');
    const [langInitialized, setLangInitialized] = useState(false);

    const [filters, setFilters] = useState({
        search: '',
        transactionType: '',
        propertyType: '',
        city: '',
        bedrooms: '',
        minPrice: '',
        maxPrice: '',
        sort: 'newest'
    });

    const [pagination, setPagination] = useState({
        page: 1,
        pages: 1,
        total: 0
    });

    // Inquiry modal state (<dialog> ref)
    const dialogRef = useRef(null);
    const [selectedProperty, setSelectedProperty] = useState(null);
    const [inquiryForm, setInquiryForm] = useState({
        name: '',
        phone: '',
        email: '',
        message: ''
    });
    const [submittingInquiry, setSubmittingInquiry] = useState(false);
    const [inquiryError, setInquiryError] = useState('');
    const [inquirySuccess, setInquirySuccess] = useState(false);

    const L = LABELS[lang] || LABELS.en;

    // Fallback for <dialog closedby="any"> on browsers without native closedBy support (e.g., Safari)
    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;

        const handleBackdropClick = (event) => {
            if ('closedBy' in HTMLDialogElement.prototype) return;
            if (event.target !== dialog) return;
            const rect = dialog.getBoundingClientRect();
            const isDialogContent = (
                rect.top <= event.clientY &&
                event.clientY <= rect.top + rect.height &&
                rect.left <= event.clientX &&
                event.clientX <= rect.left + rect.width
            );
            if (!isDialogContent) {
                dialog.close();
            }
        };

        dialog.addEventListener('click', handleBackdropClick);
        return () => dialog.removeEventListener('click', handleBackdropClick);
    }, [loading]);

    useEffect(() => {
        if (slug) {
            fetchCatalog();
        }
    }, [slug, filters, pagination.page]);

    const fetchCatalog = async () => {
        try {
            setLoading(true);
            setError(null);
            const params = {
                ...filters,
                page: pagination.page,
                limit: 12
            };
            Object.keys(params).forEach((k) => {
                if (params[k] === '' || params[k] == null) delete params[k];
            });

            const res = await catalogService.getPublicCatalog(slug, params);
            setAgency(res.agency || null);
            setProperties(res.data || []);
            setFacets(res.facets || { cities: [], propertyTypes: [], developers: [] });
            setPagination({
                page: res.page || 1,
                pages: res.pages || 1,
                total: res.total || 0
            });

            if (!langInitialized && res.agency?.language) {
                setLang(res.agency.language === 'ar' ? 'ar' : 'en');
                setLangInitialized(true);
            }
        } catch (err) {
            console.error('Error loading public catalog:', err);
            setError(err?.response?.data?.message || L.notFoundSub);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => ({ ...prev, [name]: value }));
        setPagination((prev) => ({ ...prev, page: 1 }));
    };

    const handleTransactionTab = (txValue) => {
        setFilters((prev) => ({ ...prev, transactionType: txValue }));
        setPagination((prev) => ({ ...prev, page: 1 }));
    };

    const clearFilters = () => {
        setFilters({
            search: '',
            transactionType: '',
            propertyType: '',
            city: '',
            bedrooms: '',
            minPrice: '',
            maxPrice: '',
            sort: 'newest'
        });
        setPagination((prev) => ({ ...prev, page: 1 }));
    };

    const openInquiryModal = (property = null) => {
        setSelectedProperty(property);
        setInquiryError('');
        setInquirySuccess(false);
        setInquiryForm((prev) => ({
            ...prev,
            message: property
                ? (lang === 'ar'
                    ? `أود الاستفسار عن: ${property.title}`
                    : `I am interested in "${property.title}" and would like more details.`)
                : ''
        }));
        if (dialogRef.current && typeof dialogRef.current.showModal === 'function') {
            dialogRef.current.showModal();
        }
    };

    const closeInquiryModal = () => {
        if (dialogRef.current && dialogRef.current.open) {
            dialogRef.current.close();
        }
    };

    const handleFieldBlur = (e) => {
        const el = e.target;
        if (typeof el.checkValidity === 'function') {
            if (!el.checkValidity()) {
                el.classList.add(styles.userInvalidFallback);
            } else {
                el.classList.remove(styles.userInvalidFallback);
            }
        }
    };

    const handleInquirySubmit = async (e) => {
        e.preventDefault();
        setInquiryError('');
        setSubmittingInquiry(true);
        try {
            await catalogService.submitInquiry(slug, {
                name: inquiryForm.name,
                phone: inquiryForm.phone,
                email: inquiryForm.email,
                message: inquiryForm.message,
                propertyId: selectedProperty?._id,
                shareToken: selectedProperty?.shareToken,
                propertyType: selectedProperty?.propertyType,
                transactionType: selectedProperty?.transactionType
            });
            setInquirySuccess(true);
        } catch (err) {
            setInquiryError(err?.response?.data?.message || 'Failed to submit inquiry. Please try again.');
        } finally {
            setSubmittingInquiry(false);
        }
    };

    const getWhatsAppUrl = (property = null) => {
        const phoneToUse = property?.listedBy?.phone || agency?.whatsapp || agency?.phone;
        const cleanPhone = cleanPhoneForWhatsApp(phoneToUse);
        const propUrl = property?.shareToken
            ? `${window.location.origin}/share/${property.shareToken}`
            : window.location.href;
        const text = property
            ? (lang === 'ar'
                ? `مرحباً ${agency?.name || ''}، أود الاستفسار عن العقار "${property.title}" المعروض بسعر ${formatCurrency(property.price, property.currency)}: ${propUrl}`
                : `Hello ${agency?.name || ''}, I'm interested in "${property.title}" listed at ${formatCurrency(property.price, property.currency)}: ${propUrl}`)
            : (lang === 'ar'
                ? `مرحباً ${agency?.name || ''}، تصفحت كتالوج العقارات الخاص بكم وأود الاستفسار عن العروض المتاحة.`
                : `Hello ${agency?.name || ''}, I browsed your property catalog and would like to inquire about available listings.`);
        return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
    };

    const formatCurrency = (price, currency = 'EGP') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency || agency?.currency || 'EGP',
            maximumFractionDigits: 0
        }).format(price || 0);
    };

    const hasActiveFilters = Boolean(
        filters.search ||
        filters.transactionType ||
        filters.propertyType ||
        filters.city ||
        filters.bedrooms ||
        filters.minPrice ||
        filters.maxPrice
    );

    if (loading && !agency) {
        return (
            <div className={styles.wrapper} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                <div className={styles.stateBox} style={{ margin: '4rem auto', maxWidth: '520px' }}>
                    <h3>{L.loadingCatalog}</h3>
                </div>
            </div>
        );
    }

    if (error && !agency) {
        return (
            <div className={styles.wrapper} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                <div className={styles.stateBox} style={{ margin: '4rem auto', maxWidth: '520px' }}>
                    <Building2 size={42} color="#94a3b8" />
                    <h3>{L.notFoundTitle}</h3>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    const customThemeStyle = {
        '--catalog-primary': agency?.primaryColor || '#b4562d',
        '--catalog-secondary': agency?.secondaryColor || '#1e293b'
    };

    const agencyPhone = agency?.phone || agency?.whatsapp;
    const agencyInitials = (agency?.name || 'RE')
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0])
        .join('')
        .toUpperCase();

    return (
        <div
            className={styles.wrapper}
            style={customThemeStyle}
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
        >
            {/* Top Branded Navigation */}
            <header className={styles.navbar}>
                <div className={styles.navbarInner}>
                    <div className={styles.brandIdentity}>
                        {agency?.logo ? (
                            <img
                                src={agency.logo}
                                alt={agency.name}
                                className={styles.agencyLogo}
                            />
                        ) : (
                            <div className={styles.agencyInitials}>{agencyInitials}</div>
                        )}
                        <div className={styles.brandText}>
                            <h1>{agency?.name}</h1>
                            {agency?.tagline && <p>{agency.tagline}</p>}
                        </div>
                    </div>

                    <div className={styles.navActions}>
                        <button
                            type="button"
                            className={styles.langToggleBtn}
                            onClick={() => setLang((prev) => (prev === 'ar' ? 'en' : 'ar'))}
                        >
                            <Globe size={15} />
                            <span>{lang === 'ar' ? 'English' : 'العربية'}</span>
                        </button>

                        {agencyPhone && (
                            <a href={`tel:${agencyPhone}`} className={styles.navContactBtn}>
                                <Phone size={15} />
                                <span>{L.callUs}</span>
                            </a>
                        )}

                        {agency?.email && (
                            <a href={`mailto:${agency.email}`} className={styles.navContactBtn}>
                                <Mail size={15} />
                                <span>{L.emailUs}</span>
                            </a>
                        )}

                        {agencyPhone && (
                            <a
                                href={getWhatsAppUrl(null)}
                                target="_blank"
                                rel="noreferrer"
                                className={styles.whatsappNavBtn}
                            >
                                <MessageCircle size={15} />
                                <span>{L.whatsapp}</span>
                            </a>
                        )}

                        <button
                            type="button"
                            className={styles.inquireNavBtn}
                            onClick={() => openInquiryModal(null)}
                        >
                            <Send size={15} />
                            <span>{L.sendInquiry}</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Hero & Search / Filter Section */}
            <section className={styles.hero}>
                <div className={styles.heroInner}>
                    <div className={styles.heroTop}>
                        <div>
                            <h2 className={styles.heroTitle}>{agency?.name}</h2>
                            <p className={styles.heroSubtitle}>
                                {agency?.tagline || (lang === 'ar'
                                    ? 'تصفح أحدث العقارات المتاحة للبيع والإيجار وتواصل معنا مباشرة'
                                    : 'Explore our curated portfolio of properties for sale and rent.')}
                            </p>
                            <div className={styles.heroMeta}>
                                {agency?.address && (
                                    <span className={styles.heroMetaItem}>
                                        <MapPin size={15} /> {agency.address}
                                    </span>
                                )}
                                {agency?.website && (
                                    <a
                                        href={agency.website}
                                        target="_blank"
                                        rel="noreferrer"
                                        className={styles.heroMetaItem}
                                        style={{ color: '#93c5fd', textDecoration: 'none' }}
                                    >
                                        <ExternalLink size={14} /> {agency.website.replace(/^https?:\/\//, '')}
                                    </a>
                                )}
                            </div>
                        </div>

                        <div className={styles.heroStatsBadge}>
                            <span className={styles.heroStatsNum}>{pagination.total}</span>
                            <span className={styles.heroStatsLabel}>{L.activeListings}</span>
                        </div>
                    </div>

                    {/* Interactive Filter Box */}
                    <div className={styles.filterCard}>
                        <div className={styles.filterRowPrimary}>
                            <div className={styles.txTabs}>
                                <button
                                    type="button"
                                    className={`${styles.txTab} ${!filters.transactionType ? styles.txTabActive : ''}`}
                                    onClick={() => handleTransactionTab('')}
                                >
                                    {L.all}
                                </button>
                                <button
                                    type="button"
                                    className={`${styles.txTab} ${filters.transactionType === 'sale' ? styles.txTabActive : ''}`}
                                    onClick={() => handleTransactionTab('sale')}
                                >
                                    {L.forSale}
                                </button>
                                <button
                                    type="button"
                                    className={`${styles.txTab} ${filters.transactionType === 'rent' ? styles.txTabActive : ''}`}
                                    onClick={() => handleTransactionTab('rent')}
                                >
                                    {L.forRent}
                                </button>
                            </div>

                            <div className={styles.searchInputWrap}>
                                <Search size={18} className={styles.searchIcon} />
                                <input
                                    type="text"
                                    name="search"
                                    value={filters.search}
                                    onChange={handleFilterChange}
                                    placeholder={L.searchPlaceholder}
                                    className={styles.searchInput}
                                />
                            </div>
                        </div>

                        <div className={styles.filterRowSecondary}>
                            <div className={styles.filterControl}>
                                <label>{L.propertyType}</label>
                                <select name="propertyType" value={filters.propertyType} onChange={handleFilterChange}>
                                    <option value="">{L.allTypes}</option>
                                    {PROPERTY_TYPES.map((pt) => (
                                        <option key={pt.value} value={pt.value}>{pt.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className={styles.filterControl}>
                                <label>{L.cityLocation}</label>
                                <select name="city" value={filters.city} onChange={handleFilterChange}>
                                    <option value="">{L.allCities}</option>
                                    {facets.cities?.map((c) => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>

                            <div className={styles.filterControl}>
                                <label>{L.bedrooms}</label>
                                <select name="bedrooms" value={filters.bedrooms} onChange={handleFilterChange}>
                                    <option value="">{L.anyBeds}</option>
                                    <option value="1">1+</option>
                                    <option value="2">2+</option>
                                    <option value="3">3+</option>
                                    <option value="4">4+</option>
                                    <option value="5">5+</option>
                                </select>
                            </div>

                            <div className={styles.filterControl}>
                                <label>{L.minPrice}</label>
                                <input
                                    type="number"
                                    name="minPrice"
                                    value={filters.minPrice}
                                    onChange={handleFilterChange}
                                    placeholder="0"
                                    min="0"
                                />
                            </div>

                            <div className={styles.filterControl}>
                                <label>{L.maxPrice}</label>
                                <input
                                    type="number"
                                    name="maxPrice"
                                    value={filters.maxPrice}
                                    onChange={handleFilterChange}
                                    placeholder="∞"
                                    min="0"
                                />
                            </div>

                            <div className={styles.filterControl}>
                                <label>{L.sortBy}</label>
                                <select name="sort" value={filters.sort} onChange={handleFilterChange}>
                                    <option value="newest">{L.sortNewest}</option>
                                    <option value="price_asc">{L.sortPriceAsc}</option>
                                    <option value="price_desc">{L.sortPriceDesc}</option>
                                </select>
                            </div>

                            {hasActiveFilters && (
                                <button type="button" onClick={clearFilters} className={styles.clearBtn}>
                                    <X size={15} />
                                    <span>{L.clearFilters}</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Catalog Listings */}
            <main className={styles.main}>
                <div className={styles.resultsBar}>
                    <div className={styles.resultsCount}>
                        {L.showingCount} <strong>{properties.length}</strong> {L.of} <strong>{pagination.total}</strong> {L.propertiesAvailable}
                    </div>
                </div>

                {loading ? (
                    <div className={styles.stateBox}>
                        <h3>{L.loadingCatalog}</h3>
                    </div>
                ) : properties.length === 0 ? (
                    <div className={styles.stateBox}>
                        <Building2 size={40} color="#94a3b8" />
                        <h3>{L.noPropertiesTitle}</h3>
                        <p>{L.noPropertiesSub}</p>
                        {hasActiveFilters && (
                            <button
                                type="button"
                                onClick={clearFilters}
                                className={styles.inquireNavBtn}
                                style={{ marginTop: '0.75rem' }}
                            >
                                {L.clearFilters}
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        <div className={styles.grid}>
                            {properties.map((prop, idx) => {
                                const primaryImg = prop.media?.images?.find((i) => i.isPrimary)?.url
                                    || prop.media?.images?.[0]?.url
                                    || '/placeholder-property.jpg';
                                const sharePath = `/share/${prop.shareToken || prop._id}?catalog=${encodeURIComponent(agency?.slug || slug)}`;
                                const hasInstallments = prop.paymentPlan?.installmentYears > 0;

                                return (
                                    <article key={prop._id} className={styles.card}>
                                        <Link to={sharePath} className={styles.cardImageWrap}>
                                            <img
                                                src={primaryImg}
                                                alt={prop.title}
                                                className={styles.cardImage}
                                                {...(idx === 0
                                                    ? { fetchPriority: 'high' }
                                                    : { loading: 'lazy' })}
                                            />
                                            <div className={styles.cardBadgesTop}>
                                                <div className={styles.badgeGroup}>
                                                    <span className={styles.txBadge}>
                                                        {prop.transactionType === 'rent' ? L.forRent : L.forSale}
                                                    </span>
                                                    <span className={styles.typeBadge}>
                                                        {prop.propertyType}
                                                    </span>
                                                    {prop.listingCategory === 'primary_offplan' && (
                                                        <span className={styles.offplanBadge}>{L.offPlan}</span>
                                                    )}
                                                </div>
                                                {(prop.isFeatured || prop.isHotDeal) && (
                                                    <span className={styles.hotBadge}>
                                                        <Sparkles size={11} style={{ display: 'inline', marginInlineEnd: 3 }} />
                                                        {prop.isHotDeal ? L.hotDeal : L.featured}
                                                    </span>
                                                )}
                                            </div>
                                            <div className={styles.cardPriceOverlay}>
                                                <span className={styles.cardPrice}>
                                                    {formatCurrency(prop.price, prop.currency)}
                                                </span>
                                                {hasInstallments && (
                                                    <span className={styles.paymentPill}>
                                                        {prop.paymentPlan.downPaymentPercent || 0}% {L.downPayment} • {prop.paymentPlan.installmentYears} {L.yrs}
                                                    </span>
                                                )}
                                            </div>
                                        </Link>

                                        <div className={styles.cardBody}>
                                            <Link to={sharePath} style={{ textDecoration: 'none' }}>
                                                <h3 className={styles.cardTitle}>{prop.title}</h3>
                                            </Link>

                                            {prop.developer?.name && (
                                                <div className={styles.developerRow}>
                                                    <Building2 size={14} />
                                                    <span>
                                                        {prop.developer.projectName
                                                            ? `${prop.developer.projectName} • ${prop.developer.name}`
                                                            : prop.developer.name}
                                                    </span>
                                                </div>
                                            )}

                                            <div className={styles.locationRow}>
                                                <MapPin size={15} />
                                                <span>
                                                    {[prop.location?.area, prop.location?.city].filter(Boolean).join(', ') || prop.location?.address}
                                                </span>
                                            </div>

                                            <div className={styles.specsRow}>
                                                {prop.features?.bedrooms != null && (
                                                    <span className={styles.specItem}>
                                                        <Bed size={16} /> {prop.features.bedrooms} {L.beds}
                                                    </span>
                                                )}
                                                {prop.features?.bathrooms != null && (
                                                    <span className={styles.specItem}>
                                                        <Bath size={16} /> {prop.features.bathrooms} {L.baths}
                                                    </span>
                                                )}
                                                {prop.features?.area?.value != null && (
                                                    <span className={styles.specItem}>
                                                        <Maximize size={15} /> {prop.features.area.value} {prop.features.area.unit || 'sqm'}
                                                    </span>
                                                )}
                                            </div>

                                            <div className={styles.cardActions}>
                                                <Link to={sharePath} className={styles.viewBtn}>
                                                    {L.viewDetails}
                                                </Link>
                                                <button
                                                    type="button"
                                                    className={styles.inquireBtn}
                                                    onClick={() => openInquiryModal(prop)}
                                                >
                                                    <Send size={14} />
                                                    <span>{L.inquire}</span>
                                                </button>
                                                {(prop.listedBy?.phone || agencyPhone) && (
                                                    <a
                                                        href={getWhatsAppUrl(prop)}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className={styles.whatsappCardBtn}
                                                        title={L.whatsapp}
                                                    >
                                                        <MessageCircle size={17} />
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>

                        {pagination.pages > 1 && (
                            <div className={styles.pagination}>
                                <button
                                    type="button"
                                    className={styles.pageBtn}
                                    disabled={pagination.page <= 1}
                                    onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                                >
                                    {L.prev}
                                </button>
                                <span>
                                    {L.page} {pagination.page} {L.of} {pagination.pages}
                                </span>
                                <button
                                    type="button"
                                    className={styles.pageBtn}
                                    disabled={pagination.page >= pagination.pages}
                                    onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                                >
                                    {L.next}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </main>

            {/* Footer */}
            <footer className={styles.footer}>
                <div className={styles.footerInner}>
                    <div>
                        <strong style={{ color: '#ffffff' }}>{agency?.name}</strong>
                        {agency?.address ? ` • ${agency.address}` : ''}
                    </div>
                    <div>{L.poweredBy}</div>
                </div>
            </footer>

            {/* Native <dialog closedby="any"> for Lead Capture Inquiry */}
            <dialog
                ref={dialogRef}
                {...({ closedby: 'any' })}
                aria-labelledby="catalogInquiryTitle"
                className={styles.inquiryDialog}
            >
                <div className={styles.dialogInner}>
                    <div className={styles.dialogHeader}>
                        <div>
                            <h2 id="catalogInquiryTitle">
                                {selectedProperty ? L.inquiryModalTitleProp : L.inquiryModalTitleGeneral}
                            </h2>
                            {selectedProperty && (
                                <div className={styles.dialogPropertyTag}>
                                    {selectedProperty.title} ({formatCurrency(selectedProperty.price, selectedProperty.currency)})
                                </div>
                            )}
                        </div>
                        <button
                            type="button"
                            className={styles.dialogCloseBtn}
                            onClick={closeInquiryModal}
                            aria-label={L.close}
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {inquirySuccess ? (
                        <div className={styles.inquirySuccessBox}>
                            <CheckCircle2 size={48} color="#16a34a" style={{ margin: '0 auto' }} />
                            <h3>{L.inquirySentTitle}</h3>
                            <p>{L.inquirySentSub}</p>
                            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                                {(selectedProperty?.listedBy?.phone || agencyPhone) && (
                                    <a
                                        href={getWhatsAppUrl(selectedProperty)}
                                        target="_blank"
                                        rel="noreferrer"
                                        className={styles.whatsappNavBtn}
                                    >
                                        <MessageCircle size={16} />
                                        <span>{L.continueWhatsApp}</span>
                                    </a>
                                )}
                                <button
                                    type="button"
                                    onClick={closeInquiryModal}
                                    className={styles.navContactBtn}
                                >
                                    {L.close}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleInquirySubmit}>
                            {inquiryError && (
                                <div style={{
                                    padding: '0.65rem 0.85rem',
                                    background: '#fef2f2',
                                    color: '#dc2626',
                                    borderRadius: '8px',
                                    fontSize: '0.85rem',
                                    marginBottom: '0.9rem'
                                }}>
                                    {inquiryError}
                                </div>
                            )}

                            <div className={styles.formField}>
                                <label htmlFor="visitor-name">{L.yourName}</label>
                                <span id="visitor-name-hint" className={styles.fieldHint}>{L.nameHint}</span>
                                <input
                                    id="visitor-name"
                                    type="text"
                                    required
                                    minLength={2}
                                    autoComplete="name"
                                    aria-describedby="visitor-name-hint"
                                    value={inquiryForm.name}
                                    onChange={(e) => setInquiryForm({ ...inquiryForm, name: e.target.value })}
                                    onBlur={handleFieldBlur}
                                    className={styles.fieldInput}
                                />
                                <div className={styles.fieldErrorMsg}>{L.nameError}</div>
                            </div>

                            <div className={styles.formField}>
                                <label htmlFor="visitor-phone">{L.yourPhone}</label>
                                <span id="visitor-phone-hint" className={styles.fieldHint}>{L.phoneHint}</span>
                                <input
                                    id="visitor-phone"
                                    type="tel"
                                    required
                                    pattern="[0-9+\-\s()]{7,20}"
                                    autoComplete="tel"
                                    aria-describedby="visitor-phone-hint"
                                    value={inquiryForm.phone}
                                    onChange={(e) => setInquiryForm({ ...inquiryForm, phone: e.target.value })}
                                    onBlur={handleFieldBlur}
                                    className={styles.fieldInput}
                                />
                                <div className={styles.fieldErrorMsg}>{L.phoneError}</div>
                            </div>

                            <div className={styles.formField}>
                                <label htmlFor="visitor-email">{L.yourEmail}</label>
                                <span id="visitor-email-hint" className={styles.fieldHint}>{L.emailHint}</span>
                                <input
                                    id="visitor-email"
                                    type="email"
                                    autoComplete="email"
                                    aria-describedby="visitor-email-hint"
                                    value={inquiryForm.email}
                                    onChange={(e) => setInquiryForm({ ...inquiryForm, email: e.target.value })}
                                    onBlur={handleFieldBlur}
                                    className={styles.fieldInput}
                                />
                                <div className={styles.fieldErrorMsg}>{L.emailError}</div>
                            </div>

                            <div className={styles.formField}>
                                <label htmlFor="visitor-message">{L.yourMessage}</label>
                                <textarea
                                    id="visitor-message"
                                    rows={3}
                                    placeholder={L.messagePlaceholder}
                                    value={inquiryForm.message}
                                    onChange={(e) => setInquiryForm({ ...inquiryForm, message: e.target.value })}
                                    className={styles.fieldTextarea}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={submittingInquiry}
                                className={styles.submitInquiryBtn}
                            >
                                <Send size={16} />
                                <span>{submittingInquiry ? L.submitting : L.submitInquiry}</span>
                            </button>
                        </form>
                    )}
                </div>
            </dialog>
        </div>
    );
};

export default PublicCatalog;
