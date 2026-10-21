import api from './api';

/**
 * AI Service for Phase 3 Gemini AI Co-Pilot
 * Provides frontend API integrations for listing copy generation,
 * lead call/WhatsApp note extraction, and dialect-aware pitch scripts.
 */
export const aiService = {
  /**
   * Generate bilingual (English + Arabic) listing title, description, and social caption
   * @param {Object} specs Property specifications
   * @returns {Promise<{success: boolean, data: {english: {title: string, description: string, socialCaption: string}, arabic: {title: string, description: string, socialCaption: string}}}>}
   */
  generateListingCopy: async (specs) => {
    const response = await api.post('/ai/listing-copy', specs);
    return response.data;
  },

  /**
   * Parse raw unstructured note or chat transcript into structured CRM lead fields
   * @param {Object} payload { rawText: string, leadId?: string }
   * @returns {Promise<{success: boolean, data: {budget: Object, propertyType: string, transactionType: string, location: Object, preferredDeveloper?: string, bedrooms?: Object, priority: string, summaryNote: string, suggestedTask?: Object}}>}
   */
  extractLeadNote: async (payload) => {
    const response = await api.post('/ai/extract-lead-note', payload);
    return response.data;
  },

  /**
   * Generate dialect-aware WhatsApp outreach pitch script
   * @param {Object} payload { leadId?: string, propertyId?: string, language?: string, tone?: string, lead?: Object, property?: Object }
   * @returns {Promise<{success: boolean, data: {language: string, pitchScript: string, waUrl?: string, keySellingPoints: string[]}}>}
   */
  generatePitchScript: async (payload) => {
    const response = await api.post('/ai/pitch-script', payload);
    return response.data;
  }
};

export default aiService;
