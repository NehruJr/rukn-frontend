import { useLanguage } from "@/hooks/useLanguage";
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { propertyService } from '@/services/propertyService';
import { useAuthStore } from '@/store/authStore';
import PropertyCard from '@/components/PropertyCard';
import { Plus, Search, Filter, X, Globe, Building2 } from 'lucide-react';
import { COUNTRIES, getCountryBranches, getDeveloperSuggestions } from '@/utils/marketPresets';
import { PROPERTY_TYPES, LISTING_CATEGORIES } from '@/utils/constants';
import styles from './PropertyList.module.css';

const PropertyList = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const { hasPermission } = useAuthStore();
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
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
    const [showFilters, setShowFilters] = useState(false);
    const [pagination, setPagination] = useState({
        page: 1,
        pages: 1,
        total: 0
    });

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
        setFilters(prev => ({
            ...prev,
            country: prev.country === countryValue ? '' : countryValue,
            branch: ''
        }));
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handleBranchClick = (branchName) => {
        setFilters(prev => ({
            ...prev,
            branch: prev.branch === branchName ? '' : branchName
        }));
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const clearFilters = () => {
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

    const availableBranches = filters.country ? getCountryBranches(filters.country) : [];
    const availableDevelopers = filters.country ? getDeveloperSuggestions(filters.country) : [];

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1>{t('dashboard_extra.properties')}</h1>
                    <p>{pagination.total} properties found</p>
                </div>
                {hasPermission('properties.create') && (
                    <button
                        onClick={() => navigate('/properties/new')}
                        className={styles.addButton}
                    >
                        <Plus size={20} />{t('dashboard_extra.add_property')}
                    </button>
                )}
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
        </div>
    );
};

export default PropertyList;
