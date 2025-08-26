# OAuth Provider Setup Guide

Complete guide for configuring OAuth applications with real providers for newwestevents.com

## Production URLs

- **Production Domain**: https://www.newwestevents.com
- **Alternative Domain**: https://newwestevents.com (redirects to www)
- **Development Domain**: http://localhost:3000

## OAuth Callback URLs

All providers need these callback URLs configured:

- **Development**: `http://localhost:3000/api/auth/callback/[provider]`
- **Preview**: `https://test.newwestevents.com/api/auth/callback/[provider]`
- **Production**: `https://www.newwestevents.com/api/auth/callback/[provider]`

Replace `[provider]` with: `google`, `github`, `facebook`, or `twitter`

## 1. Google OAuth Setup

### Google Cloud Console
1. **Go to**: https://console.cloud.google.com/
2. **Create Project**: "New West Events Calendar"
3. **Enable APIs**: Google+ API, Google Identity Services API
4. **Create OAuth Client**:
   - Type: Web Application
   - Name: "New Westminster Events Calendar"
   - Authorized Origins:
     ```
     http://localhost:3000
     https://www.newwestevents.com
     https://newwestevents.com
     ```
   - Authorized Redirect URIs:
     ```
     http://localhost:3000/api/auth/callback/google
     https://www.newwestevents.com/api/auth/callback/google
     ```

### Environment Variables
```env
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

## 2. GitHub OAuth Setup

### GitHub Developer Settings
1. **Go to**: https://github.com/settings/developers
2. **Create OAuth App**:
   - Application Name: "New Westminster Events Calendar"
   - Homepage URL: `https://www.newwestevents.com`
   - Authorization Callback URL: `https://www.newwestevents.com/api/auth/callback/github`

### For Development
Create a separate app with:
- Homepage URL: `http://localhost:3000`
- Callback URL: `http://localhost:3000/api/auth/callback/github`

### Environment Variables
```env
GITHUB_ID="your-github-client-id"
GITHUB_SECRET="your-github-client-secret"
```

## 3. Facebook OAuth Setup

### Facebook Developers
1. **Go to**: https://developers.facebook.com/
2. **Create App**: Business type, "New Westminster Events Calendar"
3. **Add Facebook Login Product**
4. **Configure OAuth Redirect URIs**:
   ```
   http://localhost:3000/api/auth/callback/facebook
   https://www.newwestevents.com/api/auth/callback/facebook
   ```
5. **App Domains**: `newwestevents.com`, `localhost`

### Environment Variables
```env
FACEBOOK_CLIENT_ID="your-facebook-app-id"
FACEBOOK_CLIENT_SECRET="your-facebook-app-secret"
```

## 4. Twitter OAuth Setup

### Twitter Developer Portal
1. **Apply for access**: https://developer.twitter.com/
2. **Create App**: "new-west-events-calendar"
3. **Configure Settings**:
   - Website URL: `https://www.newwestevents.com`
   - Callback URLs:
     ```
     http://localhost:3000/api/auth/callback/twitter
     https://www.newwestevents.com/api/auth/callback/twitter
     ```
   - **Enable**: "Request email from users"

### Environment Variables
```env
TWITTER_CLIENT_ID="your-twitter-client-id"
TWITTER_CLIENT_SECRET="your-twitter-client-secret"
```

## 5. NextAuth Configuration

### Required Environment Variables
```env
NEXTAUTH_SECRET="your-32-char-random-secret"
NEXTAUTH_URL="https://www.newwestevents.com"
```

### Generate Secret
```bash
openssl rand -base64 32
```

## 6. Admin Access

Users with email addresses ending in `@newwestminster.ca` automatically receive admin privileges.

## 7. Deployment Checklist

### Vercel Environment Variables
Set these in your Vercel dashboard under Project Settings → Environment Variables:

| Variable | Value |
|----------|--------|
| `NEXTAUTH_SECRET` | Your generated secret |
| `NEXTAUTH_URL` | `https://www.newwestevents.com` |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret |
| `GITHUB_ID` | GitHub OAuth Client ID |
| `GITHUB_SECRET` | GitHub OAuth Client Secret |
| `FACEBOOK_CLIENT_ID` | Facebook App ID |
| `FACEBOOK_CLIENT_SECRET` | Facebook App Secret |
| `TWITTER_CLIENT_ID` | Twitter OAuth Client ID |
| `TWITTER_CLIENT_SECRET` | Twitter OAuth Client Secret |

### Domain Configuration
1. **Vercel Domain**: Add `www.newwestevents.com` as custom domain in Vercel
2. **Root Domain**: Configure `newwestevents.com` to redirect to `www.newwestevents.com`
3. **DNS**: Point both domains to Vercel
4. **SSL**: Automatically handled by Vercel

### Testing Production
1. Visit `https://www.newwestevents.com`
2. Test each OAuth provider
3. Verify admin access with @newwestminster.ca email
4. Test event creation and management

## 8. Security Notes

- Never commit `.env.local` files
- Use different OAuth apps for development vs production
- Rotate secrets periodically
- Monitor OAuth app usage in provider dashboards
- Review OAuth permissions granted to users

## 9. Troubleshooting

### Common Issues
- **Redirect URI Mismatch**: Ensure exact URL match in OAuth apps
- **Invalid Client**: Check client ID/secret in environment variables
- **Email Missing**: Enable email permissions in OAuth app settings
- **Development vs Production**: Use separate OAuth apps for each environment

### Testing Locally
```bash
# Set up local environment
cp .env.example .env.local
# Edit .env.local with your credentials
bun run dev
```