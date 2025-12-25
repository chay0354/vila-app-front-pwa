// Base API URL for the backend.
// Must be set via API_BASE_URL environment variable
// @ts-ignore - Vite injects this at build time
const apiUrl = import.meta.env.API_BASE_URL;

if (!apiUrl || apiUrl.trim() === '') {
  console.error('ERROR: API_BASE_URL environment variable is required. Please set it in your .env file.');
  console.error('Example: API_BASE_URL=https://vila-app-back.vercel.app');
  throw new Error('API_BASE_URL environment variable is required. Please set it in your .env file.');
}

// Remove all trailing slashes - endpoints already start with /
const cleanUrl = String(apiUrl).trim().replace(/\/+$/, '');
export const API_BASE_URL = cleanUrl;

