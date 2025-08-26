# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Architecture

This is a standalone Next.js application for a New Westminster events calendar.

The project structure is organized as follows:

- **Root**: Contains all Next.js configuration, dependencies, and source code
- **`src/`**: Main application source code (components, pages, utilities)
- **`public/`**: Static assets and manifest files

## Key Commands

All commands should be run from the root directory. **Bun is now the default runtime for optimal performance:**

```bash
# Primary development workflow (Bun - recommended)
bun install
bun run dev
bun run build
bun run start
bun run lint

# Additional Bun-optimized commands
bun run clean          # Clean build cache
bun run install:clean  # Clean install
bun run type-check     # TypeScript checking
bun run build:analyze  # Build and analyze bundle

# Fallback Node.js commands (if needed)
bun run dev:node
bun run build:node
bun run start:node
bun run lint:node
```

## Technology Stack

- **Framework**: Next.js 15.4.6 (with Turbopack enabled)
- **Frontend**: React 19.1.0 with TypeScript
- **Runtime**: **Bun (primary)** - Node.js fallback available
- **Styling**: Tailwind CSS v4
- **Authentication**: NextAuth.js v4 with OAuth providers
- **Linting**: ESLint with Next.js config
- **Deployment**: Vercel (optimized for Bun + standalone output)
- **Performance**: Optimized bundle imports, SWC minification

## Code Organization

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout with comprehensive SEO
│   ├── page.tsx           # Main events calendar page
│   └── globals.css        # Global styles
├── components/
│   └── ErrorBoundary.tsx  # React error boundary
└── utils/
    └── security.ts        # Security utilities and validation
```

## Security Implementation

The codebase includes comprehensive security utilities in `src/utils/security.ts`:

- **Input Sanitization**: XSS protection, content filtering
- **Validation**: Email, password, event data, file uploads
- **Rate Limiting**: Client-side protection against spam
- **CSP Directives**: Content Security Policy configuration
- **Token Generation**: CSRF tokens and secure IDs

Always use these security utilities when handling user input or creating new features.

## Application Features

The main application (`src/app/page.tsx`) is a comprehensive event calendar with:

- **Event Management**: CRUD operations with approval workflow
- **User Authentication**: OAuth login with Google, GitHub, Facebook, and Twitter
- **Role-based Access**: Automatic admin privileges for @newwestminster.ca email addresses
- **Calendar Views**: List and calendar grid displays
- **Filtering/Search**: By category, accessibility, price, location
- **Admin Dashboard**: Analytics, pending approvals, data integration
- **External Integration**: City data feed import capability
- **Export**: ICS calendar export functionality
- **Accessibility**: Full support for screen readers and keyboard navigation

## Development Notes

- **Bun Runtime**: Optimized for Bun with faster builds and dev server (~3x faster than Node.js)
- **Turbopack**: Next.js 15+ stable Turbopack integration for lightning-fast builds
- **OAuth Integration**: NextAuth.js v4 with Google, GitHub, Facebook, and Twitter providers
- **Admin Access**: Automatic admin privileges for @newwestminster.ca email addresses
- **Performance**: Bundle optimization, tree shaking, and SWC minification enabled
- **React 19**: Uses latest React features (ensure compatibility when making changes)
- **Security**: Comprehensive input sanitization, rate limiting, and XSS protection
- **Deployment**: Standalone output optimized for Vercel with Bun runtime
- **Custom Styling**: `nw-` prefix for New Westminster civic branding
- **Responsive Design**: Mobile-first approach with dark mode support
- **Error Handling**: ErrorBoundary component with comprehensive error tracking

## Performance Optimizations

The project is optimized for maximum performance using Bun:

- **~3x faster build times** compared to Node.js
- **Faster development server** with hot reload
- **Optimized package imports** for reduced bundle size
- **Turbopack integration** for lightning-fast rebuilds
- **Standalone output** for efficient Vercel deployments
- **Advanced caching** with Bun's native cache management
- **Tree shaking** and dead code elimination
- **SWC minification** for production builds

### Benchmarks (approximate)
- **Cold start**: `bun run dev` ~2s vs `npm run dev` ~6s
- **Hot reload**: ~100ms vs ~300ms with Node.js
- **Production build**: `bun run build` ~15s vs `npm run build` ~45s

## Testing

Currently no test framework is configured. When adding tests, consider Bun's native test runner for optimal performance.

## Brand Guidelines

- Primary colors: New Westminster civic colors (#003149 theme)
- Design follows civic/municipal aesthetics
- Accessibility compliance is mandatory
- Uses "Royal City" branding references