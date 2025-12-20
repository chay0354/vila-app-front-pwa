// Base API URL for the backend.
// Uses react-native-config to read from .env file
const DEFAULT_API_URL = 'https://vila-app-back.vercel.app';

let apiUrl = DEFAULT_API_URL;

try {
  // Try to import react-native-config
  const Config = require('react-native-config').default || require('react-native-config');
  if (Config && Config.API_BASE_URL) {
    apiUrl = Config.API_BASE_URL;
  }
} catch (e) {
  // If react-native-config is not available, use default
  console.warn('react-native-config not available, using default API URL');
}

// Remove all trailing slashes - endpoints already start with /
apiUrl = String(apiUrl).trim().replace(/\/+$/, '');
export const API_BASE_URL = apiUrl;

