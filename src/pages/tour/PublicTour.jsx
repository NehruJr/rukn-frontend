import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { tourService } from '@/services/tourService';
import TourViewer from '@/components/tour/TourViewer';
import { MapPin, Phone, Mail, ArrowLeft, ExternalLink, Loader2 } from 'lucide-react';
import styles from './PublicTour.module.css';

export const PublicTour = () => {
  const { token } = useParams();
  const [tour, setTour] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTour = async () => {
      try {
        setLoading(true);
        const response = await tourService.getPublicTour(token);
        setTour(response.data);
      } catch (err) {
        console.error('Error loading public tour:', err);
        setError(err.response?.data?.message || 'Virtual tour not found or expired.');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchTour();
    }
  }, [token]);

  if (loading) {
    return (
      <div className={styles.loadingWrapper}>
        <Loader2 className={styles.spinner} size={36} />
        <p>Loading 360° Virtual Tour...</p>
      </div>
    );
  }

  if (error || !tour) {
    return (
      <div className={styles.errorWrapper}>
        <h2>Virtual Tour Unavailable</h2>
        <p>{error || 'This tour link is invalid or has expired.'}</p>
        <Link to="/" className={styles.backHomeBtn}>
          <ArrowLeft size={16} /> Return to Homepage
        </Link>
      </div>
    );
  }

  const property = tour.property;

  return (
    <div className={styles.pageWrapper}>
      {/* Top Floating Property Badge */}
      <div className={styles.topHeader}>
        <div className={styles.propertyInfo}>
          <h1 className={styles.tourTitle}>{tour.title}</h1>
          {property && (
            <div className={styles.propertySub}>
              {property.location?.city && (
                <span className={styles.location}>
                  <MapPin size={14} /> {property.location.city}
                  {property.location.address ? `, ${property.location.address}` : ''}
                </span>
              )}
              {property.price && (
                <span className={styles.price}>
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: property.currency || 'EGP',
                    maximumFractionDigits: 0
                  }).format(property.price)}
                </span>
              )}
            </div>
          )}
        </div>

        {property?.shareToken && (
          <Link to={`/share/${property.shareToken}`} className={styles.viewListingBtn}>
            <span>View Full Listing</span>
            <ExternalLink size={14} />
          </Link>
        )}
      </div>

      {/* Main Full-Height 360 Viewer */}
      <div className={styles.viewerContainer}>
        <TourViewer tour={tour} height="100vh" />
      </div>
    </div>
  );
};

export default PublicTour;
