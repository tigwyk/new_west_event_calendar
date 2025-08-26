import NextAuth from "next-auth/next"
import GoogleProvider from "next-auth/providers/google"
import GitHubProvider from "next-auth/providers/github"
import FacebookProvider from "next-auth/providers/facebook"
import TwitterProvider from "next-auth/providers/twitter"

const authOptions = {
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
  secret: process.env.NEXTAUTH_SECRET || "demo_secret_key_for_development",
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }