# <img src="public/logo-route-random.png" alt="Route Random Logo" width="48" height="48" style="vertical-align:middle;"> Route Random

<p>
  <img src="https://img.shields.io/badge/React-61dafb?logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Next.js-000000?logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-3178c6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38bdf8?logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Leaflet-199900?logo=leaflet&logoColor=white" alt="Leaflet" />
  <img src="https://img.shields.io/badge/OpenRouteService-ff6600?logo=OpenStreetMap&logoColor=white" alt="OpenRouteService" />
  <img src="https://img.shields.io/badge/Zustand-764ABC?logo=zustand&logoColor=white" alt="Zustand" />
  <img src="https://img.shields.io/badge/Zod-3c3c37?logo=zod&logoColor=white" alt="Zod" />
  <img src="https://img.shields.io/badge/Pino-3DDC84?logo=node.js&logoColor=white" alt="Pino" />
  <img src="https://img.shields.io/badge/PostgreSQL-336791?logo=postgresql&logoColor=white" alt="PostgreSQL" />
</p>

> **Discover new routes, anywhere.**

Route Random is a modern, full-stack web application for generating unique, circular running, walking, and cycling routes. Whether you're training for a marathon, exploring a new city, or breaking your daily routine, Route Random instantly creates the perfect path tailored to your distance and location—no accounts, no tracking, no hassle.

![Screenshot of Route Random](public/screenshot-desktop.png)

## 🚀 Features

- **Smart Route Generation**: Generates random, circular routes that start and end at your chosen point using OpenRouteService routing API
- **Flexible Planning**: Set routes by distance (km) or time (minutes) with automatic pace-based calculations
- **Pace Selection**: Choose walking, running, or cycling mode for accurate distance-to-time conversions
- **Elevation Profiles**: Real-time elevation gain/loss and detailed elevation data for each route
- **Location Discovery**: Search locations by address or click on the map to set your starting point
- **Live GPS Tracking**: Real-time location tracking with high accuracy positioning (mobile optimized)
- **Overlap Detection**: Visual highlighting of route segments that cross each other in red for awareness
- **Route Persistence**: Save routes to the database and share them via unique IDs
- **Export Formats**: Download routes as GPX or GeoJSON for Garmin, Strava, or any compatible fitness app
- **Internationalization**: Full multi-language support (English, Dutch) with `next-intl`
- **Responsive Design**: Optimized for desktop, tablet, and mobile with adaptive UI layouts
- **Privacy First**: No user accounts, no personal data tracking, open source

## 🛠️ Tech Stack

### Frontend

