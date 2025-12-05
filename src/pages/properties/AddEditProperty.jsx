import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { propertyService } from '@/services/propertyService';
import { ArrowLeft, Save, Upload, X } from 'lucide-react';
import styles from './AddEditProperty.module.css';

const AddEditProperty = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = !!id;
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        propertyType: 'apartment',
        transactionType: 'sale',
        price: '',
        currency: 'USD',
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
                    <h2>Basic Information</h2>
                    <div className={styles.grid}>
                        <div className={styles.formGroup}>
                            <label>Title</label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Type</label>
                            <select name="propertyType" value={formData.propertyType} onChange={handleChange}>
                                <option value="apartment">Apartment</option>
                                <option value="villa">Villa</option>
                                <option value="townhouse">Townhouse</option>
                                <option value="office">Office</option>
                                <option value="land">Land</option>
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label>Transaction Type</label>
                            <select name="transactionType" value={formData.transactionType} onChange={handleChange}>
                                <option value="sale">For Sale</option>
                                <option value="rent">For Rent</option>
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label>Price</label>
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
                        <label>Description</label>
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
                    <h2>Location</h2>
                    <div className={styles.grid}>
                        <div className={styles.formGroup}>
                            <label>Address</label>
                            <input
                                type="text"
                                name="location.address"
                                value={formData.location.address}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>City</label>
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
                    <h2>Features</h2>
                    <div className={styles.grid}>
                        <div className={styles.formGroup}>
                            <label>Bedrooms</label>
                            <input
                                type="number"
                                name="features.bedrooms"
                                value={formData.features.bedrooms}
                                onChange={handleChange}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Bathrooms</label>
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
                            <label>Year Built</label>
                            <input
                                type="number"
                                name="features.yearBuilt"
                                value={formData.features.yearBuilt}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className={styles.amenitiesGroup}>
                        <label>Amenities</label>
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
                    <h2>Images</h2>
                    <div className={styles.imageUpload}>
                        <input
                            type="file"
                            id="images"
                            multiple
                            accept="image/*"
                            onChange={handleImageChange}
                            className={styles.fileInput}
                        />
                        <label htmlFor="images" className={styles.uploadButton}>
                            <Upload size={20} />
                            <span>Upload Images</span>
                        </label>
                    </div>

                    <div className={styles.imagePreview}>
                        {imageUrls.map((img, index) => (
                            <div key={index} className={styles.previewItem}>
                                <img src={img.url} alt={`Preview ${index}`} />
                                <button
                                    type="button"
                                    onClick={() => removeImage(index)}
                                    className={styles.removeButton}
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className={styles.actions}>
                    <button
                        type="button"
                        onClick={() => navigate('/properties')}
                        className={styles.cancelButton}
                    >
                        Cancel
                    </button>
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
