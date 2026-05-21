import type { Metadata } from "next";
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
    <html lang="en">
      <head>
        {/* Load Phosphor Icons CDN for old CSS classes compatibility if needed, though we can use @phosphor-icons/react */}
        <link rel="stylesheet" type="text/css" href="https://unpkg.com/@phosphor-icons/web@2.1.1/src/style.css" />
      </head>
      <body>{children}</body>
    </html>
  );
}
