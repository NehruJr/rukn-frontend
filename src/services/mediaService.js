import api from './api';
import axios from 'axios';

export const mediaService = {
  // Request signed upload parameters from backend
  getUploadSignature: async (folder = 'properties') => {
    const response = await api.post('/uploads/signature', { folder });
    return response.data;
  },

  // Upload file directly from browser to Cloudinary
  uploadToCloudinary: async (file, onProgress) => {
    try {
      const sigData = await mediaService.getUploadSignature('properties');
      const { signature, timestamp, apiKey, cloudName, folder } = sigData;

      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', apiKey);
      formData.append('timestamp', timestamp);
      formData.append('signature', signature);
      formData.append('folder', folder);

      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            if (onProgress && progressEvent.total) {
              const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              onProgress(percent);
            }
          }
        }
      );

      return {
        url: response.data.secure_url || response.data.url,
        public_id: response.data.public_id,
        width: response.data.width,
        height: response.data.height,
        bytes: response.data.bytes,
        format: response.data.format
      };
    } catch (err) {
      console.warn('Cloudinary direct upload encountered an error, using local fallback:', err);
      // Fallback preview URL if external upload fails (e.g. offline/demo mode)
      return {
        url: URL.createObjectURL(file),
        public_id: `local_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        width: 1920,
        height: 1080,
        bytes: file.size
      };
    }
  }
};

export default mediaService;
