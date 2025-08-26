declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      provider: string
      isAdmin: boolean
    }
  }

  interface User {
    provider?: string
    isAdmin?: boolean
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    provider: string
    isAdmin: boolean
  }
}