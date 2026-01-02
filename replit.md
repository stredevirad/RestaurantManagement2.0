# THALLIPOLI Management System

## Overview

THALLIPOLI Management is an AI-powered kitchen inventory and restaurant management system. It provides real-time inventory tracking, point-of-sale functionality, kitchen display systems, and analytics dashboards. The application features an integrated AI chatbot powered by Google Gemini that can interact with live kitchen data to help manage inventory, process sales, and provide strategic recommendations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight client-side routing)
- **State Management**: React Context API with custom `StoreProvider` for global state
- **Data Fetching**: TanStack React Query for server state management
- **Styling**: Tailwind CSS v4 with custom CSS variables for theming
- **UI Components**: shadcn/ui component library (Radix UI primitives)
- **Animations**: Framer Motion for UI animations
- **Build Tool**: Vite with custom plugins for Replit integration

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ESM modules
- **API Design**: RESTful endpoints under `/api/*` prefix
- **AI Integration**: Google Gemini via Replit AI Integrations (`@google/genai`)
- **Function Calling**: Gemini function calling for inventory operations (get_inventory_status, restock_item, get_menu_info, process_sale)

### Data Storage
- **Database**: PostgreSQL via Drizzle ORM
- **Schema Location**: `shared/schema.ts` defines all database tables
- **Tables**: users, inventoryItems, menuItems, menuIngredients, logs, settings, orders, orderItems, conversations, messages
- **Migrations**: Drizzle Kit with `db:push` command

### Key Design Patterns
- **Monorepo Structure**: Client (`client/`), Server (`server/`), and Shared (`shared/`) directories
- **Path Aliases**: `@/` for client source, `@shared/` for shared code
- **Database Init**: Frontend triggers database seeding on app load via `DatabaseInit` component
- **Mock Data Fallback**: `client/src/lib/mockData.ts` provides initial seed data for inventory and menu items

### AI Chatbot Architecture
- Real-time AI assistant accessible via floating button
- Conversations persisted to database
- Function calling enables AI to execute inventory and sales operations
- Server routes in `server/routes.ts` handle `/api/chat` endpoint

## External Dependencies

### AI Services
- **Google Gemini**: Primary AI model via Replit AI Integrations
  - Environment variables: `AI_INTEGRATIONS_GEMINI_API_KEY`, `AI_INTEGRATIONS_GEMINI_BASE_URL`
  - Models: gemini-2.5-flash (fast), gemini-2.5-pro (advanced), gemini-2.5-flash-image (image generation)

### Database
- **PostgreSQL**: Primary data store
  - Connection via `DATABASE_URL` environment variable
  - Drizzle ORM for type-safe queries

### Key NPM Packages
- `@google/genai`: Gemini AI SDK
- `drizzle-orm` + `drizzle-zod`: Database ORM with Zod validation
- `@tanstack/react-query`: Server state management
- `express` + `express-session`: HTTP server and session handling
- `recharts`: Analytics charts
- `framer-motion`: UI animations
- `wouter`: Client-side routing

### Replit-Specific Integrations
- `@replit/vite-plugin-runtime-error-modal`: Development error overlay
- `@replit/vite-plugin-cartographer`: Development tooling
- `vite-plugin-meta-images`: OpenGraph image handling for deployments