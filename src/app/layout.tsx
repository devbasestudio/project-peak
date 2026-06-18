import type { Metadata } from "next";
import Script from "next/script";
import AuthHashHandler from "@/components/AuthHashHandler";
import "./globals.css";

export const metadata: Metadata = {
  title: "Project Peak 空 | Conquer The Mountain",
  description: "Project Peak 空 - Transform your body with personalized fitness programs, 1-on-1 coaching, and a dedicated community. Conquer your mountain.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Phosphor Icons — load each weight the markup actually uses (regular, fill, bold).
            The combined `src/style.css` does not exist on the CDN (404), which previously left every icon blank. */}
        <link rel="stylesheet" type="text/css" href="https://unpkg.com/@phosphor-icons/web@2.1.1/src/regular/style.css" />
        <link rel="stylesheet" type="text/css" href="https://unpkg.com/@phosphor-icons/web@2.1.1/src/fill/style.css" />
        <link rel="stylesheet" type="text/css" href="https://unpkg.com/@phosphor-icons/web@2.1.1/src/bold/style.css" />
      </head>
      <body>
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
        <AuthHashHandler />
        {children}
      </body>
    </html>
  );
}
