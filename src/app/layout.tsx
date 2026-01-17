import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "ChainedX | NFT Marketplace",
  description: "ChainedX | NFT Marketplace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <link rel="icon" href="/assets/icon2.png" sizes="192x192" type="image/png" />
      </head>
      <body>
        <div className="min-h-screen bg-background text-text">
          <Navbar />
          {children}
        </div>
      </body>
    </html>
  );
}