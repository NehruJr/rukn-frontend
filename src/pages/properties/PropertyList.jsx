import { useLanguage } from "@/hooks/useLanguage";
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { propertyService } from '@/services/propertyService';
import { catalogService } from '@/services/catalogService';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import PropertyCard from '@/components/PropertyCard';
import { QRCodeSVG } from '@/utils/qrCode';
import { Plus, Search, Filter, X, Globe, Building2, Share2, Copy, ExternalLink, QrCode, MessageCircle } from 'lucide-react';
import { COUNTRIES, getCountryBranches, getDeveloperSuggestions } from '@/utils/marketPresets';
import { PROPERTY_TYPES, LISTING_CATEGORIES } from '@/utils/constants';
import styles from './PropertyList.module.css';

const PropertyList = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const { hasPermission } = useAuthStore();
    const { selectedCountry, selectedBranch, setSelectedCountry, setSelectedBranch, addToast } = useUIStore();
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [catalogModalOpen, setCatalogModalOpen] = useState(false);
    const [catalogInfo, setCatalogInfo] = useState(null);
    const [loadingCatalog, setLoadingCatalog] = useState(false);
    const [filters, setFilters] = useState({
        search: '',
        country: selectedCountry || '',
        branch: selectedBranch || '',
        developer: '',
        listingCategory: '',
        propertyType: '',
        transactionType: '',
        status: '',
        minPrice: '',
        maxPrice: ''
    });
    const [showFilters, setShowFilters] = useState(false);
    const [pagination, setPagination] = useState({
        page: 1,
        pages: 1,
        total: 0
    });

    useEffect(() => {
        setFilters(prev => {
            if (prev.country === (selectedCountry || '') && prev.branch === (selectedBranch || '')) {
                return prev;
            }
            return {
                ...prev,
                country: selectedCountry || '',
                branch: selectedBranch || ''
            };
        });
        setPagination(prev => ({ ...prev, page: 1 }));
    }, [selectedCountry, selectedBranch]);

    useEffect(() => {
        fetchProperties();
    }, [filters, pagination.page]);

    const fetchProperties = async () => {
        try {
            setLoading(true);
            const queryParams = { ...filters, page: pagination.page, limit: 12 };
            // Remove empty string filters
            Object.keys(queryParams).forEach(key => {
                if (queryParams[key] === '' || queryParams[key] == null) {
                    delete queryParams[key];
                }
            });

            const response = await propertyService.getProperties(queryParams);
            setProperties(response.data || []);
            setPagination({
                page: response.page || 1,
                pages: response.pages || 1,
                total: response.total || 0
            });
        } catch (err) {
            console.error('Error fetching properties:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handleCountryTabClick = (countryValue) => {
        const nextCountry = filters.country === countryValue ? '' : countryValue;
        setSelectedCountry(nextCountry);
        setFilters(prev => ({
            ...prev,
            country: nextCountry,
            branch: ''
        }));
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handleBranchClick = (branchName) => {
        const nextBranch = filters.branch === branchName ? '' : branchName;
        setSelectedBranch(nextBranch);
        setFilters(prev => ({
            ...prev,
            branch: nextBranch
        }));
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const clearFilters = () => {
        setSelectedCountry('');
        setSelectedBranch('');
        setFilters({
            search: '',
            country: '',
            branch: '',
            developer: '',
            listingCategory: '',
            propertyType: '',
            transactionType: '',
            status: '',
            minPrice: '',
            maxPrice: ''
        });
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this property?')) {
            try {
                await propertyService.deleteProperty(id);
                fetchProperties();
            } catch (err) {
                console.error('Error deleting property:', err);
                alert('Failed to delete property');
            }
        }
    };

    const handleToggleCatalog = async (property) => {
        try {
            const nextState = property.showInCatalog === false;
            const res = await propertyService.toggleCatalogVisibility(property._id, nextState);
            setProperties((prev) =>
                prev.map((p) => (p._id === property._id ? { ...p, showInCatalog: res?.data?.showInCatalog ?? nextState } : p))
            );
            addToast({
                type: 'success',
                message: nextState ? 'Property added to Public Catalog' : 'Property hidden from Public Catalog'
            });
        } catch (err) {
            addToast({ type: 'error', message: err?.response?.data?.message || 'Failed to update catalog visibility' });
        }
    };

    const handleOpenCatalogModal = async () => {
        setCatalogModalOpen(true);
        try {
            setLoadingCatalog(true);
            const res = await catalogService.getMyCatalogInfo();
            setCatalogInfo(res?.data || null);
        } catch (err) {
            console.error('Error fetching catalog info:', err);
        } finally {
            setLoadingCatalog(false);
        }
    };

    const handleCopyCatalogUrl = async () => {
        if (!catalogInfo?.slug) return;
        const url = `${window.location.origin}/catalog/${catalogInfo.slug}`;
        await navigator.clipboard.writeText(url);
        addToast({ type: 'success', message: 'Public Catalog link copied to clipboard!' });
    };

    const availableBranches = filters.country ? getCountryBranches(filters.country) : [];
    const availableDevelopers = filters.country ? getDeveloperSuggestions(filters.country) : [];

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1>{t('dashboard_extra.properties')}</h1>
                    <p>{pagination.total} properties found</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <button
                        type="button"
                        onClick={handleOpenCatalogModal}
                        className={styles.filterButton}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', fontWeight: 600 }}
                    >
                        <Share2 size={18} />
                        <span>Public Catalog</span>
                    </button>
                    {hasPermission('properties.create') && (
                        <button
                            onClick={() => navigate('/properties/new')}
                            className={styles.addButton}
                        >
                            <Plus size={20} />{t('dashboard_extra.add_property')}
                        </button>
                    )}
                </div>
            </div>

            {/* Country Tabs */}
            <div className={styles.countryTabs}>
                <button
                    className={`${styles.countryTab} ${!filters.country ? styles.countryTabActive : ''}`}
                    onClick={() => handleCountryTabClick('')}
                >
                    <Globe size={16} /> All Countries
                </button>
                {COUNTRIES.map(c => (
                    <button
                        key={c.value}
                        className={`${styles.countryTab} ${filters.country === c.value ? styles.countryTabActive : ''}`}
                        onClick={() => handleCountryTabClick(c.value)}
                    >
                        {c.label}
                    </button>
                ))}
            </div>

            {/* Branch Pills */}
            {availableBranches.length > 0 && (
                <div className={styles.branchPills}>
                    <span className={styles.branchLabel}>Branches:</span>
                    {availableBranches.map(branchName => (
                        <button
                            key={branchName}
                            className={`${styles.branchPill} ${filters.branch === branchName ? styles.branchPillActive : ''}`}
                            onClick={() => handleBranchClick(branchName)}
                        >
                            {branchName}
                        </button>
                    ))}
                </div>
            )}

            <div className={styles.controls}>
                <div className={styles.searchBar}>
                    <Search size={20} className={styles.searchIcon} />
                    <input
                        type="text"
                        name="search"
                        placeholder="Search by title, location, developer..."
                        value={filters.search}
                        onChange={handleFilterChange}
                    />
                </div>
                <button
                    className={`${styles.filterButton} ${showFilters ? styles.active : ''}`}
                    onClick={() => setShowFilters(!showFilters)}
                >
                    <Filter size={20} />{t('dashboard_extra.filters')}
                </button>
            </div>

            {showFilters && (
                <div className={styles.filtersPanel}>
                    <div className={styles.filterGroup}>
                        <label>Developer</label>
                        <input
                            type="text"
                            name="developer"
                            list="developer-filter-list"
                            placeholder="Developer or Project..."
                            value={filters.developer}
                            onChange={handleFilterChange}
                        />
                        <datalist id="developer-filter-list">
                            {availableDevelopers.map(dev => (
                                <option key={dev} value={dev} />
                            ))}
                        </datalist>
                    </div>

                    <div className={styles.filterGroup}>
                        <label>Category</label>
                        <select name="listingCategory" value={filters.listingCategory} onChange={handleFilterChange}>
                            <option value="">All Categories</option>
                            {LISTING_CATEGORIES.map(cat => (
                                <option key={cat.value} value={cat.value}>{cat.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.filterGroup}>
                        <label>{t('dashboard_extra.type')}</label>
                        <select name="propertyType" value={filters.propertyType} onChange={handleFilterChange}>
                            <option value="">{t('dashboard_extra.all_types')}</option>
                            {PROPERTY_TYPES.map(type => (
                                <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.filterGroup}>
                        <label>{t('dashboard_extra.for')}</label>
                        <select name="transactionType" value={filters.transactionType} onChange={handleFilterChange}>
                            <option value="">{t('dashboard_extra.any')}</option>
                            <option value="sale">{t('dashboard_extra.sale')}</option>
                            <option value="rent">{t('dashboard_extra.rent')}</option>
                        </select>
                    </div>

                    <div className={styles.filterGroup}>
                        <label>{t('dashboard_extra.status')}</label>
                        <select name="status" value={filters.status} onChange={handleFilterChange}>
                            <option value="">{t('dashboard_extra.all_status')}</option>
                            <option value="active">{t('dashboard_extra.active')}</option>
                            <option value="pending">{t('dashboard_extra.pending')}</option>
                            <option value="sold">{t('dashboard_extra.sold')}</option>
                            <option value="rented">{t('dashboard_extra.rented')}</option>
                        </select>
                    </div>

                    <div className={styles.filterGroup}>
                        <label>{t('dashboard_extra.min_price')}</label>
                        <input
                            type="number"
                            name="minPrice"
                            value={filters.minPrice}
                            onChange={handleFilterChange}
                            placeholder="Min"
                        />
                    </div>

                    <div className={styles.filterGroup}>
                        <label>{t('dashboard_extra.max_price')}</label>
                        <input
                            type="number"
                            name="maxPrice"
                            value={filters.maxPrice}
                            onChange={handleFilterChange}
                            placeholder="Max"
                        />
                    </div>

                    <button onClick={clearFilters} className={styles.clearButton}>
                        <X size={16} />{t('dashboard_extra.clear')}
                    </button>
                </div>
            )}

            {loading ? (
                <div className={styles.loading}>{t('dashboard_extra.loading_properties')}</div>
            ) : (
                <>
                    <div className={styles.grid}>
                        {properties.map(property => (
                            <PropertyCard
                                key={property._id}
                                property={property}
                                onClick={() => navigate(`/properties/${property._id}`)}
                                onEdit={() => navigate(`/properties/${property._id}/edit`)}
                                onDelete={handleDelete}
                                onToggleCatalog={handleToggleCatalog}
                            />
                        ))}
                    </div>

                    {properties.length === 0 && (
                        <div className={styles.emptyState}>
                            <h3>{t('dashboard_extra.no_properties_found')}</h3>
                            <p>{t('dashboard_extra.try_adjusting_your_filters_or_add_a_new_')}</p>
                        </div>
                    )}

                    {pagination.pages > 1 && (
                        <div className={styles.pagination}>
                            <button
                                disabled={pagination.page === 1}
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                            >
                                {t('dashboard_extra.previous')}
                            </button>
                            <span>Page {pagination.page} of {pagination.pages}</span>
                            <button
                                disabled={pagination.page === pagination.pages}
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                            >
                                {t('dashboard_extra.next')}
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Share Agency Public Catalog Modal */}
            {catalogModalOpen && (
                <div
                    onClick={() => setCatalogModalOpen(false)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(15, 23, 42, 0.55)',
                        backdropFilter: 'blur(3px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        padding: '1rem'
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: 'var(--color-surface, #ffffff)',
                            color: 'var(--color-text-primary, #0f172a)',
                            borderRadius: '16px',
                            maxWidth: '520px',
                            width: '100%',
                            padding: '1.5rem',
                            boxShadow: '0 24px 48px -12px rgba(15, 23, 42, 0.25)',
                            border: '1px solid var(--color-border, #e2e8f0)'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <QrCode size={20} color="#2563eb" />
                                    <span>Share Public Property Catalog</span>
                                </h2>
                                <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--color-text-secondary, #64748b)' }}>
                                    Share your branded agency catalog with clients so they can browse your active properties and submit inquiries.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setCatalogModalOpen(false)}
                                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b' }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {loadingCatalog ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading catalog link...</div>
                        ) : catalogInfo ? (
                            <>
                                <div style={{
                                    display: 'flex',
                                    gap: '1.25rem',
                                    alignItems: 'center',
                                    background: '#f8fafc',
                                    padding: '1rem',
                                    borderRadius: '12px',
                                    border: '1px solid #e2e8f0',
                                    marginBottom: '1rem',
                                    flexWrap: 'wrap'
                                }}>
                                    <div style={{ background: '#ffffff', padding: '0.5rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                                        <QRCodeSVG
                                            value={`${window.location.origin}/catalog/${catalogInfo.slug}`}
                                            size={120}
                                            title={`${catalogInfo.agency?.name || 'Agency'} Public Catalog QR`}
                                        />
                                    </div>
                                    <div style={{ flex: 1, minWidth: '200px' }}>
                                        <div style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a', marginBottom: '0.35rem' }}>
                                            {catalogInfo.agency?.name}
                                        </div>
                                        <div style={{ fontSize: '0.83rem', color: '#475569', marginBottom: '0.5rem' }}>
                                            <strong style={{ color: '#16a34a' }}>{catalogInfo.stats?.publishedCount ?? 0}</strong> active properties visible in catalog
                                            {catalogInfo.stats?.hiddenCount > 0 ? ` (${catalogInfo.stats.hiddenCount} hidden)` : ''}
                                        </div>
                                        <div style={{
                                            fontSize: '0.8rem',
                                            background: '#ffffff',
                                            padding: '0.45rem 0.65rem',
                                            borderRadius: '6px',
                                            border: '1px solid #cbd5e1',
                                            wordBreak: 'break-all',
                                            color: '#334155',
                                            fontFamily: 'monospace'
                                        }}>
                                            {`${window.location.origin}/catalog/${catalogInfo.slug}`}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                                    <button
                                        type="button"
                                        onClick={handleCopyCatalogUrl}
                                        className={styles.addButton}
                                        style={{ flex: 1, justifyContent: 'center' }}
                                    >
                                        <Copy size={16} />
                                        <span>Copy Catalog Link</span>
                                    </button>
                                    <a
                                        href={`/catalog/${catalogInfo.slug}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className={styles.filterButton}
                                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none', fontWeight: 600 }}
                                    >
                                        <ExternalLink size={16} />
                                        <span>Open Catalog</span>
                                    </a>
                                    <a
                                        href={`https://wa.me/?text=${encodeURIComponent(`Explore our available properties at ${catalogInfo.agency?.name || 'our agency'}: ${window.location.origin}/catalog/${catalogInfo.slug}`)}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className={styles.filterButton}
                                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none', color: '#16a34a', borderColor: '#bbf7d0', background: '#f0fdf4', fontWeight: 600 }}
                                    >
                                        <MessageCircle size={16} />
                                        <span>WhatsApp</span>
                                    </a>
                                </div>
                            </>
                        ) : (
                            <div style={{ padding: '1rem', color: '#dc2626' }}>Could not load catalog details.</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PropertyList;
