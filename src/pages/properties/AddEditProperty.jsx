import { useLanguage } from "@/hooks/useLanguage";
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { propertyService } from '@/services/propertyService';
import { tourService } from '@/services/tourService';
import { ArrowLeft, Save, Upload, X, Compass, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import MediaUploader from '@/components/media/MediaUploader';
import TourEditor from '@/components/tour/TourEditor';
import styles from './AddEditProperty.module.css';

const AddEditProperty = () => {
    const { t } = useLanguage();
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = !!id;
    const [loading, setLoading] = useState(false);
    const [tour, setTour] = useState(null);
    const [showTourStudio, setShowTourStudio] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        propertyType: 'apartment',
        transactionType: 'sale',
        price: '',
        currency: 'EGP',
        location: {
            address: '',
            city: '',
            area: '',
            country: 'UAE'
        },
        features: {
            bedrooms: '',
            bathrooms: '',
            area: { value: '', unit: 'sqft' },
            furnished: 'unfurnished',
            yearBuilt: '',
            amenities: []
        },
        status: 'active',
        media: {
            images: []
        }
    });

    const [newImages, setNewImages] = useState([]);
    const [imageUrls, setImageUrls] = useState([]);

    useEffect(() => {
        if (isEditMode) {
            fetchProperty();
        }
    }, [id]);

    const fetchProperty = async () => {
        try {
            setLoading(true);
            const response = await propertyService.getPropertyById(id);
            const property = response.data;

            setFormData({
                ...property,
                features: {
                    ...property.features,
                    amenities: property.features.amenities || []
                }
            });
            setImageUrls(property.media?.images || []);

            try {
                const tourRes = await tourService.getTourByProperty(id);
                setTour(tourRes?.data ?? tourRes);
            } catch (tErr) {
                // Tour does not exist yet
                setTour(null);
            }
        } catch (err) {
            console.error('Error fetching property:', err);
            alert('Failed to load property');
            navigate('/properties');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name.includes('.')) {
            const [parent, child, subchild] = name.split('.');
            setFormData(prev => {
                if (subchild) {
                    return {
                        ...prev,
                        [parent]: {
                            ...prev[parent],
                            [child]: {
                                ...prev[parent][child],
                                [subchild]: value
                            }
                        }
                    };
                }
                return {
                    ...prev,
                    [parent]: {
                        ...prev[parent],
                        [child]: value
                    }
                };
            });
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleAmenityChange = (e) => {
        const amenity = e.target.value;
        if (e.target.checked) {
            setFormData(prev => ({
                ...prev,
                features: {
                    ...prev.features,
                    amenities: [...prev.features.amenities, amenity]
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                features: {
                    ...prev.features,
                    amenities: prev.features.amenities.filter(a => a !== amenity)
                }
            }));
        }
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        setNewImages(prev => [...prev, ...files]);

        // Create preview URLs
        const newUrls = files.map(file => ({
            url: URL.createObjectURL(file),
            file
        }));
        setImageUrls(prev => [...prev, ...newUrls]);
    };

    const removeImage = (index) => {
        setImageUrls(prev => prev.filter((_, i) => i !== index));
        // Also remove from newImages if it's a new image
        // This logic is simplified; in a real app you'd track IDs
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // In a real app, you would upload images to a storage service (S3, Cloudinary)
            // and get URLs back. Here we'll simulate it or just send data.
            // For now, we'll just save the form data.

            const dataToSave = {
                ...formData,
                price: Number(formData.price),
                features: {
                    ...formData.features,
                    bedrooms: Number(formData.features.bedrooms),
                    bathrooms: Number(formData.features.bathrooms),
                    yearBuilt: Number(formData.features.yearBuilt),
                    area: {
                        ...formData.features.area,
                        value: Number(formData.features.area.value)
                    }
                }
            };

            if (isEditMode) {
                await propertyService.updateProperty(id, dataToSave);
            } else {
                await propertyService.createProperty(dataToSave);
            }

            navigate('/properties');
        } catch (err) {
            console.error('Error saving property:', err);
            alert('Failed to save property');
        } finally {
            setLoading(false);
        }
    };

    const amenitiesList = [
        'Air Conditioning', 'Swimming Pool', 'Gym', 'Parking',
        'Security', 'Balcony', 'Garden', 'Elevator',
        'Sea View', 'Furnished', 'Kitchen Appliances', 'Pets Allowed'
    ];

    if (loading && isEditMode && !formData.title) return <div className={styles.loading}>Loading...</div>;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <button onClick={() => navigate('/properties')} className={styles.backButton}>
                    <ArrowLeft size={20} /> Back
                </button>
                <h1>{isEditMode ? 'Edit Property' : 'Add New Property'}</h1>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.section}>
                    <h2>{t('dashboard_extra.basic_information')}</h2>
                    <div className={styles.grid}>
                        <div className={styles.formGroup}>
                            <label>{t('dashboard_extra.title')}</label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>{t('dashboard_extra.type')}</label>
                            <select name="propertyType" value={formData.propertyType} onChange={handleChange}>
                                <option value="apartment">{t('dashboard_extra.apartment')}</option>
                                <option value="villa">{t('dashboard_extra.villa')}</option>
                                <option value="townhouse">{t('dashboard_extra.townhouse')}</option>
                                <option value="office">{t('dashboard_extra.office')}</option>
                                <option value="land">{t('dashboard_extra.land')}</option>
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label>{t('dashboard_extra.transaction_type')}</label>
                            <select name="transactionType" value={formData.transactionType} onChange={handleChange}>
                                <option value="sale">{t('dashboard_extra.for_sale')}</option>
                                <option value="rent">{t('dashboard_extra.for_rent')}</option>
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label>{t('dashboard_extra.price')}</label>
                            <input
                                type="number"
                                name="price"
                                value={formData.price}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>
                    <div className={styles.formGroup}>
                        <label>{t('dashboard_extra.description')}</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={4}
                            required
                        />
                    </div>
                </div>

                <div className={styles.section}>
                    <h2>{t('dashboard_extra.location')}</h2>
                    <div className={styles.grid}>
                        <div className={styles.formGroup}>
                            <label>{t('dashboard_extra.address')}</label>
                            <input
                                type="text"
                                name="location.address"
                                value={formData.location.address}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>{t('dashboard_extra.city')}</label>
                            <input
                                type="text"
                                name="location.city"
                                value={formData.location.city}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Area/Neighborhood</label>
                            <input
                                type="text"
                                name="location.area"
                                value={formData.location.area}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                </div>

                <div className={styles.section}>
                    <h2>{t('dashboard_extra.features')}</h2>
                    <div className={styles.grid}>
                        <div className={styles.formGroup}>
                            <label>{t('dashboard_extra.bedrooms')}</label>
                            <input
                                type="number"
                                name="features.bedrooms"
                                value={formData.features.bedrooms}
                                onChange={handleChange}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>{t('dashboard_extra.bathrooms')}</label>
                            <input
                                type="number"
                                name="features.bathrooms"
                                value={formData.features.bathrooms}
                                onChange={handleChange}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Area (sqft)</label>
                            <input
                                type="number"
                                name="features.area.value"
                                value={formData.features.area.value}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>{t('dashboard_extra.year_built')}</label>
                            <input
                                type="number"
                                name="features.yearBuilt"
                                value={formData.features.yearBuilt}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className={styles.amenitiesGroup}>
                        <label>{t('dashboard_extra.amenities')}</label>
                        <div className={styles.amenitiesGrid}>
                            {amenitiesList.map(amenity => (
                                <label key={amenity} className={styles.checkboxLabel}>
                                    <input
                                        type="checkbox"
                                        value={amenity}
                                        checked={formData.features.amenities.includes(amenity)}
                                        onChange={handleAmenityChange}
                                    />
                                    <span>{amenity}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                <div className={styles.section}>
                    <h2>{t('dashboard_extra.images')}</h2>
                    <MediaUploader
                        images={formData.media?.images || []}
                        onChange={(newImages) => {
                            const resolved = typeof newImages === 'function' ? newImages(formData.media?.images || []) : newImages;
                            setFormData((prev) => ({
                                ...prev,
                                media: {
                                    ...prev.media,
                                    images: resolved
                                }
                            }));
                        }}
                    />
                </div>

                <div className={styles.section}>
                    <h2>360° Virtual Walkthrough</h2>
                    <div className={styles.tourSection}>
                        <div className={styles.tourSectionHeader}>
                            <h3>
                                <Compass size={20} color="#2563eb" />
                                <span>360° Virtual Tour Studio</span>
                            </h3>
                            {isEditMode && (
                                <button
                                    type="button"
                                    onClick={() => setShowTourStudio(prev => !prev)}
                                    className={styles.tourToggleBtn}
                                >
                                    <Sparkles size={16} />
                                    <span>{showTourStudio ? 'Close Tour Studio' : (tour ? 'Edit 360° Tour' : 'Create 360° Tour')}</span>
                                    {showTourStudio ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </button>
                            )}
                        </div>

                        {isEditMode ? (
                            showTourStudio ? (
                                <div style={{ marginTop: '1.5rem', background: '#ffffff', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                    <TourEditor
                                        propertyId={id}
                                        existingTour={tour}
                                        onSaved={(savedTour) => {
                                            setTour(savedTour);
                                            alert('360° Tour saved successfully!');
                                        }}
                                    />
                                </div>
                            ) : (
                                <p className={styles.tourNotice}>
                                    {tour
                                        ? `This property has an active 360° tour with ${tour.scenes?.length || 0} scenes. Click "Edit 360° Tour" to adjust hotspots or add rooms.`
                                        : 'No 360° tour attached to this property yet. Click "Create 360° Tour" to upload 360 photos or phone panoramas.'}
                                </p>
                            )
                        ) : (
                            <p className={styles.tourNotice}>
                                Save this property first. Once created, you can access the 360° Virtual Tour Studio to upload panoramas, link rooms, and enable gyroscope/VR modes.
                            </p>
                        )}
                    </div>
                </div>

                <div className={styles.actions}>
                    <button
                        type="button"
                        onClick={() => navigate('/properties')}
                        className={styles.cancelButton}
                    >{t('dashboard_extra.cancel')}</button>
                    <button
                        type="submit"
                        className={styles.saveButton}
                        disabled={loading}
                    >
                        <Save size={20} />
                        {loading ? 'Saving...' : 'Save Property'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddEditProperty;
