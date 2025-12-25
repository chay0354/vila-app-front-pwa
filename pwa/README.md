# BolaVila PWA

Progressive Web App version of the BolaVila front-native application.

## Getting Started

### Install Dependencies

```bash
npm install
```

### Environment Variables

Create a `.env` file in the root directory to configure the API URL:

```bash
# Production API
API_BASE_URL=https://vila-app-back.vercel.app

# Or for local development
# API_BASE_URL=http://localhost:4001

# Or for Android emulator
# API_BASE_URL=http://10.0.2.2:4001
```

**Required:** The `API_BASE_URL` environment variable is required. The application will not start without it.

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Features

- Sign In / Sign Up screens (matching front-native logic)
- Home screen with stats and navigation
- Responsive design
- PWA support (installable, offline capable)
- RTL (Right-to-Left) support for Hebrew
- Environment-based API configuration

## Tech Stack

- React 18
- TypeScript
- Vite
- React Router
- PWA Plugin

