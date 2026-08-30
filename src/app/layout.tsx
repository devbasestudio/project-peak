import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Toaster } from "sonner";
import "./globals.css";

const archivo = localFont({
  src: [
    { path: "./fonts/archivo-variable.ttf", style: "normal" },
    { path: "./fonts/archivo-italic-variable.ttf", style: "italic" },
  ],
  variable: "--font-archivo",
  display: "swap",
});

const geist = localFont({
  src: "./fonts/geist-variable.ttf",
  variable: "--font-geist",
  display: "swap",
});

const geistMono = localFont({
  src: "./fonts/geist-mono-variable.ttf",
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Project Peak — 12 Week Home Workout",
    template: "%s · Project Peak",
  },
  description:
    "A 12-week, 48-session home workout system that turns fitness knowledge into a habit you can keep.",
  applicationName: "Project Peak",
  category: "fitness",
  openGraph: {
    type: "website",
    siteName: "Project Peak",
    title: "Project Peak — 12 Week Home Workout",
    description: "Knowledge. Habits. A stronger identity in 12 weeks.",
    images: [{ url: "/brand/social-card.jpg", width: 1800, height: 1800 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Project Peak — 12 Week Home Workout",
    description: "Knowledge. Habits. A stronger identity in 12 weeks.",
    images: ["/brand/social-card.jpg"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f6f5ef",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="my" className={`${archivo.variable} ${geist.variable} ${geistMono.variable}`}>
      <body>
        {children}
        <Toaster position="top-center" richColors={false} closeButton />
      </body>
    </html>
  );
}
