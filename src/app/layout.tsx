import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";

import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

export const metadata: Metadata = {
  title: "Eula — Discover who you are",
  description:
    "Through natural conversation, Eula learns who you are and brings your identity to life in a living virtual room.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="h-full overflow-hidden bg-[#1a1714] antialiased">
        {children}
      </body>
    </html>
  );
}
