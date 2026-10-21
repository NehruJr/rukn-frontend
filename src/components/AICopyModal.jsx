import { useState, useEffect } from 'react';
import {
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  Globe2,
  FileText,
  Share2,
  AlertCircle
} from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { aiService } from '@/services/aiService';
import { useUIStore } from '@/store/uiStore';
import styles from './AICopyModal.module.css';

const AICopyModal = ({
  isOpen,
  onClose,
  propertyData,
  onApplyCopy
}) => {
  const addToast = useUIStore((s) => s.addToast);
  const [activeTab, setActiveTab] = useState('en'); // 'en' | 'ar'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copyData, setCopyData] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);

  useEffect(() => {
    if (isOpen && !copyData && !loading) {
      handleGenerate();
    }
  }, [isOpen]);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        country: propertyData.country || 'Egypt',
        branch: propertyData.branch || 'Main Branch',
        developer: propertyData.developer || {},
        propertyType: propertyData.propertyType || 'apartment',
        transactionType: propertyData.transactionType || 'sale',
        listingCategory: propertyData.listingCategory || 'resale',
        price: propertyData.price ? Number(propertyData.price) : undefined,
        currency: propertyData.currency || 'EGP',
        location: propertyData.location || {},
        features: {
          bedrooms: propertyData.features?.bedrooms ? Number(propertyData.features.bedrooms) : undefined,
          bathrooms: propertyData.features?.bathrooms ? Number(propertyData.features.bathrooms) : undefined,
          area: propertyData.features?.area || { value: 0, unit: 'sqm' },
          amenities: propertyData.features?.amenities || []
        },
        paymentPlan: propertyData.paymentPlan || undefined
      };

      const res = await aiService.generateListingCopy(payload);
      if (res?.data) {
        setCopyData(res.data);
      } else {
        throw new Error('Invalid response format from AI service');
      }
    } catch (err) {
      console.error('AI Copy generation error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to generate AI listing copy');
      addToast({
        type: 'error',
        message: 'Failed to generate AI listing copy. Using fallback template.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToClipboard = async (text, key) => {
    if (!text) return;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedKey(key);
      addToast({ type: 'success', message: 'Copied to clipboard!' });
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (err) {
      console.error('Clipboard copy error:', err);
      addToast({ type: 'error', message: 'Failed to copy to clipboard' });
    }
  };

  const handleApplyEnglish = () => {
    if (!copyData?.english) return;
    onApplyCopy({
      language: 'en',
      title: copyData.english.title,
      description: copyData.english.description
    });
    addToast({ type: 'success', message: 'English title & description applied!' });
    onClose();
  };

  const handleApplyArabic = () => {
    if (!copyData?.arabic) return;
    onApplyCopy({
      language: 'ar',
      title: copyData.arabic.title,
      description: copyData.arabic.description
    });
    addToast({ type: 'success', message: 'Arabic title & description applied!' });
    onClose();
  };

  const currentCopy = activeTab === 'en' ? copyData?.english : copyData?.arabic;
  const isRtl = activeTab === 'ar';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="AI Listing Copywriter"
      size="lg"
    >
      <div className={styles.container}>
        {/* Modal Description & Context Pill */}
        <div className={styles.contextBar}>
          <div className={styles.contextInfo}>
            <Sparkles size={16} className={styles.sparkleIcon} />
            <span>
              Generate high-converting bilingual copy for{' '}
              <strong>{propertyData.propertyType || 'property'}</strong> in{' '}
              <strong>{propertyData.location?.city || propertyData.country || 'prime location'}</strong>
              {propertyData.developer?.name ? ` by ${propertyData.developer.name}` : ''}.
            </span>
          </div>
          <button
            type="button"
            className={styles.refreshBtn}
            onClick={handleGenerate}
            disabled={loading}
            title="Regenerate copy"
          >
            <RefreshCw size={14} className={loading ? styles.spinning : ''} />
            <span>Regenerate</span>
          </button>
        </div>

        {/* Language Tabs */}
        <div className={styles.tabBar}>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'en' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('en')}
          >
            <Globe2 size={16} />
            <span>English Copy</span>
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'ar' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('ar')}
          >
            <Globe2 size={16} />
            <span>Arabic Copy (العربية)</span>
          </button>
        </div>

        {/* Error State */}
        {error && (
          <div className={styles.errorBanner}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Loading Shimmer */}
        {loading ? (
          <div className={styles.loadingSkeleton}>
            <div className={styles.skeletonLine} style={{ width: '60%', height: '24px' }} />
            <div className={styles.skeletonLine} style={{ width: '100%', height: '80px' }} />
            <div className={styles.skeletonLine} style={{ width: '85%', height: '50px' }} />
            <p className={styles.loadingText}>Crafting premium real estate listing copy with Gemini AI...</p>
          </div>
        ) : copyData ? (
          <div className={styles.copyBody} dir={isRtl ? 'rtl' : 'ltr'}>
            {/* Title Section */}
            <div className={styles.fieldCard}>
              <div className={styles.fieldHeader}>
                <label className={styles.fieldLabel}>
                  <FileText size={15} />
                  <span>{isRtl ? 'عنوان الإعلان المقترح' : 'Listing Title'}</span>
                </label>
                <button
                  type="button"
                  className={styles.iconCopyBtn}
                  onClick={() => handleCopyToClipboard(currentCopy?.title, 'title')}
                  title="Copy title"
                >
                  {copiedKey === 'title' ? <Check size={14} color="#059669" /> : <Copy size={14} />}
                  <span>{copiedKey === 'title' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className={styles.titleBox}>
                {currentCopy?.title || 'No title generated'}
              </div>
            </div>

            {/* Description Section */}
            <div className={styles.fieldCard}>
              <div className={styles.fieldHeader}>
                <label className={styles.fieldLabel}>
                  <FileText size={15} />
                  <span>{isRtl ? 'الوصف التسويقي الكامل' : 'Marketing Description'}</span>
                </label>
                <button
                  type="button"
                  className={styles.iconCopyBtn}
                  onClick={() => handleCopyToClipboard(currentCopy?.description, 'desc')}
                  title="Copy description"
                >
                  {copiedKey === 'desc' ? <Check size={14} color="#059669" /> : <Copy size={14} />}
                  <span>{copiedKey === 'desc' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className={styles.descriptionBox}>
                {currentCopy?.description || 'No description generated'}
              </div>
            </div>

            {/* Social Media Caption Section */}
            <div className={styles.fieldCard}>
              <div className={styles.fieldHeader}>
                <label className={styles.fieldLabel}>
                  <Share2 size={15} />
                  <span>{isRtl ? 'كابشن السوشيال ميديا و الهاشتاجات' : 'Social Media Caption & Hashtags'}</span>
                </label>
                <button
                  type="button"
                  className={styles.copyCaptionBtn}
                  onClick={() => handleCopyToClipboard(currentCopy?.socialCaption, 'social')}
                  title="Copy Social Caption to Clipboard"
                >
                  {copiedKey === 'social' ? <Check size={14} /> : <Copy size={14} />}
                  <span>Copy Social Caption to Clipboard</span>
                </button>
              </div>
              <div className={styles.socialBox}>
                {currentCopy?.socialCaption || 'No caption generated'}
              </div>
            </div>
          </div>
        ) : null}

        {/* Modal Actions Footer */}
        <div className={styles.footerActions}>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>

          <div className={styles.insertGroup}>
            <button
              type="button"
              className={styles.insertEnglishBtn}
              onClick={handleApplyEnglish}
              disabled={!copyData?.english}
            >
              Insert English Title & Description
            </button>
            <button
              type="button"
              className={styles.insertArabicBtn}
              onClick={handleApplyArabic}
              disabled={!copyData?.arabic}
            >
              Insert Arabic Title & Description
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default AICopyModal;
