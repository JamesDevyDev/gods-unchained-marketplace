import type { Metadata } from "next";
import "./globals.css";
import Image from "next/image";
import Link from "next/link";

import { COLORS } from "../../constants";

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
        <link rel="icon" href="/assets/iconBg.png" sizes="any" type="image/png" />
      </head>
      <body>
        <div
          className="min-h-screen relative bg-background text-text">
          {/* Top Navigation Bar */}
          <nav
            className="fixed top-0 left-0 right-0 h-16 flex items-center px-6 z-50 border-b border-lines bg-background">
            <div className="flex items-center gap-4 flex-1">
              {/* Logo */}
              <Link href='/' className="w-10 h-10 rounded-full flex items-center justify-center relative">
                <Image
                  src="/assets/iconBg.png"
                  alt="Chained Icon"
                  fill
                  className="object-contain scale-250"
                />
              </Link>
            </div>

            {/* Right side buttons */}
            <div className="flex items-center gap-4">
              <div
                className="w-32 h-10 rounded-lg flex items-center justify-center transition hover:opacity-90 cursor-pointer">
                Connect Wallet
              </div>
              <div
                className="w-10 h-10 rounded-full bg-gray-800"
              ></div>
            </div>
          </nav>

          {children}
        </div>
      </body>
    </html>
  );
}