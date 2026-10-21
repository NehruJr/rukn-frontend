/**
 * WhatsApp Pitch Utility
 * Formats bilingual outreach messages with share and 360° virtual tour links,
 * sanitizes regional phone numbers, and builds wa.me deep links.
 */

export const formatWhatsAppPhone = (phone = '', country = 'Egypt') => {
  if (!phone) return '';
  let cleaned = String(phone).replace(/[^\d+]/g, '');

  // Strip leading plus
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }
  // Strip double zeros
  if (cleaned.startsWith('00')) {
    cleaned = cleaned.substring(2);
  }

  // Handle local formats starting with 0
  const normCountry = String(country || '').toLowerCase();
  if (cleaned.startsWith('0')) {
    if (normCountry.includes('uae') || normCountry.includes('emirates')) {
      cleaned = '971' + cleaned.substring(1);
    } else if (normCountry.includes('saudi') || normCountry.includes('ksa')) {
      cleaned = '966' + cleaned.substring(1);
    } else {
      // Default to Egypt
      cleaned = '20' + cleaned.substring(1);
    }
  }

  return cleaned;
};

export const generatePropertyPitch = ({
  property,
  lead,
  language = 'en',
  tourShareToken = null
}) => {
  if (!property) return '';

  const leadName = lead ? `${lead.firstName || ''} ${lead.lastName || ''}`.trim() : '';
  const greetingName = leadName || (language === 'ar' ? 'عزيزي العميل' : 'Valued Client');

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const shareToken = property.shareToken || property._id;
  const shareUrl = `${origin}/share/${shareToken}`;
  const tourToken = tourShareToken || property.virtualTour?.shareToken || property.tourShareToken;
  const tourUrl = tourToken ? `${origin}/tour/${tourToken}` : null;

  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: property.currency || 'EGP',
    maximumFractionDigits: 0
  }).format(property.price || 0);

  const developerInfo = property.developer?.name
    ? `${property.developer.name}${property.developer.projectName ? ` (${property.developer.projectName})` : ''}`
    : null;

  const area = property.features?.area?.value
    ? `${property.features.area.value} ${property.features.area.unit || 'sqm'}`
    : null;

  const beds = property.features?.bedrooms != null ? property.features.bedrooms : 'N/A';
  const baths = property.features?.bathrooms != null ? property.features.bathrooms : 'N/A';
  const location = [property.location?.area, property.location?.city].filter(Boolean).join(', ') || 'Prime Location';

  if (language === 'ar') {
    return (
      `مرحباً ${greetingName}،\n\n` +
      `يسعدني أن أشاركك هذه الوحدة العقارية المميزة والمناسبة لاهتماماتك:\n\n` +
      `🏠 *${property.title}*\n` +
      `📍 *الموقع:* ${location}\n` +
      (developerInfo ? `🏢 *المطور العقاري:* ${developerInfo}\n` : '') +
      `💰 *السعر:* ${formattedPrice}\n` +
      `📐 *المواصفات:* ${area ? `${area} | ` : ''}${beds} غرف نوم | ${baths} حمامات\n\n` +
      `🔗 *تفاصيل الوحدة والصور الكاملة:*\n${shareUrl}\n\n` +
      (tourUrl ? `🌐 *جولة افتراضية تفاعلية 360°:*\n${tourUrl}\n\n` : '') +
      `يسعدني التنسيق معك لتحديد موعد للمعاينة أو تزويدك بخطة السداد!`
    );
  }

  // Default English Pitch
  return (
    `Hello ${greetingName},\n\n` +
    `I thought you might be interested in this prime property matching your preferences:\n\n` +
    `🏠 *${property.title}*\n` +
    `📍 *Location:* ${location}\n` +
    (developerInfo ? `🏢 *Developer:* ${developerInfo}\n` : '') +
    `💰 *Price:* ${formattedPrice}\n` +
    `📐 *Specs:* ${area ? `${area} | ` : ''}${beds} Beds | ${baths} Baths\n\n` +
    `🔗 *View Full Property Details:*\n${shareUrl}\n\n` +
    (tourUrl ? `🌐 *Experience 360° Virtual Tour:*\n${tourUrl}\n\n` : '') +
    `Please let me know if you would like to arrange a private viewing or need the payment plan!`
  );
};

export const getWhatsAppPitchUrl = ({
  property,
  lead,
  language = 'en',
  tourShareToken = null
}) => {
  const phone = formatWhatsAppPhone(lead?.phone, property?.country || lead?.country);
  const pitch = generatePropertyPitch({ property, lead, language, tourShareToken });
  if (!phone) {
    return `https://wa.me/?text=${encodeURIComponent(pitch)}`;
  }
  return `https://wa.me/${phone}?text=${encodeURIComponent(pitch)}`;
};

export default {
  formatWhatsAppPhone,
  generatePropertyPitch,
  getWhatsAppPitchUrl
};
