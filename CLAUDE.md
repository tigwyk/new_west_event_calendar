# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Architecture

This is a standalone Next.js application for a New Westminster events calendar.

The project structure is organized as follows:

- **Root**: Contains all Next.js configuration, dependencies, and source code
- **`src/`**: Main application source code (components, pages, utilities)
- **`public/`**: Static assets and manifest files

## Key Commands

All commands should be run from the root directory:

```bash
# Development (regular)
npm install
npm run dev
npm run build
npm run start
npm run lint

# Development (Bun alternative)
npm run dev:bun
npm run build:bun
npm run start:bun 
npm run lint:bun
```

## Technology Stack

- **Framework**: Next.js 15.4.6
- **Frontend**: React 19.1.0 with TypeScript
- **Styling**: Tailwind CSS v4
- **Runtime**: Node.js or Bun (both supported)
- **Linting**: ESLint with Next.js config
- **Deployment**: Vercel (configured)

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
- **User Authentication**: Login/signup with role-based access (admin vs regular users)
- **Calendar Views**: List and calendar grid displays
- **Filtering/Search**: By category, accessibility, price, location
- **Admin Dashboard**: Analytics, pending approvals, data integration
- **External Integration**: City data feed import capability
- **Export**: ICS calendar export functionality
- **Accessibility**: Full support for screen readers and keyboard navigation

## Development Notes

- Uses React 19 features (ensure compatibility when making changes)
- Comprehensive SEO metadata already configured in layout.tsx
- Custom CSS classes use `nw-` prefix for New Westminster branding
- Error handling implemented with ErrorBoundary component
- Rate limiting prevents form spam
- All user inputs are sanitized using security utilities
- Responsive design with mobile-first approach
- Dark mode support throughout the interface

## Testing

Currently no test framework is configured. When adding tests, check existing patterns and project needs first.

## Brand Guidelines

- Primary colors: New Westminster civic colors (#003149 theme)
- Design follows civic/municipal aesthetics
- Accessibility compliance is mandatory
- Uses "Royal City" branding references