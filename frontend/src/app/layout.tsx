import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ArabaIQ",
  description: "Data-driven car recommendations and comparison platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className="dark">
      <body className="min-h-screen flex flex-col bg-[#020617] text-[#E5E7EB] antialiased">
        {children}
      </body>
    </html>
  );
}
