import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "LiveKit Agent Demo",
  description:
    "LiveKit Agent Demo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="relative min-h-screen">{children}</body>
    </html>
  );
}
