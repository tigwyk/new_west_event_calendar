import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ErrorBoundary from "../components/ErrorBoundary";
import NextAuthProvider from "../components/SessionProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "New Westminster Events Calendar | Royal City Events",
  description: "Discover local events in New Westminster, BC - the Royal City. Find community events, arts, sports, festivals, and more happening in your neighborhood.",
  keywords: [
    "New Westminster events",
    "Royal City events", 
    "BC events",
    "British Columbia events",
    "community calendar",
    "local events",
    "New West",
    "Fraser River events",
    "Metro Vancouver events",
    "community activities",
    "arts events",
    "sports events",
    "festivals"
  ].join(", "),
  authors: [{ name: "City of New Westminster" }],
  creator: "New Westminster Event Calendar",
  publisher: "City of New Westminster",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: "New Westminster Events Calendar | Royal City Events",
    description: "Discover local events in New Westminster, BC - the Royal City. Find community events, arts, sports, festivals, and more.",
    type: "website",
    locale: "en_CA",
    siteName: "New Westminster Events Calendar",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "New Westminster Events Calendar",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "New Westminster Events Calendar | Royal City Events",
    description: "Discover local events in New Westminster, BC - the Royal City",
    images: ["/og-image.jpg"],
    creator: "@new_westminster",
  },
  alternates: {
    canonical: "https://new-west-events-calendar.vercel.app",
  },
  category: "Events",
  classification: "Community Events Calendar",
  other: {
    "geo.region": "CA-BC",
    "geo.placename": "New Westminster",
    "geo.position": "49.2057;-122.9110",
    "ICBM": "49.2057, -122.9110",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#003149" />
        <meta name="msapplication-TileColor" content="#003149" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="NW Events" />
        <link rel="canonical" href="https://new-west-events-calendar.vercel.app" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextAuthProvider>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </NextAuthProvider>
      </body>
    </html>
  );
}
