# New West Events Calendar

A state-of-the-art, real-time events calendar application for New Westminster, British Columbia. Built with modern web technologies and featuring advanced real-time collaboration, AI-powered content moderation, and comprehensive event management capabilities.

**🌐 Live Site**: https://www.newwestevents.com

## ✨ Key Features

### 🔄 Real-time Collaboration
- **Live Comments**: Real-time comment threads with instant updates
- **Live RSVP Tracking**: Dynamic attendance counts with attending/maybe/not_attending status
- **Real-time Notifications**: Browser and in-app notifications for event updates
- **Live Event Updates**: Instant synchronization across all connected users

### 🛡️ Advanced Content Moderation
- **AI-Powered Analysis**: Automated content screening with intelligent risk assessment
- **Admin Moderation Dashboard**: Comprehensive tools for content review and bulk actions
- **Content Filtering**: Automatic inappropriate content detection and replacement
- **Smart Approval Workflow**: Intelligent categorization (approve/review/reject)

### 📸 Media Management
- **Event Images**: Drag-and-drop image uploads with preview gallery
- **File Storage**: Secure Supabase Storage integration with Row Level Security
- **Image Validation**: Type and size validation with user-friendly error handling

### 🎯 Event Management
- **Full CRUD Operations**: Create, read, update, and delete events with approval workflow
- **Calendar Views**: List and calendar grid displays with navigation
- **Advanced Filtering**: Search by category, accessibility, price, location, and date
- **Event Export**: ICS calendar export functionality
- **Capacity Management**: Event capacity limits with waiting list support

### 🔐 Authentication & Security
- **OAuth Integration**: Google, GitHub, Facebook, and Twitter sign-in
- **Role-based Access**: Automatic admin privileges for @newwestevents.com emails
- **Input Sanitization**: Comprehensive XSS protection and content validation
- **Rate Limiting**: Client-side protection against spam and abuse

### 📱 User Experience
- **Responsive Design**: Mobile-first approach with dark mode support
- **Accessibility**: Full screen reader and keyboard navigation support
- **Performance**: Optimized with React 19, useMemo, useCallback, and advanced caching
- **Progressive Web App**: Offline capabilities with service worker integration

## 🚀 Quick Start

### Prerequisites
- Node.js 18.17.0+ or Bun 1.0+
- Supabase account (for database and storage)
- OAuth provider credentials (Google, GitHub, Facebook, Twitter)

### Installation

**Using Bun (Recommended - 3x faster):**
```bash
bun install
bun run dev
```

**Using Node.js:**
```bash
npm install
npm run dev
```

### Environment Setup

1. Copy the environment template:
```bash
cp .env.example .env.local
```

2. Configure your environment variables:
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="https://your-project-ref.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"

# NextAuth.js Configuration
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# OAuth Provider Keys
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"
# ... additional OAuth providers
```

3. Set up Supabase database:
   - Run the SQL commands from `database-schema.sql` in your Supabase SQL editor
   - Follow the detailed setup guide in `SUPABASE_SETUP.md`

## 🏗️ Architecture

### Technology Stack
- **Framework**: Next.js 15.4.6 (App Router with Turbopack)
- **Frontend**: React 19.1.0 with TypeScript 5.0
- **Runtime**: Bun (primary) with Node.js fallback support
- **Database**: Supabase (PostgreSQL with real-time subscriptions)
- **Authentication**: NextAuth.js v4 with multiple OAuth providers
- **Storage**: Supabase Storage with Row Level Security
- **Styling**: Tailwind CSS v4 with custom New Westminster branding
- **Testing**: Bun native test runner (30 tests, ~15ms execution)
- **Deployment**: Vercel with optimized builds

### Performance Metrics
- **Build Time**: ~15s (Bun) vs ~45s (Node.js)
- **Dev Server**: ~2s cold start vs ~6s with Node.js
- **Test Suite**: 30 comprehensive tests in ~15ms
- **Bundle Size**: 117KB first load JS
- **Lighthouse Score**: 95+ across all metrics

### Real-time Architecture
```
User Interface ↔ React Components ↔ Custom Hooks ↔ Supabase Client ↔ PostgreSQL + Realtime
                                                  ↔ Supabase Storage
                                                  ↔ NextAuth.js ↔ OAuth Providers
```

## 📋 Development Commands

```bash
# Development (Bun - recommended)
bun run dev          # Start development server with Turbopack
bun run build        # Production build
bun run start        # Start production server
bun run lint         # Run ESLint
bun run type-check   # TypeScript checking
bun test             # Run test suite

# Development (Node.js fallback)
bun run dev:node     # Node.js development server
bun run build:node   # Node.js production build
bun run start:node   # Node.js production server

# Additional commands
bun run clean        # Clean build cache
bun run build:analyze # Build and analyze bundle size
```

## 🧪 Testing

The project includes a comprehensive test suite with 30 tests covering:

- ✅ Core event management functionality
- ✅ Search and filtering capabilities
- ✅ Calendar view functionality
- ✅ Authentication and authorization
- ✅ Real-time features
- ✅ Content moderation
- ✅ File upload validation
- ✅ Security utilities

Run tests with:
```bash
bun test              # Run all tests
bun test --watch      # Watch mode
bun test --coverage   # With coverage report
```

## 🔧 Configuration

### Bun Optimization
The project is optimized for Bun runtime with:
- `bunfig.toml` configuration for dependency management
- Auto peer dependency installation
- Advanced caching and hot reload optimizations
- Tree shaking and minification enabled

### Next.js Configuration
- Turbopack integration for lightning-fast builds
- Optimized bundle imports for NextAuth.js and React
- Standalone output for efficient Vercel deployments
- SWC minification with production optimizations

## 📚 Documentation

- **`CLAUDE.md`**: Complete development guide and project architecture
- **`ROADMAP.md`**: Development roadmap and feature progress
- **`SUPABASE_SETUP.md`**: Detailed Supabase setup and configuration guide
- **`OAUTH_SETUP.md`**: OAuth provider configuration instructions
- **`database-schema.sql`**: Complete database schema with RLS policies

## 🎨 Design System

The application follows New Westminster's civic branding:
- **Primary Colors**: New Westminster civic blue (`#003149`)
- **Accent Colors**: Royal City red (`#c94927`)
- **Typography**: System fonts with accessibility considerations
- **Components**: Reusable, accessible components with dark mode support

## 🚀 Deployment

### Vercel (Recommended)
```bash
# Deploy to Vercel
vercel --prod

# Or connect your GitHub repository for automatic deployments
```

### Manual Deployment
```bash
bun run build:node    # Use Node.js build for deployment compatibility
bun run start:node    # Start production server
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Run the test suite: `bun test`
5. Ensure code quality: `bun run lint && bun run type-check`
6. Commit your changes: `git commit -m 'Add amazing feature'`
7. Push to the branch: `git push origin feature/amazing-feature`
8. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏆 Recognition

Built for the Royal City of New Westminster to enhance community engagement and event discovery for residents and visitors.

---

**🔗 Links:**
- [Live Application](https://www.newwestevents.com)
- [Project Repository](https://github.com/your-username/new-west-events-calendar)
- [Issue Tracker](https://github.com/your-username/new-west-events-calendar/issues)
- [New Westminster Official Website](https://www.newwestcity.ca)
