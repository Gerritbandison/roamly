import type { Metadata } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import ErrorBoundary from "@/components/ErrorBoundary";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Roamly — AI Trip Planner",
  description:
    "Plan your perfect trip in seconds. Tell us where you want to go and we'll build a complete day-by-day itinerary with local tips, dining, and budget breakdowns.",
  openGraph: {
    title: "Roamly — AI Trip Planner",
    description:
      "Plan your perfect trip in seconds. AI-powered day-by-day itineraries with local tips, dining, and budget breakdowns.",
    type: "website",
    siteName: "Roamly",
    images: [
      {
        url: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&h=630&fit=crop&q=80",
        width: 1200,
        height: 630,
        alt: "Roamly — AI Trip Planner",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Roamly — AI Trip Planner",
    description:
      "Plan your perfect trip in seconds with AI-powered itineraries.",
    images: [
      "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&h=630&fit=crop&q=80",
    ],
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_URL || "https://roamly.vercel.app"
  ),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-[family-name:var(--font-dm-sans)]">
        <ErrorBoundary>{children}</ErrorBoundary>
        <Analytics />
      </body>
    </html>
  );
}
