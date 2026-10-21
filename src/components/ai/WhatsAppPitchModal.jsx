import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Sparkles,
  MessageSquare,
  Copy,
  Check,
  Send,
  Building,
  Globe,
  Sliders,
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { aiService } from '@/services/aiService';
import { leadService } from '@/services/leadService';
import { useUIStore } from '@/store/uiStore';
import { formatWhatsAppPhone } from '@/utils/whatsappPitch';
import styles from './WhatsAppPitchModal.module.css';

const DIALECT_OPTIONS = [
  { value: 'en', label: 'English', sublabel: 'Corporate & Executive', flag: '🇬🇧' },
  { value: 'ar-EG', label: 'مصري', sublabel: 'Egyptian Arabic', flag: '🇪🇬' },
  { value: 'ar-AE', label: 'خليجي / إماراتي', sublabel: 'Gulf & UAE Arabic', flag: '🇦🇪' },
  { value: 'ar-SA', label: 'سعودي', sublabel: 'Saudi Arabic', flag: '🇸🇦' }
];

const TONE_OPTIONS = [
  { value: 'consultative', label: 'Consultative' },
  { value: 'urgent', label: 'High Urgency' },
  { value: 'friendly', label: 'Warm & Friendly' },
  { value: 'executive', label: 'Executive VIP' }
];

