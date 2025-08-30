import NextAuth from "next-auth/next"
import type { AuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import GitHubProvider from "next-auth/providers/github"
import FacebookProvider from "next-auth/providers/facebook"
import TwitterProvider from "next-auth/providers/twitter"

const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "demo_google_client_id",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "demo_google_secret",
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID || "demo_github_client_id",
      clientSecret: process.env.GITHUB_SECRET || "demo_github_secret",
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID || "demo_facebook_client_id",
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || "demo_facebook_secret",
    }),
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID || "demo_twitter_client_id",
      clientSecret: process.env.TWITTER_CLIENT_SECRET || "demo_twitter_secret",
      version: "2.0",
    }),
  ],
  pages: {
    signIn: '/',
    error: '/',
  },
  session: {
    strategy: "jwt" as const,
  },
  callbacks: {
    jwt: async ({ token, account, profile }) => {
      // Debug logging for JWT callback
      console.log('🔐 JWT Callback:', { token, account, profile });
      
      // Ensure email is preserved in token
      if (account && profile && typeof profile === 'object' && profile !== null && 'email' in profile) {
        token.email = (profile.email as string) || token.email;
        if ('name' in profile) token.name = (profile.name as string) || token.name;
        if ('image' in profile) token.image = (profile.image as string) || token.image;
        
        console.log('📧 JWT Email preserved:', token.email);
      }
      
      return token;
    },
    session: async ({ session, token }) => {
      // Debug logging for session callback
      console.log('🎫 Session Callback:', { session, token });
      
      // Ensure email is passed to session
      if (token.email && session.user) {
        session.user.email = token.email as string;
      }
      
      console.log('📧 Session Email final:', session.user.email);
      
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "demo_secret_key_for_development",
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }