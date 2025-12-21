import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "./Sidebar";

export const metadata: Metadata = {
  title: "Gods Unchained Cards",
  description: "Browse Gods Unchained cards",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className='bg-[#1a1d29]'>
        <Sidebar />
        <main className='ml-0 md:ml-[250px]'>
          {children}
        </main>
      </body>
    </html>
  );
}