- **Framework**: [React](https://react.dev/) with [Next.js 15](https://nextjs.org/) (App Router, Server Components)
- **Language**: [TypeScript](https://www.typescriptlang.org/) for type safety
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) for responsive utility-first design
- **State Management**: [Zustand](https://github.com/pmndrs/zustand) for lightweight client state
- **Mapping**: [Leaflet.js](https://leafletjs.com/) with [React-Leaflet](https://react-leaflet.dev/)
- **Icons**: [Lucide React](https://lucide.dev/) for consistent icon library
- **Geosearch**: [Leaflet-Geosearch](https://smoogipoo.github.io/leaflet-geosearch/) for address lookup

### Backend & APIs

- **Routing**: [OpenRouteService API](https://openrouteservice.org/) for route calculation and geocoding
- **Database**: [Neon PostgreSQL](https://neon.tech/) (serverless) with [Neon SDK](https://neon.tech/docs/serverless/about)
- **API Routes**: Next.js API Routes with TypeScript

### Quality & Infrastructure

- **Validation**: [Zod](https://zod.dev/) for schema validation and environment config
- **Logging**: [Pino](https://getpino.io/) for structured, production-grade logging
- **Code Quality**:
  - [ESLint](https://eslint.org/) for linting
  - [Prettier](https://prettier.io/) for code formatting
  - [Husky](https://typicode.github.io/husky/) with [lint-staged](https://github.com/okonet/lint-staged) for pre-commit hooks
- **Internationalization**: [next-intl](https://next-intl-docs.vercel.app/) for multi-language support
- **Analytics**: [Umami](https://umami.is/) for privacy-respecting analytics

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+
- **pnpm** (or npm/yarn)
- **OpenRouteService API Key** (free tier available at [openrouteservice.org](https://openrouteservice.org/))
- **PostgreSQL Database** (Neon recommended for serverless)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/route-random.git
cd route-random

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
```

### Environment Configuration

Create a `.env.local` file in the root directory:

```env
# Database Configuration
# PostgreSQL connection string from Neon
DATABASE_URL=postgresql://username:password@host/database

# OpenRouteService API
# Get your free key from https://openrouteservice.org/
ORS_API_KEY=your_ors_api_key_here

# Optional: Umami Analytics
NEXT_PUBLIC_UMAMI_WEBSITE_ID=your_umami_website_id

# Optional: Discord Notifications
DISCORD_WEBHOOK_URL=your_discord_webhook_url
```

### Development

```bash
# Start development server with Turbopack
pnpm dev

# Open http://localhost:3000 in your browser
```

The app will automatically initialize the database schema on first run.

### Building for Production

```bash
# Build the application
pnpm build

# Start the production server
pnpm start
```

### Code Quality

```bash
# Run linter
pnpm lint

# Check code formatting
pnpm format:check

# Auto-format code
pnpm format
```

## 📡 API Endpoints

### Route Generation

- **POST** `/api/generateroute` - Generate a new route
  - Body: `{ startLocation: [lat, lng], distance: number, waypoints?: [[lng,lat]], regenerate?: boolean }`

### Route Management

- **POST** `/api/routes` - Save a route to the database
  - Body: `{ coordinates: [[lng,lat]], distance: number }`
- **GET** `/api/routes/[id]` - Retrieve a saved route by ID

## 🏗️ Project Structure

```
route-random/
├── app/
│   ├── api/                 # API routes
│   ├── components/          # React components
│   ├── hooks/              # Custom React hooks
│   ├── services/           # External API integrations (ORS)
│   ├── utils/              # Utilities (routing, analysis, export)
│   └── layout.tsx          # Root layout
├── lib/
│   ├── db.ts              # Database connection & queries
│   ├── env.ts             # Environment validation (Zod)
│   └── logger.ts          # Structured logging (Pino)
├── stores/                # Zustand stores (state management)
├── i18n/                  # Internationalization (next-intl)
├── public/                # Static assets
└── package.json           # Dependencies & scripts
```

## 🎯 Key Capabilities

### Route Generation Algorithm

- Adaptive distance correction with multiple fallback factors (0.82, 0.75, 0.68)
- Configurable tolerance bands for distance accuracy
- Prefers green/quiet routes via weighted routing preferences
- Extracts elevation profiles and waypoints for detailed analysis

### Data Export

- **GPX Format**: Compatible with Garmin, Strava, and most fitness trackers
- **GeoJSON Format**: For mapping applications and geographic analysis

### Error Handling & Logging

- Structured logging with Pino for production debugging
- Graceful error recovery with user-friendly error messages
- Environment validation at startup (Zod)
- Discord webhook notifications for route generation failures

## 🌍 Powered By

This project depends on these open-source projects and services:

- [OpenStreetMap](https://www.openstreetmap.org/) – Free, editable map data
- [Leaflet](https://leafletjs.com/) – Interactive mapping library
- [OpenRouteService](https://openrouteservice.org/) – Routing and geocoding API
- [React](https://react.dev/) – UI library
- [Next.js](https://nextjs.org/) – React framework
- [Tailwind CSS](https://tailwindcss.com/) – Utility-first CSS

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to open issues or submit pull requests.

For major changes, please open an issue first to discuss what you would like to change.

## 👤 Author

Made by [Lukas Olivier](https://www.lukasolivier.be)
