import type { Metadata } from "next";
import "./globals.css";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Chained | NFT Marketplace",
  description: "Chained | NFT Marketplace",

};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" >
      <head>
        <link rel="icon" href="/assets/icon1.png" sizes="any" type="image/png" />
      </head>
      <body>
        <div className="min-h-screen h-[200vh] bg-[#0a0e1a] text-white relative">
          {/* Top Navigation Bar */}
          <nav className="fixed top-0 left-0 right-0 h-16 bg-[#151b2e] border-b border-[#1f2937] flex items-center px-6 z-50">
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
              <div className="w-32 h-10 bg-[#4c1d95] hover:bg-[#5b21b6] rounded-lg flex items-center justify-center transition">Connect Wallet</div>
              <div className="w-10 h-10 bg-[#1f2937] rounded-full"></div>
            </div>
          </nav>

          {/* Sidebar */}
          {/* <div className="fixed left-0 top-16 w-16 h-full bg-[#151b2e] border-r border-[#1f2937] flex flex-col items-center py-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="w-10 h-10 bg-[#1f2937] rounded-lg hover:bg-[#2d3748] transition"></div>
            ))}
          </div> */}

          {children}
        </div>
      </body>
    </html>
  );
}