# Project Roadmap: New West Event Calendar

A guide for major milestones and development priorities for the interactive events calendar of New Westminster, B.C.

## ✅ Phase 1: Core Event Calendar (COMPLETED)
- ✅ Design basic UI for an interactive city events calendar
- ✅ Set up event data model (title, date, time, location, description)
- ✅ Allow adding/viewing/editing/removing events
- ✅ Responsive design for desktop and mobile
- ✅ Display events in calendar and list views

## ✅ Phase 2: Search & Discovery (COMPLETED)
- ✅ Implement event search by date, keyword, and category
- ✅ Add filtering/sorting (community, location, free/paid, accessibility)
- ✅ Calendar export (ICS, Google Calendar)
- ✅ Display upcoming/highlighted events

## ✅ Phase 3: User Engagement (COMPLETED)
- ✅ Allow users to sign up/login (optional, minimal info)
- ✅ Users can submit their own events for moderation
- ✅ Commenting/discussion or RSVP functionality
- ✅ Notification or email subscription for new events

## ✅ Phase 4: Admin & Integrations (COMPLETED)
- ✅ Admin dashboard for approving and editing events
- ✅ Integrate with city data/open data events feeds
- ✅ Analytics (popular events, views, etc)
- ✅ Accessibility and SEO improvements

## ✅ Phase 5: Production Readiness (COMPLETED)
- ✅ Input validation and sanitization
- ✅ Enhanced calendar view with month navigation
- ✅ Environment variables configuration
- ✅ Basic test framework setup
- ✅ Comprehensive test coverage
- ✅ Performance optimization (useMemo, useCallback)
- ✅ Security audit and hardening
- ✅ Enhanced SEO and meta tags
- ✅ Progressive Web App (PWA) manifest
- ✅ Error boundaries and better error handling
- ✅ Loading states and improved UX
- ✅ Rate limiting for form submissions
- ✅ New Westminster official branding and colors
- 🟡 Database integration (PostgreSQL/MongoDB)
- 🟡 Real authentication system (NextAuth.js)
- 🟡 Email notification system (SMTP/SendGrid)
- 🟡 Real external API integrations

## 🔄 Phase 6: Backend Integration (FUTURE)
- 🟡 Database persistence layer
- 🟡 Server-side authentication and authorization
- 🟡 Email notification service
- 🟡 Real-time updates with WebSockets
- 🟡 File upload capabilities
- 🟡 Advanced analytics and reporting
- 🟡 Content moderation tools
- 🟡 Multi-language support
- 🟡 Mobile app development
- 🟡 Integration with city systems

## General Practices
- Security: Validate all user input & sanitize events
- Use environment variables for keys/secrets. Do not commit secrets.
- Write basic automated tests after each major feature
- Keep CRUSH.md and this roadmap updated as priorities evolve

---
_Last updated: 2025-08-16_
