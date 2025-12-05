import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { propertyService } from '@/services/propertyService';
import { useAuthStore } from '@/store/authStore';
import PropertyCard from '@/components/PropertyCard';
import { Plus, Search, Filter, X } from 'lucide-react';
import styles from './PropertyList.module.css';

const PropertyList = () => {
    const navigate = useNavigate();
    const { hasPermission } = useAuthStore();
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        search: '',
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
            const response = await propertyService.getProperties({
                ...filters,
                page: pagination.page,
                limit: 12
            });
            setProperties(response.data);
            setPagination({
                page: response.page,
                pages: response.pages,
                total: response.total
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
        setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
    };

    const clearFilters = () => {
        setFilters({
            search: '',
            propertyType: '',
            transactionType: '',
            status: '',
            minPrice: '',
            maxPrice: ''
        });
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

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1>Properties</h1>
                    <p>{pagination.total} properties found</p>
                </div>
                {hasPermission('properties.create') && (
                    <button
                        onClick={() => navigate('/properties/new')}
                        className={styles.addButton}
                    >
                        <Plus size={20} />
                        Add Property
                    </button>
                )}
            </div>

            <div className={styles.controls}>
                <div className={styles.searchBar}>
                    <Search size={20} className={styles.searchIcon} />
                    <input
                        type="text"
                        name="search"
                        placeholder="Search by title, location..."
                        value={filters.search}
                        onChange={handleFilterChange}
                    />
                </div>
                <button
                    className={`${styles.filterButton} ${showFilters ? styles.active : ''}`}
                    onClick={() => setShowFilters(!showFilters)}
                >
                    <Filter size={20} />
                    Filters
                </button>
            </div>

            {showFilters && (
                <div className={styles.filtersPanel}>
                    <div className={styles.filterGroup}>
                        <label>Type</label>
                        <select name="propertyType" value={filters.propertyType} onChange={handleFilterChange}>
                            <option value="">All Types</option>
                            <option value="apartment">Apartment</option>
                            <option value="villa">Villa</option>
                            <option value="office">Office</option>
                            <option value="land">Land</option>
                        </select>
                    </div>
                    <div className={styles.filterGroup}>
                        <label>For</label>
                        <select name="transactionType" value={filters.transactionType} onChange={handleFilterChange}>
                            <option value="">Any</option>
                            <option value="sale">Sale</option>
                            <option value="rent">Rent</option>
                        </select>
                    </div>
                    <div className={styles.filterGroup}>
                        <label>Status</label>
                        <select name="status" value={filters.status} onChange={handleFilterChange}>
                            <option value="">All Status</option>
                            <option value="active">Active</option>
                            <option value="pending">Pending</option>
                            <option value="sold">Sold</option>
                            <option value="rented">Rented</option>
                        </select>
                    </div>
                    <div className={styles.filterGroup}>
                        <label>Min Price</label>
                        <input
                            type="number"
                            name="minPrice"
                            value={filters.minPrice}
                            onChange={handleFilterChange}
                            placeholder="Min"
                        />
                    </div>
                    <div className={styles.filterGroup}>
                        <label>Max Price</label>
                        <input
                            type="number"
                            name="maxPrice"
                            value={filters.maxPrice}
                            onChange={handleFilterChange}
                            placeholder="Max"
                        />
                    </div>
                    <button onClick={clearFilters} className={styles.clearButton}>
                        <X size={16} /> Clear
                    </button>
                </div>
            )}

            {loading ? (
                <div className={styles.loading}>Loading properties...</div>
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
                            <h3>No properties found</h3>
                            <p>Try adjusting your filters or add a new property.</p>
                        </div>
                    )}

                    {pagination.pages > 1 && (
                        <div className={styles.pagination}>
                            <button
                                disabled={pagination.page === 1}
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                            >
                                Previous
                            </button>
                            <span>Page {pagination.page} of {pagination.pages}</span>
                            <button
                                disabled={pagination.page === pagination.pages}
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default PropertyList;
