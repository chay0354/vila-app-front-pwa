// Base API URL for the backend.
// In React Native CLI, env vars are not injected by default. If you need
// to override, you can start Metro with: API_BASE_URL=http://<host>:<port> npm start
// and we will try to read from process.env if available. Fallback to emulator host.
const fallback = 'http://10.0.2.2:4000';
let fromEnv = fallback;

try {
  // @ts-expect-error process may be undefined on RN
  if (typeof process !== 'undefined' && process.env && process.env.API_BASE_URL) {
    // @ts-expect-error RN env
    fromEnv = process.env.API_BASE_URL;
  }
} catch (e) {
  fromEnv = fallback;
}

export const API_BASE_URL = fromEnv ?? fallback;