const WhatsAppPitchModal = ({
  isOpen,
  onClose,
  lead,
  initialProperty = null,
  matchedProperties = [],
  assignedProperties = []
}) => {
  const queryClient = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);

  // Available property list: combines matched properties, assigned properties, and initialProperty
  const combinedProperties = (() => {
    const map = new Map();
    if (initialProperty) {
      const id = initialProperty._id?.toString?.() || initialProperty._id;
      map.set(id, { property: initialProperty, label: initialProperty.title });
    }
    matchedProperties.forEach((m) => {
      const p = m.property || m;
      const id = p._id?.toString?.() || p._id;
      if (!map.has(id)) {
        map.set(id, {
          property: p,
          label: `${p.title} (${m.matchScore ? `${m.matchScore}% Match` : 'Matched'})`
        });
      }
    });
    assignedProperties.forEach((a) => {
      const p = a.property || a;
      const id = p._id?.toString?.() || p._id;
      if (!map.has(id)) {
        map.set(id, { property: p, label: `${p.title} (Assigned)` });
      }
    });
    return Array.from(map.values());
  })();

  const defaultProp = initialProperty || combinedProperties[0]?.property || null;
  const [selectedPropertyId, setSelectedPropertyId] = useState(
    defaultProp?._id?.toString?.() || defaultProp?._id || ''
  );

  // Default dialect based on country
  const getDefaultDialect = () => {
    const c = String(lead?.country || defaultProp?.country || '').toLowerCase();
    if (c.includes('uae') || c.includes('emirates')) return 'ar-AE';
    if (c.includes('saudi') || c.includes('ksa')) return 'ar-SA';
    return 'ar-EG';
  };

  const [dialect, setDialect] = useState(getDefaultDialect());
  const [tone, setTone] = useState('consultative');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pitchScript, setPitchScript] = useState('');
  const [keySellingPoints, setKeySellingPoints] = useState([]);
  const [isCopied, setIsCopied] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Find currently active property object
  const currentPropertyEntry = combinedProperties.find(
    (item) => (item.property._id?.toString?.() || item.property._id) === selectedPropertyId
  );
  const activeProperty = currentPropertyEntry?.property || defaultProp;

  useEffect(() => {
    if (isOpen && activeProperty) {
      handleGeneratePitch();
    }
  }, [isOpen, selectedPropertyId, dialect, tone]);

  const handleGeneratePitch = async () => {
    if (!activeProperty) return;

    setLoading(true);
    setError(null);
    try {
      const payload = {
        leadId: lead?._id,
        propertyId: activeProperty._id,
        language: dialect,
        tone: tone,
        lead: {
          firstName: lead?.firstName || '',
          lastName: lead?.lastName || '',
          phone: lead?.phone || '',
          country: lead?.country || activeProperty.country || 'Egypt'
        },
        property: {
          title: activeProperty.title,
          propertyType: activeProperty.propertyType,
          price: activeProperty.price,
          currency: activeProperty.currency || 'EGP',
          location: activeProperty.location || {},
          features: activeProperty.features || {},
          developer: activeProperty.developer || {},
          paymentPlan: activeProperty.paymentPlan,
          shareToken: activeProperty.shareToken || activeProperty._id,
          virtualTourToken: activeProperty.virtualTour?.shareToken || activeProperty.tourShareToken
        }
      };

      const res = await aiService.generatePitchScript(payload);
      if (res?.data) {
        setPitchScript(res.data.pitchScript || '');
        setKeySellingPoints(res.data.keySellingPoints || []);
      } else {
        throw new Error('Invalid pitch response format');
      }
    } catch (err) {
      console.error('Failed to generate pitch script:', err);
      setError(err.response?.data?.message || err.message || 'Failed to generate script');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyScript = async () => {
    if (!pitchScript) return;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(pitchScript);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = pitchScript;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setIsCopied(true);
      addToast({ type: 'success', message: 'Pitch script copied to clipboard!' });
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy pitch script:', err);
      addToast({ type: 'error', message: 'Could not copy to clipboard' });
    }
  };

  const handleOpenWhatsApp = async () => {
    if (!pitchScript) return;

    setIsSending(true);
    try {
      const cleanPhone = formatWhatsAppPhone(
        lead?.phone,
        activeProperty?.country || lead?.country
      );
      const encodedMsg = encodeURIComponent(pitchScript);
      const waUrl = cleanPhone
        ? `https://wa.me/${cleanPhone}?text=${encodedMsg}`
        : `https://wa.me/?text=${encodedMsg}`;

      // Open WhatsApp in new tab
      window.open(waUrl, '_blank');

      // Automatically log whatsapp activity on the lead
      if (lead?._id) {
        const propTitle = activeProperty?.title || 'Selected Property';
        await leadService.addActivity(lead._id, {
          type: 'whatsapp',
          title: `AI WhatsApp Pitch (${dialect}) - ${propTitle}`,
          description: `Sent personalized AI pitch script via WhatsApp in dialect "${dialect}". Message preview: "${pitchScript.substring(0, 180)}..."`
        });

        queryClient.invalidateQueries(['lead', lead._id]);
        queryClient.invalidateQueries(['leads']);
      }

      addToast({
        type: 'success',
        message: 'WhatsApp opened & activity logged on lead!'
      });

      onClose();
    } catch (err) {
      console.error('Error logging WhatsApp activity:', err);
      addToast({
        type: 'warning',
        message: 'WhatsApp opened, but activity logging failed'
      });
    } finally {
      setIsSending(false);
    }
  };

  const isRtl = dialect !== 'en';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="WhatsApp AI Pitch Generator"
      size="lg"
    >
      <div className={styles.modalBody}>
        {/* Lead Summary Bar */}
        <div className={styles.leadBar}>
          <span>Pitching to:</span>
          <strong>{lead ? `${lead.firstName || ''} ${lead.lastName || ''}`.trim() : 'Valued Client'}</strong>
          {lead?.phone && <span className={styles.phoneBadge}>{lead.phone}</span>}
        </div>

        {/* Controls Row: Property Selector, Dialect, Tone */}
        <div className={styles.controlsGrid}>
          {/* Property Selector */}
          <div className={styles.controlGroup}>
            <label className={styles.label}>
              <Building size={14} /> Target Property
            </label>
            <select
              className={styles.select}
              value={selectedPropertyId}
              onChange={(e) => setSelectedPropertyId(e.target.value)}
              disabled={loading}
            >
              {combinedProperties.length === 0 && (
                <option value="">No properties available</option>
              )}
              {combinedProperties.map(({ property, label }) => {
                const id = property._id?.toString?.() || property._id;
                return (
                  <option key={id} value={id}>
                    {label}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Dialect Selector */}
          <div className={styles.controlGroup}>
            <label className={styles.label}>
              <Globe size={14} /> Regional Dialect
            </label>
            <select
              className={styles.select}
              value={dialect}
              onChange={(e) => setDialect(e.target.value)}
              disabled={loading}
            >
              {DIALECT_OPTIONS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.flag} {d.label} — {d.sublabel}
                </option>
              ))}
            </select>
          </div>

          {/* Tone Selector */}
          <div className={styles.controlGroup}>
            <label className={styles.label}>
              <Sliders size={14} /> Outreach Tone
            </label>
            <select
              className={styles.select}
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              disabled={loading}
            >
              {TONE_OPTIONS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className={styles.errorBox}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Selling Points Preview */}
        {keySellingPoints.length > 0 && (
          <div className={styles.sellingPointsRow}>
            <span className={styles.sellingPointsLabel}>AI Selling Angles:</span>
            <div className={styles.sellingPointsList}>
              {keySellingPoints.map((pt, idx) => (
                <span key={idx} className={styles.sellingTag}>
                  ✨ {pt}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Script Editor & Live Preview */}
        <div className={styles.previewCard}>
          <div className={styles.previewHeader}>
            <div className={styles.previewHeaderLeft}>
              <MessageSquare size={16} color="#059669" />
              <span>Personalized WhatsApp Outreach Script</span>
            </div>
            <span className={styles.charCount}>
              {pitchScript.length} characters
            </span>
          </div>

          {loading ? (
            <div className={styles.loadingState}>
              <Sparkles size={24} className={styles.spinning} />
              <p>Generating personalized dialect pitch script...</p>
            </div>
          ) : (
            <textarea
              className={styles.scriptTextarea}
              rows={8}
              dir={isRtl ? 'rtl' : 'ltr'}
              value={pitchScript}
              onChange={(e) => setPitchScript(e.target.value)}
              placeholder="Script preview will appear here..."
            />
          )}
        </div>

        {/* Action Buttons */}
        <div className={styles.actionsFooter}>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>

          <div className={styles.actionButtonsGroup}>
            <button
              type="button"
              className={styles.copyBtn}
              onClick={handleCopyScript}
              disabled={!pitchScript || loading}
            >
              {isCopied ? <Check size={16} color="#059669" /> : <Copy size={16} />}
              <span>{isCopied ? 'Copied!' : 'Copy Script'}</span>
            </button>

            <button
              type="button"
              className={styles.sendWhatsAppBtn}
              onClick={handleOpenWhatsApp}
              disabled={!pitchScript || loading || isSending}
            >
              <Send size={16} />
              <span>{isSending ? 'Logging & Opening...' : 'Open WhatsApp'}</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default WhatsAppPitchModal;
