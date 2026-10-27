import { useLanguage } from "@/hooks/useLanguage";
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { propertyService } from '@/services/propertyService';
import { tourService } from '@/services/tourService';
import { ArrowLeft, Save, Compass, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import MediaUploader from '@/components/media/MediaUploader';
import TourEditor from '@/components/tour/TourEditor';
import { COUNTRIES, getMarketPreset, getCountryBranches, getDeveloperSuggestions } from '@/utils/marketPresets';
import { PROPERTY_TYPES, LISTING_CATEGORIES, FINISHING_TYPES, INSTALLMENT_FREQUENCIES } from '@/utils/constants';
import AICopyModal from '@/components/AICopyModal';
import { useUIStore } from '@/store/uiStore';
import styles from './AddEditProperty.module.css';

const AddEditProperty = () => {
    const { t } = useLanguage();
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = !!id;
    const [loading, setLoading] = useState(false);
    const [tour, setTour] = useState(null);
    const [showTourStudio, setShowTourStudio] = useState(false);
    const [aiCopyModalOpen, setAiCopyModalOpen] = useState(false);
    const addToast = useUIStore((s) => s.addToast);
    const selectedCountry = useUIStore((s) => s.selectedCountry);
    const selectedBranch = useUIStore((s) => s.selectedBranch);

    const initialCountry = selectedCountry || 'Egypt';
    const initialPreset = getMarketPreset(initialCountry);
    const initialBranches = getCountryBranches(initialCountry);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        propertyType: 'apartment',
        transactionType: 'sale',
        listingCategory: 'resale',
        country: initialCountry,
        branch: selectedBranch || initialBranches[0] || 'Main Branch',
        developer: {
            name: '',
            projectName: '',
            deliveryDate: '',
            finishingType: 'fully_finished'
        },
        paymentPlan: {
            downPaymentPercent: 10,
            installmentYears: 7,
            installmentFrequency: 'quarterly',
            handoverPaymentPercent: 10,
            maintenancePercent: 8
        },
        price: '',
        currency: initialPreset.currency || 'EGP',
        location: {
            address: '',
            city: '',
            area: '',
            country: initialCountry
        },
        features: {
            bedrooms: '',
            bathrooms: '',
            area: { value: '', unit: initialPreset.areaUnit || 'sqm' },
            furnished: 'unfurnished',
            yearBuilt: '',
            amenities: []
        },
        status: 'active',
        showInCatalog: true,
        media: {
            images: []
        }
    });

    // Keep new property form synced when user switches active country in header/dashboard
    useEffect(() => {
        if (!isEditMode && selectedCountry) {
            const preset = getMarketPreset(selectedCountry);
            const branches = getCountryBranches(selectedCountry);
            setFormData((prev) => ({
                ...prev,
                country: selectedCountry,
                branch: selectedBranch || branches[0] || 'Main Branch',
                currency: preset.currency || 'EGP',
                location: {
                    ...prev.location,
                    country: selectedCountry
                },
                features: {
                    ...prev.features,
                    area: {
                        ...prev.features.area,
                        unit: preset.areaUnit || 'sqm'
                    }
                }
            }));
        }
    }, [selectedCountry, selectedBranch, isEditMode]);

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
                showInCatalog: property.showInCatalog !== false,
                country: property.country || property.location?.country || 'Egypt',
                branch: property.branch || 'Main Branch',
                listingCategory: property.listingCategory || 'resale',
                developer: {
                    name: property.developer?.name || '',
                    projectName: property.developer?.projectName || '',
                    deliveryDate: property.developer?.deliveryDate ? property.developer.deliveryDate.substring(0, 10) : '',
                    finishingType: property.developer?.finishingType || 'fully_finished'
                },
                location: {
                    address: property.location?.address || '',
                    city: property.location?.city || '',
                    area: property.location?.area || '',
                    country: property.country || property.location?.country || 'Egypt'
                },
                paymentPlan: {
                    downPaymentPercent: property.paymentPlan?.downPaymentPercent ?? 10,
                    installmentYears: property.paymentPlan?.installmentYears ?? 7,
                    installmentFrequency: property.paymentPlan?.installmentFrequency || 'quarterly',
                    handoverPaymentPercent: property.paymentPlan?.handoverPaymentPercent ?? 10,
                    maintenancePercent: property.paymentPlan?.maintenancePercent ?? 8
                },
                features: {
                    ...property.features,
                    amenities: property.features?.amenities || [],
                    area: {
                        value: property.features?.area?.value ?? '',
                        unit: property.features?.area?.unit || 'sqm'
                    }
                }
            });

            try {
                const tourRes = await tourService.getTourByProperty(id);
                setTour(tourRes?.data ?? tourRes);
            } catch (tErr) {
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

    const handleCountryChange = (e) => {
        const selectedCountry = e.target.value;
        const preset = getMarketPreset(selectedCountry);
        const branches = preset?.branches || [];

        setFormData(prev => ({
            ...prev,
            country: selectedCountry,
            branch: branches[0] || 'Main Branch',
            currency: preset.currency || 'EGP',
            location: {
                ...prev.location,
                country: selectedCountry
            },
            features: {
                ...prev.features,
                area: {
                    ...prev.features.area,
                    unit: preset.areaUnit || 'sqm'
                }
            }
        }));
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

    const handleApplyAiCopy = ({ language, title, description }) => {
        setFormData(prev => ({
            ...prev,
            title: title || prev.title,
            description: description || prev.description
        }));
        addToast({ type: 'success', message: `${language === 'ar' ? 'Arabic' : 'English'} AI copy applied to property!` });
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const dataToSave = {
                ...formData,
                price: Number(formData.price),
                paymentPlan: {
                    downPaymentPercent: Number(formData.paymentPlan?.downPaymentPercent || 0),
                    installmentYears: Number(formData.paymentPlan?.installmentYears || 0),
                    installmentFrequency: formData.paymentPlan?.installmentFrequency || 'quarterly',
                    handoverPaymentPercent: Number(formData.paymentPlan?.handoverPaymentPercent || 0),
                    maintenancePercent: Number(formData.paymentPlan?.maintenancePercent || 0)
                },
                features: {
                    ...formData.features,
                    bedrooms: formData.features?.bedrooms ? Number(formData.features.bedrooms) : undefined,
                    bathrooms: formData.features?.bathrooms ? Number(formData.features.bathrooms) : undefined,
                    yearBuilt: formData.features?.yearBuilt ? Number(formData.features.yearBuilt) : undefined,
                    area: {
                        ...formData.features?.area,
                        value: Number(formData.features?.area?.value || 0)
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

    const availableBranches = getCountryBranches(formData.country);
    const availableDevelopers = getDeveloperSuggestions(formData.country);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <button onClick={() => navigate('/properties')} className={styles.backButton}>
                    <ArrowLeft size={20} /> Back
                </button>
                <h1>{isEditMode ? 'Edit Property' : 'Add New Property'}</h1>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
                {/* Regional Market & Branch */}
                <div className={styles.section}>
                    <h2>Regional Market & Branch</h2>
                    <div className={styles.grid}>
                        <div className={styles.formGroup}>
                            <label>Country / Market</label>
                            <select name="country" value={formData.country} onChange={handleCountryChange} required>
                                {COUNTRIES.map(c => (
                                    <option key={c.value} value={c.value}>{c.label} ({c.currency})</option>
                                ))}
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label>Branch</label>
                            <input
                                type="text"
                                name="branch"
                                list="branch-options"
                                value={formData.branch}
                                onChange={handleChange}
                                placeholder="e.g. New Cairo, Dubai, Riyadh"
                                required
                            />
                            <datalist id="branch-options">
                                {availableBranches.map(b => (
                                    <option key={b} value={b} />
                                ))}
                            </datalist>
                        </div>
                        <div className={styles.formGroup}>
                            <label>Listing Category</label>
                            <select name="listingCategory" value={formData.listingCategory} onChange={handleChange}>
                                {LISTING_CATEGORIES.map(c => (
                                    <option key={c.value} value={c.value}>{c.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Developer & Project Specifications */}
                <div className={styles.section}>
                    <h2>Developer & Project Specifications</h2>
                    <div className={styles.grid}>
                        <div className={styles.formGroup}>
                            <label>Developer Name</label>
                            <input
                                type="text"
                                name="developer.name"
                                list="developer-list"
                                value={formData.developer?.name || ''}
                                onChange={handleChange}
                                placeholder="e.g. Emaar, SODIC, ROSHN"
                            />
                            <datalist id="developer-list">
                                {availableDevelopers.map(dev => (
                                    <option key={dev} value={dev} />
                                ))}
                            </datalist>
                        </div>
                        <div className={styles.formGroup}>
                            <label>Project / Compound Name</label>
                            <input
                                type="text"
                                name="developer.projectName"
                                value={formData.developer?.projectName || ''}
                                onChange={handleChange}
                                placeholder="e.g. Mivida, Downtown, Sedra"
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Delivery Date</label>
                            <input
                                type="date"
                                name="developer.deliveryDate"
                                value={formData.developer?.deliveryDate ? formData.developer.deliveryDate.substring(0, 10) : ''}
                                onChange={handleChange}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Finishing Type</label>
                            <select
                                name="developer.finishingType"
                                value={formData.developer?.finishingType || 'fully_finished'}
                                onChange={handleChange}
                            >
                                {FINISHING_TYPES.map(f => (
                                    <option key={f.value} value={f.value}>{f.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Off-Plan Payment Plan & Financing Terms */}
                {(formData.listingCategory === 'primary_offplan' || formData.transactionType === 'sale') && (
                    <div className={styles.section}>
                        <h2>Off-Plan Payment Plan Terms</h2>
                        <div className={styles.grid}>
                            <div className={styles.formGroup}>
                                <label>Down Payment (%)</label>
                                <input
                                    type="number"
                                    name="paymentPlan.downPaymentPercent"
                                    min="0"
                                    max="100"
                                    value={formData.paymentPlan?.downPaymentPercent ?? ''}
                                    onChange={handleChange}
                                    placeholder="e.g. 10"
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Installment Duration (Years)</label>
                                <input
                                    type="number"
                                    name="paymentPlan.installmentYears"
                                    min="1"
                                    max="20"
                                    value={formData.paymentPlan?.installmentYears ?? ''}
                                    onChange={handleChange}
                                    placeholder="e.g. 7"
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Installment Frequency</label>
                                <select
                                    name="paymentPlan.installmentFrequency"
                                    value={formData.paymentPlan?.installmentFrequency || 'quarterly'}
                                    onChange={handleChange}
                                >
                                    {INSTALLMENT_FREQUENCIES.map(f => (
                                        <option key={f.value} value={f.value}>{f.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label>Handover Milestone (%)</label>
                                <input
                                    type="number"
                                    name="paymentPlan.handoverPaymentPercent"
                                    min="0"
                                    max="100"
                                    value={formData.paymentPlan?.handoverPaymentPercent ?? ''}
                                    onChange={handleChange}
                                    placeholder="e.g. 10"
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Maintenance Escrow (%)</label>
                                <input
                                    type="number"
                                    name="paymentPlan.maintenancePercent"
                                    min="0"
                                    max="20"
                                    value={formData.paymentPlan?.maintenancePercent ?? ''}
                                    onChange={handleChange}
                                    placeholder="e.g. 8"
                                />
                            </div>
                        </div>

                        {/* Real-time Calculation Summary Card */}
                        {Number(formData.price) > 0 && (
                            <div style={{
                                marginTop: '1rem',
                                padding: '1rem',
                                background: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                                gap: '1rem'
                            }}>
                                <div>
                                    <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Down Payment Amount</span>
                                    <strong style={{ color: '#2563eb', fontSize: '1rem' }}>
                                        {formData.currency} {Math.round(Number(formData.price) * ((Number(formData.paymentPlan?.downPaymentPercent) || 0) / 100)).toLocaleString()}
                                    </strong>
                                </div>
                                <div>
                                    <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>
                                        Estimated {formData.paymentPlan?.installmentFrequency || 'Quarterly'} Payment
                                    </span>
                                    <strong style={{ color: '#059669', fontSize: '1rem' }}>
                                        {(() => {
                                            const p = Number(formData.price) || 0;
                                            const dp = p * ((Number(formData.paymentPlan?.downPaymentPercent) || 0) / 100);
                                            const ho = p * ((Number(formData.paymentPlan?.handoverPaymentPercent) || 0) / 100);
                                            const financed = Math.max(0, p - dp - ho);
                                            const yrs = Number(formData.paymentPlan?.installmentYears) || 0;
                                            const mult = { monthly: 12, quarterly: 4, semi_annual: 2, annual: 1 }[formData.paymentPlan?.installmentFrequency] || 4;
                                            const total = yrs * mult;
                                            const periodic = total > 0 ? Math.round(financed / total) : 0;
                                            return `${formData.currency} ${periodic.toLocaleString()}`;
                                        })()}
                                    </strong>
                                </div>
                                <div>
                                    <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Total Installments</span>
                                    <strong style={{ color: '#0f172a', fontSize: '1rem' }}>
                                        {(Number(formData.paymentPlan?.installmentYears) || 0) * ({ monthly: 12, quarterly: 4, semi_annual: 2, annual: 1 }[formData.paymentPlan?.installmentFrequency] || 4)} payments
                                    </strong>
                                </div>
                                <div>
                                    <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Maintenance Deposit</span>
                                    <strong style={{ color: '#475569', fontSize: '1rem' }}>
                                        {formData.currency} {Math.round(Number(formData.price) * ((Number(formData.paymentPlan?.maintenancePercent) || 0) / 100)).toLocaleString()}
                                    </strong>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Basic Information */}
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h2>{t('dashboard_extra.basic_information')}</h2>
                        <button
                            type="button"
                            className={styles.aiCopyButton}
                            onClick={() => setAiCopyModalOpen(true)}
                            title="Generate bilingual listing copy with AI"
                        >
                            <Sparkles size={16} />
                            <span>AI Listing Copy</span>
                        </button>
                    </div>
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
                                {PROPERTY_TYPES.map(type => (
                                    <option key={type.value} value={type.value}>{type.label}</option>
                                ))}
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
                            <label>{t('dashboard_extra.price')} ({formData.currency})</label>
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
                    <div style={{ marginTop: '0.85rem', padding: '0.85rem 1rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                        <div>
                            <strong style={{ display: 'block', fontSize: '0.92rem', color: '#0f172a' }}>Show in Public Agency Catalog</strong>
                            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>When active, this property will be displayed on your agency&apos;s public catalog page.</span>
                        </div>
                        <input
                            type="checkbox"
                            checked={formData.showInCatalog !== false}
                            onChange={(e) => setFormData((prev) => ({ ...prev, showInCatalog: e.target.checked }))}
                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                    </div>
                </div>

                {/* Location */}
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

                {/* Features */}
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
                            <label>Area ({formData.features?.area?.unit || 'sqm'})</label>
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

                {/* Images */}
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

                {/* 360 Virtual Walkthrough */}
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

            <AICopyModal
                isOpen={aiCopyModalOpen}
                onClose={() => setAiCopyModalOpen(false)}
                propertyData={formData}
                onApplyCopy={handleApplyAiCopy}
            />
        </div>
    );
};

export default AddEditProperty;
