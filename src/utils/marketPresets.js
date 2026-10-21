/**
 * Regional Market Presets for Egypt, UAE, and Saudi Arabia
 * Provides branches, developer suggestions, currencies, units, and localized lead sources.
 */

export const MARKET_PRESETS = {
  egypt: {
    country: 'Egypt',
    key: 'egypt',
    name: 'Egypt',
    currency: 'EGP',
    currencySymbol: 'EGP',
    areaUnit: 'sqm',
    areaUnits: ['sqm', 'sqft'],
    vatRate: 14,
    phonePrefix: '+20',
    branches: [
      'Cairo',
      'New Cairo',
      'Sheikh Zayed',
      '6th of October',
      'Maadi',
      'Alexandria',
      'North Coast',
      'El Gouna'
    ],
    developerSuggestions: [
      'Emaar Misr',
      'SODIC',
      'Palm Hills Developments',
      'Talaat Moustafa Group (TMG)',
      'Mountain View (DMG)',
      'Ora Developers',
      'Tatweer Misr',
      'Hassan Allam Properties',
      'Misr Italia',
      'Al Ahly Sabbour'
    ],
    leadSources: [
      'facebook',
      'olx',
      'property_finder',
      'bayut',
      'website',
      'referral',
      'call',
      'whatsapp',
      'instagram',
      'tiktok',
      'cold_call',
      'walk_in',
      'other'
    ],
    regulatory: {
      reraEnabled: false,
      falEnabled: false,
      licenseName: null
    }
  },
  uae: {
    country: 'UAE',
    key: 'uae',
    name: 'United Arab Emirates',
    currency: 'AED',
    currencySymbol: 'AED',
    areaUnit: 'sqft',
    areaUnits: ['sqft', 'sqm'],
    vatRate: 5,
    phonePrefix: '+971',
    branches: [
      'Dubai',
      'Abu Dhabi',
      'Sharjah',
      'Ajman',
      'Ras Al Khaimah'
    ],
    developerSuggestions: [
      'Emaar Properties',
      'DAMAC Properties',
      'Sobha Realty',
      'Aldar Properties',
      'Nakheel',
      'Meraas',
      'Danube Properties',
      'Ellington Properties',
      'Binghatti Developers',
      'Select Group'
    ],
    leadSources: [
      'property_finder',
      'bayut',
      'dubizzle',
      'website',
      'referral',
      'facebook',
      'instagram',
      'tiktok',
      'whatsapp',
      'call',
      'cold_call',
      'walk_in',
      'other'
    ],
    regulatory: {
      reraEnabled: true,
      falEnabled: false,
      licenseName: 'RERA / Trakheesi Permit'
    }
  },
  saudi_arabia: {
    country: 'Saudi Arabia',
    key: 'saudi_arabia',
    name: 'Saudi Arabia',
    currency: 'SAR',
    currencySymbol: 'SAR',
    areaUnit: 'sqm',
    areaUnits: ['sqm', 'sqft'],
    vatRate: 15,
    phonePrefix: '+966',
    branches: [
      'Riyadh',
      'Jeddah',
      'Dammam',
      'Khobar',
      'Makkah',
      'Madinah'
    ],
    developerSuggestions: [
      'ROSHN',
      'Dar Al Arkan',
      'Retal Urban Development',
      'National Housing Company (NHC)',
      'Ajdan Real Estate',
      'Al Akaria (SRECO)',
      'Sedco Holding',
      'Midad Real Estate'
    ],
    leadSources: [
      'aqar',
      'bayut',
      'website',
      'referral',
      'whatsapp',
      'instagram',
      'tiktok',
      'call',
      'cold_call',
      'walk_in',
      'other'
    ],
    regulatory: {
      reraEnabled: false,
      falEnabled: true,
      licenseName: 'REGA / FAL Ad License'
    }
  }
};

export const COUNTRIES = [
  { value: 'Egypt', label: 'Egypt', code: '+20', currency: 'EGP', unit: 'sqm' },
  { value: 'UAE', label: 'UAE (United Arab Emirates)', code: '+971', currency: 'AED', unit: 'sqft' },
  { value: 'Saudi Arabia', label: 'Saudi Arabia', code: '+966', currency: 'SAR', unit: 'sqm' }
];

export const getMarketPreset = (marketOrCountry = '') => {
  const norm = String(marketOrCountry || '').toLowerCase().trim();
  if (norm === 'uae' || norm === 'united arab emirates') {
    return MARKET_PRESETS.uae;
  }
  if (norm === 'saudi arabia' || norm === 'saudi_arabia' || norm === 'saudi' || norm === 'ksa') {
    return MARKET_PRESETS.saudi_arabia;
  }
  return MARKET_PRESETS.egypt;
};

export const getCountryBranches = (country) => {
  const preset = getMarketPreset(country);
  return preset?.branches || [];
};

export const getDeveloperSuggestions = (country) => {
  const preset = getMarketPreset(country);
  return preset?.developerSuggestions || [];
};

export default {
  MARKET_PRESETS,
  COUNTRIES,
  getMarketPreset,
  getCountryBranches,
  getDeveloperSuggestions
};
