import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { headers } from "next/headers";
import { Toaster } from "sonner";
import "./globals.css";

const archivo = localFont({
  src: "./fonts/english/heading/archivo-extra-bold.ttf",
  variable: "--font-archivo",
  weight: "800",
  display: "swap",
});

const englishSubheading = localFont({
  src: "./fonts/english/subheading/archivo-semi-bold.ttf",
  variable: "--font-english-subheading",
  weight: "600",
  display: "swap",
  preload: false,
});

const geist = localFont({
  src: "./fonts/english/body/geist-variable.ttf",
  variable: "--font-geist",
  weight: "100 900",
  display: "swap",
  preload: false,
});

const smallTitle = localFont({
  src: "./fonts/english/small-title/albert-sans-semi-bold.ttf",
  variable: "--font-geist-mono",
  weight: "600",
  display: "swap",
  preload: false,
});

const myanmarHeading = localFont({
  src: "./fonts/myanmar/subheading/pt21-mandalay-bold.ttf",
  variable: "--font-myanmar-heading",
  weight: "700",
  display: "swap",
  preload: false,
});

const myanmarBody = localFont({
  src: "./fonts/myanmar/body/shwe-pa-chi-04-medium.ttf",
  variable: "--font-myanmar",
  weight: "500",
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
    locale: "my_MM",
    alternateLocale: ["en_US"],
    siteName: "Project Peak",
    title: "Project Peak — 12 Week Home Workout",
    description: "Knowledge. Habits. A stronger identity in 12 weeks.",
    images: [{
      url: "/brand/project-peak-social-2026.jpg",
      width: 1200,
      height: 630,
      alt: "Project Peak — 12 weeks, 48 sessions, build your peak",
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Project Peak — 12 Week Home Workout",
    description: "Knowledge. Habits. A stronger identity in 12 weeks.",
    images: ["/brand/project-peak-social-2026.jpg"],
  },
  icons: {
    icon: [
      { url: "/brand/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/brand/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/favicon-48.png", sizes: "48x48", type: "image/png" },
    ],
    shortcut: "/brand/favicon-32.png",
    apple: "/brand/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f6f5ef",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = (await headers()).get("x-project-peak-locale") === "en" ? "en" : "mm";

  return (
    <html lang={locale} className={`${archivo.variable} ${englishSubheading.variable} ${geist.variable} ${smallTitle.variable} ${myanmarHeading.variable} ${myanmarBody.variable}`}>
      <body>
        {children}
        <Toaster position="top-center" richColors={false} closeButton />
      </body>
    </html>
  );
}
