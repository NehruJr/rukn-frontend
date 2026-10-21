import React, { useEffect, useMemo } from 'react';
import { QRCodeSVG } from '@/utils/qrCode';
import {
  Printer, X, MapPin, Building, Globe, CheckCircle,
  Phone, Mail, Compass, Calendar, Maximize, Bed, Bath, Shield
} from 'lucide-react';
import styles from './PropertyOfferModal.module.css';

/**
 * 1-Page Print-Ready A4 Branded Property Offer Brochure Modal
 * Features:
 * - Agency Branding ("Rukn Real Estate / ركن العقارية") with official reference ID & date
 * - Property Hero & Specifications Grid
 * - Developer & Compound Information
 * - Structured Payment Plan & Installment Schedule
 * - Scannable Pure JS SVG QR Code linking to 360° Tour or Public Share URL
 * - Listing Agent Card with direct contacts & regulatory license
 * - Strict @media print CSS rules for 1-page A4 printing with zero page overflow
 */
const PropertyOfferModal = ({
  isOpen,
  onClose,
  property,
  tour = null,
  agencyName = 'Rukn Real Estate / ركن العقارية'
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !property) return null;

  // Format currency
  const currency = property.currency || 'EGP';
  const formatMoney = (amount) => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        maximumFractionDigits: 0
      }).format(amount || 0);
    } catch {
      return `${currency} ${Math.round(amount || 0).toLocaleString('en-US')}`;
    }
  };

  // Payment Plan Math
  const price = property.price || 0;
  const plan = property.paymentPlan || {};
  const downPaymentPercent = plan.downPaymentPercent || 0;
  const handoverPaymentPercent = plan.handoverPaymentPercent || 0;
  const installmentYears = plan.installmentYears || 0;
  const installmentFrequency = plan.installmentFrequency || 'quarterly';
  const maintenancePercent = plan.maintenancePercent || 0;

  const downPaymentAmount = price * (downPaymentPercent / 100);
  const handoverPaymentAmount = price * (handoverPaymentPercent / 100);
  const financedBalance = Math.max(0, price - downPaymentAmount - handoverPaymentAmount);
  const freqMultiplier = {
    monthly: 12,
    quarterly: 4,
    semi_annual: 2,
    annual: 1
  }[installmentFrequency] || 4;

  const totalInstallments = installmentYears * freqMultiplier;
  const periodicInstallmentAmount = totalInstallments > 0 ? (financedBalance / totalInstallments) : 0;
  const maintenanceDepositAmount = price * (maintenancePercent / 100);

  const hasPaymentPlan = downPaymentPercent > 0 || installmentYears > 0;

  // QR Code Destination URL: 360° Virtual Tour (if available) or Public Share Page
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const tourToken = tour?.shareToken || property.virtualTour?.shareToken || property.media?.virtualTour;
  const shareToken = property.shareToken || property._id;
  const qrUrl = tourToken
    ? `${origin}/tour/${tourToken}`
    : `${origin}/share/${shareToken}`;

  const isTour = Boolean(tourToken);

  // Reference number & date
  const refCode = `RK-${(property._id || '').slice(-6).toUpperCase()}`;
  const currentDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const locationStr = [
    property.location?.address,
    property.location?.area,
    property.location?.city
  ].filter(Boolean).join(', ') || 'Prime Brokerage Location';

  const coverImage = property.media?.images?.find(img => img.isCover)?.url ||
    property.media?.images?.[0]?.url ||
    '/placeholder-property.jpg';

  const handlePrint = () => {
    window.print();
  };

  // Regional regulatory license text
  const country = property.country || 'Egypt';
  let licenseText = 'Official Licensed Agency Brokerage';
  if (country === 'UAE' || country.toLowerCase() === 'uae') {
    licenseText = 'RERA / Trakheesi Permit Approved';
  } else if (country === 'Saudi Arabia' || country.toLowerCase().includes('saudi')) {
    licenseText = 'REGA / FAL Advertising License Verified';
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
        {/* On-screen Preview Bar (Hidden during Print) */}
        <div className={`${styles.previewBar} ${styles.noPrint}`}>
          <div className={styles.previewTitle}>
            <Building size={20} className={styles.brandIcon} />
            <div>
              <h3>Branded Property Offer Brochure Preview</h3>
              <p>Print-ready 1-Page A4 format with verified QR code</p>
            </div>
          </div>
          <div className={styles.previewActions}>
            <button
              type="button"
              onClick={handlePrint}
              className={styles.printButton}
            >
              <Printer size={18} />
              <span>Print / Save as PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className={styles.closeButton}
              title="Close Preview"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Physical A4 Print Sheet */}
        <div className={styles.offerSheet}>
          {/* Header Section: Agency Branding & Offer Metadata */}
          <div className={styles.sheetHeader}>
            <div className={styles.headerBrand}>
              <div className={styles.emblemBadge}>
                <span className={styles.emblemText}>رُكْن</span>
              </div>
              <div className={styles.brandTexts}>
                <h1 className={styles.agencyName}>{agencyName}</h1>
                <p className={styles.agencyTagline}>
                  PREMIUM REAL ESTATE ADVISORY & BROKERAGE • ركن للاستشارات والتسويق العقاري
                </p>
              </div>
            </div>
            <div className={styles.headerMeta}>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>REF NO:</span>
                <span className={styles.metaValue}>{refCode}</span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>DATE:</span>
                <span className={styles.metaValue}>{currentDate}</span>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>BRANCH:</span>
                <span className={styles.metaValue}>
                  {property.branch ? `${country} • ${property.branch}` : country}
                </span>
              </div>
            </div>
          </div>

          <div className={styles.headerDivider} />

          {/* Hero Section: Property Cover Image & Primary Heading */}
          <div className={styles.heroSection}>
            <div className={styles.heroImageWrapper}>
              <img
                src={coverImage}
                alt={property.title}
                className={styles.heroImage}
              />
              <div className={styles.imageBadgeOverlay}>
                <span className={styles.statusBadge}>
                  {property.status?.toUpperCase() || 'AVAILABLE'}
                </span>
                {property.listingCategory === 'primary_offplan' && (
                  <span className={styles.categoryBadge}>OFF-PLAN / قيد الإنشاء</span>
                )}
                <span className={styles.typeBadge}>
                  {property.propertyType?.toUpperCase()}
                </span>
              </div>
            </div>

            <div className={styles.heroDetails}>
              <div className={styles.titleRow}>
                <h2 className={styles.propertyTitle}>{property.title}</h2>
                <div className={styles.priceTag}>
                  {formatMoney(price)}
                </div>
              </div>

              {property.developer?.name && (
                <div className={styles.developerSubhead}>
                  <Building size={14} />
                  <span>
                    {property.developer.projectName
                      ? `${property.developer.projectName} by ${property.developer.name}`
                      : property.developer.name}
                  </span>
                </div>
              )}

              <div className={styles.locationSubhead}>
                <MapPin size={14} />
                <span>{locationStr}</span>
              </div>
            </div>
          </div>

          {/* Specifications Grid: 6 Key Metrics */}
          <div className={styles.specsGrid}>
            <div className={styles.specCard}>
              <span className={styles.specLabel}>Total Price / السعر</span>
              <span className={`${styles.specValue} ${styles.specPrice}`}>
                {formatMoney(price)}
              </span>
            </div>
            <div className={styles.specCard}>
              <span className={styles.specLabel}>Built-Up Area / المساحة</span>
              <span className={styles.specValue}>
                {property.features?.area?.value ? `${property.features.area.value} ${property.features.area.unit || 'sqm'}` : '—'}
              </span>
            </div>
            <div className={styles.specCard}>
              <span className={styles.specLabel}>Bedrooms & Baths / الغرف</span>
              <span className={styles.specValue}>
                {property.features?.bedrooms ?? '—'} Beds • {property.features?.bathrooms ?? '—'} Baths
              </span>
            </div>
            <div className={styles.specCard}>
              <span className={styles.specLabel}>Finishing / نوع التشطيب</span>
              <span className={styles.specValue}>
                {property.developer?.finishingType?.replace(/_/g, ' ') ||
                  property.features?.finishing ||
                  'Fully Finished'}
              </span>
            </div>
            <div className={styles.specCard}>
              <span className={styles.specLabel}>Delivery Date / تاريخ التسليم</span>
              <span className={styles.specValue}>
                {property.developer?.deliveryDate
                  ? new Date(property.developer.deliveryDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                  : (property.listingCategory === 'primary_offplan' ? 'In Schedule' : 'Ready to Move')}
              </span>
            </div>
            <div className={styles.specCard}>
              <span className={styles.specLabel}>Transaction Type / نوع المعاملة</span>
              <span className={styles.specValue}>
                {property.listingCategory === 'primary_offplan' ? 'Primary Developer Sale' : 'Resale / جاهز'}
              </span>
            </div>
          </div>

          {/* Payment Plan & Installment Schedule */}
          <div className={styles.paymentScheduleSection}>
            <div className={styles.sectionHeadingRow}>
              <h3 className={styles.sectionHeading}>
                {hasPaymentPlan ? 'Payment Plan & Installment Schedule / خطة السداد والأقساط' : 'Purchase Terms & Payment Structure / خطة الدفع والشراء'}
              </h3>
              <span className={styles.sectionSubtag}>
                {hasPaymentPlan ? `${installmentYears} Years • ${installmentFrequency.toUpperCase()}` : 'Immediate Handover Terms'}
              </span>
            </div>

            {hasPaymentPlan ? (
              <div className={styles.paymentCardsGrid}>
                <div className={styles.paymentCard}>
                  <span className={styles.payCardLabel}>Down Payment ({downPaymentPercent}%)</span>
                  <span className={styles.payCardValue}>{formatMoney(downPaymentAmount)}</span>
                  <span className={styles.payCardSub}>Upon contract signing</span>
                </div>
                <div className={styles.paymentCard}>
                  <span className={styles.payCardLabel}>Periodic Installment</span>
                  <span className={`${styles.payCardValue} ${styles.payHighlight}`}>
                    {formatMoney(periodicInstallmentAmount)}
                  </span>
                  <span className={styles.payCardSub}>
                    {totalInstallments} {installmentFrequency} payments ({installmentYears} yrs)
                  </span>
                </div>
                <div className={styles.paymentCard}>
                  <span className={styles.payCardLabel}>Handover ({handoverPaymentPercent}%)</span>
                  <span className={styles.payCardValue}>{formatMoney(handoverPaymentAmount)}</span>
                  <span className={styles.payCardSub}>At key handover</span>
                </div>
                <div className={styles.paymentCard}>
                  <span className={styles.payCardLabel}>Maintenance ({maintenancePercent}%)</span>
                  <span className={styles.payCardValue}>{formatMoney(maintenanceDepositAmount)}</span>
                  <span className={styles.payCardSub}>Deposit before delivery</span>
                </div>
              </div>
            ) : (
              <div className={styles.cashPlanBox}>
                <div className={styles.cashPlanItem}>
                  <CheckCircle size={16} color="#059669" />
                  <span><strong>100% Cash Purchase:</strong> Total investment {formatMoney(price)} with immediate contract execution.</span>
                </div>
                <div className={styles.cashPlanItem}>
                  <CheckCircle size={16} color="#059669" />
                  <span><strong>Reservation Deposit:</strong> 10% refundable earnest deposit upon reservation.</span>
                </div>
                <div className={styles.cashPlanItem}>
                  <CheckCircle size={16} color="#059669" />
                  <span><strong>Mortgage Financing:</strong> Fully eligible for local bank mortgage pre-approvals.</span>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Showcase: Listing Agent Contacts & Vector SVG QR Code */}
          <div className={styles.bottomShowcaseRow}>
            {/* Agent Contact Card */}
            <div className={styles.agentCard}>
              <div className={styles.agentAvatar}>
                {property.listedBy?.firstName?.[0] || 'R'}
                {property.listedBy?.lastName?.[0] || 'K'}
              </div>
              <div className={styles.agentInfo}>
                <div className={styles.agentHeader}>
                  <h4 className={styles.agentName}>
                    {property.listedBy
                      ? `${property.listedBy.firstName} ${property.listedBy.lastName}`
                      : 'Rukn Senior Property Consultant'}
                  </h4>
                  <span className={styles.agentTitle}>
                    Certified Real Estate Specialist • مستشار عقاري معتمد
                  </span>
                </div>
                <div className={styles.agentContacts}>
                  <div className={styles.contactItem}>
                    <Phone size={13} />
                    <span>{property.listedBy?.phone || '+20 100 000 0000'}</span>
                  </div>
                  <div className={styles.contactItem}>
                    <Mail size={13} />
                    <span>{property.listedBy?.email || 'sales@ruknrealestate.com'}</span>
                  </div>
                </div>
                <div className={styles.licenseBadge}>
                  <Shield size={12} />
                  <span>{licenseText}</span>
                </div>
              </div>
            </div>

            {/* Interactive Vector SVG QR Code Card */}
            <div className={styles.qrCard}>
              <div className={styles.qrCodeBox}>
                <QRCodeSVG
                  value={qrUrl}
                  size={96}
                  margin={1}
                  color="#0f172a"
                  bgColor="#ffffff"
                  title={isTour ? "360 Tour QR" : "Brochure QR"}
                />
              </div>
              <div className={styles.qrTextCol}>
                <div className={styles.qrBadge}>
                  <Compass size={12} />
                  <span>{isTour ? '360° VIRTUAL WALKTHROUGH' : 'ONLINE BROCHURE'}</span>
                </div>
                <p className={styles.qrActionEn}>
                  {isTour ? 'Scan to explore 360° virtual tour' : 'Scan for full listing & photo gallery'}
                </p>
                <p className={styles.qrActionAr}>
                  {isTour ? 'امسح الكود للجولة الافتراضية 360°' : 'امسح الكود لتفاصيل الوحدة كاملة'}
                </p>
                <span className={styles.qrNote}>
                  Point smartphone camera • Works on iOS & Android
                </span>
              </div>
            </div>
          </div>

          {/* Footer Notice & Disclaimers */}
          <div className={styles.sheetFooter}>
            <p className={styles.disclaimerText}>
              Official property offer generated via Rukn Real Estate CRM. Prices, developer payment plans, and unit availability are subject to developer/owner confirmation at the time of reservation. All rights reserved © {new Date().getFullYear()} Rukn Real Estate.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyOfferModal;
