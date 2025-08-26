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
/
├── bunfig.toml            # Bun configuration (optimized for performance)
├── next.config.ts         # Next.js config (Turbopack + Bun optimizations)
├── package.json           # Bun-first scripts (Node.js fallbacks available)
├── .env.example          # OAuth environment variables template
├── OAUTH_SETUP.md        # Complete OAuth provider setup guide
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── api/auth/[...nextauth]/  # NextAuth.js OAuth handlers
│   │   ├── layout.tsx    # Root layout with SessionProvider
│   │   ├── page.tsx      # Main events calendar with OAuth integration
│   │   ├── comprehensive.test.ts   # Complete test suite (30 tests)
│   │   ├── page.test.ts            # Basic validation tests
│   │   └── globals.css   # Global styles
│   ├── components/
│   │   ├── ErrorBoundary.tsx      # React error boundary
│   │   └── SessionProvider.tsx    # NextAuth session wrapper
│   ├── types/
│   │   ├── next-auth.d.ts         # NextAuth TypeScript definitions
│   │   └── bun-test.d.ts          # Bun test runner TypeScript definitions
│   └── utils/
│       └── security.ts            # Security utilities and validation
└── public/               # Static assets and PWA manifest
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
- **TypeScript**: Full type safety with custom Bun test type definitions
- **Testing**: Native Bun test runner with TypeScript support
- **Deployment**: Optimized for Vercel with compatibility fixes for Next.js 15+
- **Custom Styling**: `nw-` prefix for New Westminster civic branding
- **Responsive Design**: Mobile-first approach with dark mode support
- **Error Handling**: ErrorBoundary component with comprehensive error tracking

## Bun Configuration & Performance

### Bun Runtime Optimizations
The project is specifically optimized for Bun with:

**bunfig.toml configuration:**
- Auto peer dependency installation
- Exact version pinning for reproducibility
- Advanced caching (`node_modules/.cache/bun`)
- Hot reload and watch optimizations
- Tree shaking and minification enabled
- Faster module resolution with `preferBunModules`

**next.config.ts optimizations:**
- Turbopack integration (stable in Next.js 15+)
- Optimized package imports for NextAuth.js, React, React DOM
- Standalone output for efficient Vercel deployments
- SWC minification and console.log removal in production

### Performance Gains
- **~3x faster build times** compared to Node.js
- **Faster development server** with sub-second hot reload
- **Optimized bundle imports** for reduced bundle size
- **Lightning-fast rebuilds** with Turbopack
- **Advanced caching** with Bun's native cache management

### Benchmarks (approximate)
- **Cold start**: `bun run dev` ~2s vs `npm run dev` ~6s
- **Hot reload**: ~100ms vs ~300ms with Node.js
- **Production build**: `bun run build` ~15s vs `npm run build` ~45s
- **Package installation**: `bun install` ~5s vs `npm install` ~20s

## Testing

The project uses **Bun's native test runner** for optimal performance:

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test --watch

# Run tests with coverage
bun test --coverage

# Run specific test file
bun test src/app/comprehensive.test.ts
```

**Test Suite Overview:**
- **30 tests** covering core functionality
- **~15ms** execution time (ultra-fast with Bun)
- **Comprehensive coverage**: Event management, search/filtering, calendar functionality, authentication, analytics, ICS export, and accessibility

**Test Files:**
- `src/app/comprehensive.test.ts` - Complete feature test suite
- `src/app/page.test.ts` - Basic validation and security tests

**Key Features:**
- **Native Bun integration** with proper TypeScript support
- Built-in assertions with `expect()`
- Automatic test discovery and execution
- Watch mode for development
- Coverage reporting available

## Deployment Notes

**Production Deployment:**
- **Domain**: https://www.newwestevents.com
- **Platform**: Vercel with Node.js runtime (`.nvmrc`)
- **OAuth**: NextAuth.js API routes configured with 30s timeout
- **Performance**: Telemetry disabled, optimized Next.js config
- **DNS**: Custom domain configured with SSL

**Key Compatibility Fixes:**
- **SWC Resolution**: Added optional Linux SWC binaries for deployment platforms
- **NPM Configuration**: `.npmrc` with `legacy-peer-deps` for compatibility
- **Node.js Commands**: Uses `build:node` and `start:node` for deployment
- **Package Engines**: Specified Node.js >=18.17.0 requirement
- **Environment Variables**: Added `SKIP_ENV_VALIDATION` and disabled telemetry

**Troubleshooting Deployment:**
If SWC 404 errors persist, the `swcMinify: true` option in `next.config.ts` can be set to `false` to use Terser instead of SWC for minification.

## Brand Guidelines

- Primary colors: New Westminster civic colors (#003149 theme)
- Design follows civic/municipal aesthetics
- Accessibility compliance is mandatory
- Uses "Royal City" branding references